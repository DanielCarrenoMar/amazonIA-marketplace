import { IsString, IsNotEmpty, IsOptional, MaxLength, IsNumber, Min, Max, IsUUID, IsInt, IsEnum } from 'class-validator';
import { TransportType } from '../enums';


export class CreateProductOrderDto {
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  // buyerId is NOT accepted from the client — injected automatically from the JWT token

  @IsInt()
  @Min(1)
  @IsNotEmpty()
  quantity: number;

  @IsString()
  @IsOptional()
  orderNotes?: string;



  @IsString()
  @IsOptional()
  @MaxLength(255)
  transactionHash?: string;

  @IsEnum(TransportType)
  @IsOptional()
  transportType?: TransportType;

  // Destination fields
  @IsString()
  @IsOptional()
  @MaxLength(100)
  destinationMapboxId?: string;

  @IsString()
  @IsOptional()
  destinationFormattedAddress?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  destinationCity?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  destinationRegion?: string;

  @IsOptional()
  destinationCoords?: {
    latitude: number;
    longitude: number;
  };
}
