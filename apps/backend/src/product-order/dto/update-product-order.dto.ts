import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsString, IsUUID } from 'class-validator';
import { CreateProductOrderDto } from './create-product-order.dto';

export class UpdateProductOrderDto extends PartialType(CreateProductOrderDto) {
  // Required when changing currentStatus so the history log knows who made the change
  @IsUUID()
  @IsOptional()
  changedByUserId?: string;

  @IsString()
  @IsOptional()
  statusNote?: string;
}
