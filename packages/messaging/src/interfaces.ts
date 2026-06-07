import { StreamTopic } from './streams';

export interface IMessageProducer {
  produce<T extends Record<string, unknown>>(
    topic: StreamTopic,
    message: T,
    key?: string,
  ): Promise<void>;

  produceBatch<T extends Record<string, unknown>>(
    topic: StreamTopic,
    messages: T[],
    keyExtractor?: (msg: T) => string,
  ): Promise<void>;
}

export interface ConsumedMessage<T> {
  topic: string;
  partition: number;
  offset: string;
  key: string | null;
  value: T;
  timestamp: number;
}

export interface IMessageConsumer {
  consume<T>(
    groupId: string,
    instanceId: string,
    topic: StreamTopic,
  ): Promise<ConsumedMessage<T>[]>;

  ack(
    groupId: string,
    topic: StreamTopic,
    messageIds: string[],
  ): Promise<void>;
}
