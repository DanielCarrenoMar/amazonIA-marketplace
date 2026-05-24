import { Kafka } from '@upstash/kafka';
import { createKafkaClient } from './kafka.config';
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
export class KafkaConsumerService {
  private kafka: Kafka;

  constructor(kafka?: Kafka) {
    this.kafka = kafka ?? createKafkaClient();
  }

  /**
   * Consume a batch of messages from a topic.
   *
   * @param groupId  - Consumer group ID (enables offset tracking)
   * @param instanceId - Unique instance within the group (for scaling)
   * @param topic    - Topic to consume from
   * @returns Parsed messages with metadata
   */
  async consume<T>(
    groupId: string,
    instanceId: string,
    topic: KafkaTopic,
  ): Promise<ConsumedMessage<T>[]> {
    const consumer = this.kafka.consumer();

    const rawMessages = await consumer.consume({
      consumerGroupId: groupId,
      instanceId,
      topics: [topic],
      autoOffsetReset: 'earliest',
    });

    return rawMessages.map((msg: any) => ({
      topic: msg.topic,
      partition: msg.partition,
      offset: msg.offset,
      key: msg.key as string | null,
      value: JSON.parse(msg.value as string) as T,
      timestamp: msg.timestamp,
    }));
  }
}
