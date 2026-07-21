import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';

// Shape of the JWT payload we sign when the user logs in
export interface JwtPayload {
  sub: string;   // UserAccount UUID
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      // Extract token from the Authorization: Bearer <token> header
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? 'change_this_in_production',
    });
  }

  // This is called after the token signature is verified
  // The return value is attached to req.user
  async validate(payload: JwtPayload) {
    if (!payload.sub) throw new UnauthorizedException();

    // Un access token ya emitido sigue siendo válido criptográficamente aunque un admin
    // bloquee la cuenta después — sin esta verificación, un usuario bloqueado podría
    // seguir usando la app hasta que el token expire (hasta 15 min).
    const user = await this.prisma.userAccount.findUnique({
      where: { id: payload.sub },
      select: { isActive: true },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Tu cuenta ha sido desactivada.');
    }

    return { id: payload.sub, email: payload.email, role: payload.role };
  }
}
