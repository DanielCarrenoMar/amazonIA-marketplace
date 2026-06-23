export const STREAM_TOPICS = {
  CLIMATE_EVENTS: 'iot.climate.events',
  SHIPMENT_EVENTS: 'iot.shipment.events',
  CLIMATE_EVENTS_DLQ: 'iot.climate.events.dlq',
  SHIPMENT_EVENTS_DLQ: 'iot.shipment.events.dlq',
} as const;

export type StreamTopic = (typeof STREAM_TOPICS)[keyof typeof STREAM_TOPICS];

// Backward compatibility aliases (deprecated)
/**
 * @deprecated Use STREAM_TOPICS instead
 */
export const KAFKA_TOPICS = STREAM_TOPICS;

/**
 * @deprecated Use StreamTopic instead
 */
export type KafkaTopic = StreamTopic;
