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
var IngestService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.IngestService = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
const kafka_client_1 = require("kafka-client");
let IngestService = IngestService_1 = class IngestService {
    logger = new common_1.Logger(IngestService_1.name);
    producer;
    constructor() {
        this.producer = new kafka_client_1.KafkaProducerService();
    }
    async publishClimateEvent(dto) {
        const event = this.enrichClimateEvent(dto);
        await this.producer.produce(kafka_client_1.KAFKA_TOPICS.CLIMATE_EVENTS, event, event.metadata.sensor_id);
        this.logger.debug(`Published climate event ${event.event_id} from sensor ${event.metadata.sensor_id}`);
        return event;
    }
    async publishClimateEventBatch(dtos) {
        const events = dtos.map((dto) => this.enrichClimateEvent(dto));
        await this.producer.produceBatch(kafka_client_1.KAFKA_TOPICS.CLIMATE_EVENTS, events, (evt) => evt.metadata.sensor_id);
        return events;
    }
    async publishShipmentEvent(dto) {
        const event = this.enrichShipmentEvent(dto);
        await this.producer.produce(kafka_client_1.KAFKA_TOPICS.SHIPMENT_EVENTS, event, event.metadata.tracking_number);
        this.logger.debug(`Published shipment event ${event.event_id} for tracking ${event.metadata.tracking_number}`);
        return event;
    }
    async publishShipmentEventBatch(dtos) {
        const events = dtos.map((dto) => this.enrichShipmentEvent(dto));
        await this.producer.produceBatch(kafka_client_1.KAFKA_TOPICS.SHIPMENT_EVENTS, events, (evt) => evt.metadata.tracking_number);
        return events;
    }
    enrichClimateEvent(dto) {
        return {
            ...dto,
            event_id: dto.event_id ?? `env_${(0, uuid_1.v4)().replace(/-/g, '').slice(0, 8)}`,
            ingested_at: new Date().toISOString(),
        };
    }
    enrichShipmentEvent(dto) {
        return {
            ...dto,
            event_id: dto.event_id ?? `pkg_evt_${(0, uuid_1.v4)().replace(/-/g, '').slice(0, 7)}`,
            ingested_at: new Date().toISOString(),
        };
    }
};
exports.IngestService = IngestService;
exports.IngestService = IngestService = IngestService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], IngestService);
//# sourceMappingURL=ingest.service.js.map