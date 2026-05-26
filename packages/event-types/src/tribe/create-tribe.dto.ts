import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class CreateTribeDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    name: string;

    @IsString()
    @IsOptional()
    description?: string;

    // Text-based location fields
    // Note: locationCoords (PostGIS) is omitted from this basic DTO as it requires raw queries to insert
    @IsString()
    @IsOptional()
    @MaxLength(100)
    locationMapboxId?: string;

    @IsString()
    @IsOptional()
    locationFormattedAddress?: string;
}
