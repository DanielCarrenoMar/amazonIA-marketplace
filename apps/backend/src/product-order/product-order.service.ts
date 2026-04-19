import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateProductOrderDto } from './dto/create-product-order.dto';
import { UpdateProductOrderDto } from './dto/update-product-order.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductOrderService {
  constructor(private readonly prisma: PrismaService) {}

  // buyerId comes from the JWT token (req.user.id), NOT from the client body
  async create(buyerId: string, createProductOrderDto: CreateProductOrderDto) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Get the current stock
      const product = await tx.product.findUnique({
        where: { id: createProductOrderDto.productId },
        select: { stockAvailable: true },
      });

      if (!product) {
        throw new NotFoundException(`Product with ID ${createProductOrderDto.productId} not found`);
      }

      // 2. Validate and calculate new stock
      const newStock = product.stockAvailable - createProductOrderDto.quantity;
      if (newStock < 0) {
        throw new BadRequestException(
          `Insufficient stock. Current: ${product.stockAvailable}, needed: ${createProductOrderDto.quantity}`,
        );
      }

      // 3. Update stock
      await tx.product.update({
        where: { id: createProductOrderDto.productId },
        data: { stockAvailable: newStock },
      });

      // 4. Create the order
      return tx.productOrder.create({
        data: { ...createProductOrderDto, buyerId },
      });
    });
  }

  async findAll() {
    return this.prisma.productOrder.findMany({
      include: { product: true, buyer: true, statusHistory: true },
    });
  }

  async findOne(id: string) {
    const order = await this.prisma.productOrder.findUnique({
      where: { id },
      include: { product: true, buyer: true, statusHistory: true },
    });

    if (!order) throw new NotFoundException(`ProductOrder with ID ${id} not found`);
    return order;
  }

  // changedByUserId comes from the JWT token (req.user.id), NOT from the client body
  async update(id: string, changedByUserId: string, updateProductOrderDto: UpdateProductOrderDto) {
    const order = await this.findOne(id); // Already includes { product: true }

    const { statusNote, ...orderData } = updateProductOrderDto;
    const statusChanged = orderData.currentStatus && orderData.currentStatus !== order.currentStatus;

    // Use a transaction to keep the order update and history log atomic
    return this.prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.productOrder.update({
        where: { id },
        data: orderData,
      });

      // 1. Audit Log: Log status changes
      if (statusChanged) {
        await tx.orderStatusHistory.create({
          data: {
            orderId: id,
            changedByUserId,
            previousStatus: order.currentStatus,
            newStatus: orderData.currentStatus!,
            statusNote: statusNote,
          },
        });
      }

      // 2. Seller Rating: If the buyer left a rating for the seller, recalculate the seller's global rating
      if (orderData.sellerRatingValue !== undefined && order.product?.sellerId) {
        const sellerId = order.product.sellerId;
        
        // Find the mathematical average of all completed ratings for this seller
        const aggregate = await tx.productOrder.aggregate({
          where: { 
            product: { sellerId },
            sellerRatingValue: { not: null }
          },
          _avg: { sellerRatingValue: true },
        });

        const newAverageRaw = aggregate._avg.sellerRatingValue;

        // The schema restricts seller.rating to an INTEGER between 1 and 5
        if (newAverageRaw !== null) {
          const roundedRating = Math.round(newAverageRaw);
          await tx.seller.update({
            where: { id: sellerId },
            data: { rating: roundedRating },
          });
        }
      }

      return updatedOrder;
    });
  }

  async findHistory(id: string) {
    await this.findOne(id); // Verify the order exists first
    return this.prisma.orderStatusHistory.findMany({
      where: { orderId: id },
      orderBy: { createdAt: 'asc' },
      include: { changedByUser: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id); // Check existence
    return this.prisma.productOrder.delete({
      where: { id },
    });
  }
}
