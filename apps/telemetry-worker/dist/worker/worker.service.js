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
var WorkerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkerService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const schedule_1 = require("@nestjs/schedule");
const messaging_1 = require("messaging");
const common_2 = require("@nestjs/common");
const database_1 = require("database");
const CONSUMER_GROUP = 'telemetry-worker-group';
const INSTANCE_ID = `worker-${process.pid}`;
let WorkerService = WorkerService_1 = class WorkerService {
    config;
    climateModel;
    shipmentModel;
    consumer;
    logger = new common_1.Logger(WorkerService_1.name);
    pollIntervalMs;
    constructor(config, climateModel, shipmentModel, consumer) {
        this.config = config;
        this.climateModel = climateModel;
        this.shipmentModel = shipmentModel;
        this.consumer = consumer;
        this.pollIntervalMs = Number(this.config.get('POLL_INTERVAL_MS', '5000'));
    }
    onModuleInit() {
        this.logger.log(`Worker initialized. Polling every ${this.pollIntervalMs}ms`);
    }
    async pollStreams() {
        await Promise.all([
            this.consumeClimateEvents(),
            this.consumeShipmentEvents(),
        ]);
    }
    async consumeClimateEvents() {
        try {
            const messages = await this.consumer.consume(CONSUMER_GROUP, INSTANCE_ID, messaging_1.STREAM_TOPICS.CLIMATE_EVENTS);
            if (messages.length === 0)
                return;
            const documents = messages.map((msg) => ({
                event_id: msg.value.event_id,
                event_type: msg.value.event_type,
                recorded_at: new Date(msg.value.recorded_at),
                ingested_at: new Date(msg.value.ingested_at),
                metadata: msg.value.metadata,
                location: msg.value.location,
                telemetry: msg.value.telemetry,
            }));
            await this.climateModel.insertMany(documents, { ordered: false });
            const avgLatencyMs = this.calculateAvgLatency(documents);
            this.logger.log(`Persisted ${documents.length} climate events | avg latency: ${avgLatencyMs}ms`);
        }
        catch (error) {
            this.logger.error('Failed to process climate events', error instanceof Error ? error.stack : String(error));
        }
    }
    async consumeShipmentEvents() {
        try {
            const messages = await this.consumer.consume(CONSUMER_GROUP, INSTANCE_ID, messaging_1.STREAM_TOPICS.SHIPMENT_EVENTS);
            if (messages.length === 0)
                return;
            const documents = messages.map((msg) => ({
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
            this.logger.log(`Persisted ${documents.length} shipment events | avg latency: ${avgLatencyMs}ms`);
        }
        catch (error) {
            this.logger.error('Failed to process shipment events', error instanceof Error ? error.stack : String(error));
        }
    }
    calculateAvgLatency(docs) {
        if (docs.length === 0)
            return 0;
        const totalMs = docs.reduce((sum, d) => sum + (d.ingested_at.getTime() - d.recorded_at.getTime()), 0);
        return Math.round(totalMs / docs.length);
    }
};
exports.WorkerService = WorkerService;
__decorate([
    (0, schedule_1.Interval)(5000),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WorkerService.prototype, "pollStreams", null);
exports.WorkerService = WorkerService = WorkerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, mongoose_1.InjectModel)(database_1.ClimateEventDocument.name)),
    __param(2, (0, mongoose_1.InjectModel)(database_1.ShipmentEventDocument.name)),
    __param(3, (0, common_2.Inject)(messaging_1.MESSAGE_CONSUMER)),
    __metadata("design:paramtypes", [config_1.ConfigService,
        mongoose_2.Model,
        mongoose_2.Model, Object])
], WorkerService);
//# sourceMappingURL=worker.service.js.map