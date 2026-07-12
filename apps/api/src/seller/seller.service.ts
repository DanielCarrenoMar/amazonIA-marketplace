import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import { CreateSellerDto, UpdateSellerDto, FindSellersDto, UserRole, SellerResponseDto, PaginatedResponseDto, SellerMetricsResponseDto, OrderStatus } from 'event-types';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SellerService {
  constructor(private readonly prisma: PrismaService) {}

  async create(id: string, createSellerDto: CreateSellerDto): Promise<SellerResponseDto> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const seller = await tx.seller.create({
          data: { id, ...createSellerDto },
          include: {
            user: { 
              select: { 
                id: true, 
                fullName: true, 
                username: true, 
                email: true, 
                age: true, 
                nationality: true,
                avatarUrl: true,
                locationFormattedAddress: true,
                locationCity: true,
                locationRegion: true,
              } 
            },
            tribe: true,
            ledTribeAsPrimary: true,
            ledTribeAsSecondary: true,
          },
        });

        await tx.userAccount.update({
          where: { id },
          data: { role: UserRole.SELLER },
        });

        return seller;
      });
    } catch (e: any) {
      // Map Prisma unique constraint error to HTTP 409
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('Alguno de los campos únicos del seller ya está en uso');
      }
      throw e;
    }
  }

  async findAll(query?: FindSellersDto): Promise<PaginatedResponseDto<SellerResponseDto>> {
    const { tribeId, search, page = 1, limit = 10 } = query || {};
    const skip = (page - 1) * limit;

    const where: Prisma.SellerWhereInput = {
      ...(tribeId ? { tribeId } : {}),
      ...(search
        ? {
            OR: [
              { description: { contains: search, mode: 'insensitive' } },
              { user: { fullName: { contains: search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.seller.findMany({
        where,
        include: {
          user: { 
            select: { 
              id: true, 
              fullName: true, 
              username: true, 
              email: true, 
              age: true, 
              nationality: true,
              avatarUrl: true,
              locationFormattedAddress: true,
              locationCity: true,
              locationRegion: true,
            } 
          },
          tribe: true,
          ledTribeAsPrimary: true,
          ledTribeAsSecondary: true,
        },
        skip,
        take: limit,
      }),
      this.prisma.seller.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<SellerResponseDto> {
    // Instant read: the rating is already denormalized and stored in the Seller record.
    const seller = await this.prisma.seller.findUnique({
      where: { id },
      include: {
        user: { 
          select: { 
            id: true, 
            fullName: true, 
            username: true, 
            email: true, 
            age: true, 
            nationality: true,
            avatarUrl: true,
            locationFormattedAddress: true,
            locationCity: true,
            locationRegion: true,
          } 
        },
        tribe: true,
        ledTribeAsPrimary: true,
        ledTribeAsSecondary: true,
      },
    });
    
    if (!seller) throw new NotFoundException(`Vendedor con ID ${id} no encontrado`);
    return seller;
  }

  async getMetrics(sellerId: string): Promise<SellerMetricsResponseDto> {
    await this.findOne(sellerId); // Check existence

    // Calculate readyToPayout (orders delivered)
    const readyToPayoutAggr = await this.prisma.productOrder.aggregate({
      where: {
        product: { sellerId },
        currentStatus: OrderStatus.DELIVERED,
      },
      _sum: { totalAmount: true },
    });

    // Calculate pendingRelease (orders shipped but not delivered)
    const pendingReleaseAggr = await this.prisma.productOrder.aggregate({
      where: {
        product: { sellerId },
        currentStatus: OrderStatus.SHIPPED,
      },
      _sum: { totalAmount: true },
    });

    // Calculate soldThisMonth (all paid, shipped, delivered, completed orders created this month)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const soldThisMonthAggr = await this.prisma.productOrder.aggregate({
      where: {
        product: { sellerId },
        currentStatus: { in: [OrderStatus.PAID, OrderStatus.SHIPPED, OrderStatus.DELIVERED] },
        createdAt: { gte: startOfMonth },
      },
      _sum: { totalAmount: true },
    });

    return {
      readyToPayout: Number(readyToPayoutAggr._sum.totalAmount) || 0,
      pendingRelease: Number(pendingReleaseAggr._sum.totalAmount) || 0,
      soldThisMonth: Number(soldThisMonthAggr._sum.totalAmount) || 0,
    };
  }

  async update(id: string, reqUser: { id: string; role: UserRole }, updateSellerDto: UpdateSellerDto): Promise<SellerResponseDto> {
    await this.findOne(id); // Check existence

    if (reqUser && reqUser.role !== UserRole.ADMIN && reqUser.id !== id) {
      throw new ForbiddenException('No tienes permiso para actualizar este perfil de vendedor');
    }

    return this.prisma.seller.update({
      where: { id },
      data: updateSellerDto,
      include: {
        user: { 
          select: { 
            id: true, 
            fullName: true, 
            username: true, 
            email: true, 
            age: true, 
            nationality: true,
            avatarUrl: true,
            locationFormattedAddress: true,
            locationCity: true,
            locationRegion: true,
          } 
        },
        tribe: true,
        ledTribeAsPrimary: true,
        ledTribeAsSecondary: true,
      },
    });
  }

  async remove(id: string, reqUser?: { id: string; role: UserRole }) {
    await this.findOne(id); // Check existence

    if (reqUser && reqUser.role !== UserRole.ADMIN && reqUser.id !== id) {
      throw new ForbiddenException('No tienes permiso para eliminar este perfil de vendedor');
    }

    return this.prisma.seller.delete({
      where: { id },
    });
  }

  @OnEvent('product-rating.product-updated', { async: true })
  async handleProductUpdated(payload: { sellerId: string }) {
    const { sellerId } = payload;
    
    // Calculate new average and total across ALL products of this seller
    const aggregate = await this.prisma.productRating.aggregate({
      where: { product: { sellerId } },
      _avg: { ratingValue: true },
      _count: { ratingValue: true },
    });

    await this.prisma.seller.update({
      where: { id: sellerId },
      data: {
        avgProductRating: aggregate._avg.ratingValue,
        totalReviews: aggregate._count.ratingValue,
      },
    });
  }
}
