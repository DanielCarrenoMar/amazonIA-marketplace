import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CreateProductOrderDto, FindOrdersDto, PaginationDto } from 'event-types';
import { UpdateProductOrderDto } from 'event-types';
import { OrderStatus, UserRole } from 'event-types';
import { STREAM_TOPICS } from 'messaging';
import { PrismaService } from '../prisma/prisma.service';
import { OutboxService } from '../outbox/outbox.service';
import { TelemetryIntegrationService } from '../telemetry-integration/telemetry-integration.service';

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
  constructor(
    private readonly prisma: PrismaService,
    private readonly outbox: OutboxService,
    private readonly telemetryIntegration: TelemetryIntegrationService,
  ) {}

  // buyerId comes from the JWT token (req.user.id), NOT from the client body
  async create(buyerId: string, createProductOrderDto: CreateProductOrderDto) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Get the current stock and price
      const product = await tx.product.findUnique({
        where: { id: createProductOrderDto.productId },
        select: { stockAvailable: true, price: true, sellerId: true },
      });

      if (!product) {
        throw new NotFoundException(`Product with ID ${createProductOrderDto.productId} not found`);
      }

      // 2. Prevent self-purchase — a seller cannot buy their own products
      if (product.sellerId === buyerId) {
        throw new BadRequestException('No podés comprar tus propios productos');
      }

      // 3. Validate stock
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

  async findAll(query?: PaginationDto) {
    const { page = 1, limit = 10 } = query || {};
    const skip = (page - 1) * limit;

    const [total, data] = await Promise.all([
      this.prisma.productOrder.count(),
      this.prisma.productOrder.findMany({
        include: { 
          product: true, 
          buyer: { omit: { passwordHash: true } }, 
          statusHistory: true 
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Returns all orders that belong to a specific buyer with pagination and filters
  async findByBuyer(buyerId: string, query?: FindOrdersDto) {
    const { status, page = 1, limit = 10, dateFrom, dateTo } = query || {};
    const skip = (page - 1) * limit;

    const where: Prisma.ProductOrderWhereInput = {
      buyerId,
      ...(status ? { currentStatus: status } : {}),
      ...(dateFrom || dateTo
        ? {
          createdAt: {
            ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
            ...(dateTo ? { lte: new Date(dateTo) } : {}),
          },
        }
        : {}),
    };

    const [total, data] = await Promise.all([
      this.prisma.productOrder.count({ where }),
      this.prisma.productOrder.findMany({
        where,
        include: {
          product: true,
          statusHistory: { orderBy: { createdAt: 'desc' } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findBySeller(sellerId: string, query?: FindOrdersDto) {
    const { status, page = 1, limit = 10, dateFrom, dateTo } = query || {};
    const skip = (page - 1) * limit;

    const where: Prisma.ProductOrderWhereInput = {
      product: { sellerId },
      ...(status ? { currentStatus: status } : {}),
      ...(dateFrom || dateTo
        ? {
          createdAt: {
            ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
            ...(dateTo ? { lte: new Date(dateTo) } : {}),
          },
        }
        : {}),
    };

    const [total, data] = await Promise.all([
      this.prisma.productOrder.count({ where }),
      this.prisma.productOrder.findMany({
        where,
        include: {
          product: true,
          buyer: { omit: { passwordHash: true } },
          statusHistory: { orderBy: { createdAt: 'desc' } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, reqUser?: { id: string; role: UserRole }) {
    const order = await this.prisma.productOrder.findUnique({
      where: { id },
      include: {
        product: true,
        buyer: { omit: { passwordHash: true } },
        statusHistory: true,
      },
    });

    if (!order) throw new NotFoundException(`ProductOrder with ID ${id} not found`);

    if (reqUser && reqUser.role !== UserRole.ADMIN) {
      if (order.buyerId !== reqUser.id && order.product.sellerId !== reqUser.id) {
        throw new ForbiddenException('You can only view your own orders');
      }
    }

    return order;
  }

  /**
   * Returns the order with its IoT telemetry enriched from MongoDB.
   * If MongoDB is unavailable (circuit OPEN, timeout, or error), telemetry
   * degrades gracefully to null — the order data from PostgreSQL is always returned.
   */
  async findOneWithTelemetry(id: string, reqUser: { id: string; role: UserRole }) {
    const order = await this.findOne(id, reqUser);
    const telemetry = await this.telemetryIntegration.getShipmentTelemetry(
      order.trackingNumber ?? null,
    );
    return { ...order, telemetry };
  }

  /**
   * Returns a unified chronological timeline merging PostgreSQL status history
   * with MongoDB IoT telemetry events, sorted oldest-first.
   * Telemetry degrades gracefully: if MongoDB is unavailable, only order events
   * are returned and `telemetryAvailable` is set to false.
   */
  async getTimeline(id: string, reqUser: { id: string; role: UserRole }) {
    const order = await this.findOne(id, reqUser);
    const telemetry = await this.telemetryIntegration.getShipmentTelemetry(
      order.trackingNumber ?? null,
      100,
    );

    const orderEvents = order.statusHistory.map((h) => ({
      type: 'order_event' as const,
      timestamp: h.createdAt.toISOString(),
      source: 'postgresql' as const,
      historyId: h.id,
      previousStatus: (h.previousStatus as OrderStatus) ?? null,
      newStatus: h.newStatus as OrderStatus,
      statusNote: h.statusNote,
    }));

    const telemetryEvents = (telemetry ?? []).map((e) => ({
      type: 'telemetry' as const,
      timestamp: e.recorded_at,
      source: 'mongodb' as const,
      event_id: e.event_id,
      event_type: e.event_type,
      temperature_celsius: e.telemetry.temperature_celsius,
      shock_g_force: e.telemetry.shock_g_force,
      location: e.location,
      shipment_status: e.business_context.status,
      scan_type: e.business_context.scan_type,
    }));

    const items = [...orderEvents, ...telemetryEvents].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );

    return {
      orderId: order.id,
      trackingNumber: order.trackingNumber ?? null,
      telemetryAvailable: telemetry !== null,
      items,
    };
  }

  // Find a single order ensuring it belongs to the given buyerId
  async findOneForBuyer(id: string, buyerId: string) {
    const order = await this.prisma.productOrder.findUnique({
      where: { id },
      include: {
        product: true,
        buyer: { omit: { passwordHash: true } },
        statusHistory: true,
      },
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
      (reqUser.role !== UserRole.SELLER || order.product?.sellerId !== reqUser.id)
    ) {
      throw new ForbiddenException('You can only update your own order');
    }

    if (updateProductOrderDto.sellerRatingValue !== undefined) {
      if (reqUser.id !== order.buyerId) {
        throw new ForbiddenException('Solo el comprador puede calificar al vendedor');
      }
    }

    if (updateProductOrderDto.buyerRatingValue !== undefined) {
      if (reqUser.id !== order.product?.sellerId && reqUser.role !== UserRole.ADMIN) {
        throw new ForbiddenException('Solo el vendedor (o un admin) puede calificar al comprador');
      }
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

        // 1.6 Append an outbox event atomically — same transaction guarantees ACID consistency
        await this.outbox.append(
          tx,
          'ProductOrder',
          id,
          `order.${nextStatus.toLowerCase()}`,
          {
            orderId: id,
            productId: currentOrder.productId,
            buyerId: currentOrder.buyerId,
            sellerId: currentOrder.product?.sellerId ?? null,
            quantity: currentOrder.quantity,
            totalAmount: currentOrder.totalAmount.toString(),
            previousStatus: currentOrder.currentStatus,
            newStatus: nextStatus,
            changedByUserId: reqUser.id,
            topic: STREAM_TOPICS.SHIPMENT_EVENTS,
          },
        );
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

  async findHistory(id: string, reqUser?: { id: string; role: UserRole }) {
    await this.findOne(id, reqUser); // Verify the order exists and check ownership
    return this.prisma.orderStatusHistory.findMany({
      where: { orderId: id },
      orderBy: { createdAt: 'asc' },
      include: { changedByUser: { omit: { passwordHash: true } } },
    });
  }

  async remove(id: string, reqUser: { id: string; role: UserRole }) {
    const order = await this.findOne(id); // Check existence

    if (order.buyerId !== reqUser.id && reqUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You can only delete your own order');
    }

    if (order.currentStatus !== OrderStatus.PENDING && order.currentStatus !== OrderStatus.CANCELED) {
      throw new ConflictException('Sólo las órdenes PENDING o CANCELED pueden ser eliminadas');
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

