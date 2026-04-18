import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductOrderDto } from './dto/create-product-order.dto';
import { UpdateProductOrderDto } from './dto/update-product-order.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductOrderService {
  constructor(private readonly prisma: PrismaService) {}

  // buyerId comes from the JWT token (req.user.id), NOT from the client body
  async create(buyerId: string, createProductOrderDto: CreateProductOrderDto) {
    return this.prisma.productOrder.create({
      data: { ...createProductOrderDto, buyerId },
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
    const order = await this.findOne(id);

    const { statusNote, ...orderData } = updateProductOrderDto;
    const statusChanged = orderData.currentStatus && orderData.currentStatus !== order.currentStatus;

    // Use a transaction to keep the order update and history log atomic
    return this.prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.productOrder.update({
        where: { id },
        data: orderData,
      });

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
