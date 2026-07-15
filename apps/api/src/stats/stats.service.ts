import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  async getImpactStats() {
    // Run all count/aggregations in parallel for better performance
    const [artisansCount, ordersData, totalProducts] = await Promise.all([
      this.prisma.seller.count(),
      this.prisma.productOrder.aggregate({
        _count: { id: true },
        _sum: { totalAmount: true },
        where: { currentStatus: OrderStatus.DELIVERED }
      }),
      this.prisma.product.count({ where: { isActive: true } })
    ]);

    return {
      artisansCount,
      transactionsCount: ordersData._count.id,
      totalVolume: Number(ordersData._sum.totalAmount || 0),
      activeProducts: totalProducts
    };
  }
}
