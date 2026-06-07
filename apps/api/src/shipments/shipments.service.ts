import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ShipmentEventDocument, ShipmentEventDocumentType } from 'database';
import { PrismaService } from '../prisma/prisma.service';
import {
  PaginationDto,
  ShipmentHistoryDto,
  IShipmentEvent,
  IShipmentMetadata,
  IBusinessContext,
  IShipmentTelemetry,
  IGeoPoint,
  IoTEventType,
} from 'event-types';

@Injectable()
export class ShipmentsService {
  constructor(
    @InjectModel(ShipmentEventDocument.name)
    private readonly shipmentEventModel: Model<ShipmentEventDocumentType>,
    private readonly prismaService: PrismaService,
  ) {}

  async getHistory(
    trackingNumber: string,
    query: PaginationDto,
    user: { id: string; role: string },
  ): Promise<ShipmentHistoryDto> {
    if (user.role !== 'ADMIN') {
      const order = await this.prismaService.productOrder.findFirst({
        where: { trackingNumber },
        include: { product: true },
      });

      if (!order) {
        throw new UnauthorizedException('You do not have access to this shipment');
      }

      const isBuyer = order.buyerId === user.id;
      const isSeller = order.product.sellerId === user.id;

      if (!isBuyer && !isSeller) {
        throw new UnauthorizedException('You do not have access to this shipment');
      }
    }

    const { limit = 10, page = 1 } = query;
    const offset = (page - 1) * limit;

    const filter = { 'metadata.tracking_number': trackingNumber };

    const [total, documents] = await Promise.all([
      this.shipmentEventModel.countDocuments(filter),
      this.shipmentEventModel
        .find(filter)
        .sort({ recorded_at: -1 })
        .skip(offset)
        .limit(limit)
        .lean()
        .exec(),
    ]);

    if (total === 0) {
      throw new NotFoundException(
        `No events found for tracking number ${trackingNumber}`,
      );
    }

    const data: IShipmentEvent[] = documents.map((doc) => ({
      event_id: doc.event_id,
      event_type: IoTEventType.SHIPMENT_TELEMETRY,
      recorded_at: doc.recorded_at.toISOString(),
      ingested_at: doc.ingested_at.toISOString(),
      metadata: doc.metadata,
      location: doc.location,
      business_context: doc.business_context,
      telemetry: doc.telemetry,
    }));

    return {
      data,
      meta: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  }
}
