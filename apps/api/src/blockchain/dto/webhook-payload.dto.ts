import { IsString, IsOptional, IsNumber, IsNotEmpty, IsEnum } from 'class-validator';

// =============================================================================
// WebhookPayloadDto — Estructura del callback que envía el notario
// =============================================================================

export enum WebhookBlockchainStatus {
  PENDING = 'PENDING',
  SUBMITTED = 'SUBMITTED',
  CONFIRMED = 'CONFIRMED',
  FAILED = 'FAILED',
}

export class WebhookPayloadDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsString()
  @IsOptional()
  transactionHash?: string | null;

  @IsNumber()
  @IsOptional()
  blockNumber?: number | null;

  @IsEnum(WebhookBlockchainStatus)
  @IsNotEmpty()
  status: WebhookBlockchainStatus;

  @IsString()
  @IsOptional()
  gasUsed?: string | null;

  @IsString()
  @IsOptional()
  errorMessage?: string | null;

  @IsString()
  @IsNotEmpty()
  timestamp: string;
}
