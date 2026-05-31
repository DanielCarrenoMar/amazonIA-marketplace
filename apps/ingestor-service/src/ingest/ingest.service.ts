import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { IMessageProducer, MESSAGE_PRODUCER, STREAM_TOPICS } from 'messaging';
import { Inject } from '@nestjs/common';
import {
  CreateClimateEventDto,
  CreateShipmentEventDto,
  IClimateEvent,
  IShipmentEvent,
} from 'event-types';

/**
 * Service responsible for enriching IoT event payloads and publishing
 * them to the appropriate Redis Stream.
 *
 * Enrichment steps:
 *  1. Generate event_id if not provided by the device
 *  2. Set ingested_at to the current server timestamp
 *
 * The delta between recorded_at and ingested_at is critical for
 * ML models analyzing network connectivity patterns.
 */
@Injectable()
export class IngestService {
  private readonly logger = new Logger(IngestService.name);
  constructor(
    @Inject(MESSAGE_PRODUCER) private readonly producer: IMessageProducer,
  ) {}

  // -------------------------------------------------------------------------
  // Climate Events
  // -------------------------------------------------------------------------

  async publishClimateEvent(
    dto: CreateClimateEventDto,
  ): Promise<IClimateEvent> {
    const event = this.enrichClimateEvent(dto);

    await this.producer.produce(
      STREAM_TOPICS.CLIMATE_EVENTS,
      event as unknown as Record<string, unknown>,
      event.metadata.sensor_id, // Stream key for routing by sensor
    );

    this.logger.debug(
      `Published climate event ${event.event_id} from sensor ${event.metadata.sensor_id}`,
    );

    return event;
  }

  async publishClimateEventBatch(
    dtos: CreateClimateEventDto[],
  ): Promise<IClimateEvent[]> {
    const events = dtos.map((dto) => this.enrichClimateEvent(dto));

    await this.producer.produceBatch(
      STREAM_TOPICS.CLIMATE_EVENTS,
      events as unknown as Record<string, unknown>[],
      (evt: any) => (evt as unknown as IClimateEvent).metadata.sensor_id,
    );

    return events;
  }

  // -------------------------------------------------------------------------
  // Shipment Events
  // -------------------------------------------------------------------------

  async publishShipmentEvent(
    dto: CreateShipmentEventDto,
  ): Promise<IShipmentEvent> {
    const event = this.enrichShipmentEvent(dto);

    await this.producer.produce(
      STREAM_TOPICS.SHIPMENT_EVENTS,
      event as unknown as Record<string, unknown>,
      event.metadata.tracking_number, // Stream key for routing by shipment
    );

    this.logger.debug(
      `Published shipment event ${event.event_id} for tracking ${event.metadata.tracking_number}`,
    );

    return event;
  }

  async publishShipmentEventBatch(
    dtos: CreateShipmentEventDto[],
  ): Promise<IShipmentEvent[]> {
    const events = dtos.map((dto) => this.enrichShipmentEvent(dto));

    await this.producer.produceBatch(
      STREAM_TOPICS.SHIPMENT_EVENTS,
      events as unknown as Record<string, unknown>[],
      (evt: any) => (evt as unknown as IShipmentEvent).metadata.tracking_number,
    );

    return events;
  }

  // -------------------------------------------------------------------------
  // Enrichment helpers
  // -------------------------------------------------------------------------

  private enrichClimateEvent(dto: CreateClimateEventDto): IClimateEvent {
    return {
      ...dto,
      event_id: dto.event_id ?? `env_${uuidv4().replace(/-/g, '').slice(0, 8)}`,
      ingested_at: new Date().toISOString(),
    } as IClimateEvent;
  }

  private enrichShipmentEvent(dto: CreateShipmentEventDto): IShipmentEvent {
    return {
      ...dto,
      event_id:
        dto.event_id ?? `pkg_evt_${uuidv4().replace(/-/g, '').slice(0, 7)}`,
      ingested_at: new Date().toISOString(),
    } as IShipmentEvent;
  }
}
