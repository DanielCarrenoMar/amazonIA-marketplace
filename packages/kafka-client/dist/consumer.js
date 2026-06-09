"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KafkaConsumerService = void 0;
const kafka_config_1 = require("./kafka.config");
/**
 * Typed Kafka consumer wrapper for polling-based consumption.
 *
 * Uses Upstash REST consumer API. Each call to `consume()` fetches
 * a batch of messages and auto-commits offsets.
 *
 * Designed for the telemetry-worker's interval-based polling loop.
 */
class KafkaConsumerService {
    kafka;
    constructor(kafka) {
        this.kafka = kafka ?? (0, kafka_config_1.createKafkaClient)();
    }
    /**
     * Consume a batch of messages from a topic.
     *
     * @param groupId  - Consumer group ID (enables offset tracking)
     * @param instanceId - Unique instance within the group (for scaling)
     * @param topic    - Topic to consume from
     * @returns Parsed messages with metadata
     */
    async consume(groupId, instanceId, topic) {
        if (!this.kafka) {
            return [];
        }
        const consumer = this.kafka.consumer();
        const rawMessages = await consumer.consume({
            consumerGroupId: groupId,
            instanceId,
            topics: [topic],
            autoOffsetReset: 'earliest',
        });
        return rawMessages.map((msg) => ({
            topic: msg.topic,
            partition: msg.partition,
            offset: msg.offset,
            key: msg.key,
            value: JSON.parse(msg.value),
            timestamp: msg.timestamp,
        }));
    }
}
exports.KafkaConsumerService = KafkaConsumerService;
//# sourceMappingURL=consumer.js.map