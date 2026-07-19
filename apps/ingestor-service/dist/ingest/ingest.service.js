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
const event_types_1 = require("event-types");
const db_service_1 = require("./db.service");
let IngestService = IngestService_1 = class IngestService {
    producer;
    db;
    logger = new common_1.Logger(IngestService_1.name);
    sensorCache = new Map();
    constructor(producer, db) {
        this.producer = producer;
        this.db = db;
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
        const event = await this.enrichShipmentEvent(dto);
        if (!event)
            return null;
        await this.producer.produce(messaging_1.STREAM_TOPICS.SHIPMENT_EVENTS, event, event.metadata.tracking_number);
        this.logger.debug(`Published shipment event ${event.event_id} for tracking ${event.metadata.tracking_number}`);
        return event;
    }
    async publishShipmentEventBatch(dtos) {
        const eventsPromise = dtos.map((dto) => this.enrichShipmentEvent(dto));
        const maybeEvents = await Promise.all(eventsPromise);
        const events = maybeEvents.filter(e => e !== null);
        if (events.length > 0) {
            await this.producer.produceBatch(messaging_1.STREAM_TOPICS.SHIPMENT_EVENTS, events, (evt) => evt.metadata.tracking_number ?? 'UNKNOWN');
        }
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
    async resolveShipmentContext(sensorId) {
        const cached = this.sensorCache.get(sensorId);
        if (cached && cached.expires_at > Date.now())
            return cached;
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
            expires_at: Date.now() + 60_000,
        };
        this.sensorCache.set(sensorId, ctx);
        return ctx;
    }
    async enrichShipmentEvent(dto) {
        const ctx = await this.resolveShipmentContext(dto.sensor_id);
        if (!ctx) {
            this.logger.warn(`Descartando evento: No se encontró orden activa para sensor ${dto.sensor_id}`);
            return null;
        }
        const { lat, lng, ...rest } = dto;
        const location = lat != null && lng != null
            ? { type: 'Point', coordinates: [lng, lat] }
            : undefined;
        return {
            event_id: `pkg_evt_${(0, uuid_1.v4)().replace(/-/g, '').slice(0, 7)}`,
            event_type: event_types_1.IoTEventType.SHIPMENT_TELEMETRY,
            recorded_at: dto.recorded_at,
            ingested_at: new Date().toISOString(),
            metadata: {
                sensor_id: dto.sensor_id,
                tracking_number: ctx.tracking_number,
                sensor_profile: ctx.sensor_profile,
            },
            telemetry: dto.telemetry,
            ...(location ? { location } : {}),
        };
    }
};
exports.IngestService = IngestService;
exports.IngestService = IngestService = IngestService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_2.Inject)(messaging_1.MESSAGE_PRODUCER)),
    __metadata("design:paramtypes", [Object, db_service_1.DbService])
], IngestService);
//# sourceMappingURL=ingest.service.js.map