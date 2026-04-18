import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsString, IsUUID } from 'class-validator';
import { CreateProductOrderDto } from './create-product-order.dto';

export class UpdateProductOrderDto extends PartialType(CreateProductOrderDto) {
  // changedByUserId is NOT accepted from the client — injected from the JWT token in the controller

  @IsString()
  @IsOptional()
  statusNote?: string;
}
