import { DynamicModule, Module } from '@nestjs/common';
import { MESSAGE_CONSUMER, MESSAGE_PRODUCER } from './tokens';
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
          useFactory: () => {
            const redis = createRedisClient();
            return new RedisProducerService(redis);
          },
        },
        {
          provide: MESSAGE_CONSUMER,
          useFactory: () => {
            const redis = createRedisClient();
            return new RedisConsumerService(redis);
          },
        },
      ],
      exports: [MESSAGE_PRODUCER, MESSAGE_CONSUMER],
    };
  }
}
