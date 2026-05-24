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
export function createKafkaClient(): Kafka {
  const url = process.env.KAFKA_REST_URL;
  const token = process.env.KAFKA_REST_TOKEN;

  if (!url || !token) {
    throw new Error(
      'Missing Kafka configuration. Set KAFKA_REST_URL and KAFKA_REST_TOKEN environment variables.',
    );
  }

  return new Kafka({
    url,
    username: process.env.KAFKA_REST_USERNAME || '',
    password: token, // Upstash uses 'password' in v1.3.5
  });
}
