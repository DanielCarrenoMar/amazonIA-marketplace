import {
  Controller,
  Post,
  Body,
  UseGuards,
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { IngestService } from './ingest.service';
import { CreateClimateEventDto, CreateShipmentEventDto } from 'event-types';

/**
 * Ingestion endpoints for IoT telemetry data.
 *
 * All endpoints are protected by the ApiKeyGuard (x-api-key header).
 * Payloads are validated by class-validator via the global ValidationPipe.
 *
 * Flow: HTTP request → validate DTO → enrich (event_id, ingested_at) → publish to Kafka
 */
@Controller('ingest')
@UseGuards(ApiKeyGuard)
export class IngestController {
  private readonly logger = new Logger(IngestController.name);

  constructor(private readonly ingestService: IngestService) {}

  // -------------------------------------------------------------------------
  // Single event ingestion
  // -------------------------------------------------------------------------

  @Post('climate')
  @HttpCode(HttpStatus.ACCEPTED) // 202 — async processing, not immediate persistence
  async ingestClimate(@Body() dto: CreateClimateEventDto) {
    const event = await this.ingestService.publishClimateEvent(dto);
    return { accepted: true, event_id: event.event_id };
  }

  @Post('shipment')
  @HttpCode(HttpStatus.ACCEPTED)
  async ingestShipment(@Body() dto: CreateShipmentEventDto) {
    const event = await this.ingestService.publishShipmentEvent(dto);
    return { accepted: true, event_id: event.event_id };
  }

  // -------------------------------------------------------------------------
  // Batch ingestion (for network-loss recovery bursts)
  // -------------------------------------------------------------------------

  @Post('batch/climate')
  @HttpCode(HttpStatus.ACCEPTED)
  async ingestClimateBatch(@Body() dtos: CreateClimateEventDto[]) {
    const events = await this.ingestService.publishClimateEventBatch(dtos);
    this.logger.log(`Accepted batch of ${events.length} climate events`);
    return { accepted: true, count: events.length };
  }

  @Post('batch/shipment')
  @HttpCode(HttpStatus.ACCEPTED)
  async ingestShipmentBatch(@Body() dtos: CreateShipmentEventDto[]) {
    const events = await this.ingestService.publishShipmentEventBatch(dtos);
    this.logger.log(`Accepted batch of ${events.length} shipment events`);
    return { accepted: true, count: events.length };
  }
}
