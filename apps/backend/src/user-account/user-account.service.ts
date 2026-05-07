import { ForbiddenException, Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { CreateUserAccountDto, UpdateUserAccountDto, ChangePasswordDto, UserRole } from 'dtos';
import { PrismaService } from '../prisma/prisma.service';

const SALT_ROUNDS = 12;

@Injectable()
export class UserAccountService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserAccountDto: CreateUserAccountDto) {
    const { password, ...rest } = createUserAccountDto;

    // Hash the plain password before persisting — never store plain text
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    try {
      return await this.prisma.userAccount.create({
        data: { ...rest, passwordHash },
      });
    } catch (e: any) {
      // Convert Prisma unique constraint errors to HTTP 409 Conflict with a clear message
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('El email, username o nationalId ya está en uso');
      }
      throw e;
    }
  }

  async findAll() {
    return this.prisma.userAccount.findMany({
      // Exclude the passwordHash field from the response
      omit: { passwordHash: true },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.userAccount.findUnique({
      where: { id },
      omit: { passwordHash: true },
    });

    if (!user) throw new NotFoundException(`UserAccount with ID ${id} not found`);
    return user;
  }

  async update(
    id: string,
    reqUser: { id: string; role: UserRole },
    updateUserAccountDto: UpdateUserAccountDto,
  ) {
    await this.findOne(id); // Check existence

    // Only the account owner or an ADMIN can update this account
    if (reqUser.id !== id && reqUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You can only update your own account');
    }

    return this.prisma.userAccount.update({
      where: { id },
      data: updateUserAccountDto,
      omit: { passwordHash: true },
    });
  }

  async changePassword(
    id: string,
    reqUser: { id: string },
    changePasswordDto: ChangePasswordDto,
  ) {
    if (reqUser.id !== id) {
      throw new ForbiddenException('You can only change your own password');
    }

    const user = await this.prisma.userAccount.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`UserAccount with ID ${id} not found`);
    }

    const isMatch = await bcrypt.compare(changePasswordDto.currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new ForbiddenException('La contraseña actual es incorrecta');
    }

    if (changePasswordDto.currentPassword === changePasswordDto.newPassword) {
      throw new BadRequestException('La nueva contraseña no puede ser igual a la actual');
    }

    const newPasswordHash = await bcrypt.hash(changePasswordDto.newPassword, SALT_ROUNDS);

    return this.prisma.userAccount.update({
      where: { id },
      data: { passwordHash: newPasswordHash },
      omit: { passwordHash: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id); // Check existence
    return this.prisma.userAccount.delete({
      where: { id },
    });
  }
}
