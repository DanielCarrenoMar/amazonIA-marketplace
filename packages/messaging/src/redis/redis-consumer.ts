import { Redis } from '@upstash/redis';
import { ConsumedMessage, IMessageConsumer } from '../interfaces';
import { StreamTopic } from '../streams';
import { createRedisClient } from './redis.config';

export class RedisConsumerService implements IMessageConsumer {
  private redis: Redis;
  private initialized: Set<string> = new Set();

  constructor(redis?: Redis) {
    this.redis = redis ?? createRedisClient();
  }

  private async ensureGroup(
    topic: StreamTopic,
    groupId: string,
  ): Promise<void> {
    const cacheKey = `${topic}:${groupId}`;
    if (this.initialized.has(cacheKey)) return;

    try {
      await this.redis.xgroup(topic, {
        type: 'CREATE',
        group: groupId,
        id: '0',
        options: { MKSTREAM: true },
      });
    } catch (err: any) {
      const message = typeof err === 'string' ? err : err?.message ?? '';
      if (!message.includes('BUSYGROUP')) {
        throw err;
      }
    }

    this.initialized.add(cacheKey);
  }

  async consume<T>(
    groupId: string,
    instanceId: string,
    topic: StreamTopic,
  ): Promise<ConsumedMessage<T>[]> {
    await this.ensureGroup(topic, groupId);

    const result = await this.redis.xreadgroup(
      groupId,
      instanceId,
      topic,
      '>',
      { count: 100 },
    ) as any;

    if (!result || !Array.isArray(result) || result.length === 0) {
      return [];
    }

    const messages: ConsumedMessage<T>[] = [];
    const idsToAck: string[] = [];

    for (const stream of result) {
      if (!stream || !Array.isArray(stream.messages)) continue;

      for (const entry of stream.messages) {
        const id: string = entry.id;
        const fields = entry.value as Record<string, string> | undefined;
        const data = fields?.data ?? '{}';
        const key = fields?.key ?? null;

        idsToAck.push(id);

        const timestampMs = parseInt(id.split('-')[0], 10);

        messages.push({
          topic,
          partition: 0,
          offset: id,
          key,
          value: JSON.parse(data) as T,
          timestamp: timestampMs,
        });
      }
    }

    if (idsToAck.length > 0) {
      await this.redis.xack(topic, groupId, idsToAck);
    }

    return messages;
  }
}
