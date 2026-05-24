import { IsOptional, IsUUID } from 'class-validator';
import { PaginationDto } from '../common/pagination.dto';

export class FindProductRatingsDto extends PaginationDto {
  @IsUUID()
  @IsOptional()
  productId?: string;
}
