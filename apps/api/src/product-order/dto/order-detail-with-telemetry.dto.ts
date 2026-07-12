import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import { OrderStatus, UserRole, ShipmentStatus, ScanType, IoTEventType } from 'event-types';

// ---------------------------------------------------------------------------
// Nested — Product (PostgreSQL)
// ---------------------------------------------------------------------------

export class OrderProductDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'Cacao Silvestre Amazónico' })
  name: string;

  @ApiPropertyOptional({ example: 'Cacao de origen único de la cuenca del río Napo.' })
  description: string | null;

  @ApiProperty({ example: '45.99' })
  @Transform(({ value }) => value?.toString())
  price: string;

  @ApiProperty({ example: 3 })
  stockAvailable: number;

  @ApiPropertyOptional({ example: 'https://cdn.supabase.co/storage/v1/object/public/products/abc.jpg' })
  imageUrl: string | null;

  @ApiPropertyOptional({ example: 4.7 })
  @Transform(({ value }) => (value != null ? parseFloat(value.toString()) : null))
  averageRating: number | null;

  @ApiProperty({ example: 23 })
  totalReviews: number;

  @ApiPropertyOptional({ example: 'Iquitos' })
  locationCity: string | null;

  @ApiPropertyOptional({ example: 'Loreto' })
  locationRegion: string | null;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  createdAt: Date;
}

// ---------------------------------------------------------------------------
// Nested — Buyer (PostgreSQL, passwordHash omitted at query level)
// ---------------------------------------------------------------------------

export class OrderBuyerDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'Maria' })
  firstName: string;

  @ApiProperty({ example: 'Torres' })
  lastName: string;

  @ApiProperty({ example: 'maria.torres@example.com' })
  email: string;

  @ApiProperty({ enum: UserRole, example: UserRole.BUYER })
  role: UserRole;

  @ApiPropertyOptional({ example: '+51 965 123 456' })
  phonePrimary: string | null;

  @ApiPropertyOptional({ example: 'Lima' })
  locationCity: string | null;

  @ApiPropertyOptional({ example: 'Lima' })
  locationRegion: string | null;
}

// ---------------------------------------------------------------------------
// Nested — Status history entry (PostgreSQL, append-only)
// ---------------------------------------------------------------------------

export class OrderStatusHistoryItemDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiPropertyOptional({ enum: OrderStatus, example: OrderStatus.PENDING })
  previousStatus: OrderStatus | null;

  @ApiProperty({ enum: OrderStatus, example: OrderStatus.PAID })
  newStatus: OrderStatus;

  @ApiPropertyOptional({ example: 'Pago confirmado por pasarela' })
  statusNote: string | null;

  @ApiProperty({ example: '2024-06-08T12:00:00.000Z' })
  createdAt: Date;
}

// ---------------------------------------------------------------------------
// Nested — Shipment telemetry event (MongoDB)
// ---------------------------------------------------------------------------

export class GeoPointResponseDto {
  @ApiProperty({ example: 'Point' })
  type: 'Point';

  @ApiProperty({
    example: [-73.1200, -3.8900],
    description: '[longitude, latitude] — GeoJSON standard order',
  })
  coordinates: [number, number];
}

export class ShipmentMetadataResponseDto {
  @ApiProperty({ example: 'AMZ-2024-00123' })
  tracking_number: string;

  @ApiProperty({ example: 'CONT-TRK001' })
  container_id: string;

  @ApiPropertyOptional({ example: 'SENSOR-IOT-001' })
  sensor_id?: string;
}

export class BusinessContextResponseDto {
  @ApiProperty({ enum: ShipmentStatus, example: ShipmentStatus.IN_TRANSIT })
  status: ShipmentStatus;

  @ApiProperty({ enum: ScanType, example: ScanType.GPS })
  scan_type: ScanType;
}

export class ShipmentTelemetryResponseDto {
  @ApiPropertyOptional({ example: 4.2, description: 'Temperature in Celsius at time of reading' })
  temperature_celsius?: number;

  @ApiPropertyOptional({ example: 0.3, description: 'Shock force in G — values > 2.5 indicate potential damage' })
  shock_g_force?: number;
}

export class ShipmentEventDto {
  @ApiProperty({ example: 'evt-truck-TRK001-1717800000' })
  event_id: string;

  @ApiProperty({ enum: IoTEventType, example: IoTEventType.SHIPMENT_TELEMETRY })
  event_type: IoTEventType;

  @ApiProperty({ example: '2024-06-08T10:00:00.000Z', description: 'When the device recorded the reading' })
  recorded_at: string;

  @ApiProperty({ example: '2024-06-08T10:00:01.000Z', description: 'When the ingestor received the event' })
  ingested_at: string;

  @ApiProperty({ type: () => ShipmentMetadataResponseDto })
  @Type(() => ShipmentMetadataResponseDto)
  metadata: ShipmentMetadataResponseDto;

  @ApiProperty({ type: () => GeoPointResponseDto })
  @Type(() => GeoPointResponseDto)
  location: GeoPointResponseDto;

  @ApiProperty({ type: () => BusinessContextResponseDto })
  @Type(() => BusinessContextResponseDto)
  business_context: BusinessContextResponseDto;

  @ApiProperty({ type: () => ShipmentTelemetryResponseDto })
  @Type(() => ShipmentTelemetryResponseDto)
  telemetry: ShipmentTelemetryResponseDto;
}

// ---------------------------------------------------------------------------
// Root — unified order + telemetry response
// ---------------------------------------------------------------------------

export class OrderDetailWithTelemetryDto {
  // --- Order identity ---

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901' })
  productId: string;

  @ApiProperty({ example: 'c3d4e5f6-a7b8-9012-cdef-123456789012' })
  buyerId: string;

  // --- Order values ---

  @ApiProperty({ example: 2 })
  quantity: number;

  @ApiProperty({ example: '91.98', description: 'Total amount as string to preserve Decimal precision' })
  @Transform(({ value }) => value?.toString())
  totalAmount: string;

  @ApiPropertyOptional({ example: 'Por favor empacar con cuidado.' })
  orderNotes: string | null;

  @ApiProperty({ enum: OrderStatus, example: OrderStatus.SHIPPED })
  currentStatus: OrderStatus;

  // --- Shipment linkage ---

  @ApiPropertyOptional({
    example: 'AMZ-2024-00123',
    description: 'Assigned when the order is shipped — links to MongoDB telemetry',
    nullable: true,
  })
  trackingNumber: string | null;

  @ApiPropertyOptional({
    example: 'SENSOR-IOT-001',
    description: 'ID del sensor IoT colocado en el paquete por el vendedor',
    nullable: true,
  })
  sensorId: string | null;

  @ApiPropertyOptional({
    example: '0xabc123def456...',
    description: 'Blockchain transaction hash for immutable traceability record',
    nullable: true,
  })
  transactionHash: string | null;

  // --- Rating values ---

  @ApiPropertyOptional({ example: 4, description: 'Rating the buyer gave the seller (1–5)' })
  sellerRatingValue: number | null;

  @ApiPropertyOptional({ example: 5, description: 'Rating the seller gave the buyer (1–5)' })
  buyerRatingValue: number | null;

  // --- Timestamps ---

  @ApiProperty({ example: '2024-06-07T08:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-06-08T12:00:00.000Z' })
  updatedAt: Date;

  // --- Nested relations (PostgreSQL) ---

  @ApiProperty({ type: () => OrderProductDto })
  @Type(() => OrderProductDto)
  product: OrderProductDto;

  @ApiProperty({ type: () => OrderBuyerDto })
  @Type(() => OrderBuyerDto)
  buyer: OrderBuyerDto;

  @ApiProperty({ type: () => [OrderStatusHistoryItemDto] })
  @Type(() => OrderStatusHistoryItemDto)
  statusHistory: OrderStatusHistoryItemDto[];

  // --- Telemetry (MongoDB) — null when no tracking number or no events yet ---

  @ApiProperty({
    type: () => [ShipmentEventDto],
    nullable: true,
    description:
      'IoT telemetry events from MongoDB for this shipment. ' +
      'Null when the order has no tracking number or telemetry has not been received yet.',
  })
  @Type(() => ShipmentEventDto)
  telemetry: ShipmentEventDto[] | null;
}
