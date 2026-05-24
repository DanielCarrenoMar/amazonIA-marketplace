import { Kafka } from '@upstash/kafka';
import { KafkaTopic } from './topics';
/**
 * Typed Kafka producer wrapper.
 *
 * Serializes messages as JSON and publishes to Upstash Kafka topics
 * via the REST protocol. Supports single and batch publishing.
 */
export declare class KafkaProducerService {
    private kafka;
    constructor(kafka?: Kafka);
    /**
     * Publish a single message to a topic.
     * The message is JSON-serialized automatically.
     */
    produce<T extends Record<string, unknown>>(topic: KafkaTopic, message: T, key?: string): Promise<void>;
    /**
     * Publish multiple messages to a topic in a single HTTP request.
     * Upstash REST API batches these into one round-trip.
     */
    produceBatch<T extends Record<string, unknown>>(topic: KafkaTopic, messages: T[], keyExtractor?: (msg: T) => string): Promise<void>;
}
//# sourceMappingURL=producer.d.ts.map