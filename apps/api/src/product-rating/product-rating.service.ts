import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import { CreateProductRatingDto, PaginationDto, OrderStatus, FindProductRatingsDto } from 'event-types';
import { UpdateProductRatingDto } from 'event-types';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductRatingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2
  ) {}

  // userAccountId comes from the JWT token (req.user.id), NOT from the client body
  async create(userAccountId: string, createProductRatingDto: CreateProductRatingDto) {
    const { productId, ratingValue } = createProductRatingDto;

    const order = await this.prisma.productOrder.findFirst({
      where: {
        buyerId: userAccountId,
        productId,
        currentStatus: OrderStatus.DELIVERED,
      },
    });

    if (!order) {
      throw new ForbiddenException('Debes haber recibido el producto para calificarlo');
    }

    return this.prisma.$transaction(async (tx) => {
      let newRating;
      try {
        newRating = await tx.productRating.create({
          data: { productId, userAccountId, ratingValue },
        });
      } catch (e: any) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
          // Composite primary key conflict — user already rated this product
          throw new ConflictException('Ya existe una valoración de este usuario para este producto');
        }
        throw e;
      }

      // Emit event to recalculate aggregates asynchronously
      this.eventEmitter.emit('product-rating.changed', { productId });
      return newRating;
    });
  }

  async findAll(query?: FindProductRatingsDto) {
    const { page = 1, limit = 10, productId } = query || {};
    const skip = (page - 1) * limit;

    const where: Prisma.ProductRatingWhereInput = {
      ...(productId ? { productId } : {}),
    };

    const [total, data] = await Promise.all([
      this.prisma.productRating.count({ where }),
      this.prisma.productRating.findMany({
        where,
        include: { 
          product: true, 
          user: { omit: { passwordHash: true } } 
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
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

  async findOne(productId: string, userAccountId: string) {
    const rating = await this.prisma.productRating.findUnique({
      where: { productId_userAccountId: { productId, userAccountId } },
      include: { user: { omit: { passwordHash: true } } },
    });

    if (!rating) throw new NotFoundException('ProductRating not found');
    return rating;
  }

  async update(productId: string, userAccountId: string, updateProductRatingDto: UpdateProductRatingDto) {
    // findUnique with the composite key guarantees ownership:
    // if the rating doesn't exist for THIS user on THIS product → 404
    const rating = await this.prisma.productRating.findUnique({
      where: { productId_userAccountId: { productId, userAccountId } },
    });

    if (!rating) {
      throw new NotFoundException('Rating not found or you do not own this rating');
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedRating = await tx.productRating.update({
        where: { productId_userAccountId: { productId, userAccountId } },
        data: updateProductRatingDto,
      });

      // Emit event to recalculate aggregates asynchronously
      this.eventEmitter.emit('product-rating.changed', { productId });
      return updatedRating;
    });
  }

  async remove(productId: string, userAccountId: string) {
    // findUnique with the composite key guarantees ownership:
    // if the rating doesn't exist for THIS user on THIS product → 404
    const rating = await this.prisma.productRating.findUnique({
      where: { productId_userAccountId: { productId, userAccountId } },
    });

    if (!rating) {
      throw new NotFoundException('Rating not found or you do not own this rating');
    }

    return this.prisma.$transaction(async (tx) => {
      const deletedRating = await tx.productRating.delete({
        where: { productId_userAccountId: { productId, userAccountId } },
      });

      // Emit event to recalculate aggregates asynchronously
      this.eventEmitter.emit('product-rating.changed', { productId });
      return deletedRating;
    });
  }
}

