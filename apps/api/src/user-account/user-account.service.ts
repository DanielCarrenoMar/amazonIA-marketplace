import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { CreateUserAccountDto, UpdateUserAccountDto, ChangePasswordDto, UserRole, PaginationDto } from 'event-types';
import { PrismaService } from '../prisma/prisma.service';

const SALT_ROUNDS = 12;

@Injectable()
export class UserAccountService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserAccountDto: CreateUserAccountDto) {
    const { password, ...rest } = createUserAccountDto;
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    try {
      return await this.prisma.userAccount.create({
        data: { ...rest, passwordHash },
        omit: { passwordHash: true },
      });
    } catch (e: any) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('El email, username o nationalId ya está en uso');
      }
      throw e;
    }
  }

  async findAll(query?: PaginationDto) {
    const { page = 1, limit = 10 } = query || {};
    const skip = (page - 1) * limit;

    const [total, data] = await Promise.all([
      this.prisma.userAccount.count(),
      this.prisma.userAccount.findMany({
        omit: { passwordHash: true },
        skip,
        take: limit,
      }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string, reqUser: { id: string; role: UserRole }) {
    const user = await this.prisma.userAccount.findUnique({
      where: { id },
      omit: { passwordHash: true },
    });

    if (!user) throw new NotFoundException(`UserAccount with ID ${id} not found`);

    // PRIVACY LOGIC:
    if (reqUser.id === id) {
      return user;
    }
    if (reqUser.role === UserRole.ADMIN) {
      return user;
    }

    return {
      id: user.id,
      fullName: user.fullName,
      username: user.username,
    };
  }

  async update(
    id: string,
    reqUser: { id: string; role: UserRole },
    updateUserAccountDto: UpdateUserAccountDto,
  ) {
    // Validate existence before update
    const user = await this.prisma.userAccount.findUnique({ where: { id } });
    if (!user) throw new NotFoundException(`UserAccount with ID ${id} not found`);

    // Only owner or ADMIN can edit sensitive fields
    if (reqUser.id !== id && reqUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('No tienes permiso para actualizar esta cuenta');
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
    // Password change rule is stricter: ONLY owner (not even ADMIN)
    if (reqUser.id !== id) {
      throw new ForbiddenException('Solo puedes cambiar tu propia contraseña');
    }

    const user = await this.prisma.userAccount.findUnique({ where: { id } });
    if (!user) throw new NotFoundException(`UserAccount with ID ${id} not found`);

    const isMatch = await bcrypt.compare(changePasswordDto.currentPassword, user.passwordHash);
    if (!isMatch) throw new ForbiddenException('La contraseña actual es incorrecta');

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

  async remove(id: string, reqUser: { id: string; role: UserRole }) {
    // According to controller, only ADMIN reaches here, but we reinforce in service
    if (reqUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Solo un administrador puede eliminar cuentas');
    }

    return this.prisma.userAccount.delete({
      where: { id },
    });
  }
}