import { DynamicModule, Module } from '@nestjs/common';
import { Redis } from '@upstash/redis';
import { MESSAGE_CONSUMER, MESSAGE_PRODUCER, REDIS_CLIENT } from './tokens';
import { RedisProducerService } from './redis/redis-producer';
import { RedisConsumerService } from './redis/redis-consumer';
import { createRedisClient } from './redis/redis.config';

@Module({})
export class MessagingModule {
  static forRoot(): DynamicModule {
    return {
      module: MessagingModule,
      global: true,
      providers: [
        {
          provide: MESSAGE_PRODUCER,
          useFactory: (redis: Redis) => {
            return new RedisProducerService(redis);
          },
          inject: [REDIS_CLIENT],
        },
        {
          provide: MESSAGE_CONSUMER,
          useFactory: (redis: Redis) => {
            return new RedisConsumerService(redis);
          },
          inject: [REDIS_CLIENT],
        },
        {
          provide: REDIS_CLIENT,
          useFactory: () => createRedisClient(),
        },
      ],
      exports: [MESSAGE_PRODUCER, MESSAGE_CONSUMER, REDIS_CLIENT],
    };
  }
}
