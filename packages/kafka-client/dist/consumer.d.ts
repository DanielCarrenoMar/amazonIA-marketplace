import { Kafka } from '@upstash/kafka';
import { KafkaTopic } from './topics';
export interface ConsumedMessage<T> {
    topic: string;
    partition: number;
    offset: number;
    key: string | null;
    value: T;
    timestamp: number;
}
/**
 * Typed Kafka consumer wrapper for polling-based consumption.
 *
 * Uses Upstash REST consumer API. Each call to `consume()` fetches
 * a batch of messages and auto-commits offsets.
 *
 * Designed for the telemetry-worker's interval-based polling loop.
 */
export declare class KafkaConsumerService {
    private kafka;
    constructor(kafka?: Kafka);
    /**
     * Consume a batch of messages from a topic.
     *
     * @param groupId  - Consumer group ID (enables offset tracking)
     * @param instanceId - Unique instance within the group (for scaling)
     * @param topic    - Topic to consume from
     * @returns Parsed messages with metadata
     */
    consume<T>(groupId: string, instanceId: string, topic: KafkaTopic): Promise<ConsumedMessage<T>[]>;
}
//# sourceMappingURL=consumer.d.ts.map