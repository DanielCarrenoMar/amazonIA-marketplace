import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { KafkaProducerService as BaseKafkaProducerService, KafkaTopic } from 'kafka-client';

@Injectable()
export class KafkaProducerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaProducerService.name);
  private producer: BaseKafkaProducerService;

  onModuleInit(): void {
    this.producer = new BaseKafkaProducerService();
    this.logger.log('Kafka producer connected');
  }

  onModuleDestroy(): void {
    this.logger.log('Kafka producer disconnected');
  }

  async produce<T extends Record<string, unknown>>(
    topic: KafkaTopic,
    message: T,
    key?: string,
  ): Promise<void> {
    return this.producer.produce(topic, message, key);
  }

  async produceBatch<T extends Record<string, unknown>>(
    topic: KafkaTopic,
    messages: T[],
    keyExtractor?: (msg: T) => string,
  ): Promise<void> {
    return this.producer.produceBatch(topic, messages, keyExtractor);
  }
}
