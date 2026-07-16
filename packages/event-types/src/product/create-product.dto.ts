import { IsString, IsNotEmpty, IsOptional, MaxLength, IsNumber, Min, IsUUID, IsInt, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { LocationCoordsDto } from './location-coords.dto';
import { CreateElaborationStepDto } from './create-elaboration-step.dto';

export class CreateProductDto {

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

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateElaborationStepDto)
  @IsOptional()
  elaborationSteps?: CreateElaborationStepDto[];

  @IsString()
  @IsOptional()
  elaborationText?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  elaborationMediaUrls?: string[];

  // Logistics Criteria
  @IsOptional()
  @Type(() => Boolean)
  isFragile?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  requiresColdChain?: boolean;

  @IsOptional()
  @IsNumber()
  maxTemperatureCelsius?: number;

  @IsOptional()
  @IsNumber()
  maxHumidity?: number;
}
