import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductRatingDto } from './dto/create-product-rating.dto';
import { UpdateProductRatingDto } from './dto/update-product-rating.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductRatingService {
  constructor(private readonly prisma: PrismaService) {}

  // userAccountId comes from the JWT token (req.user.id), NOT from the client body
  async create(userAccountId: string, createProductRatingDto: CreateProductRatingDto) {
    return this.prisma.productRating.create({
      data: { ...createProductRatingDto, userAccountId },
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
    await this.findOne(productId, userAccountId); // Check existence
    return this.prisma.productRating.update({
      where: { productId_userAccountId: { productId, userAccountId } },
      data: updateProductRatingDto,
    });
  }

  async remove(productId: string, userAccountId: string) {
    await this.findOne(productId, userAccountId); // Check existence
    return this.prisma.productRating.delete({
      where: { productId_userAccountId: { productId, userAccountId } },
    });
  }
}
