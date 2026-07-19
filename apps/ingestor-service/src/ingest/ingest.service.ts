import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { IMessageProducer, MESSAGE_PRODUCER, STREAM_TOPICS } from 'messaging';
import { Inject } from '@nestjs/common';
import {
  CreateClimateEventDto,
  RawSensorPayloadDto,
  IClimateEvent,
  IShipmentEvent,
  IoTEventType,
} from 'event-types';
import { DbService } from './db.service';

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
  
  // Cache para contexto de sensores (evitar N queries a Postgres por segundo)
  private sensorCache = new Map<string, { tracking_number: string; sensor_profile: any; expires_at: number }>();

  constructor(
    @Inject(MESSAGE_PRODUCER) private readonly producer: IMessageProducer,
    private readonly db: DbService,
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
    dto: RawSensorPayloadDto,
  ): Promise<IShipmentEvent | null> {
    const event = await this.enrichShipmentEvent(dto);
    if (!event) return null; // Ignorado por ser huérfano

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
    dtos: RawSensorPayloadDto[],
  ): Promise<IShipmentEvent[]> {
    const eventsPromise = dtos.map((dto) => this.enrichShipmentEvent(dto));
    const maybeEvents = await Promise.all(eventsPromise);
    const events = maybeEvents.filter(e => e !== null) as IShipmentEvent[];

    if (events.length > 0) {
      await this.producer.produceBatch(
        STREAM_TOPICS.SHIPMENT_EVENTS,
        events as unknown as Record<string, unknown>[],
        (evt: any) => (evt as unknown as IShipmentEvent).metadata.tracking_number ?? 'UNKNOWN',
      );
    }

    return events;
  }

  // -------------------------------------------------------------------------
  // Enrichment helpers
  // -------------------------------------------------------------------------

  private enrichClimateEvent(dto: CreateClimateEventDto): IClimateEvent {
    const rawDto = dto as any;
    
    // Soporta tanto formato estructurado (CreateClimateEventDto) como plano (Simulator)
    const metadata = rawDto.metadata || {
      sensor_id: rawDto.sensor_id,
      sensor_type: rawDto.sensor_type,
      facility_id: rawDto.facility_id,
    };

    const telemetry = rawDto.telemetry || rawDto.metrics || {};

    const location = rawDto.location || (rawDto.latitude != null && rawDto.longitude != null
      ? { type: 'Point' as const, coordinates: [rawDto.longitude, rawDto.latitude] as [number, number] }
      : undefined);

    return {
      event_id: rawDto.event_id ?? `env_${uuidv4().replace(/-/g, '').slice(0, 8)}`,
      event_type: rawDto.event_type || 'environment_reading',
      recorded_at: rawDto.recorded_at,
      ingested_at: new Date().toISOString(),
      metadata,
      telemetry,
      ...(location ? { location } : {}),
    } as IClimateEvent;
  }

  private async resolveShipmentContext(sensorId: string) {
    const cached = this.sensorCache.get(sensorId);
    if (cached && cached.expires_at > Date.now()) return cached;

    const orderCtx = await this.db.getShipmentContextBySensorId(sensorId);

    if (!orderCtx || !orderCtx.trackingNumber) {
      if (process.env.ALLOW_ORPHAN_EVENTS === 'true') {
        return {
          tracking_number: `ORPHAN-${sensorId}`,
          sensor_profile: 'FULL_TELEMETRY',
          expires_at: Date.now() + 60_000,
        };
      }
      return null;
    }

    const ctx = {
      tracking_number: orderCtx.trackingNumber,
      sensor_profile: orderCtx.sensorProfile,
      expires_at: Date.now() + 60_000, // TTL: 60s
    };

    this.sensorCache.set(sensorId, ctx);
    return ctx;
  }

  private async enrichShipmentEvent(dto: RawSensorPayloadDto): Promise<IShipmentEvent | null> {
    const ctx = await this.resolveShipmentContext(dto.sensor_id);
    if (!ctx) {
      this.logger.warn(`Descartando evento: No se encontró orden activa para sensor ${dto.sensor_id}`);
      return null;
    }

    const { lat, lng, ...rest } = dto as any;
    const location = lat != null && lng != null
      ? { type: 'Point' as const, coordinates: [lng, lat] as [number, number] }
      : undefined;

    return {
      event_id: `pkg_evt_${uuidv4().replace(/-/g, '').slice(0, 7)}`,
      event_type: IoTEventType.SHIPMENT_TELEMETRY,
      recorded_at: dto.recorded_at,
      ingested_at: new Date().toISOString(),
      metadata: {
        sensor_id: dto.sensor_id,
        tracking_number: ctx.tracking_number,
        sensor_profile: ctx.sensor_profile as any,
      },
      telemetry: dto.telemetry,
      ...(location ? { location } : {}),
    } as IShipmentEvent;
  }
}
