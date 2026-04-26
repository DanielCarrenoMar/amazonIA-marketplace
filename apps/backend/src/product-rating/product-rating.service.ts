import { Injectable, NotFoundException } from '@nestjs/common';
import {  CreateProductRatingDto  } from 'dtos';
import {  UpdateProductRatingDto  } from 'dtos';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductRatingService {
  constructor(private readonly prisma: PrismaService) {}

  // Recalculates the exact average rating of a product using Prisma's aggregate
  private async recalculateProductAverage(tx: any, productId: string) {
    const aggregate = await tx.productRating.aggregate({
      where: { productId },
      _avg: { ratingValue: true },
    });

    const newAverage = aggregate._avg.ratingValue;
    
    // Update the parent Product with the newly calculated mathematical average
    await tx.product.update({
      where: { id: productId },
      data: { averageRating: newAverage },
    });
  }

  // userAccountId comes from the JWT token (req.user.id), NOT from the client body
  async create(userAccountId: string, createProductRatingDto: CreateProductRatingDto) {
    const { productId, ratingValue } = createProductRatingDto;

    return this.prisma.$transaction(async (tx) => {
      const newRating = await tx.productRating.create({
        data: { productId, userAccountId, ratingValue },
      });

      // Recalculate average and inject it into the product
      await this.recalculateProductAverage(tx, productId);
      return newRating;
    });
  }

  async findAll() {
    return this.prisma.productRating.findMany();
  }

  async findOne(productId: string, userAccountId: string) {
    const rating = await this.prisma.productRating.findUnique({
      where: { productId_userAccountId: { productId, userAccountId } },
      include: { user: true },
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

      // Recalculate average since the rating amount changed
      await this.recalculateProductAverage(tx, productId);
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

      // Recalculate average since one rating was dropped
      await this.recalculateProductAverage(tx, productId);
      return deletedRating;
    });
  }
}

