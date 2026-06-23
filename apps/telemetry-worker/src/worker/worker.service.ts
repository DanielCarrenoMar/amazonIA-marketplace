import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Interval } from '@nestjs/schedule';
import { IMessageConsumer, MESSAGE_CONSUMER, STREAM_TOPICS } from 'messaging';
import { Inject } from '@nestjs/common';
import { IClimateEvent, IShipmentEvent } from 'event-types';
import { ClimateEventDocument, ShipmentEventDocument } from 'database';

const CONSUMER_GROUP = 'telemetry-worker-group';
const INSTANCE_ID = `worker-${process.pid}`;

/**
 * Background worker that polls Redis Streams at a configurable interval
 * and bulk-inserts consumed events into MongoDB Time Series Collections.
 *
 * Metrics logged per cycle:
 *  - Number of messages consumed per topic
 *  - Average ingestion latency (ingested_at - recorded_at)
 */
@Injectable()
export class WorkerService implements OnModuleInit {
  private readonly logger = new Logger(WorkerService.name);
  private pollIntervalMs: number;

  constructor(
    private readonly config: ConfigService,
    @InjectModel(ClimateEventDocument.name)
    private readonly climateModel: Model<ClimateEventDocument>,
    @InjectModel(ShipmentEventDocument.name)
    private readonly shipmentModel: Model<ShipmentEventDocument>,
    @Inject(MESSAGE_CONSUMER) private readonly consumer: IMessageConsumer,
  ) {
    this.pollIntervalMs = Number(
      this.config.get<string>('POLL_INTERVAL_MS', '5000'),
    );
  }

  onModuleInit() {
    this.logger.log(
      `Worker initialized. Polling every ${this.pollIntervalMs}ms`,
    );
  }

  // -------------------------------------------------------------------------
  // Polling loop — driven by @nestjs/schedule
  // -------------------------------------------------------------------------

  @Interval(30000) // Default 5s; overridden dynamically if needed
  async pollStreams(): Promise<void> {
    // Consumer comes from DI now, no need to manually instantiate

    await Promise.all([
      this.consumeClimateEvents(),
      this.consumeShipmentEvents(),
    ]);
  }

  // -------------------------------------------------------------------------
  // Climate events: Redis Stream → MongoDB
  // -------------------------------------------------------------------------

  private async consumeClimateEvents(): Promise<void> {
    try {
      const messages = await this.consumer!.consume<IClimateEvent>(
        CONSUMER_GROUP,
        INSTANCE_ID,
        STREAM_TOPICS.CLIMATE_EVENTS,
      );

      if (messages.length === 0) return;

      const documents = messages.map((msg: any) => this.stripNulls({
        event_id: msg.value.event_id,
        event_type: msg.value.event_type,
        recorded_at: new Date(msg.value.recorded_at),
        ingested_at: new Date(msg.value.ingested_at),
        metadata: msg.value.metadata,
        location: msg.value.location,
        telemetry: msg.value.telemetry,
      }));

      await this.insertWithRetry(this.climateModel, documents);

      // ACK messages only after successful persistence
      const idsToAck = messages.map((m) => m.offset);
      await this.consumer!.ack(
        CONSUMER_GROUP,
        STREAM_TOPICS.CLIMATE_EVENTS,
        idsToAck,
      );

      // Log metrics
      const avgLatencyMs = this.calculateAvgLatency(documents);
      this.logger.log(
        `Persisted ${documents.length} climate events | avg latency: ${avgLatencyMs}ms`,
      );
    } catch (error) {
      this.logger.error(
        'Failed to process climate events',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  // -------------------------------------------------------------------------
  // Shipment events: Redis Stream → MongoDB
  // -------------------------------------------------------------------------

  private async consumeShipmentEvents(): Promise<void> {
    try {
      const messages = await this.consumer!.consume<IShipmentEvent>(
        CONSUMER_GROUP,
        INSTANCE_ID,
        STREAM_TOPICS.SHIPMENT_EVENTS,
      );

      if (messages.length === 0) return;

      const documents = messages.map((msg: any) => this.stripNulls({
        event_id: msg.value.event_id,
        event_type: msg.value.event_type,
        recorded_at: new Date(msg.value.recorded_at),
        ingested_at: new Date(msg.value.ingested_at),
        metadata: msg.value.metadata,
        location: msg.value.location,
        business_context: msg.value.business_context,
        telemetry: msg.value.telemetry,
      }));

      await this.insertWithRetry(this.shipmentModel, documents);

      // ACK messages only after successful persistence
      const idsToAck = messages.map((m) => m.offset);
      await this.consumer!.ack(
        CONSUMER_GROUP,
        STREAM_TOPICS.SHIPMENT_EVENTS,
        idsToAck,
      );

      const avgLatencyMs = this.calculateAvgLatency(documents);
      this.logger.log(
        `Persisted ${documents.length} shipment events | avg latency: ${avgLatencyMs}ms`,
      );
    } catch (error) {
      this.logger.error(
        'Failed to process shipment events',
        error instanceof Error ? error.stack : String(error),
      );
    }
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
        ])
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
      return sum + (doc.ingested_at.getTime() - doc.recorded_at.getTime());
    }, 0);
    return Math.round(totalLatency / documents.length);
  }
}
