import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {  CreateProductOrderDto, FindOrdersDto  } from 'dtos';
import {  UpdateProductOrderDto  } from 'dtos';
import { OrderStatus, UserRole } from 'dtos';
import { PrismaService } from '../prisma/prisma.service';

const allowedOrderStatusTransitions: Record<OrderStatus, readonly OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.PAID, OrderStatus.CANCELED],
  [OrderStatus.PAID]: [OrderStatus.SHIPPED, OrderStatus.REFUNDED],
  [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]: [],
  [OrderStatus.CANCELED]: [],
  [OrderStatus.REFUNDED]: [],
};

@Injectable()
export class ProductOrderService {
  constructor(private readonly prisma: PrismaService) {}

  // buyerId comes from the JWT token (req.user.id), NOT from the client body
  async create(buyerId: string, createProductOrderDto: CreateProductOrderDto) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Get the current stock and price
      const product = await tx.product.findUnique({
        where: { id: createProductOrderDto.productId },
        select: { stockAvailable: true, price: true },
      });

      if (!product) {
        throw new NotFoundException(`Product with ID ${createProductOrderDto.productId} not found`);
      }

      // 2. Validate stock
      if (product.stockAvailable < createProductOrderDto.quantity) {
        throw new BadRequestException(
          `Insufficient stock. Current: ${product.stockAvailable}, needed: ${createProductOrderDto.quantity}`,
        );
      }

      // 3. Update stock atomically
      await tx.product.update({
        where: { id: createProductOrderDto.productId },
        data: { stockAvailable: { decrement: createProductOrderDto.quantity } },
      });

      // Calculate total amount using the already fetched price
      const totalAmount = Number(product.price) * createProductOrderDto.quantity;

      // 4. Create the order
      return tx.productOrder.create({
        data: { ...createProductOrderDto, buyerId, totalAmount, currentStatus: OrderStatus.PENDING },
      });
    });
  }

  async findAll() {
    return this.prisma.productOrder.findMany({
      include: { product: true, buyer: true, statusHistory: true },
    });
  }

  // Returns all orders that belong to a specific buyer
  async findByBuyer(buyerId: string, query?: FindOrdersDto) {
    const { status } = query || {};
    return this.prisma.productOrder.findMany({
      where: { 
        buyerId,
        ...(status ? { currentStatus: status } : {}),
      },
      include: { product: true, statusHistory: true, buyer: true },
      orderBy: { createdAt: 'desc' },
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

  // Find a single order ensuring it belongs to the given buyerId
  async findOneForBuyer(id: string, buyerId: string) {
    const order = await this.prisma.productOrder.findUnique({
      where: { id },
      include: { product: true, buyer: true, statusHistory: true },
    });

    if (!order) throw new NotFoundException(`ProductOrder with ID ${id} not found`);

    if (order.buyerId !== buyerId) {
      throw new ForbiddenException('You can only view your own order');
    }

    return order;
  }

  // reqUser comes from the JWT token (req.user), NOT from the client body
  async update(
    id: string,
    reqUser: { id: string; role: UserRole },
    updateProductOrderDto: UpdateProductOrderDto,
  ) {
    const order = await this.findOne(id); // Already includes { product: true }

    if (
      order.buyerId !== reqUser.id &&
      reqUser.role !== UserRole.ADMIN &&
      reqUser.role !== UserRole.SELLER
    ) {
      throw new ForbiddenException('You can only update your own order');
    }

    const { statusNote, ...orderData } = updateProductOrderDto;
    const nextStatus = orderData.currentStatus;

    // Use a transaction to keep the order update and history log atomic
    return this.prisma.$transaction(async (tx) => {
      // Re-fetch the order inside the transaction to prevent race conditions
      const currentOrder = await tx.productOrder.findUnique({
        where: { id },
        include: { product: true },
      });

      if (!currentOrder) {
        throw new NotFoundException(`ProductOrder with ID ${id} not found`);
      }

      const statusChanged = nextStatus && nextStatus !== currentOrder.currentStatus;

      if (statusChanged) {
        const allowedTransitions = allowedOrderStatusTransitions[currentOrder.currentStatus as OrderStatus] ?? [];

        if (!allowedTransitions.includes(nextStatus)) {
          throw new BadRequestException(
            `Invalid order status transition from ${currentOrder.currentStatus} to ${nextStatus}`,
          );
        }
      }

      const updatedOrder = await tx.productOrder.update({
        where: { id },
        data: orderData,
      });

      // 1. Audit Log: Log status changes
      if (statusChanged) {
        await tx.orderStatusHistory.create({
          data: {
            orderId: id,
            changedByUserId: reqUser.id,
            previousStatus: currentOrder.currentStatus,
            newStatus: nextStatus!,
            statusNote: statusNote,
          },
        });

        // 1.5 Restore stock if the order is canceled or refunded
        if (
          (nextStatus === OrderStatus.CANCELED || nextStatus === OrderStatus.REFUNDED) &&
          currentOrder.currentStatus !== OrderStatus.CANCELED &&
          currentOrder.currentStatus !== OrderStatus.REFUNDED
        ) {
          await tx.product.update({
            where: { id: currentOrder.productId },
            data: { stockAvailable: { increment: currentOrder.quantity } },
          });
        }
      }

      // 2. Seller Rating: If the buyer left a rating for the seller, recalculate the seller's global rating
      if (orderData.sellerRatingValue !== undefined && currentOrder.product?.sellerId) {
        const sellerId = currentOrder.product.sellerId;
        
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

  async remove(id: string, reqUser: { id: string; role: UserRole }) {
    const order = await this.findOne(id); // Check existence

    if (order.buyerId !== reqUser.id && reqUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You can only delete your own order');
    }

    return this.prisma.$transaction(async (tx) => {
      // Restore stock if deleting an active order permanently
      if (
        order.currentStatus !== OrderStatus.CANCELED &&
        order.currentStatus !== OrderStatus.REFUNDED
      ) {
        await tx.product.update({
          where: { id: order.productId },
          data: { stockAvailable: { increment: order.quantity } },
        });
      }

      return tx.productOrder.delete({
        where: { id },
      });
    });
  }
}

