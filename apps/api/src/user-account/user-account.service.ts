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
import { StorageService } from '../storage/storage.service';
import { SpatialService } from '../spatial/spatial.service';

const SALT_ROUNDS = 10;

@Injectable()
export class UserAccountService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly spatialService: SpatialService,
  ) {}

  async create(createUserAccountDto: CreateUserAccountDto): Promise<UserAccountResponseDto> {
    const { password, locationLat, locationLng, ...rest } = createUserAccountDto;
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    try {
      const user = await this.prisma.userAccount.create({
        data: {
          ...rest,
          passwordHash,
        },
      });

      if (locationLat !== undefined && locationLng !== undefined && locationLat !== null && locationLng !== null) {
        await this.spatialService.updateUserLocation(user.id, locationLat, locationLng);
      }

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

    // Solo el dueño o ADMIN puede editar
    if (reqUser.id !== id && reqUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('No tienes permiso para actualizar esta cuenta');
    }

    // Separar campos espaciales
    const { locationLat, locationLng, ...restDto } = updateUserAccountDto;

    // Actualización de campos de texto estándar
    const updatedUser = await this.prisma.userAccount.update({
      where: { id },
      data: restDto,
    }) as unknown as UserAccountResponseDto;

    // Actualización de campo geográfico PostGIS
    if (locationLat !== undefined && locationLng !== undefined) {
      await this.spatialService.updateUserLocation(id, locationLat, locationLng);
    }

    return updatedUser;
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

  // Bloquea/desbloquea el acceso de una cuenta sin borrar sus datos — el usuario
  // conserva su historial de órdenes, ratings, etc., pero no puede iniciar sesión
  // ni usar tokens ya emitidos (ver JwtStrategy.validate y AuthService.login/refresh).
  async setActiveStatus(
    id: string,
    isActive: boolean,
    reqUser: { id: string; role: UserRole },
  ): Promise<UserAccountResponseDto> {
    if (reqUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Solo un administrador puede bloquear o desbloquear cuentas');
    }

    if (reqUser.id === id) {
      throw new BadRequestException('No puedes bloquear tu propia cuenta');
    }

    const user = await this.prisma.userAccount.findUnique({ where: { id } });
    if (!user) throw new NotFoundException(`UserAccount with ID ${id} not found`);

    return this.prisma.userAccount.update({
      where: { id },
      data: { isActive },
    }) as unknown as UserAccountResponseDto;
  }

  async uploadAvatar(id: string, file: Express.Multer.File, requestingUser: any): Promise<UserAccountResponseDto> {
    if (requestingUser.role !== UserRole.ADMIN && requestingUser.id !== id) {
      throw new ForbiddenException('No tienes permiso para actualizar este perfil');
    }

    try {
      // Usa el StorageService para optimizar y subir (misma lógica que los productos)
      const avatarUrl = await this.storageService.uploadOptimizedImage(file);

      const user = await this.prisma.userAccount.update({
        where: { id },
        data: { avatarUrl },
      });

      return user as unknown as UserAccountResponseDto;
    } catch (error: any) {
      throw new BadRequestException(`Error al procesar y subir el avatar: ${error.message}`);
    }
  }
}