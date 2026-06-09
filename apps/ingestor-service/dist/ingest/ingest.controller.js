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
var IngestController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.IngestController = void 0;
const common_1 = require("@nestjs/common");
const microservices_1 = require("@nestjs/microservices");
const ingest_service_1 = require("./ingest.service");
const event_types_1 = require("event-types");
let IngestController = IngestController_1 = class IngestController {
    ingestService;
    logger = new common_1.Logger(IngestController_1.name);
    constructor(ingestService) {
        this.ingestService = ingestService;
    }
    async handleMqttClimateEvent(dto) {
        this.logger.log(`📥 Recibido evento climático vía MQTT desde sensor ${dto.metadata.sensor_id}`);
        try {
            await this.ingestService.publishClimateEvent(dto);
        }
        catch (err) {
            this.logger.error('Error procesando evento climático de MQTT', err);
        }
    }
    async handleMqttShipmentEvent(dto) {
        this.logger.log(`📥 Recibido evento de envío vía MQTT para tracking ${dto.metadata.tracking_number}`);
        try {
            await this.ingestService.publishShipmentEvent(dto);
        }
        catch (err) {
            this.logger.error('Error procesando evento de envío de MQTT', err);
        }
    }
    async handleMqttShipmentBatchEvent(dtos) {
        this.logger.log(`📥 Recibido lote de ${dtos.length} eventos de envío vía MQTT`);
        try {
            await this.ingestService.publishShipmentEventBatch(dtos);
        }
        catch (err) {
            this.logger.error('Error procesando lote de eventos de envío de MQTT', err);
        }
    }
};
exports.IngestController = IngestController;
__decorate([
    (0, microservices_1.EventPattern)('amazonia/iot/climate'),
    __param(0, (0, microservices_1.Payload)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [event_types_1.CreateClimateEventDto]),
    __metadata("design:returntype", Promise)
], IngestController.prototype, "handleMqttClimateEvent", null);
__decorate([
    (0, microservices_1.EventPattern)('amazonia/iot/shipment'),
    __param(0, (0, microservices_1.Payload)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [event_types_1.CreateShipmentEventDto]),
    __metadata("design:returntype", Promise)
], IngestController.prototype, "handleMqttShipmentEvent", null);
__decorate([
    (0, microservices_1.EventPattern)('amazonia/iot/batch/shipment'),
    __param(0, (0, microservices_1.Payload)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array]),
    __metadata("design:returntype", Promise)
], IngestController.prototype, "handleMqttShipmentBatchEvent", null);
exports.IngestController = IngestController = IngestController_1 = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [ingest_service_1.IngestService])
], IngestController);
//# sourceMappingURL=ingest.controller.js.map