import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Interval } from '@nestjs/schedule';
import { KafkaConsumerService, KAFKA_TOPICS } from 'kafka-client';
import { IClimateEvent, IShipmentEvent } from 'event-types';
import { ClimateEventDocument, ShipmentEventDocument } from 'database';

const CONSUMER_GROUP = 'telemetry-worker-group';
const INSTANCE_ID = `worker-${process.pid}`;

/**
 * Background worker that polls Kafka topics at a configurable interval
 * and bulk-inserts consumed events into MongoDB Time Series Collections.
 *
 * Metrics logged per cycle:
 *  - Number of messages consumed per topic
 *  - Average ingestion latency (ingested_at - recorded_at)
 */
@Injectable()
export class WorkerService implements OnModuleInit {
  private readonly logger = new Logger(WorkerService.name);
  private consumer: KafkaConsumerService | null = null;
  private pollIntervalMs: number;

  constructor(
    private readonly config: ConfigService,
    @InjectModel(ClimateEventDocument.name)
    private readonly climateModel: Model<ClimateEventDocument>,
    @InjectModel(ShipmentEventDocument.name)
    private readonly shipmentModel: Model<ShipmentEventDocument>,
  ) {
    this.pollIntervalMs = Number(
      this.config.get<string>('POLL_INTERVAL_MS', '5000'),
    );
  }

  onModuleInit() {
    try {
      this.consumer = new KafkaConsumerService();
      this.logger.log(
        `Worker initialized. Polling every ${this.pollIntervalMs}ms`,
      );
    } catch (error) {
      this.logger.warn(
        'Kafka consumer not initialized — missing credentials. Worker will retry each cycle.',
      );
    }
  }

  // -------------------------------------------------------------------------
  // Polling loop — driven by @nestjs/schedule
  // -------------------------------------------------------------------------

  @Interval(5000) // Default 5s; overridden dynamically if needed
  async pollKafka(): Promise<void> {
    if (!this.consumer) {
      try {
        this.consumer = new KafkaConsumerService();
      } catch {
        return; // Still no credentials, skip this cycle
      }
    }

    await Promise.all([
      this.consumeClimateEvents(),
      this.consumeShipmentEvents(),
    ]);
  }

  // -------------------------------------------------------------------------
  // Climate events: Kafka → MongoDB
  // -------------------------------------------------------------------------

  private async consumeClimateEvents(): Promise<void> {
    try {
      const messages = await this.consumer!.consume<IClimateEvent>(
        CONSUMER_GROUP,
        INSTANCE_ID,
        KAFKA_TOPICS.CLIMATE_EVENTS,
      );

      if (messages.length === 0) return;

      const documents = messages.map((msg: any) => ({
        event_id: msg.value.event_id,
        event_type: msg.value.event_type,
        recorded_at: new Date(msg.value.recorded_at),
        ingested_at: new Date(msg.value.ingested_at),
        metadata: msg.value.metadata,
        location: msg.value.location,
        telemetry: msg.value.telemetry,
      }));

      await this.climateModel.insertMany(documents, { ordered: false });

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
  // Shipment events: Kafka → MongoDB
  // -------------------------------------------------------------------------

  private async consumeShipmentEvents(): Promise<void> {
    try {
      const messages = await this.consumer!.consume<IShipmentEvent>(
        CONSUMER_GROUP,
        INSTANCE_ID,
        KAFKA_TOPICS.SHIPMENT_EVENTS,
      );

      if (messages.length === 0) return;

      const documents = messages.map((msg: any) => ({
        event_id: msg.value.event_id,
        event_type: msg.value.event_type,
        recorded_at: new Date(msg.value.recorded_at),
        ingested_at: new Date(msg.value.ingested_at),
        metadata: msg.value.metadata,
        location: msg.value.location,
        business_context: msg.value.business_context,
        telemetry: msg.value.telemetry,
      }));

      await this.shipmentModel.insertMany(documents, { ordered: false });

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
  // Metrics
  // -------------------------------------------------------------------------

  /**
   * Calculates average ingestion latency (ingested_at - recorded_at).
   * This delta reveals network connectivity gaps — critical for ML models
   * training anomaly detection in low-connectivity zones.
   */
  private calculateAvgLatency(
    docs: Array<{ recorded_at: Date; ingested_at: Date }>,
  ): number {
    if (docs.length === 0) return 0;
    const totalMs = docs.reduce(
      (sum, d) => sum + (d.ingested_at.getTime() - d.recorded_at.getTime()),
      0,
    );
    return Math.round(totalMs / docs.length);
  }
}
