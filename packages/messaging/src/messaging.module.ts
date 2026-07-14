import { DynamicModule, Module } from '@nestjs/common';
import { Redis } from '@upstash/redis';
import { MESSAGE_CONSUMER, MESSAGE_PRODUCER, REDIS_CLIENT } from './tokens';
import { RedisProducerService } from './redis/redis-producer';
import { RedisConsumerService } from './redis/redis-consumer';
import { NoopProducerService } from './redis/noop-producer';
import { NoopConsumerService } from './redis/noop-consumer';
import { createRedisClient } from './redis/redis.config';

@Module({})
export class MessagingModule {
  static forRoot(): DynamicModule {
    return {
      module: MessagingModule,
      global: true,
      providers: [
        {
          provide: REDIS_CLIENT,
          useFactory: () => createRedisClient(), // null when not configured
        },
        {
          provide: MESSAGE_PRODUCER,
          useFactory: (redis: Redis | null) =>
            redis ? new RedisProducerService(redis) : new NoopProducerService(),
          inject: [REDIS_CLIENT],
        },
        {
          provide: MESSAGE_CONSUMER,
          useFactory: (redis: Redis | null) =>
            redis ? new RedisConsumerService(redis) : new NoopConsumerService(),
          inject: [REDIS_CLIENT],
        },
      ],
      exports: [MESSAGE_PRODUCER, MESSAGE_CONSUMER, REDIS_CLIENT],
    };
  }
}
