import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ShipmentEventDocument, ShipmentEventDocumentType } from 'database';
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
  ) {}

  async getHistory(
    trackingNumber: string,
    query: PaginationDto,
  ): Promise<ShipmentHistoryDto> {
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
      metadata: doc.metadata as unknown as IShipmentMetadata,
      location: doc.location as unknown as IGeoPoint,
      business_context: doc.business_context as unknown as IBusinessContext,
      telemetry: doc.telemetry as unknown as IShipmentTelemetry,
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
