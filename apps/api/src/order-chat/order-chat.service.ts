import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderChatDto } from 'event-types';

@Injectable()
export class OrderChatService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createDto: CreateOrderChatDto) {
    // Verificar que la orden exista y el usuario sea el comprador o el vendedor
    const order = await this.prisma.productOrder.findUnique({
      where: { id: createDto.orderId },
      include: {
        product: {
          select: { sellerId: true }
        }
      }
    });

    if (!order) {
      throw new NotFoundException('El pedido no existe');
    }

    if (order.buyerId !== userId && order.product.sellerId !== userId) {
      throw new ForbiddenException('No tienes permiso para comentar en este pedido');
    }

    return this.prisma.orderChat.create({
      data: {
        orderId: createDto.orderId,
        senderId: userId,
        message: createDto.message,
      },
    });
  }

  async findByOrder(orderId: string, userId: string) {
    // Opcional: Validar que el usuario tenga acceso a ver este chat
    const order = await this.prisma.productOrder.findUnique({
      where: { id: orderId },
      include: {
        product: {
          select: { sellerId: true }
        }
      }
    });

    if (!order) {
      throw new NotFoundException('El pedido no existe');
    }

    if (order.buyerId !== userId && order.product.sellerId !== userId) {
      throw new ForbiddenException('No tienes permiso para ver este chat');
    }

    return this.prisma.orderChat.findMany({
      where: { orderId },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            role: true,
          }
        }
      },
      orderBy: {
        sentAt: 'asc',
      },
    });
  }
}
