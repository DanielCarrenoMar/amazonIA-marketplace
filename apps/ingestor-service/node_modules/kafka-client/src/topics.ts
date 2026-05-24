/**
 * Kafka topic constants for IoT telemetry events.
 *
 * Naming convention: domain.entity.action
 * These must match the topics created in the Upstash Kafka dashboard.
 */
export const KAFKA_TOPICS = {
  /** Fixed-sensor environmental readings (warehouses, cold storage) */
  CLIMATE_EVENTS: 'iot.climate.events',

  /** Mobile shipment telemetry (trucks, drones, parcels) */
  SHIPMENT_EVENTS: 'iot.shipment.events',
} as const;

export type KafkaTopic = (typeof KAFKA_TOPICS)[keyof typeof KAFKA_TOPICS];
