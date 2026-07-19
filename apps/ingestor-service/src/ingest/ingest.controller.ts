import {
  Controller,
  Logger,
} from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { IngestService } from './ingest.service';
import { CreateClimateEventDto, RawSensorPayloadDto } from 'event-types';

/**
 * Ingestion endpoints for IoT telemetry data via MQTT microservice.
 *
 * Flow: MQTT EventPattern → validate DTO → enrich (event_id, ingested_at) → publish to Redis Streams
 */
@Controller()
export class IngestController {
  private readonly logger = new Logger(IngestController.name);

  constructor(private readonly ingestService: IngestService) { }

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
  async handleMqttShipmentEvent(@Payload() dto: RawSensorPayloadDto) {
    this.logger.log(`📥 Recibido evento de envío vía MQTT para sensor ${dto.sensor_id}`);
    try {
      await this.ingestService.publishShipmentEvent(dto);
    } catch (err) {
      this.logger.error('Error procesando evento de envío de MQTT', err);
    }
  }

  @EventPattern('amazonia/iot/batch/shipment')
  async handleMqttShipmentBatchEvent(@Payload() dtos: RawSensorPayloadDto[]) {
    this.logger.log(`📥 Recibido lote de ${dtos.length} eventos de envío vía MQTT`);
    try {
      await this.ingestService.publishShipmentEventBatch(dtos);
    } catch (err) {
      this.logger.error('Error procesando lote de eventos de envío de MQTT', err);
    }
  }
}