import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CreateProductOrderDto, FindOrdersDto, PaginationDto, ProductOrderResponseDto, PaginatedResponseDto, OrderStatusHistoryResponseDto, OrderTimelineResponseDto } from 'event-types';
import { UpdateProductOrderDto } from 'event-types';
import { OrderStatus, UserRole } from 'event-types';
import { STREAM_TOPICS } from 'messaging';
import { ConfigService } from '@nestjs/config';
import * as mqtt from 'mqtt';
import { PrismaService } from '../prisma/prisma.service';
import { OutboxService } from '../outbox/outbox.service';
import { TelemetryIntegrationService } from '../telemetry-integration/telemetry-integration.service';
import { NotaryClientService } from '../blockchain/services/notary-client.service';
import * as crypto from 'crypto';

const allowedOrderStatusTransitions: Record<OrderStatus, readonly OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.PAID, OrderStatus.CANCELED],
  [OrderStatus.PAID]: [OrderStatus.SHIPPED, OrderStatus.REFUNDED],
  [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]: [],
  [OrderStatus.CANCELED]: [],
  [OrderStatus.REFUNDED]: [],
};

import { NotificationService } from '../notification/notification.service';

@Injectable()
export class ProductOrderService {
  private readonly logger = new Logger(ProductOrderService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly outbox: OutboxService,
    private readonly telemetryIntegration: TelemetryIntegrationService,
    private readonly configService: ConfigService,
    private readonly notificationService: NotificationService,
    private readonly notaryClient: NotaryClientService,
  ) {}


  // buyerId comes from the JWT token (req.user.id), NOT from the client body
  async create(buyerId: string, createProductOrderDto: CreateProductOrderDto): Promise<ProductOrderResponseDto> {
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Get the current stock and price
      const product = await tx.product.findUnique({
        where: { id: createProductOrderDto.productId },
        select: { 
          stockAvailable: true, 
          price: true, 
          sellerId: true,
          locationMapboxId: true,
          locationFormattedAddress: true,
          locationCity: true,
          locationRegion: true,
          seller: {
            select: {
              user: {
                select: {
                  locationMapboxId: true,
                  locationFormattedAddress: true,
                  locationCity: true,
                  locationRegion: true,
                }
              }
            }
          }
        },
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

      // 4. Fetch the buyer to get their location
      const buyer = await tx.userAccount.findUnique({
        where: { id: buyerId },
        select: {
          locationMapboxId: true,
          locationFormattedAddress: true,
          locationCity: true,
          locationRegion: true,
        },
      });

      if (!buyer) {
        throw new NotFoundException(`Buyer with ID ${buyerId} not found`);
      }

      const { destinationCoords, ...rest } = createProductOrderDto;

      // Use DTO values, or fallback to the buyer's location
      const finalMapboxId = rest.destinationMapboxId ?? buyer.locationMapboxId;
      const finalFormattedAddress = rest.destinationFormattedAddress ?? buyer.locationFormattedAddress;
      const finalCity = rest.destinationCity ?? buyer.locationCity;
      const finalRegion = rest.destinationRegion ?? buyer.locationRegion;
      // Use product location, or fallback to seller's user profile location
      const originMapboxId = product.locationMapboxId ?? product.seller.user.locationMapboxId;
      const originFormattedAddress = product.locationFormattedAddress ?? product.seller.user.locationFormattedAddress;
      const originCity = product.locationCity ?? product.seller.user.locationCity;
      const originRegion = product.locationRegion ?? product.seller.user.locationRegion;

      const initialStatus = createProductOrderDto.transactionHash ? OrderStatus.PAID : OrderStatus.PENDING;
      const paymentMethod = createProductOrderDto.transactionHash ? 'CRYPTO' : undefined;

      // 5. Create the order
      const order = await tx.productOrder.create({
        data: {
          ...rest,
          destinationMapboxId: finalMapboxId,
          destinationFormattedAddress: finalFormattedAddress,
          destinationCity: finalCity,
          destinationRegion: finalRegion,
          originMapboxId,
          originFormattedAddress,
          originCity,
          originRegion,
          buyerId,
          totalAmount,
          currentStatus: initialStatus,
          paymentMethod,
        },
      });

      // 6. Set Spatial Coordinates
      // If client provided explicitly coords, use them. Otherwise, copy from the buyer's profile via SQL.
      // Additionally, always set origin_coords from product or seller location.
      if (destinationCoords && destinationCoords.latitude != null && destinationCoords.longitude != null) {
        await tx.$executeRaw`
          UPDATE product_order 
          SET 
            destination_coords = ST_SetSRID(ST_MakePoint(${destinationCoords.longitude}, ${destinationCoords.latitude}), 4326),
            origin_coords = COALESCE(
              (SELECT location_coords FROM product WHERE id = ${createProductOrderDto.productId}::uuid),
              (SELECT location_coords FROM user_account WHERE id = ${product.sellerId}::uuid)
            )
          WHERE id = ${order.id}::uuid;
        `;
      } else {
        await tx.$executeRaw`
          UPDATE product_order 
          SET 
            destination_coords = (SELECT location_coords FROM user_account WHERE id = ${buyerId}::uuid),
            origin_coords = COALESCE(
              (SELECT location_coords FROM product WHERE id = ${createProductOrderDto.productId}::uuid),
              (SELECT location_coords FROM user_account WHERE id = ${product.sellerId}::uuid)
            )
          WHERE id = ${order.id}::uuid;
        `;
      }

      // Audit Log for initial creation
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          changedByUserId: buyerId,
          previousStatus: null,
          newStatus: OrderStatus.PENDING,
          statusNote: 'Pedido creado',
        },
      });

      if (initialStatus === OrderStatus.PAID) {
        await tx.orderStatusHistory.create({
          data: {
            orderId: order.id,
            changedByUserId: buyerId,
            previousStatus: OrderStatus.PENDING,
            newStatus: OrderStatus.PAID,
            statusNote: 'Pago registrado con Hash de Transacción',
          },
        });

        // Append outbox event for paid order
        await this.outbox.append(
          tx,
          'ProductOrder',
          order.id,
          `order.paid`,
          {
            orderId: order.id,
            productId: order.productId,
            buyerId: order.buyerId,
            sellerId: product.sellerId,
            quantity: order.quantity,
            totalAmount: order.totalAmount.toString(),
            previousStatus: OrderStatus.PENDING,
            newStatus: OrderStatus.PAID,
            changedByUserId: buyerId,
            trackingNumber: null,
            topic: STREAM_TOPICS.SHIPMENT_EVENTS,
          },
        );
      }

      return order;
    });

    // Disparar notarización si se creó directamente como PAID
    if (result.currentStatus === OrderStatus.PAID && result.transactionHash) {
      this.prisma.product.findUnique({
        where: { id: result.productId },
        select: { id: true, sellerId: true },
      }).then(async (product) => {
        if (product) {
          const productHash = crypto
            .createHash('sha256')
            .update(`${result.productId}-${product.sellerId}-${result.createdAt.getTime()}`)
            .digest('hex');

          this.logger.log(`Firing asynchronous notarization proposal creation for order ${result.id} from creation`);
          await this.notaryClient.notarizeOrder({
            orderId: result.id,
            amount: Number(result.totalAmount),
            paymentMethod: result.paymentMethod ?? 'CRYPTO',
            productHash,
            buyerId: result.buyerId,
            sellerId: product.sellerId,
            webhookUrl: '',
          });
        }
      }).catch(err => this.logger.error(`Notarization trigger failed for order ${result.id}: ${err.message}`));
    }

    return result as unknown as ProductOrderResponseDto;
  }

  async findAll(query?: PaginationDto): Promise<PaginatedResponseDto<ProductOrderResponseDto>> {
    const { page = 1, limit = 10 } = query || {};
    const skip = (page - 1) * limit;

    const [total, data] = await Promise.all([
      this.prisma.productOrder.count(),
      this.prisma.productOrder.findMany({
        include: {
          product: { include: { seller: { include: { user: { omit: { passwordHash: true } } } } } },
          buyer: { omit: { passwordHash: true } },
          statusHistory: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      data: data as unknown as ProductOrderResponseDto[],
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Returns all orders that belong to a specific buyer with pagination and filters
  async findByBuyer(buyerId: string, query?: FindOrdersDto): Promise<PaginatedResponseDto<ProductOrderResponseDto>> {
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
          product: { include: { seller: { include: { user: { omit: { passwordHash: true } } } } } },
          statusHistory: { orderBy: { createdAt: 'desc' } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      data: data as unknown as ProductOrderResponseDto[],
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findBySeller(sellerId: string, query?: FindOrdersDto): Promise<PaginatedResponseDto<ProductOrderResponseDto>> {
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
      data: data as unknown as ProductOrderResponseDto[],
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, reqUser?: { id: string; role: UserRole }): Promise<ProductOrderResponseDto> {
    const order = await this.prisma.productOrder.findUnique({
      where: { id },
      include: {
        product: { include: { seller: { include: { user: { omit: { passwordHash: true } } } } } },
        buyer: { omit: { passwordHash: true } },
        statusHistory: true,
        blockchainRecord: true,
      },
    });

    if (!order) throw new NotFoundException(`ProductOrder with ID ${id} not found`);

    if (reqUser && reqUser.role !== UserRole.ADMIN) {
      if (order.buyerId !== reqUser.id && order.product.sellerId !== reqUser.id) {
        throw new ForbiddenException('You can only view your own orders');
      }
    }

    // origin_coords/destination_coords are geography(Point,4326) columns, which
    // Prisma's findUnique cannot select (Unsupported type) - extract them via
    // raw SQL, same pattern as product.service.ts's PostGIS queries.
    const [coordsRow] = await this.prisma.$queryRaw<
      Array<{ originLat: number | null; originLon: number | null; destLat: number | null; destLon: number | null }>
    >`
      SELECT
        ST_Y(origin_coords::geometry)      AS "originLat",
        ST_X(origin_coords::geometry)      AS "originLon",
        ST_Y(destination_coords::geometry) AS "destLat",
        ST_X(destination_coords::geometry) AS "destLon"
      FROM product_order
      WHERE id = ${id}::uuid;
    `;

    return {
      ...order,
      originCoords:
        coordsRow?.originLat != null && coordsRow?.originLon != null
          ? { latitude: coordsRow.originLat, longitude: coordsRow.originLon }
          : null,
      destinationCoords:
        coordsRow?.destLat != null && coordsRow?.destLon != null
          ? { latitude: coordsRow.destLat, longitude: coordsRow.destLon }
          : null,
    } as unknown as ProductOrderResponseDto;
  }

  /**
   * Returns the order with its IoT telemetry enriched from MongoDB.
   * If MongoDB is unavailable (circuit OPEN, timeout, or error), telemetry
   * degrades gracefully to null — the order data from PostgreSQL is always returned.
   */
  async findOneWithTelemetry(id: string, reqUser: { id: string; role: UserRole }): Promise<ProductOrderResponseDto> {
    const order = await this.findOne(id, reqUser);
    let telemetry = await this.telemetryIntegration.getShipmentTelemetry(
      order.trackingNumber ?? null,
    );
    if ((!telemetry || telemetry.length === 0) && order.sensorId) {
      telemetry = await this.telemetryIntegration.getShipmentTelemetryBySensor(
        order.sensorId,
      );
    }
    return { ...order, telemetry };
  }

  /**
   * Returns a unified chronological timeline merging PostgreSQL status history
   * with MongoDB IoT telemetry events, sorted oldest-first.
   * Telemetry degrades gracefully: if MongoDB is unavailable, only order events
   * are returned and `telemetryAvailable` is set to false.
   */
  async getTimeline(id: string, reqUser: { id: string; role: UserRole }): Promise<OrderTimelineResponseDto> {
    const order = await this.findOne(id, reqUser);
    const telemetry = await this.telemetryIntegration.getShipmentTelemetry(
      order.trackingNumber ?? null,
      100,
    );

    const historyItems = order.statusHistory || [];
    const orderEvents = historyItems.map((h) => ({
      type: 'order_event' as const,
      timestamp: h.createdAt.toISOString(),
      source: 'postgresql' as const,
      historyId: h.id,
      previousStatus: h.previousStatus as unknown as OrderStatus,
      newStatus: h.newStatus as unknown as OrderStatus,
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
  async findOneForBuyer(id: string, buyerId: string): Promise<ProductOrderResponseDto> {
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

    return order as unknown as ProductOrderResponseDto;
  }

  // reqUser comes from the JWT token (req.user), NOT from the client body
  async update(
    id: string,
    reqUser: { id: string; role: UserRole },
    updateProductOrderDto: UpdateProductOrderDto,
  ): Promise<ProductOrderResponseDto> {
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
    const result = await this.prisma.$transaction(async (tx) => {
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

      if (statusChanged && nextStatus === OrderStatus.SHIPPED) {
        const finalTrackingNumber = orderData.trackingNumber || currentOrder.trackingNumber;
        const finalCarrierId = orderData.carrierId || currentOrder.carrierId;
        if (!finalTrackingNumber || !finalCarrierId) {
          throw new BadRequestException(
            'Se requiere un trackingNumber y un carrierId (empresa logística) al marcar la orden como enviada',
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
            trackingNumber: updatedOrder.trackingNumber,
            topic: STREAM_TOPICS.SHIPMENT_EVENTS,
          },
        );

        // 1.7 Create Notifications
        const buyerMessage = `Tu orden ${id} ha cambiado de estado a ${nextStatus}.`;
        const sellerMessage = `La orden ${id} de tu producto ha cambiado de estado a ${nextStatus}.`;
        
        await this.notificationService.createNotification(currentOrder.buyerId, 'Actualización de Pedido', buyerMessage);
        
        if (currentOrder.product?.sellerId) {
          await this.notificationService.createNotification(currentOrder.product.sellerId, 'Actualización de Pedido', sellerMessage);
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

    if (result.sensorId && result.currentStatus === OrderStatus.SHIPPED) {
      this.publishSensorStartSignal(
        result.sensorId,
        result.trackingNumber,
        result.productId,
        result.buyerId,
      ).catch((err) => {
        console.error('Failed to trigger sensor activation MQTT message', err);
      });
    }

    return result as unknown as ProductOrderResponseDto;
  }

  async findHistory(id: string, reqUser?: { id: string; role: UserRole }): Promise<OrderStatusHistoryResponseDto[]> {
    await this.findOne(id, reqUser); // Verify the order exists and check ownership
    const history = await this.prisma.orderStatusHistory.findMany({
      where: { orderId: id },
      orderBy: { createdAt: 'desc' },
      include: {
        changedByUser: { omit: { passwordHash: true } },
      },
    });
    return history as unknown as OrderStatusHistoryResponseDto[];
  }

  async remove(id: string, reqUser: { id: string; role: UserRole }): Promise<ProductOrderResponseDto> {
    const order = await this.findOne(id); // Check existence

    if (order.buyerId !== reqUser.id && reqUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You can only delete your own order');
    }

    if (order.currentStatus !== OrderStatus.PENDING && order.currentStatus !== OrderStatus.CANCELED) {
      throw new ConflictException('Sólo las órdenes PENDING o CANCELED pueden ser eliminadas');
    }

    const result = await this.prisma.$transaction(async (tx) => {
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
    return result as unknown as ProductOrderResponseDto;
  }

  private async publishSensorStartSignal(
    sensorId: string,
    trackingNumber: string | null,
    productId: string,
    buyerId: string,
  ): Promise<void> {
    const host = this.configService.get<string>('HIVEMQ_HOST');
    const port = Number(this.configService.get<string>('HIVEMQ_PORT', '8883'));
    const username = this.configService.get<string>('HIVEMQ_USERNAME');
    const password = this.configService.get<string>('HIVEMQ_PASSWORD');

    if (!host || !username || !password) {
      console.warn('HiveMQ configuration missing in API service. Cannot send START_TRANSIT signal.');
      return;
    }

    try {
      // 1. Fetch origin coordinates (Product/Seller)
      const sellerLocation = await this.prisma.$queryRaw<Array<{ lat: number | null; lng: number | null }>>`
        SELECT ST_Y("location_coords"::geometry) as lat, ST_X("location_coords"::geometry) as lng
        FROM product WHERE id = ${productId}::uuid
      `;

      // 2. Fetch destination coordinates (Buyer)
      const buyerLocation = await this.prisma.$queryRaw<Array<{ lat: number | null; lng: number | null }>>`
        SELECT ST_Y("location_coords"::geometry) as lat, ST_X("location_coords"::geometry) as lng
        FROM user_account WHERE id = ${buyerId}::uuid
      `;

      const origin = sellerLocation?.[0] || null;
      const destination = buyerLocation?.[0] || null;

      const client = mqtt.connect({
        host,
        port,
        protocol: 'mqtts',
        username,
        password,
      });

      client.on('connect', () => {
        const payload = JSON.stringify({
          action: 'START_TRANSIT',
          trackingNumber,
          sensorId,
          origin: origin && origin.lat !== null && origin.lng !== null ? { lat: origin.lat, lng: origin.lng } : null,
          destination: destination && destination.lat !== null && destination.lng !== null ? { lat: destination.lat, lng: destination.lng } : null,
          timestamp: new Date().toISOString(),
        });

        client.publish(`amazonia/iot/control/${sensorId}`, payload, { qos: 1, retain: true }, (err) => {
          if (err) {
            console.error(`Error publishing START_TRANSIT to MQTT for sensor ${sensorId}`, err);
          } else {
            console.log(`Sent START_TRANSIT signal to MQTT topic amazonia/iot/control/${sensorId}`);
          }
          client.end();
        });
      });

      client.on('error', (err) => {
        console.error(`MQTT connection error in product-order service: ${err.message}`);
        client.end();
      });
    } catch (err: any) {
      console.error(`Failed to connect or publish to MQTT: ${err?.message || err}`);
    }
  }
}

