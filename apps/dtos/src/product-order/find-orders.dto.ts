import { IsEnum, IsOptional } from 'class-validator';
import { OrderStatus } from '../enums';

export class FindOrdersDto {
  @IsEnum(OrderStatus)
  @IsOptional()
  status?: OrderStatus;
}
