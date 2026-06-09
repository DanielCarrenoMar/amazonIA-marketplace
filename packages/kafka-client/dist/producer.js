"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KafkaProducerService = void 0;
const kafka_config_1 = require("./kafka.config");
/**
 * Typed Kafka producer wrapper.
 *
 * Serializes messages as JSON and publishes to Upstash Kafka topics
 * via the REST protocol. Supports single and batch publishing.
 */
class KafkaProducerService {
    kafka;
    constructor(kafka) {
        this.kafka = kafka ?? (0, kafka_config_1.createKafkaClient)();
        if (!this.kafka) {
            console.warn('⚠️  [KAFKA-MOCK] Kafka credentials not configured. Operating in local Mock Mode. Telemetry will be logged instead of forwarded.');
        }
    }
    /**
     * Publish a single message to a topic.
     * The message is JSON-serialized automatically.
     */
    async produce(topic, message, key) {
        if (!this.kafka) {
            console.log(`📡 [KAFKA-MOCK] Produce to topic '${topic}' [Key: ${key}]:`, JSON.stringify(message));
            return;
        }
        const producer = this.kafka.producer();
        await producer.produce(topic, JSON.stringify(message), {
            key,
        });
    }
    /**
     * Publish multiple messages to a topic in a single HTTP request.
     * Upstash REST API batches these into one round-trip.
     */
    async produceBatch(topic, messages, keyExtractor) {
        if (!this.kafka) {
            console.log(`📡 [KAFKA-MOCK] Produce batch of ${messages.length} messages to topic '${topic}'`);
            return;
        }
        const producer = this.kafka.producer();
        const batch = messages.map((msg) => ({
            topic,
            value: JSON.stringify(msg),
            key: keyExtractor?.(msg),
        }));
        await producer.produceMany(batch);
    }
}
exports.KafkaProducerService = KafkaProducerService;
//# sourceMappingURL=producer.js.map