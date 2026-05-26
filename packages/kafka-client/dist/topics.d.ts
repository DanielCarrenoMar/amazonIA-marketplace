/**
 * Kafka topic constants for IoT telemetry events.
 *
 * Naming convention: domain.entity.action
 * These must match the topics created in the Upstash Kafka dashboard.
 */
export declare const KAFKA_TOPICS: {
    /** Fixed-sensor environmental readings (warehouses, cold storage) */
    readonly CLIMATE_EVENTS: "iot.climate.events";
    /** Mobile shipment telemetry (trucks, drones, parcels) */
    readonly SHIPMENT_EVENTS: "iot.shipment.events";
};
export type KafkaTopic = (typeof KAFKA_TOPICS)[keyof typeof KAFKA_TOPICS];
//# sourceMappingURL=topics.d.ts.map