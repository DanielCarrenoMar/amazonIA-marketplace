import { IsString, IsNumber, IsNotEmpty, IsOptional, IsUrl } from 'class-validator';

// =============================================================================
// RegisterTransactionDto — Payload que el Backend Core envía al Notario
// =============================================================================

export class RegisterTransactionDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsNumber()
  amount: number;

  @IsString()
  @IsNotEmpty()
  paymentMethod: string;

  @IsString()
  @IsNotEmpty()
  productHash: string;

  @IsString()
  @IsNotEmpty()
  buyerId: string;

  @IsString()
  @IsNotEmpty()
  sellerId: string;

  @IsString()
  @IsOptional()
  @IsUrl()
  webhookUrl?: string;
}
