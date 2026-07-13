import { Injectable, NotFoundException, ConflictException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { 
  CreateTribeDto, 
  UpdateTribeDto, 
  PaginationDto, 
  TribeResponseDto, 
  PaginatedResponseDto,
  RequestTribeCreationDto,
  ReviewTribeCreationDto,
  RequestTribeMembershipDto,
  ReviewTribeMembershipDto,
  AssignTribeLeaderDto,
  TribeStatus,
  MembershipRequestStatus,
  TribeMembershipRequestResponseDto,
  UserRole
} from 'event-types';
import { PrismaService } from '../prisma/prisma.service';
import { ProductService } from '../product/product.service';

const CREATION_COOLDOWN_DAYS = 15;
const MEMBERSHIP_COOLDOWN_DAYS = 7;

@Injectable()
export class TribeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly productService: ProductService,
  ) {}

  // ===========================================================================
  // Tribe Creation Flow
  // ===========================================================================

  async requestCreation(userId: string, dto: RequestTribeCreationDto): Promise<TribeResponseDto> {
    const seller = await this.prisma.seller.findUnique({ where: { id: userId } });
    if (seller?.tribeId) {
      throw new ConflictException('Ya perteneces a una tribu');
    }

    // Cooldown check
    const lastRejected = await this.prisma.tribe.findFirst({
      where: {
        requestedById: userId,
        status: 'REJECTED' as any,
      },
      orderBy: { reviewedAt: 'desc' },
    });

    if (lastRejected?.reviewedAt) {
      const cooldownEnd = new Date(lastRejected.reviewedAt);
      cooldownEnd.setDate(cooldownEnd.getDate() + CREATION_COOLDOWN_DAYS);

      if (new Date() < cooldownEnd) {
        const daysRemaining = Math.ceil((cooldownEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        throw new ForbiddenException(`Debes esperar ${daysRemaining} día(s) antes de solicitar crear otra tribu`);
      }
    }

    const pendingRequest = await this.prisma.tribe.findFirst({
      where: { requestedById: userId, status: 'PENDING_APPROVAL' as any },
    });
    if (pendingRequest) {
      throw new ConflictException('Ya tienes una solicitud de creación pendiente');
    }

    const tribeData: any = {
      ...dto,
      status: 'PENDING_APPROVAL',
      requestedById: userId,
    };

    return this.prisma.tribe.create({
      data: tribeData,
    }) as unknown as TribeResponseDto;
  }

  async reviewCreation(tribeId: number, adminId: string, dto: ReviewTribeCreationDto): Promise<TribeResponseDto> {
    const tribe = await this.prisma.tribe.findUnique({ where: { id: tribeId } });
    if (!tribe) throw new NotFoundException('Tribu no encontrada');
    if ((tribe as any).status !== 'PENDING_APPROVAL') {
      throw new BadRequestException('Esta tribu no está pendiente de aprobación');
    }

    const updateData: any = {
      status: dto.status,
      reviewedById: adminId,
      reviewedAt: new Date(),
      reviewNote: dto.reviewNote,
    };

    return this.prisma.$transaction(async (tx) => {
      let updatedTribe;
      if (dto.status === TribeStatus.ACTIVE) {
        updateData.primaryLeaderId = (tribe as any).requestedById;

        if ((tribe as any).requestedById) {
          const reqId = (tribe as any).requestedById;
          // Ensure Seller exists, then assign tribe
          const seller = await tx.seller.findUnique({ where: { id: reqId } });
          if (!seller) {
            await tx.seller.create({ data: { id: reqId, tribeId: tribeId } });
          } else {
            await tx.seller.update({
              where: { id: reqId },
              data: { tribeId: tribeId },
            });
          }
          // Promote UserAccount role to SELLER
          await tx.userAccount.update({
            where: { id: reqId },
            data: { role: UserRole.SELLER },
          });
        }

        updatedTribe = await tx.tribe.update({
          where: { id: tribeId },
          data: updateData,
        });
      } else {
        updatedTribe = await tx.tribe.update({
          where: { id: tribeId },
          data: updateData,
        });
      }
      return updatedTribe;
    }) as unknown as TribeResponseDto;
  }

  async findPendingCreations(query?: PaginationDto): Promise<PaginatedResponseDto<TribeResponseDto>> {
    const page = parseInt(String(query?.page), 10) || 1;
    const limit = parseInt(String(query?.limit), 10) || 10;
    const skip = (page - 1) * limit;

    const [total, data] = await Promise.all([
      this.prisma.tribe.count({ where: { status: 'PENDING_APPROVAL' as any } }),
      this.prisma.tribe.findMany({
        where: { status: 'PENDING_APPROVAL' as any },
        skip,
        take: limit,
        orderBy: { createdAt: 'asc' }
      }),
    ]);

    return {
      data: data as unknown as TribeResponseDto[],
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ===========================================================================
  // Membership Flow
  // ===========================================================================

  async requestMembership(tribeId: number, userId: string, dto: RequestTribeMembershipDto): Promise<TribeMembershipRequestResponseDto> {
    let seller = await this.prisma.seller.findUnique({ where: { id: userId } });
    if (seller?.tribeId) {
      throw new ConflictException('Ya perteneces a una tribu');
    }

    // Ensure the Seller record exists to satisfy the foreign key constraint
    if (!seller) {
      seller = await this.prisma.seller.create({ data: { id: userId } });
    }

    const tribe = await this.prisma.tribe.findUnique({ where: { id: tribeId } });
    if (!tribe || (tribe as any).status !== 'ACTIVE') {
      throw new NotFoundException('La tribu no existe o no está activa');
    }

    const pendingRequest = await this.prisma.tribeMembershipRequest.findFirst({
      where: { sellerId: userId, tribeId, status: 'PENDING' as any },
    });
    if (pendingRequest) {
      throw new ConflictException('Ya tienes una solicitud pendiente para esta tribu');
    }

    const lastRejected = await this.prisma.tribeMembershipRequest.findFirst({
      where: { sellerId: userId, tribeId, status: 'REJECTED' as any },
      orderBy: { reviewedAt: 'desc' },
    });

    if (lastRejected?.reviewedAt) {
      const cooldownEnd = new Date(lastRejected.reviewedAt);
      cooldownEnd.setDate(cooldownEnd.getDate() + MEMBERSHIP_COOLDOWN_DAYS);

      if (new Date() < cooldownEnd) {
        const daysRemaining = Math.ceil((cooldownEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        throw new ForbiddenException(`Debes esperar ${daysRemaining} día(s) antes de solicitar unirte nuevamente a esta tribu`);
      }
    }

    const requestData: any = {
      tribeId,
      sellerId: userId, // we keep the column as sellerId but it stores the userId
      message: dto.message,
    };

    return this.prisma.tribeMembershipRequest.create({
      data: requestData,
    }) as unknown as TribeMembershipRequestResponseDto;
  }

  async reviewMembership(requestId: number, leaderId: string, dto: ReviewTribeMembershipDto): Promise<TribeMembershipRequestResponseDto> {
    const request = await this.prisma.tribeMembershipRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new NotFoundException('Solicitud no encontrada');
    if ((request as any).status !== 'PENDING') throw new BadRequestException('Esta solicitud ya fue revisada');

    return this.prisma.$transaction(async (tx) => {
      const updateData: any = {
        status: dto.status,
        reviewedById: leaderId,
        reviewedAt: new Date(),
        reviewNote: dto.reviewNote,
      };

      const updatedRequest = await tx.tribeMembershipRequest.update({
        where: { id: requestId },
        data: updateData,
      });

      if (dto.status === MembershipRequestStatus.APPROVED) {
        // Validate if the seller isn't already in a tribe (might have joined another while pending)
        const seller = await tx.seller.findUnique({ where: { id: request.sellerId } });
        if (!seller) {
           await tx.seller.create({ data: { id: request.sellerId, tribeId: request.tribeId } });
           await tx.userAccount.update({ where: { id: request.sellerId }, data: { role: UserRole.SELLER } });
        } else if (!seller.tribeId) {
          await tx.seller.update({
            where: { id: request.sellerId },
            data: { tribeId: request.tribeId },
          });
          await tx.userAccount.update({ where: { id: request.sellerId }, data: { role: UserRole.SELLER } });
        }
      }

      return updatedRequest;
    }) as unknown as TribeMembershipRequestResponseDto;
  }

  async findMembershipRequests(tribeId: number, query?: PaginationDto & { status?: string }): Promise<PaginatedResponseDto<TribeMembershipRequestResponseDto>> {
    const page = parseInt(String(query?.page), 10) || 1;
    const limit = parseInt(String(query?.limit), 10) || 10;
    const status = query?.status;
    const skip = (page - 1) * limit;

    const where: any = { tribeId };
    if (status) {
      where.status = status;
    }

    const [total, data] = await Promise.all([
      this.prisma.tribeMembershipRequest.count({ where }),
      this.prisma.tribeMembershipRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          seller: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  fullName: true,
                  avatarUrl: true,
                  email: true,
                  locationFormattedAddress: true
                }
              }
            }
          }
        }
      }),
    ]);

    return {
      data: data as unknown as TribeMembershipRequestResponseDto[],
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findAllMembershipRequests(query?: PaginationDto & { status?: string }): Promise<PaginatedResponseDto<TribeMembershipRequestResponseDto>> {
    const page = parseInt(String(query?.page), 10) || 1;
    const limit = parseInt(String(query?.limit), 10) || 10;
    const status = query?.status;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const [total, data] = await Promise.all([
      this.prisma.tribeMembershipRequest.count({ where }),
      this.prisma.tribeMembershipRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          seller: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  fullName: true,
                  avatarUrl: true,
                  email: true,
                  locationFormattedAddress: true
                }
              }
            }
          },
          tribe: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }),
    ]);

    return {
      data: data as unknown as TribeMembershipRequestResponseDto[],
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async reviewMembershipAsAdmin(requestId: number, dto: ReviewTribeMembershipDto): Promise<TribeMembershipRequestResponseDto> {
    const request = await this.prisma.tribeMembershipRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new NotFoundException('Solicitud no encontrada');
    if ((request as any).status !== 'PENDING') throw new BadRequestException('Esta solicitud ya fue revisada');

    return this.prisma.$transaction(async (tx) => {
      const updateData: any = {
        status: dto.status,
        reviewedAt: new Date(),
        reviewNote: dto.reviewNote ? `[Aprobación Forzada por Administrador]: ${dto.reviewNote}` : '[Aprobación Forzada por Administrador]',
      };

      const updatedRequest = await tx.tribeMembershipRequest.update({
        where: { id: requestId },
        data: updateData,
      });

      if (dto.status === MembershipRequestStatus.APPROVED) {
        // Validate if the seller isn't already in a tribe (might have joined another while pending)
        const seller = await tx.seller.findUnique({ where: { id: request.sellerId } });
        if (!seller) {
           await tx.seller.create({ data: { id: request.sellerId, tribeId: request.tribeId } });
           await tx.userAccount.update({ where: { id: request.sellerId }, data: { role: UserRole.SELLER } });
        } else if (!seller.tribeId) {
          await tx.seller.update({
            where: { id: request.sellerId },
            data: { tribeId: request.tribeId },
          });
          await tx.userAccount.update({ where: { id: request.sellerId }, data: { role: UserRole.SELLER } });
        }
      }

      return updatedRequest;
    }) as unknown as TribeMembershipRequestResponseDto;
  }

  // ===========================================================================
  // Tribe Management Flow
  // ===========================================================================

  async assignSecondaryLeader(tribeId: number, dto: AssignTribeLeaderDto): Promise<TribeResponseDto> {
    const seller = await this.prisma.seller.findUnique({ where: { id: dto.sellerId } });
    if (!seller || seller.tribeId !== tribeId) {
      throw new BadRequestException('El usuario no pertenece a la tribu');
    }

    const tribe = await this.prisma.tribe.findUnique({ where: { id: tribeId } });
    if ((tribe as any).primaryLeaderId === dto.sellerId) {
      throw new BadRequestException('El usuario ya es el líder primario');
    }

    return this.prisma.tribe.update({
      where: { id: tribeId },
      data: { secondaryLeaderId: dto.sellerId } as any,
    }) as unknown as TribeResponseDto;
  }

  async removeSecondaryLeader(tribeId: number): Promise<TribeResponseDto> {
    return this.prisma.tribe.update({
      where: { id: tribeId },
      data: { secondaryLeaderId: null } as any,
    }) as unknown as TribeResponseDto;
  }

  async removeMember(tribeId: number, sellerId: string): Promise<void> {
    const seller = await this.prisma.seller.findUnique({ where: { id: sellerId } });
    if (!seller || seller.tribeId !== tribeId) {
      throw new NotFoundException('Miembro no encontrado en la tribu');
    }

    await this.prisma.$transaction(async (tx) => {
      // Deactivate their products
      await tx.product.updateMany({
        where: { sellerId },
        data: { isActive: false } as any,
      });

      // Remove from tribe
      await tx.seller.update({
        where: { id: sellerId },
        data: { tribeId: null },
      });

      // If they were secondary leader, remove them
      const tribe = await tx.tribe.findUnique({ where: { id: tribeId } });
      if ((tribe as any).secondaryLeaderId === sellerId) {
        await tx.tribe.update({
          where: { id: tribeId },
          data: { secondaryLeaderId: null } as any,
        });
      }
    });
  }

  async leaveTribe(sellerId: string): Promise<void> {
    const seller = await this.prisma.seller.findUnique({ where: { id: sellerId } });
    if (!seller?.tribeId) {
      throw new BadRequestException('No perteneces a ninguna tribu');
    }
    
    const tribeId = seller.tribeId;

    await this.prisma.$transaction(async (tx) => {
      // Deactivate their products
      await tx.product.updateMany({
        where: { sellerId },
        data: { isActive: false } as any,
      });

      // Remove from tribe
      await tx.seller.update({
        where: { id: sellerId },
        data: { tribeId: null },
      });

      // Check leadership
      const tribe = await tx.tribe.findUnique({ where: { id: tribeId } });
      if ((tribe as any).primaryLeaderId === sellerId) {
        await tx.tribe.update({
          where: { id: tribeId },
          data: { primaryLeaderId: null } as any,
        });
      }
      if ((tribe as any).secondaryLeaderId === sellerId) {
        await tx.tribe.update({
          where: { id: tribeId },
          data: { secondaryLeaderId: null } as any,
        });
      }
    });
  }

  // ===========================================================================
  // My Tribe endpoints
  // ===========================================================================

  async getMyCreationRequests(userId: string): Promise<TribeResponseDto[]> {
    const data = await this.prisma.tribe.findMany({
      where: { requestedById: userId },
      orderBy: { createdAt: 'desc' },
    });
    return data as unknown as TribeResponseDto[];
  }

  async getMyTribe(sellerId: string): Promise<TribeResponseDto> {
    const seller = await this.prisma.seller.findUnique({
      where: { id: sellerId },
      include: { tribe: true },
    });

    if (!seller?.tribeId || !seller.tribe) {
      throw new NotFoundException('No perteneces a ninguna tribu');
    }
    return seller.tribe as unknown as TribeResponseDto;
  }

  // ===========================================================================
  // Standard CRUD Flow
  // ===========================================================================

  async create(createTribeDto: CreateTribeDto): Promise<TribeResponseDto> {
    try {
      const data: any = {
        ...createTribeDto,
        status: 'ACTIVE' as any, // direct admin creation bypasses pending state
      };
      return await this.prisma.tribe.create({
        data,
      }) as unknown as TribeResponseDto;
    } catch (e: any) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('El nombre de la tribu ya está en uso');
      }
      throw e;
    }
  }

  async findAll(query?: PaginationDto): Promise<PaginatedResponseDto<TribeResponseDto>> {
    const page = parseInt(String(query?.page), 10) || 1;
    const limit = parseInt(String(query?.limit), 10) || 10;
    const skip = (page - 1) * limit;

    const where = { status: 'ACTIVE' as any };

    const [total, data] = await Promise.all([
      this.prisma.tribe.count({ where }),
      this.prisma.tribe.findMany({ where, skip, take: limit }),
    ]);

    return {
      data: data as unknown as TribeResponseDto[],
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: number): Promise<TribeResponseDto> {
    const tribe = await this.prisma.tribe.findUnique({
      where: { id },
    });
    
    if (!tribe) throw new NotFoundException(`Tribe with ID ${id} not found`);
    return tribe as unknown as TribeResponseDto;
  }

  async update(id: number, updateTribeDto: UpdateTribeDto): Promise<TribeResponseDto> {
    await this.findOne(id); // Check existence
    return this.prisma.tribe.update({
      where: { id },
      data: updateTribeDto as any,
    }) as unknown as TribeResponseDto;
  }

  async remove(id: number): Promise<TribeResponseDto> {
    await this.findOne(id); // Check existence
    return this.prisma.tribe.delete({
      where: { id },
    }) as unknown as TribeResponseDto;
  }
}
