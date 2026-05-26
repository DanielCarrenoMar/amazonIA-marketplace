import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from './prisma.service';

export const createExtendedPrismaClient = (prisma: PrismaService) => {
  return prisma.$extends({
    query: {
      productRating: {
        async $allOperations({ operation, args, query }) {
          // Execute the original query
          const result = await query(args);

          // Listen only for mutations
          if (['create', 'update', 'delete', 'upsert'].includes(operation)) {
            // Depending on the query and whether returning true is used, the result may be the rating object
            // or an object containing count. Most find/create/update queries return the object.
            // Assuming result contains productId
            const productId = (result as any)?.productId;
            if (productId) {
              // 1. Find the seller associated with this product
              const product = await prisma.product.findUnique({
                where: { id: productId },
                select: { sellerId: true },
              });

              if (product) {
                // 2. Calculate the new average rating and total reviews for the seller's products
                const aggregations = await prisma.productRating.aggregate({
                  where: { product: { sellerId: product.sellerId } },
                  _avg: { ratingValue: true },
                  _count: { ratingValue: true },
                });

                const avgProductRating = aggregations._avg.ratingValue ?? null;
                const totalReviews = aggregations._count.ratingValue;

                // 3. Update the Seller model with the precalculated values
                await prisma.seller.update({
                  where: { id: product.sellerId },
                  data: {
                    avgProductRating,
                    totalReviews,
                  },
                });
              }
            }
          }

          return result;
        },
      },
    },
  });
};

export type ExtendedPrismaClient = ReturnType<typeof createExtendedPrismaClient>;

@Injectable()
export class PrismaExtensionService implements OnModuleInit {
  public client: ExtendedPrismaClient;

  constructor(private readonly prisma: PrismaService) {
    this.client = createExtendedPrismaClient(this.prisma);
  }

  onModuleInit() {
    // Client is initialized synchronously in the constructor
  }
}
