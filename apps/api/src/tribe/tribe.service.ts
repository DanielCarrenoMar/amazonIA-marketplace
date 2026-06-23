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
  TribeMembershipRequestResponseDto
} from 'event-types';
import { PrismaService } from '../prisma/prisma.service';
import { ProductService } from '../product/product.service';

const CREATION_COOLDOWN_DAYS = 30;
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

  async requestCreation(sellerId: string, dto: RequestTribeCreationDto): Promise<TribeResponseDto> {
    const seller = await this.prisma.seller.findUnique({ where: { id: sellerId } });
    if (seller?.tribeId) {
      throw new ConflictException('Ya perteneces a una tribu');
    }

    // Cooldown check
    const lastRejected = await this.prisma.tribe.findFirst({
      where: {
        requestedById: sellerId,
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
      where: { requestedById: sellerId, status: 'PENDING_APPROVAL' as any },
    });
    if (pendingRequest) {
      throw new ConflictException('Ya tienes una solicitud de creación pendiente');
    }

    const tribeData: any = {
      ...dto,
      status: 'PENDING_APPROVAL',
      requestedById: sellerId,
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
        updatedTribe = await tx.tribe.update({
          where: { id: tribeId },
          data: updateData,
        });

        if ((tribe as any).requestedById) {
          await tx.seller.update({
            where: { id: (tribe as any).requestedById },
            data: { tribeId: tribeId },
          });
        }
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
    const { page = 1, limit = 10 } = query || {};
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

  async requestMembership(tribeId: number, sellerId: string, dto: RequestTribeMembershipDto): Promise<TribeMembershipRequestResponseDto> {
    const seller = await this.prisma.seller.findUnique({ where: { id: sellerId } });
    if (seller?.tribeId) {
      throw new ConflictException('Ya perteneces a una tribu');
    }

    const tribe = await this.prisma.tribe.findUnique({ where: { id: tribeId } });
    if (!tribe || (tribe as any).status !== 'ACTIVE') {
      throw new NotFoundException('La tribu no existe o no está activa');
    }

    const pendingRequest = await this.prisma.tribeMembershipRequest.findFirst({
      where: { sellerId, tribeId, status: 'PENDING' as any },
    });
    if (pendingRequest) {
      throw new ConflictException('Ya tienes una solicitud pendiente para esta tribu');
    }

    const lastRejected = await this.prisma.tribeMembershipRequest.findFirst({
      where: { sellerId, tribeId, status: 'REJECTED' as any },
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
      sellerId,
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
        if (!seller?.tribeId) {
          await tx.seller.update({
            where: { id: request.sellerId },
            data: { tribeId: request.tribeId },
          });
        }
      }

      return updatedRequest;
    }) as unknown as TribeMembershipRequestResponseDto;
  }

  async findMembershipRequests(tribeId: number, query?: PaginationDto & { status?: string }): Promise<PaginatedResponseDto<TribeMembershipRequestResponseDto>> {
    const { page = 1, limit = 10, status } = query || {};
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
      }),
    ]);

    return {
      data: data as unknown as TribeMembershipRequestResponseDto[],
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
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
    const { page = 1, limit = 10 } = query || {};
    const skip = (page - 1) * limit;

    const [total, data] = await Promise.all([
      this.prisma.tribe.count(),
      this.prisma.tribe.findMany({ skip, take: limit }),
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
