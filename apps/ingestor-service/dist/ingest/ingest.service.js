"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var IngestService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.IngestService = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
const messaging_1 = require("messaging");
const common_2 = require("@nestjs/common");
let IngestService = IngestService_1 = class IngestService {
    producer;
    logger = new common_1.Logger(IngestService_1.name);
    constructor(producer) {
        this.producer = producer;
    }
    async publishClimateEvent(dto) {
        const event = this.enrichClimateEvent(dto);
        await this.producer.produce(messaging_1.STREAM_TOPICS.CLIMATE_EVENTS, event, event.metadata.sensor_id);
        this.logger.debug(`Published climate event ${event.event_id} from sensor ${event.metadata.sensor_id}`);
        return event;
    }
    async publishClimateEventBatch(dtos) {
        const events = dtos.map((dto) => this.enrichClimateEvent(dto));
        await this.producer.produceBatch(messaging_1.STREAM_TOPICS.CLIMATE_EVENTS, events, (evt) => evt.metadata.sensor_id);
        return events;
    }
    async publishShipmentEvent(dto) {
        const event = this.enrichShipmentEvent(dto);
        await this.producer.produce(messaging_1.STREAM_TOPICS.SHIPMENT_EVENTS, event, event.metadata.tracking_number);
        this.logger.debug(`Published shipment event ${event.event_id} for tracking ${event.metadata.tracking_number}`);
        return event;
    }
    async publishShipmentEventBatch(dtos) {
        const events = dtos.map((dto) => this.enrichShipmentEvent(dto));
        await this.producer.produceBatch(messaging_1.STREAM_TOPICS.SHIPMENT_EVENTS, events, (evt) => evt.metadata.tracking_number);
        return events;
    }
    enrichClimateEvent(dto) {
        const rawDto = dto;
        const metadata = rawDto.metadata || {
            sensor_id: rawDto.sensor_id,
            sensor_type: rawDto.sensor_type,
            facility_id: rawDto.facility_id,
        };
        const telemetry = rawDto.telemetry || rawDto.metrics || {};
        const location = rawDto.location || (rawDto.latitude != null && rawDto.longitude != null
            ? { type: 'Point', coordinates: [rawDto.longitude, rawDto.latitude] }
            : undefined);
        return {
            event_id: rawDto.event_id ?? `env_${(0, uuid_1.v4)().replace(/-/g, '').slice(0, 8)}`,
            event_type: rawDto.event_type || 'environment_reading',
            recorded_at: rawDto.recorded_at,
            ingested_at: new Date().toISOString(),
            metadata,
            telemetry,
            ...(location ? { location } : {}),
        };
    }
    enrichShipmentEvent(dto) {
        const { latitude, longitude, ...rest } = dto;
        const location = latitude != null && longitude != null
            ? { type: 'Point', coordinates: [longitude, latitude] }
            : undefined;
        return {
            ...rest,
            event_id: dto.event_id ?? `pkg_evt_${(0, uuid_1.v4)().replace(/-/g, '').slice(0, 7)}`,
            ingested_at: new Date().toISOString(),
            ...(location ? { location } : {}),
        };
    }
};
exports.IngestService = IngestService;
exports.IngestService = IngestService = IngestService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_2.Inject)(messaging_1.MESSAGE_PRODUCER)),
    __metadata("design:paramtypes", [Object])
], IngestService);
//# sourceMappingURL=ingest.service.js.map