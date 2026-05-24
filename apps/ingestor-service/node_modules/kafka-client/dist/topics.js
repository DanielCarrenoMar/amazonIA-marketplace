"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KAFKA_TOPICS = void 0;
/**
 * Kafka topic constants for IoT telemetry events.
 *
 * Naming convention: domain.entity.action
 * These must match the topics created in the Upstash Kafka dashboard.
 */
exports.KAFKA_TOPICS = {
    /** Fixed-sensor environmental readings (warehouses, cold storage) */
    CLIMATE_EVENTS: 'iot.climate.events',
    /** Mobile shipment telemetry (trucks, drones, parcels) */
    SHIPMENT_EVENTS: 'iot.shipment.events',
};
//# sourceMappingURL=topics.js.map