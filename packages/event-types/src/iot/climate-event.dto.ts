import {
  IsString,
  IsEnum,
  IsDateString,
  IsOptional,
  IsNumber,
  ValidateNested,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IoTEventType, SensorType } from '../enums';

// ---------------------------------------------------------------------------
// Interfaces (for type-safety across services)
// ---------------------------------------------------------------------------

export interface IGeoPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface IClimateMetadata {
  sensor_id: string;
  facility_id: string;
  sensor_type: SensorType;
}

export interface IClimateTelemetry {
  temperature_celsius?: number;
  humidity_percent?: number;
  [key: string]: unknown;
}

export interface IClimateEvent {
  event_id: string;
  event_type: IoTEventType.ENVIRONMENT_READING;
  recorded_at: string; // ISO 8601 — moment of measurement
  ingested_at: string; // ISO 8601 — server acknowledgement timestamp
  metadata: IClimateMetadata;
  location: IGeoPoint;
  telemetry: IClimateTelemetry;
}

// ---------------------------------------------------------------------------
// Nested DTOs (validated sub-objects)
// ---------------------------------------------------------------------------

export class GeoPointDto implements IGeoPoint {
  @IsString()
  type: 'Point' = 'Point';

  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(2)
  @IsNumber({}, { each: true })
  coordinates: [number, number];
}

export class ClimateMetadataDto implements IClimateMetadata {
  @IsString()
  sensor_id: string;

  @IsString()
  facility_id: string;

  @IsEnum(SensorType)
  sensor_type: SensorType;
}

export class ClimateTelemetryDto implements IClimateTelemetry {
  @IsOptional()
  @IsNumber()
  temperature_celsius?: number;

  @IsOptional()
  @IsNumber()
  humidity_percent?: number;

  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Main DTO — used by the Ingestor Service to validate incoming payloads
// ---------------------------------------------------------------------------

export class CreateClimateEventDto {
  @IsOptional()
  @IsString()
  event_id?: string; // Auto-generated if not provided

  @IsEnum(IoTEventType)
  event_type: IoTEventType.ENVIRONMENT_READING;

  @IsDateString()
  recorded_at: string;

  @IsOptional()
  @IsDateString()
  ingested_at?: string; // Set by server

  @ValidateNested()
  @Type(() => ClimateMetadataDto)
  metadata: ClimateMetadataDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => GeoPointDto)
  location?: GeoPointDto;

  @ValidateNested()
  @Type(() => ClimateTelemetryDto)
  telemetry: ClimateTelemetryDto;
}
