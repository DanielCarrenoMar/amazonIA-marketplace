import { Kafka } from '@upstash/kafka';
import { createKafkaClient } from './kafka.config';
import { KafkaTopic } from './topics';

/**
 * Typed Kafka producer wrapper.
 *
 * Serializes messages as JSON and publishes to Upstash Kafka topics
 * via the REST protocol. Supports single and batch publishing.
 */
export class KafkaProducerService {
  private kafka: Kafka;

  constructor(kafka?: Kafka) {
    this.kafka = kafka ?? createKafkaClient();
  }

  /**
   * Publish a single message to a topic.
   * The message is JSON-serialized automatically.
   */
  async produce<T extends Record<string, unknown>>(
    topic: KafkaTopic,
    message: T,
    key?: string,
  ): Promise<void> {
    const producer = this.kafka.producer();
    await producer.produce(topic, JSON.stringify(message), {
      key,
    });
  }

  /**
   * Publish multiple messages to a topic in a single HTTP request.
   * Upstash REST API batches these into one round-trip.
   */
  async produceBatch<T extends Record<string, unknown>>(
    topic: KafkaTopic,
    messages: T[],
    keyExtractor?: (msg: T) => string,
  ): Promise<void> {
    const producer = this.kafka.producer();

    const batch = messages.map((msg) => ({
      topic,
      value: JSON.stringify(msg),
      key: keyExtractor?.(msg),
    }));

    await producer.produceMany(batch);
  }
}
