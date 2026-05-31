import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { OutboxEvent } from '@prisma/client';
import { STREAM_TOPICS, MESSAGE_PRODUCER } from 'messaging';
import type { StreamTopic, IMessageProducer } from 'messaging';

import { PrismaService } from '../prisma/prisma.service';
import { Inject } from '@nestjs/common';

const BATCH_SIZE = 50;
const INTERVAL_MS = 5_000;
const MAX_BACKOFF_MS = 60_000;

@Injectable()
export class OutboxRelayService {
  private readonly logger = new Logger(OutboxRelayService.name);
  private consecutiveFailures = 0;
  private nextRetryAt = 0;

  constructor(
    private readonly prisma: PrismaService,
    @Inject(MESSAGE_PRODUCER) private readonly producer: IMessageProducer,
  ) {}

  @Interval(INTERVAL_MS)
  async processOutbox(): Promise<void> {
    if (Date.now() < this.nextRetryAt) {
      this.logger.debug(`Backoff active — skipping tick (${Math.ceil((this.nextRetryAt - Date.now()) / 1000)}s remaining)`);
      return;
    }

    const events = await this.prisma.outboxEvent.findMany({
      where: { publishedAt: null },
      orderBy: { createdAt: 'asc' },
      take: BATCH_SIZE,
    });

    if (events.length === 0) return;

    this.logger.log(`Processing ${events.length} pending outbox event(s)`);

    // DESIGN DECISION: Why process events individually instead of in batches?
    // 1. FAULT ISOLATION: A single bad payload won't fail the entire batch.
    // 2. MULTIPLE TOPICS: Outbox events can go to different streams, while `produceBatch` only supports one topic at a time.
    // 3. CONCURRENCY: Promise.allSettled runs these in parallel.
    //
    // HOW TO IMPROVE FOR HIGH-VOLUME SCALE:
    // If the system grows, individual HTTP/DB calls become a bottleneck. We could:
    // - Group the `events` in memory by topic.
    // - Call `producer.produceBatch` for each group (reducing HTTP requests via pipeline).
    // - Perform a single `prisma.outboxEvent.updateMany` for the successfully published IDs.
    const results = await Promise.allSettled(events.map((e) => this.publishOne(e)));

    let published = 0;
    let failed = 0;

    for (let i = 0; i < results.length; i++) {
      if (results[i].status === 'fulfilled') {
        published++;
      } else {
        failed++;
        this.logger.error(
          { eventId: events[i].id, eventType: events[i].eventType },
          `Failed to publish outbox event: ${(results[i] as PromiseRejectedResult).reason}`,
        );
      }
    }

    this.logger.log({ published, failed, total: events.length }, 'Outbox relay batch complete');

    if (failed > 0) {
      this.consecutiveFailures++;
      const backoffMs = Math.min(1_000 * Math.pow(2, this.consecutiveFailures), MAX_BACKOFF_MS);
      this.nextRetryAt = Date.now() + backoffMs;
      this.logger.warn(
        { consecutiveFailures: this.consecutiveFailures, backoffMs },
        `Redis Streams publish failures detected — backing off for ${backoffMs}ms`,
      );
    } else {
      this.consecutiveFailures = 0;
      this.nextRetryAt = 0;
    }
  }

  private async publishOne(event: OutboxEvent): Promise<void> {
    const payload = event.payload as Record<string, unknown>;
    const topic = this.resolveTopic(payload.topic);

    await this.producer.produce(topic, payload, event.aggregateId);

    await this.prisma.outboxEvent.update({
      where: { id: event.id },
      data: { publishedAt: new Date() },
    });

    this.logger.debug(
      { eventId: event.id, eventType: event.eventType, topic },
      'Outbox event published',
    );
  }

  // Falls back to SHIPMENT_EVENTS if the stored topic is missing or unrecognized
  private resolveTopic(raw: unknown): StreamTopic {
    const valid = Object.values(STREAM_TOPICS) as string[];
    if (typeof raw === 'string' && valid.includes(raw)) {
      return raw as StreamTopic;
    }
    this.logger.warn({ raw }, 'Unrecognized topic in outbox payload — falling back to SHIPMENT_EVENTS');
    return STREAM_TOPICS.SHIPMENT_EVENTS;
  }
}
