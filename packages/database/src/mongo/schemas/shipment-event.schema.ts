import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { IShipmentMetadata, IBusinessContext, IShipmentTelemetry, IGeoPoint } from 'event-types';

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
  autoIndex: false, // Do not automatically build indexes in production
  strict: false,
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
      container_id: { type: String, required: true },
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
      status: { type: String, required: true },
      scan_type: { type: String, required: true },
    }),
  )
  business_context: IBusinessContext;

  @Prop(
    raw({
      temperature_celsius: { type: Number },
      shock_g_force: { type: Number },
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
