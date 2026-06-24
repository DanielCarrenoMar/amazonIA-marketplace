export const STREAM_TOPICS = {
  CLIMATE_EVENTS: 'iot.climate.events',
  SHIPMENT_EVENTS: 'iot.shipment.events',
} as const;

export type StreamTopic = (typeof STREAM_TOPICS)[keyof typeof STREAM_TOPICS];
