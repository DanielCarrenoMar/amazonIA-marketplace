import {
  Controller,
  Post,
  Body,
  UseGuards,
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
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

  constructor(private readonly ingestService: IngestService) { }

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
  @EventPattern('amazonia/iot/climate')
  async handleMqttClimateEvent(@Payload() dto: CreateClimateEventDto) {
    this.logger.log(`📥 Recibido evento climático vía MQTT desde sensor ${dto.metadata.sensor_id}`);
    try {
      await this.ingestService.publishClimateEvent(dto);
    } catch (err) {
      this.logger.error('Error procesando evento climático de MQTT', err);
    }
  }

  @EventPattern('amazonia/iot/shipment')
  async handleMqttShipmentEvent(@Payload() dto: CreateShipmentEventDto) {
    this.logger.log(`📥 Recibido evento de envío vía MQTT para tracking ${dto.metadata.tracking_number}`);
    try {
      await this.ingestService.publishShipmentEvent(dto);
    } catch (err) {
      this.logger.error('Error procesando evento de envío de MQTT', err);
    }
  }

  @EventPattern('amazonia/iot/batch/shipment')
  async handleMqttShipmentBatchEvent(@Payload() dtos: CreateShipmentEventDto[]) {
    this.logger.log(`📥 Recibido lote de ${dtos.length} eventos de envío vía MQTT`);
    try {
      await this.ingestService.publishShipmentEventBatch(dtos);
    } catch (err) {
      this.logger.error('Error procesando lote de eventos de envío de MQTT', err);
    }
  }
}