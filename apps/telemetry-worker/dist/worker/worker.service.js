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
const redis_1 = require("@upstash/redis");
const messaging_1 = require("messaging");
const database_1 = require("database");
const CONSUMER_GROUP = 'telemetry-worker-group';
const INSTANCE_ID = `worker-${process.pid}`;
const RETRY_HASH_KEY_PREFIX = 'telemetry-worker:retries';
let WorkerService = WorkerService_1 = class WorkerService {
    config;
    climateModel;
    shipmentModel;
    consumer;
    producer;
    redis;
    logger = new common_1.Logger(WorkerService_1.name);
    pollIntervalMs;
    maxRetries;
    constructor(config, climateModel, shipmentModel, consumer, producer, redis) {
        this.config = config;
        this.climateModel = climateModel;
        this.shipmentModel = shipmentModel;
        this.consumer = consumer;
        this.producer = producer;
        this.redis = redis;
        this.pollIntervalMs = Number(this.config.get('POLL_INTERVAL_MS', '5000'));
        this.maxRetries = Number(this.config.get('MAX_MESSAGE_RETRIES', '3'));
    }
    onModuleInit() {
        this.logger.log(`Worker initialized. Polling every ${this.pollIntervalMs}ms with max ${this.maxRetries} retries`);
    }
    async pollStreams() {
        await Promise.all([
            this.consumeClimateEvents(),
            this.consumeShipmentEvents(),
        ]);
    }
    async consumeClimateEvents() {
        return this.processTopic(messaging_1.STREAM_TOPICS.CLIMATE_EVENTS, messaging_1.STREAM_TOPICS.CLIMATE_EVENTS_DLQ, this.climateModel, (msg) => this.mapClimateDocument(msg));
    }
    async consumeShipmentEvents() {
        return this.processTopic(messaging_1.STREAM_TOPICS.SHIPMENT_EVENTS, messaging_1.STREAM_TOPICS.SHIPMENT_EVENTS_DLQ, this.shipmentModel, (msg) => this.mapShipmentDocument(msg));
    }
    async processTopic(topic, dlqTopic, model, mapper) {
        try {
            const messages = await this.consumer.consume(CONSUMER_GROUP, INSTANCE_ID, topic);
            if (messages.length === 0)
                return;
            const metrics = {
                persisted: 0,
                failed: 0,
                sentToDlq: 0,
            };
            for (const msg of messages) {
                try {
                    this.validatePayload(msg.value);
                    const document = mapper(msg);
                    await model.create(document);
                    await this.ackMessage(topic, msg.offset);
                    await this.clearRetryCount(topic, msg.offset);
                    metrics.persisted++;
                }
                catch (error) {
                    metrics.failed++;
                    const reason = error instanceof Error ? error.message : String(error);
                    const retryCount = await this.incrementRetryCount(topic, msg.offset);
                    if (retryCount >= this.maxRetries) {
                        await this.producer.produce(dlqTopic, {
                            originalMessage: msg.value,
                            reason,
                            retryCount,
                            topic,
                            offset: msg.offset,
                            timestamp: Date.now(),
                        });
                        await this.ackMessage(topic, msg.offset);
                        await this.clearRetryCount(topic, msg.offset);
                        metrics.sentToDlq++;
                        this.logger.warn(`Message ${msg.offset} moved to DLQ ${dlqTopic} after ${retryCount} retries`);
                    }
                    else {
                        this.logger.warn(`Failed to process message ${msg.offset} on ${topic} (attempt ${retryCount}/${this.maxRetries}): ${reason}`);
                    }
                }
            }
            this.logger.log(`Topic ${topic} cycle: ${metrics.persisted} persisted, ${metrics.failed} failed, ${metrics.sentToDlq} sent to DLQ`);
        }
        catch (error) {
            this.logger.error(`Failed to process topic ${topic}`, error instanceof Error ? error.stack : String(error));
        }
    }
    mapClimateDocument(msg) {
        return this.stripNulls({
            event_id: msg.value.event_id,
            event_type: msg.value.event_type,
            recorded_at: new Date(msg.value.recorded_at),
            ingested_at: new Date(msg.value.ingested_at),
            metadata: msg.value.metadata,
            location: msg.value.location,
            telemetry: msg.value.telemetry,
        });
    }
    mapShipmentDocument(msg) {
        return this.stripNulls({
            event_id: msg.value.event_id,
            event_type: msg.value.event_type,
            recorded_at: new Date(msg.value.recorded_at),
            ingested_at: new Date(msg.value.ingested_at),
            metadata: msg.value.metadata,
            location: msg.value.location,
            business_context: msg.value.business_context,
            telemetry: msg.value.telemetry,
        });
    }
    validatePayload(value) {
        if (!value || typeof value !== 'object' || Array.isArray(value)) {
            throw new Error('Payload is empty or not an object');
        }
        const payload = value;
        const requiredFields = [
            'event_id',
            'event_type',
            'recorded_at',
            'ingested_at',
            'metadata',
        ];
        for (const field of requiredFields) {
            if (payload[field] == null) {
                throw new Error(`Missing required field: ${field}`);
            }
        }
    }
    retryHashKey(topic) {
        return `${RETRY_HASH_KEY_PREFIX}:${topic}`;
    }
    async incrementRetryCount(topic, offset) {
        return this.redis.hincrby(this.retryHashKey(topic), offset, 1);
    }
    async clearRetryCount(topic, offset) {
        await this.redis.hdel(this.retryHashKey(topic), offset);
    }
    async ackMessage(topic, offset) {
        await this.consumer.ack(CONSUMER_GROUP, topic, [offset]);
    }
    stripNulls(obj) {
        return Object.fromEntries(Object.entries(obj)
            .filter(([, v]) => v != null)
            .map(([k, v]) => [
            k,
            v && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Date)
                ? this.stripNulls(v)
                : v,
        ]));
    }
    calculateAvgLatency(documents) {
        if (documents.length === 0)
            return 0;
        const totalLatency = documents.reduce((sum, doc) => {
            return sum + (doc.ingested_at.getTime() - doc.recorded_at.getTime());
        }, 0);
        return Math.round(totalLatency / documents.length);
    }
};
exports.WorkerService = WorkerService;
__decorate([
    (0, schedule_1.Interval)(30000),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WorkerService.prototype, "pollStreams", null);
exports.WorkerService = WorkerService = WorkerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, mongoose_1.InjectModel)(database_1.ClimateEventDocument.name)),
    __param(2, (0, mongoose_1.InjectModel)(database_1.ShipmentEventDocument.name)),
    __param(3, (0, common_1.Inject)(messaging_1.MESSAGE_CONSUMER)),
    __param(4, (0, common_1.Inject)(messaging_1.MESSAGE_PRODUCER)),
    __param(5, (0, common_1.Inject)(messaging_1.REDIS_CLIENT)),
    __metadata("design:paramtypes", [config_1.ConfigService,
        mongoose_2.Model,
        mongoose_2.Model, Object, Object, redis_1.Redis])
], WorkerService);
//# sourceMappingURL=worker.service.js.map