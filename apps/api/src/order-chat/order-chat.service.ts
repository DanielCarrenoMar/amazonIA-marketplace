import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderChatDto, OrderStatus, OrderChatResponseDto, UserRole } from 'event-types';

@Injectable()
export class OrderChatService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createDto: CreateOrderChatDto): Promise<OrderChatResponseDto> {
    // Verificar que la orden exista y el usuario sea el comprador o el vendedor
    const order = await this.prisma.productOrder.findUnique({
      where: { id: createDto.orderId },
      include: {
        product: {
          select: {
            seller: {
              select: { user: { select: { id: true } } }
            }
          }
        }
      }
    });

    if (!order) {
      throw new NotFoundException('El pedido no existe');
    }

    if (order.buyerId !== userId && order.product.seller.user.id !== userId) {
      console.error(`AUTH FAIL CREATE: buyerId=${order.buyerId}, sellerUserId=${order.product.seller.user.id}, requestUserId=${userId}`);
      throw new ForbiddenException('No tienes permiso para comentar en este pedido');
    }

    const finalizedStatuses: string[] = [OrderStatus.DELIVERED, OrderStatus.CANCELED, OrderStatus.REFUNDED];
    if (finalizedStatuses.includes(order.currentStatus)) {
      throw new BadRequestException('No se pueden enviar mensajes en un pedido finalizado');
    }

    const result = await this.prisma.orderChat.create({
      data: {
        orderId: createDto.orderId,
        senderId: userId,
        message: createDto.message,
      },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            role: true,
          }
        }
      }
    });

    return {
      id: result.id,
      orderId: result.orderId,
      senderId: result.senderId,
      message: result.message,
      sentAt: result.sentAt,
      sender: {
        id: result.sender.id,
        fullName: result.sender.fullName,
        role: result.sender.role as UserRole,
      }
    };
  }

  async findByOrder(orderId: string, userId: string, role?: UserRole): Promise<OrderChatResponseDto[]> {
    // Opcional: Validar que el usuario tenga acceso a ver este chat
    const order = await this.prisma.productOrder.findUnique({
      where: { id: orderId },
      include: {
        product: {
          select: {
            seller: {
              select: { user: { select: { id: true } } }
            }
          }
        }
      }
    });

    if (!order) {
      throw new NotFoundException('El pedido no existe');
    }

    if (
      role !== UserRole.ADMIN &&
      order.buyerId !== userId &&
      order.product.seller.user.id !== userId
    ) {
      console.error(`AUTH FAIL GET: buyerId=${order.buyerId}, sellerUserId=${order.product.seller.user.id}, requestUserId=${userId}`);
      throw new ForbiddenException('No tienes permiso para ver este chat');
    }

    const results = await this.prisma.orderChat.findMany({
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

    return results.map((result) => ({
      id: result.id,
      orderId: result.orderId,
      senderId: result.senderId,
      message: result.message,
      sentAt: result.sentAt,
      sender: {
        id: result.sender.id,
        fullName: result.sender.fullName,
        role: result.sender.role as UserRole,
      }
    }));
  }
}
