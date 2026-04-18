import { Type } from 'class-transformer';
import { IsNumber, IsOptional, Max, Min } from 'class-validator';

export class FindNearbyDto {
  @IsNumber()
  @Min(-90)
  @Max(90)
  @Type(() => Number)
  lat: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  @Type(() => Number)
  lng: number;

  // Radius in kilometers. Default: 10 km, Max: 100 km
  @IsNumber()
  @Min(0.1)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  radius?: number = 10;
}
