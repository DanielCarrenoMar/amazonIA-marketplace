import { IsString, IsNotEmpty, IsOptional, MaxLength, IsNumber, Min, IsUUID, IsInt, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { LocationCoordsDto } from './location-coords.dto';

export class CreateProductDto {
  @IsUUID()
  @IsNotEmpty()
  sellerId: string;

  @IsInt()
  @IsNotEmpty()
  categoryId: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  // Decimal mapped as Number in validation
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  price: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  stockAvailable?: number;

  // Text-based location fields
  // Note: locationCoords (PostGIS) is omitted as it requires raw queries to insert
  @IsString()
  @IsOptional()
  @MaxLength(100)
  locationMapboxId?: string;

  @IsString()
  @IsOptional()
  locationFormattedAddress?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  locationCity?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  locationRegion?: string;

  // Spatial coordinates passed from frontend (e.g. Mapbox click)
  @ValidateNested()
  @Type(() => LocationCoordsDto)
  @IsOptional()
  coords?: LocationCoordsDto;
}
