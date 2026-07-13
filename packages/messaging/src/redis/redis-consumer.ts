import { Redis } from '@upstash/redis';
import { ConsumedMessage, IMessageConsumer } from '../interfaces';
import { StreamTopic } from '../streams';


export class RedisConsumerService implements IMessageConsumer {
  private redis: Redis;
  private initialized: Set<string> = new Set();

  constructor(redis: Redis) {
    this.redis = redis;
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

    for (const stream of result) {
      // stream could be an array: ["topic_name", [ ["id", ["data", "..."]] ]]
      // or an object if Upstash changes API: { stream: "...", messages: [...] }
      
      let streamMessages: any[] = [];
      if (Array.isArray(stream) && stream.length === 2) {
        streamMessages = stream[1];
      } else if (stream && Array.isArray(stream.messages)) {
        streamMessages = stream.messages;
      }
      
      if (!Array.isArray(streamMessages)) continue;

      for (const entry of streamMessages) {
        let id: string;
        let fields: any;
        
        if (Array.isArray(entry) && entry.length === 2) {
          id = entry[0];
          fields = entry[1];
        } else if (entry && entry.id) {
          id = entry.id;
          fields = entry.value || {};
        } else {
          continue;
        }

        let rawData: any = '{}';
        let keyStr: string | null = null;

        if (Array.isArray(fields)) {
          for (let i = 0; i < fields.length; i += 2) {
            if (fields[i] === 'data') rawData = fields[i + 1];
            if (fields[i] === 'key') keyStr = fields[i + 1];
          }
        } else if (fields && typeof fields === 'object') {
          rawData = fields.data || '{}';
          keyStr = fields.key || null;
        }

        let parsedValue: any;
        if (typeof rawData === 'string') {
          try {
            parsedValue = JSON.parse(rawData);
          } catch (e) {
            parsedValue = {};
          }
        } else {
          parsedValue = rawData;
        }

        const timestampMs = parseInt(id.split('-')[0], 10);

        messages.push({
          topic,
          partition: 0,
          offset: id,
          key: keyStr,
          value: parsedValue as T,
          timestamp: timestampMs,
        });
      }
    }

    return messages;
  }

  async ack(
    groupId: string,
    topic: StreamTopic,
    messageIds: string[],
  ): Promise<void> {
    if (messageIds.length > 0) {
      await this.redis.xack(topic, groupId, messageIds);
    }
  }
}
