import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { IShipmentMetadata, IShipmentTelemetry, IGeoPoint } from 'event-types';

/**
 * Mongoose schema for the `shipment_events` MongoDB Time Series Collection.
 *
 * Time Series config:
 *   timeField:   recorded_at  (when the device measured)
 *   metaField:   metadata     (groups by tracking_number for internal bucketing)
 *   granularity: seconds      (mobile sensors report at high frequency)
 *
 * Atlas shell command:
 *   db.createCollection("shipment_events", {
 *     timeseries: {
 *       timeField: "recorded_at",
 *       metaField: "metadata",
 *       granularity: "seconds"
 *     }
 *   })
 */
export type ShipmentEventDocumentType =
  HydratedDocument<ShipmentEventDocument>;

@Schema({
  collection: 'shipment_events',
  timestamps: false,
  autoIndex: true, // Autocrea índices y la colección
  strict: false,
  timeseries: {
    timeField: 'recorded_at',
    metaField: 'metadata',
    granularity: 'seconds',
  },
})
export class ShipmentEventDocument {
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
      tracking_number: { type: String, required: true },
      container_id: { type: String },
      sensor_id: { type: String },
      sensor_profile: { type: String },
    }),
  )
  metadata: IShipmentMetadata;

  @Prop(
    raw({
      type: { type: String, default: 'Point' },
      coordinates: { type: [Number], required: true },
    }),
  )
  location: IGeoPoint;


  @Prop(
    raw({
      latitude: { type: Number },
      longitude: { type: Number },
      signal_strength_dbm: { type: Number },
      temperature_celsius: { type: Number },
      shock_g_force: { type: Number },
      humidity_percent: { type: Number },
      tilt_angle_deg: { type: Number },
      vibration_hz: { type: Number },
      door_open_count: { type: Number },
      tamper_detected: { type: Boolean },
      pressure_hpa: { type: Number },
      air_quality_index: { type: Number },
      battery_level_pct: { type: Number },
    }),
  )
  telemetry: IShipmentTelemetry;
}

export const ShipmentEventSchema =
  SchemaFactory.createForClass(ShipmentEventDocument);

// GeoJSON index for trajectory tracing and geo-intersection queries
ShipmentEventSchema.index({ location: '2dsphere' });

// Composite index for querying by tracking number within a time range
ShipmentEventSchema.index({
  'metadata.tracking_number': 1,
  recorded_at: -1,
});

// Composite index for querying by sensor_id within a time range
ShipmentEventSchema.index({
  'metadata.sensor_id': 1,
  recorded_at: -1,
});
