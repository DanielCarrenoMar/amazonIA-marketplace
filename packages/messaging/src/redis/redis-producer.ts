import { Redis } from '@upstash/redis';
import { IMessageProducer } from '../interfaces';
import { StreamTopic } from '../streams';


export class RedisProducerService implements IMessageProducer {
  private redis: Redis;

  constructor(redis: Redis) {
    this.redis = redis;
  }

  async produce<T extends Record<string, unknown>>(
    topic: StreamTopic,
    message: T,
    key?: string,
  ): Promise<void> {
    const fields: Record<string, unknown> = {
      data: JSON.stringify(message),
    };
    if (key) {
      fields.key = key;
    }

    await this.redis.xadd(topic, '*', fields);
    // Limit stream to approximately the last 1000 entries
    await this.redis.xtrim(topic, { strategy: 'MAXLEN', threshold: 1000, exactness: '~' });
  }

  async produceBatch<T extends Record<string, unknown>>(
    topic: StreamTopic,
    messages: T[],
    keyExtractor?: (msg: T) => string,
  ): Promise<void> {
    if (messages.length === 0) return;

    const pipeline = this.redis.pipeline();

    for (const msg of messages) {
      const key = keyExtractor ? keyExtractor(msg) : undefined;
      const fields: Record<string, unknown> = {
        data: JSON.stringify(msg),
      };
      if (key) {
        fields.key = key;
      }
      pipeline.xadd(topic, '*', fields);
    }

    await pipeline.exec();
    // Trim the stream after executing the batch
    await this.redis.xtrim(topic, { strategy: 'MAXLEN', threshold: 1000, exactness: '~' });
  }
}
