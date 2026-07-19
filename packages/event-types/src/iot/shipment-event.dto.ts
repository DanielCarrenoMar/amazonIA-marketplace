import {
  IsString,
  IsEnum,
  IsDateString,
  IsOptional,
  IsNumber,
  ValidateNested,
  Min,
  Max,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IoTEventType, ShipmentStatus, ScanType, ShipmentSensorProfile } from '../enums';
import { GeoPointDto, IGeoPoint } from './climate-event.dto';

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface IShipmentMetadata {
  tracking_number: string;
  container_id?: string;
  sensor_id?: string;
  sensor_profile?: ShipmentSensorProfile;
}

export interface IBusinessContext {
  status: ShipmentStatus;
  scan_type: ScanType;
  [key: string]: unknown;
}

export interface IShipmentTelemetry {
  latitude?: number;
  longitude?: number;
  signal_strength_dbm?: number;
  temperature_celsius?: number;
  humidity_percent?: number;
  shock_g_force?: number;
  tilt_angle_deg?: number;
  vibration_hz?: number;
  door_open_count?: number;
  tamper_detected?: boolean;
  pressure_hpa?: number;
  air_quality_index?: number;
  battery_level_pct?: number;
  [key: string]: unknown;
}

export interface IShipmentEvent {
  event_id: string;
  event_type: IoTEventType.SHIPMENT_TELEMETRY;
  recorded_at: string;
  ingested_at: string;
  metadata: IShipmentMetadata;
  location: IGeoPoint;
  business_context: IBusinessContext;
  telemetry: IShipmentTelemetry;
}

// ---------------------------------------------------------------------------
// Nested DTOs
// ---------------------------------------------------------------------------

export class ShipmentMetadataDto implements IShipmentMetadata {
  @IsString()
  tracking_number: string;

  @IsOptional()
  @IsString()
  container_id?: string;

  @IsOptional()
  @IsString()
  sensor_id?: string;

  @IsOptional()
  @IsEnum(ShipmentSensorProfile)
  sensor_profile?: ShipmentSensorProfile;
}

export class BusinessContextDto implements IBusinessContext {
  @IsEnum(ShipmentStatus)
  status: ShipmentStatus;

  @IsEnum(ScanType)
  scan_type: ScanType;

  [key: string]: unknown;
}

export class ShipmentTelemetryDto implements IShipmentTelemetry {
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsNumber()
  signal_strength_dbm?: number;

  @IsOptional()
  @IsNumber()
  temperature_celsius?: number;

  @IsOptional()
  @IsNumber()
  humidity_percent?: number;

  @IsOptional()
  @IsNumber()
  shock_g_force?: number;

  @IsOptional()
  @IsNumber()
  tilt_angle_deg?: number;

  @IsOptional()
  @IsNumber()
  vibration_hz?: number;

  @IsOptional()
  @IsNumber()
  door_open_count?: number;

  @IsOptional()
  @IsBoolean()
  tamper_detected?: boolean;

  @IsOptional()
  @IsNumber()
  pressure_hpa?: number;

  @IsOptional()
  @IsNumber()
  air_quality_index?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  battery_level_pct?: number;

  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Main DTO
// ---------------------------------------------------------------------------

export class CreateShipmentEventDto {
  @IsOptional()
  @IsString()
  event_id?: string;

  @IsEnum(IoTEventType)
  event_type: IoTEventType.SHIPMENT_TELEMETRY;

  @IsDateString()
  recorded_at: string;

  @IsOptional()
  @IsDateString()
  ingested_at?: string;

  @ValidateNested()
  @Type(() => ShipmentMetadataDto)
  metadata: ShipmentMetadataDto;

  @ValidateNested()
  @Type(() => GeoPointDto)
  location: GeoPointDto;

  @ValidateNested()
  @Type(() => BusinessContextDto)
  business_context: BusinessContextDto;

  @ValidateNested()
  @Type(() => ShipmentTelemetryDto)
  telemetry: ShipmentTelemetryDto;
}
