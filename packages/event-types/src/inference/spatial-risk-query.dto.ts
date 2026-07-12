import { IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class SpatialRiskQuery {
  @IsNumber()
  @Type(() => Number)
  lat: number;

  @IsNumber()
  @Type(() => Number)
  lon: number;

  @IsOptional()
  @IsString()
  transportType?: string;

  @IsOptional()
  @IsString()
  productType?: string;
}
