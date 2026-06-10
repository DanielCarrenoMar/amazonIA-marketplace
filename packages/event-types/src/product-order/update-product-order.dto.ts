import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsString, IsUUID, IsEnum, IsInt, Min, Max } from 'class-validator';
import { CreateProductOrderDto } from './create-product-order.dto';
import { OrderStatus } from '../enums';

export class UpdateProductOrderDto extends PartialType(CreateProductOrderDto) {
  // changedByUserId is NOT accepted from the client — injected from the JWT token in the controller

  @IsEnum(OrderStatus)
  @IsOptional()
  currentStatus?: OrderStatus;

  @IsString()
  @IsOptional()
  statusNote?: string;

  @IsString()
  @IsOptional()
  trackingNumber?: string;

  @IsInt()
  @IsOptional()
  carrierId?: number;

  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  sellerRatingValue?: number;

  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  buyerRatingValue?: number;
}
