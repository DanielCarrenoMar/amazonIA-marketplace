import { OrderStatus, TransportType } from '../enums';
import { BlockchainStatusEnum } from '../blockchain/blockchain.dto';

export class OrderStatusHistoryResponseDto {
  id: number;
  orderId: string;
  changedByUserId: string;
  previousStatus: OrderStatus | null;
  newStatus: OrderStatus;
  statusNote: string | null;
  createdAt: Date;
  changedByUser?: any; // AuthUserDto
}

export class BlockchainRecordResponseDto {
  id: string;
  orderId: string;
  transactionHash: string | null;
  blockNumber: number | null;
  networkName: string;
  status: BlockchainStatusEnum;
  retryCount: number;
  errorMessage: string | null;
  gasUsed: string | null;
  submittedAt: Date | null;
  confirmedAt: Date | null;
  createdAt: Date;
  nftMintedAt: Date | null;
  nftTokenId: string | null;
  nftTxHash: string | null;
}

export class ProductOrderResponseDto {
  id: string;
  productId: string;
  buyerId: string;
  quantity: number;
  totalAmount: any; // Decimal
  orderNotes: string | null;
  trackingNumber: string | null;
  sensorId: string | null;
  carrierId: number | null;
  sellerRatingValue: number | null;
  buyerRatingValue: number | null;
  transactionHash: string | null;
  currentStatus: OrderStatus;
  transportType: TransportType;

  // Origin fields
  originMapboxId: string | null;
  originFormattedAddress: string | null;
  originCity: string | null;
  originRegion: string | null;
  originCoords: { latitude: number; longitude: number } | null;
  // Destination fields
  destinationMapboxId: string | null;
  destinationFormattedAddress: string | null;
  destinationCity: string | null;
  destinationRegion: string | null;
  destinationCoords: { latitude: number; longitude: number } | null;

  createdAt: Date;
  updatedAt: Date;
  product?: any; // ProductResponseDto
  buyer?: any; // AuthUserDto
  statusHistory?: OrderStatusHistoryResponseDto[];
  blockchainRecord?: BlockchainRecordResponseDto | null;
  telemetry?: any;
}

export class OrderTimelineItemDto {
  type: 'order_event' | 'telemetry';
  timestamp: string;
  source: 'postgresql' | 'mongodb';
  historyId?: number;
  previousStatus?: OrderStatus | null;
  newStatus?: OrderStatus;
  statusNote?: string | null;
  event_id?: string;
  event_type?: string;
  temperature_celsius?: number;
  shock_g_force?: number;
  location?: any;
  shipment_status?: string;
  scan_type?: string;
}

export class OrderTimelineResponseDto {
  orderId: string;
  trackingNumber: string | null;
  telemetryAvailable: boolean;
  items: OrderTimelineItemDto[];
}
