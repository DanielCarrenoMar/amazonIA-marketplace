import { IMessageConsumer, ConsumedMessage } from '../interfaces';
import { StreamTopic } from '../streams';

/** No-op consumer used when Redis is not configured (local dev without Upstash). */
export class NoopConsumerService implements IMessageConsumer {
  async consume<T>(
    _groupId: string,
    _instanceId: string,
    _topic: StreamTopic,
  ): Promise<ConsumedMessage<T>[]> {
    return [];
  }

  async ack(
    _groupId: string,
    _topic: StreamTopic,
    _messageIds: string[],
  ): Promise<void> {
    // No-op
  }
}
