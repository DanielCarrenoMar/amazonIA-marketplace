import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { CreateUserAccountDto, UpdateUserAccountDto, ChangePasswordDto, UserRole, PaginationDto, UserAccountResponseDto, PaginatedResponseDto } from 'event-types';
import { PrismaService } from '../prisma/prisma.service';

const SALT_ROUNDS = 12;

@Injectable()
export class UserAccountService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserAccountDto: CreateUserAccountDto): Promise<UserAccountResponseDto> {
    const { password, ...rest } = createUserAccountDto;
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    try {
      const user = await this.prisma.userAccount.create({
        data: {
          ...rest,
          passwordHash,
        },
      });
      return user as unknown as UserAccountResponseDto;
    } catch (e: any) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('El email, username o nationalId ya está en uso');
      }
      throw e;
    }
  }

  async findAll(query?: PaginationDto): Promise<PaginatedResponseDto<UserAccountResponseDto>> {
    const { page = 1, limit = 10 } = query || {};
    const skip = (page - 1) * limit;

    const [total, users] = await Promise.all([
      this.prisma.userAccount.count(),
      this.prisma.userAccount.findMany({
        skip,
        take: limit,
      }),
    ]);

    return {
      data: users as unknown as UserAccountResponseDto[],
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, reqUser: { id: string; role: UserRole }): Promise<UserAccountResponseDto> {
    const user = await this.prisma.userAccount.findUnique({
      where: { id },
    });

    if (!user) throw new NotFoundException(`UserAccount with ID ${id} not found`);

    // PRIVACY LOGIC:
    if (reqUser.id === id) {
      return user as unknown as UserAccountResponseDto;
    }
    if (reqUser.role === UserRole.ADMIN) {
      return user as unknown as UserAccountResponseDto;
    }

    return {
      id: user.id,
      fullName: user.fullName,
      username: user.username,
    } as unknown as UserAccountResponseDto;
  }

  async update(
    id: string,
    reqUser: { id: string; role: UserRole },
    updateUserAccountDto: UpdateUserAccountDto,
  ): Promise<UserAccountResponseDto> {
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
    }) as unknown as UserAccountResponseDto;
  }

  async changePassword(
    id: string,
    reqUser: { id: string },
    changePasswordDto: ChangePasswordDto,
  ): Promise<UserAccountResponseDto> {
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
    }) as unknown as UserAccountResponseDto;
  }

  async remove(id: string, reqUser: { id: string; role: UserRole }): Promise<UserAccountResponseDto> {
    // According to controller, only ADMIN reaches here, but we reinforce in service
    if (reqUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Solo un administrador puede eliminar cuentas');
    }

    return this.prisma.userAccount.delete({
      where: { id },
    }) as unknown as UserAccountResponseDto;
  }
}