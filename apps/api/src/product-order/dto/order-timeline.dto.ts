import { ApiExtraModels, ApiProperty, ApiPropertyOptional, getSchemaPath } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { OrderStatus, IoTEventType, ShipmentStatus, ScanType } from 'event-types';
import { GeoPointResponseDto } from './order-detail-with-telemetry.dto';

// ---------------------------------------------------------------------------
// Timeline item — order status change (PostgreSQL source)
// ---------------------------------------------------------------------------

export class OrderEventTimelineItemDto {
  @ApiProperty({ example: 'order_event', enum: ['order_event'] })
  type: 'order_event';

  @ApiProperty({
    example: '2024-06-01T14:30:00.000Z',
    description: 'When this status change was recorded in PostgreSQL',
  })
  timestamp: string;

  @ApiProperty({ example: 'postgresql' })
  source: 'postgresql';

  @ApiProperty({ example: 1, description: 'Primary key of the OrderStatusHistory row' })
  historyId: number;

  @ApiPropertyOptional({ enum: OrderStatus, nullable: true, example: OrderStatus.PAID })
  previousStatus: OrderStatus | null;

  @ApiProperty({ enum: OrderStatus, example: OrderStatus.SHIPPED })
  newStatus: OrderStatus;

  @ApiPropertyOptional({
    example: 'Pago confirmado por pasarela',
    nullable: true,
    description: 'Optional note left by the user who triggered the status change',
  })
  statusNote: string | null;
}

// ---------------------------------------------------------------------------
// Timeline item — IoT telemetry reading (MongoDB source)
// ---------------------------------------------------------------------------

export class TelemetryTimelineItemDto {
  @ApiProperty({ example: 'telemetry', enum: ['telemetry'] })
  type: 'telemetry';

  @ApiProperty({
    example: '2024-06-01T15:12:00.000Z',
    description: 'When the IoT device recorded this reading (recorded_at from MongoDB)',
  })
  timestamp: string;

  @ApiProperty({ example: 'mongodb' })
  source: 'mongodb';

  @ApiProperty({ example: 'evt-truck-TRK001-1717800000' })
  event_id: string;

  @ApiProperty({ enum: IoTEventType, example: IoTEventType.SHIPMENT_TELEMETRY })
  event_type: IoTEventType;

  @ApiProperty({ example: 4.1, description: 'Temperature in Celsius at time of reading' })
  temperature_celsius: number;

  @ApiProperty({ example: 0.3, description: 'Shock force in G — values > 2.5 indicate potential damage' })
  shock_g_force: number;

  @ApiProperty({ type: () => GeoPointResponseDto, description: 'GPS coordinates at time of reading' })
  @Type(() => GeoPointResponseDto)
  location: GeoPointResponseDto;

  @ApiProperty({
    enum: ShipmentStatus,
    example: ShipmentStatus.IN_TRANSIT,
    description: 'Shipment status at the moment of this reading',
  })
  shipment_status: ShipmentStatus;

  @ApiProperty({ enum: ScanType, example: ScanType.GPS })
  scan_type: ScanType;
}

// ---------------------------------------------------------------------------
// Root response — unified timeline
// ---------------------------------------------------------------------------

@ApiExtraModels(OrderEventTimelineItemDto, TelemetryTimelineItemDto)
export class OrderTimelineDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  orderId: string;

  @ApiPropertyOptional({
    example: 'AMZ-2024-00123',
    nullable: true,
    description: 'Null when the order has not been shipped yet',
  })
  trackingNumber: string | null;

  @ApiProperty({
    example: true,
    description:
      'False when MongoDB is unavailable (circuit OPEN). ' +
      'Order status events are always present regardless.',
  })
  telemetryAvailable: boolean;

  @ApiProperty({
    description:
      'All events (order status changes + IoT readings) sorted chronologically, oldest first. ' +
      'Discriminate by the `type` field: "order_event" or "telemetry".',
    type: 'array',
    items: {
      oneOf: [
        { $ref: getSchemaPath(OrderEventTimelineItemDto) },
        { $ref: getSchemaPath(TelemetryTimelineItemDto) },
      ],
    },
  })
  items: (OrderEventTimelineItemDto | TelemetryTimelineItemDto)[];
}
