import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class RequestTribeCreationDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  locationMapboxId?: string;

  @IsString()
  @IsOptional()
  locationFormattedAddress?: string;
}
