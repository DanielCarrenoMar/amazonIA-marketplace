import { IsString, IsNotEmpty, IsOptional, MaxLength, IsInt, Min, IsEmail, MinLength, Matches } from 'class-validator';

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
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @Matches(/^(?=.*[A-Z])(?=.*\d)/, { message: 'La contraseña debe tener al menos una letra mayúscula y un número' })
  @MaxLength(255)
  password: string; // Plain text — will be hashed by the service before saving to the database

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
