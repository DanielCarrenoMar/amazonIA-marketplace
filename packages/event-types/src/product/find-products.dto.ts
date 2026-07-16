import { IsOptional, IsInt, Min, IsString, IsUUID, IsNumber } from 'class-validator';
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

  @IsString()
  @IsOptional()
  categoryName?: string;

  @IsUUID()
  @IsOptional()
  sellerId?: string;

  // Filter by multiple tribe IDs (comma separated string, e.g. "1,2,3")
  @IsString()
  @IsOptional()
  tribeIds?: string;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  minPrice?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  maxPrice?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  minRating?: number;
}
