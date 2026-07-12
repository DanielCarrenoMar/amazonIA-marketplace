import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, MaxLength, IsInt, Min, IsEmail, MinLength, Matches, IsNumber } from 'class-validator';

export class CreateUserAccountDto {
  @IsString()
  @IsOptional()
  @MaxLength(50)
  username?: string;

  @ApiProperty({ example: 'Buyer Test' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  fullName: string;

  @ApiProperty({ example: 'CompradorFake3' })
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

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @Matches(/^(?=.*[A-Z])(?=.*\d)/, { message: 'La contraseña debe tener al menos una letra mayúscula y un número' })
  @MaxLength(255)
  password: string; // Plain text — will be hashed by the service before saving to the database

  @ApiProperty({ example: 'buyerfake3@test.com' })
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

  @IsString()
  @IsOptional()
  @MaxLength(500)
  avatarUrl?: string;

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

  @IsNumber()
  @IsOptional()
  locationLat?: number;

  @IsNumber()
  @IsOptional()
  locationLng?: number;
}
