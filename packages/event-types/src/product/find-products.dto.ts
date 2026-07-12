import { IsOptional, IsInt, Min, IsString, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class FindProductsDto {
  // --- Pagination ---
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 10;

  // --- Filters ---
  @IsString()
  @IsOptional()
  search?: string;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  categoryId?: number;

  @IsUUID()
  @IsOptional()
  sellerId?: string;

  // Filter by tribe ID to get all products from members of a tribe
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  tribeId?: number;
}
