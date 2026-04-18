import { IsString, IsNotEmpty, IsOptional, MaxLength, IsInt, Min, IsEmail } from 'class-validator';

export class CreateUserAccountDto {
  @IsString()
  @IsOptional()
  @MaxLength(50)
  username?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  fullName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  nationalId: string;

  @IsInt()
  @IsOptional()
  @Min(0)
  age?: number;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  nationality?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  passwordHash: string; // Will be hashed by the server before saving, but the DTO accepts the raw string

  @IsEmail()
  @IsNotEmpty()
  @MaxLength(255)
  email: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  phonePrimary?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  phoneSecondary?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  walletHash?: string;

  // Text-based location fields
  // Note: locationCoords (PostGIS) is omitted from this basic DTO as it requires raw queries to insert
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
}
