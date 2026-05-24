import { Kafka } from '@upstash/kafka';
/**
 * Shared Kafka configuration.
 *
 * Uses Upstash REST protocol — no TCP connections, SASL, or native Kafka
 * client overhead. Works in Serverless, Edge, and container environments.
 *
 * Required environment variables:
 *   KAFKA_REST_URL   — Upstash Kafka REST endpoint
 *   KAFKA_REST_TOKEN — Upstash Kafka REST token (base64-encoded credentials)
 */
export declare function createKafkaClient(): Kafka;
//# sourceMappingURL=kafka.config.d.ts.map