import { Injectable, Logger, OnModuleInit, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Interval } from '@nestjs/schedule';
import { Redis } from '@upstash/redis';
import {
  ConsumedMessage,
  IMessageConsumer,
  IMessageProducer,
  MESSAGE_CONSUMER,
  MESSAGE_PRODUCER,
  REDIS_CLIENT,
  STREAM_TOPICS,
  StreamTopic,
} from 'messaging';
import { IClimateEvent, IShipmentEvent } from 'event-types';
import { ClimateEventDocument, ShipmentEventDocument } from 'database';

const CONSUMER_GROUP = 'telemetry-worker-group';
const INSTANCE_ID = `worker-${process.pid}`;
const RETRY_HASH_KEY_PREFIX = 'telemetry-worker:retries';

interface ProcessingMetrics {
  persisted: number;
  failed: number;
  sentToDlq: number;
}

/**
 * Background worker that polls Redis Streams at a configurable interval
 * and inserts consumed events into MongoDB Time Series Collections.
 *
 * Processing guarantees:
 *  - Messages are processed one by one so a single bad payload cannot
 *    block the whole batch.
 *  - Failed messages are retried up to MAX_MESSAGE_RETRIES times.
 *  - After exhausting retries the message is moved to the corresponding
 *    Dead Letter Queue (DLQ) and acknowledged.
 *
 * Metrics logged per cycle:
 *  - Number of messages persisted, failed and sent to DLQ per topic.
 */
@Injectable()
export class WorkerService implements OnModuleInit {
  private readonly logger = new Logger(WorkerService.name);
  private readonly pollIntervalMs: number;
  private readonly maxRetries: number;

  constructor(
    private readonly config: ConfigService,
    @InjectModel(ClimateEventDocument.name)
    private readonly climateModel: Model<ClimateEventDocument>,
    @InjectModel(ShipmentEventDocument.name)
    private readonly shipmentModel: Model<ShipmentEventDocument>,
    @Inject(MESSAGE_CONSUMER) private readonly consumer: IMessageConsumer,
    @Inject(MESSAGE_PRODUCER) private readonly producer: IMessageProducer,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {
    this.pollIntervalMs = Number(
      this.config.get<string>('POLL_INTERVAL_MS', '5000'),
    );
    this.maxRetries = Number(
      this.config.get<string>('MAX_MESSAGE_RETRIES', '3'),
    );
  }

  onModuleInit() {
    this.logger.log(
      `Worker initialized. Polling every ${this.pollIntervalMs}ms with max ${this.maxRetries} retries`,
    );
  }

  // -------------------------------------------------------------------------
  // Polling loop — driven by @nestjs/schedule
  // -------------------------------------------------------------------------

  @Interval(30000) // Default 30s; useful when external scheduler is absent
  async pollStreams(): Promise<void> {
    await Promise.all([
      this.consumeClimateEvents(),
      this.consumeShipmentEvents(),
    ]);
  }

  // -------------------------------------------------------------------------
  // Topic consumers
  // -------------------------------------------------------------------------

  private async consumeClimateEvents(): Promise<void> {
    return this.processTopic<IClimateEvent>(
      STREAM_TOPICS.CLIMATE_EVENTS,
      STREAM_TOPICS.CLIMATE_EVENTS_DLQ,
      this.climateModel,
      (msg) => this.mapClimateDocument(msg),
    );
  }

  private async consumeShipmentEvents(): Promise<void> {
    return this.processTopic<IShipmentEvent>(
      STREAM_TOPICS.SHIPMENT_EVENTS,
      STREAM_TOPICS.SHIPMENT_EVENTS_DLQ,
      this.shipmentModel,
      (msg) => this.mapShipmentDocument(msg),
    );
  }

  // -------------------------------------------------------------------------
  // Generic per-message processor with retry + DLQ semantics
  // -------------------------------------------------------------------------

  private async processTopic<T>(
    topic: StreamTopic,
    dlqTopic: StreamTopic,
    model: Model<any>,
    mapper: (msg: ConsumedMessage<T>) => Record<string, unknown>,
  ): Promise<void> {
    try {
      const messages = await this.consumer.consume<T>(
        CONSUMER_GROUP,
        INSTANCE_ID,
        topic,
      );

      if (messages.length === 0) return;

      const metrics: ProcessingMetrics = {
        persisted: 0,
        failed: 0,
        sentToDlq: 0,
      };

      for (const msg of messages) {
        try {
          this.validatePayload(msg.value);
          const document = mapper(msg);
          await this.insertWithRetry(model, [document]);

          await this.ackMessage(topic, msg.offset);
          await this.clearRetryCount(topic, msg.offset);

          metrics.persisted++;
        } catch (error) {
          metrics.failed++;
          const reason = error instanceof Error ? error.message : String(error);
          const retryCount = await this.incrementRetryCount(topic, msg.offset);

          if (retryCount >= this.maxRetries) {
            await this.producer.produce(dlqTopic, {
              originalMessage: msg.value,
              reason,
              retryCount,
              topic,
              offset: msg.offset,
              timestamp: Date.now(),
            });

            await this.ackMessage(topic, msg.offset);
            await this.clearRetryCount(topic, msg.offset);

            metrics.sentToDlq++;
            this.logger.warn(
              `Message ${msg.offset} moved to DLQ ${dlqTopic} after ${retryCount} retries`,
            );
          } else {
            this.logger.warn(
              `Failed to process message ${msg.offset} on ${topic} (attempt ${retryCount}/${this.maxRetries}): ${reason}`,
            );
          }
        }
      }

      this.logger.log(
        `Topic ${topic} cycle: ${metrics.persisted} persisted, ${metrics.failed} failed, ${metrics.sentToDlq} sent to DLQ | avg latency: ${this.calculateAvgLatency(messages.map((m) => m.value))}ms`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process topic ${topic}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  // -------------------------------------------------------------------------
  // Mappers
  // -------------------------------------------------------------------------

  private mapClimateDocument(
    msg: ConsumedMessage<IClimateEvent>,
  ): Record<string, unknown> {
    return this.stripNulls({
      event_id: msg.value.event_id,
      event_type: msg.value.event_type,
      recorded_at: new Date(msg.value.recorded_at),
      ingested_at: new Date(msg.value.ingested_at),
      metadata: msg.value.metadata,
      location: msg.value.location,
      telemetry: msg.value.telemetry,
    });
  }

  private mapShipmentDocument(
    msg: ConsumedMessage<IShipmentEvent>,
  ): Record<string, unknown> {
    return this.stripNulls({
      event_id: msg.value.event_id,
      event_type: msg.value.event_type,
      recorded_at: new Date(msg.value.recorded_at),
      ingested_at: new Date(msg.value.ingested_at),
      metadata: {
        sensor_id: msg.value.metadata.sensor_id,
        tracking_number: msg.value.metadata.tracking_number,
        sensor_profile: msg.value.metadata.sensor_profile,
      },
      location: msg.value.location,
      telemetry: msg.value.telemetry,
    });
  }

  // -------------------------------------------------------------------------
  // Validation
  // -------------------------------------------------------------------------

  private validatePayload(value: unknown): void {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new Error('Payload is empty or not an object');
    }

    const payload = value as Record<string, unknown>;
    const requiredFields = [
      'event_id',
      'event_type',
      'recorded_at',
      'ingested_at',
      'metadata',
    ];

    for (const field of requiredFields) {
      if (payload[field] == null) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
  }

  // -------------------------------------------------------------------------
  // Redis retry bookkeeping
  // -------------------------------------------------------------------------

  private retryHashKey(topic: StreamTopic): string {
    return `${RETRY_HASH_KEY_PREFIX}:${topic}`;
  }

  private async incrementRetryCount(
    topic: StreamTopic,
    offset: string,
  ): Promise<number> {
    return this.redis.hincrby(this.retryHashKey(topic), offset, 1);
  }

  private async clearRetryCount(
    topic: StreamTopic,
    offset: string,
  ): Promise<void> {
    await this.redis.hdel(this.retryHashKey(topic), offset);
  }

  private async ackMessage(topic: StreamTopic, offset: string): Promise<void> {
    await this.consumer.ack(CONSUMER_GROUP, topic, [offset]);
  }

  // -------------------------------------------------------------------------
  // Metrics & Utilities
  // -------------------------------------------------------------------------

  private async insertWithRetry<T>(
    model: Model<T>,
    documents: Record<string, any>[],
    maxRetries = 3,
  ): Promise<void> {
    const delays = [100, 200, 400];
    let lastError: unknown;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        await model.insertMany(documents, { ordered: false });
        return;
      } catch (error) {
        lastError = error;
        const delay = delays[attempt];
        this.logger.warn(
          `insertMany attempt ${attempt + 1}/${maxRetries} failed, retrying in ${delay}ms`,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  /**
   * Recursively removes keys with null or undefined values from an object.
   * MongoDB stores null explicitly (wastes space), but omitted keys are simply absent.
   */
  private stripNulls(obj: Record<string, any>): Record<string, any> {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([, v]) => v != null)
        .map(([k, v]) => [
          k,
          v && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Date)
            ? this.stripNulls(v)
            : v,
        ]),
    );
  }

  /**
   * Calculates average ingestion latency (ingested_at - recorded_at).
   * This delta reveals network connectivity gaps — critical for ML models
   * training anomaly detection in low-connectivity zones.
   */
  private calculateAvgLatency(documents: any[]): number {
    if (documents.length === 0) return 0;
    const totalLatency = documents.reduce((sum, doc) => {
      return sum + (new Date(doc.ingested_at).getTime() - new Date(doc.recorded_at).getTime());
    }, 0);
    return Math.round(totalLatency / documents.length);
  }
}
