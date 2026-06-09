"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createKafkaClient = createKafkaClient;
const kafka_1 = require("@upstash/kafka");
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
function createKafkaClient() {
    const url = process.env.KAFKA_REST_URL;
    const token = process.env.KAFKA_REST_TOKEN;
    if (!url || !token) {
        return null;
    }
    return new kafka_1.Kafka({
        url,
        username: process.env.KAFKA_REST_USERNAME || '',
        password: token, // Upstash uses 'password' in v1.3.5
    });
}
//# sourceMappingURL=kafka.config.js.map