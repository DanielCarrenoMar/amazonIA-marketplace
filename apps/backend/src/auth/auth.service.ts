import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { UserAccountService } from '../user-account/user-account.service';
import { CreateUserAccountDto } from 'dtos';
import { LoginDto } from 'dtos';
import { JwtPayload } from './jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly userAccountService: UserAccountService,
  ) { }

  // Centralized token generation — called on login and on refresh
  private async generateTokens(payload: JwtPayload) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_SECRET,
        expiresIn: '15m', // Short-lived access token
      }),
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: '7d', // Long-lived refresh token
      }),
    ]);

    // Guardar el refresh token hasheado en la base de datos
    const tokenHash = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: {
        userId: payload.sub,
        tokenHash,
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
  }

  // Registers a new user and immediately issues a token pair — no separate login required
  async register(createUserAccountDto: CreateUserAccountDto) {
    const user = await this.userAccountService.create(createUserAccountDto);

    const payload: JwtPayload = { sub: user.id, email: user.email, role: (user as any).role };
    const tokens = await this.generateTokens(payload);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        username: user.username,
      },
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // 1. Find the user by email (include passwordHash for comparison)
    const user = await this.prisma.userAccount.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    // 2. Compare the provided password with the stored hash
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) throw new UnauthorizedException('Invalid credentials');

    // 3. Sign and return both tokens
    const payload: JwtPayload = { sub: user.id, email: user.email, role: (user as any).role };
    const tokens = await this.generateTokens(payload);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        username: user.username,
      },
    };
  }

  async refresh(refreshToken: string) {
    try {
      // Verify the refresh token using the dedicated refresh secret
      const payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });

      // Find all active tokens for this user
      const userTokens = await this.prisma.refreshToken.findMany({
        where: { userId: payload.sub, revokedAt: null },
      });

      let foundToken: any = null;
      for (const token of userTokens) {
        if (await bcrypt.compare(refreshToken, token.tokenHash)) {
          foundToken = token;
          break;
        }
      }

      // Verify that the token exists in DB and is not revoked
      if (!foundToken) {
        throw new UnauthorizedException('Invalid or revoked refresh token');
      }

      // Revoke the old token (rotation)
      await this.prisma.refreshToken.update({
        where: { id: foundToken.id },
        data: { revokedAt: new Date() },
      });

      // Issue a brand new pair of tokens (rotation — the old refresh token becomes invalid)
      const newPayload: JwtPayload = { sub: payload.sub, email: payload.email, role: payload.role };
      return this.generateTokens(newPayload);
    } catch (e: any) {
      if (e instanceof UnauthorizedException) throw e;
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async logout(refreshToken: string) {
    let payload: JwtPayload;
    try {
      // Decode and verify the refresh token to get the user ID securely
      payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
    } catch (e: any) {
      // If the token is already expired or invalid, there's nothing to revoke
      return { message: 'Logged out successfully' };
    }

    const userTokens = await this.prisma.refreshToken.findMany({
      where: { userId: payload.sub, revokedAt: null },
    });

    let foundToken: any = null;
    for (const token of userTokens) {
      if (await bcrypt.compare(refreshToken, token.tokenHash)) {
        foundToken = token;
        break;
      }
    }

    if (foundToken) {
      await this.prisma.refreshToken.update({
        where: { id: foundToken.id },
        data: { revokedAt: new Date() },
      });
    }

    return { message: 'Logged out successfully' };
  }

  async findme(id: string) {
    const user = await this.prisma.userAccount.findUnique({
      where: { id },
      omit: { passwordHash: true },
      include: { seller: { include: { tribe: true } } }
    });
    return user;
  }
}
