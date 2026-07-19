import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { IClimateMetadata, IGeoPoint, IClimateTelemetry } from 'event-types';

/**
 * Mongoose schema for the `climate_events` MongoDB Time Series Collection.
 *
 * Time Series config:
 *   timeField:   recorded_at  (when the sensor measured)
 *   metaField:   metadata     (groups by sensor_id for internal bucketing)
 *   granularity: minutes      (fixed sensors report every few minutes)
 *
 * The Time Series Collection must be created in MongoDB Atlas BEFORE
 * first use, as Mongoose cannot create TS collections via schema alone.
 *
 * Atlas shell command:
 *   db.createCollection("climate_events", {
 *     timeseries: {
 *       timeField: "recorded_at",
 *       metaField: "metadata",
 *       granularity: "minutes"
 *     }
 *   })
 */
export type ClimateEventDocumentType = HydratedDocument<ClimateEventDocument>;

@Schema({
  collection: 'climate_events',
  timestamps: false, // We manage recorded_at and ingested_at explicitly
  autoIndex: true,  // Autocrea índices y la colección
  strict: false,
  timeseries: {
    timeField: 'recorded_at',
    metaField: 'metadata',
    granularity: 'minutes',
  },
})
export class ClimateEventDocument {
  @Prop({ required: true })
  event_id: string;

  @Prop({ required: true })
  event_type: string;

  @Prop({ required: true, type: Date })
  recorded_at: Date;

  @Prop({ required: true, type: Date })
  ingested_at: Date;

  @Prop(
    raw({
      sensor_id: { type: String, required: true },
      facility_id: { type: String, required: true },
      sensor_type: { type: String, required: true },
    }),
  )
  metadata: IClimateMetadata;

  @Prop(
    raw({
      type: { type: String, default: 'Point' },
      coordinates: { type: [Number], required: true },
    }),
  )
  location: IGeoPoint;

  @Prop(
    raw({
      temperature_celsius: { type: Number },
      humidity_percent: { type: Number },
      pressure_hpa: { type: Number },
      uv_index: { type: Number },
      wind_speed_kmh: { type: Number },
      wind_direction_deg: { type: Number },
      rainfall_mm: { type: Number },
      air_quality_index: { type: Number },
      co2_ppm: { type: Number },
      solar_radiation_wm2: { type: Number },
    }),
  )
  telemetry: IClimateTelemetry;
}

export const ClimateEventSchema =
  SchemaFactory.createForClass(ClimateEventDocument);

// GeoJSON index for $near and $geoIntersects queries
ClimateEventSchema.index({ location: '2dsphere' });

// Composite index for querying by sensor within a time range
ClimateEventSchema.index({ 'metadata.sensor_id': 1, recorded_at: -1 });
