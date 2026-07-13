import { IMessageProducer } from '../interfaces';
import { StreamTopic } from '../streams';

/** No-op producer used when Redis is not configured (local dev without Upstash). */
export class NoopProducerService implements IMessageProducer {
  async produce<T extends Record<string, unknown>>(
    _topic: StreamTopic,
    _message: T,
    _key?: string,
  ): Promise<void> {
    // Silently discarded — Redis not configured
  }

  async produceBatch<T extends Record<string, unknown>>(
    _topic: StreamTopic,
    _messages: T[],
    _keyExtractor?: (msg: T) => string,
  ): Promise<void> {
    // Silently discarded — Redis not configured
  }
}
