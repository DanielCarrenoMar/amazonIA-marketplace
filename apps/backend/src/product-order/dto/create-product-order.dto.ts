import { IsString, IsNotEmpty, IsOptional, MaxLength, IsNumber, Min, IsUUID, IsInt, IsEnum } from 'class-validator';
import { OrderStatus } from '@prisma/client';

export class CreateProductOrderDto {
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  // buyerId is NOT accepted from the client — injected automatically from the JWT token

  @IsInt()
  @Min(1)
  @IsNotEmpty()
  quantity: number;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  totalAmount: number;

  @IsString()
  @IsOptional()
  orderNotes?: string;

  @IsInt()
  @IsOptional()
  sellerRatingValue?: number;

  @IsInt()
  @IsOptional()
  buyerRatingValue?: number;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  transactionHash?: string;

  @IsEnum(OrderStatus)
  @IsOptional()
  currentStatus?: OrderStatus;
}
