import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ToggleFavoriteDto } from 'event-types';

@Injectable()
export class FavoriteService {
  constructor(private readonly prisma: PrismaService) { }

  async toggleFavorite(userId: string, toggleFavoriteDto: ToggleFavoriteDto) {
    const { productId } = toggleFavoriteDto;

    const existing = await this.prisma.userFavoriteProduct.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (existing) {
      // Remove it
      await this.prisma.userFavoriteProduct.delete({
        where: {
          userId_productId: {
            userId,
            productId,
          },
        },
      });
      return { isFavorite: false };
    } else {
      // Add it
      await this.prisma.userFavoriteProduct.create({
        data: {
          userId,
          productId,
        },
      });
      return { isFavorite: true };
    }
  }

  async getFavorites(userId: string) {
    const favorites = await this.prisma.userFavoriteProduct.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            seller: {
              include: {
                user: true,
              },
            },
            category: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return favorites.map(fav => ({
      userId: fav.userId,
      productId: fav.productId,
      createdAt: fav.createdAt,
      product: fav.product,
    }));
  }

  async getFavoriteIds(userId: string) {
    const favorites = await this.prisma.userFavoriteProduct.findMany({
      where: { userId },
      select: { productId: true },
    });
    return favorites.map(f => f.productId);
  }
}
