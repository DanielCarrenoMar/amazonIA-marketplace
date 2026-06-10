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

  // Filter by seller UUID — useful for admins to inspect a seller's catalog
  @IsUUID()
  @IsOptional()
  sellerId?: string;
}
