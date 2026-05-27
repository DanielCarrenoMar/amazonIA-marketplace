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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShipmentEventSchema = exports.ShipmentEventDocument = void 0;
const mongoose_1 = require("@nestjs/mongoose");
let ShipmentEventDocument = class ShipmentEventDocument {
};
exports.ShipmentEventDocument = ShipmentEventDocument;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], ShipmentEventDocument.prototype, "event_id", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], ShipmentEventDocument.prototype, "event_type", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: Date }),
    __metadata("design:type", Date)
], ShipmentEventDocument.prototype, "recorded_at", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: Date }),
    __metadata("design:type", Date)
], ShipmentEventDocument.prototype, "ingested_at", void 0);
__decorate([
    (0, mongoose_1.Prop)((0, mongoose_1.raw)({
        tracking_number: { type: String, required: true },
        container_id: { type: String, required: true },
    })),
    __metadata("design:type", Object)
], ShipmentEventDocument.prototype, "metadata", void 0);
__decorate([
    (0, mongoose_1.Prop)((0, mongoose_1.raw)({
        type: { type: String, default: 'Point' },
        coordinates: { type: [Number], required: true },
    })),
    __metadata("design:type", Object)
], ShipmentEventDocument.prototype, "location", void 0);
__decorate([
    (0, mongoose_1.Prop)((0, mongoose_1.raw)({
        status: { type: String, required: true },
        scan_type: { type: String, required: true },
    })),
    __metadata("design:type", Object)
], ShipmentEventDocument.prototype, "business_context", void 0);
__decorate([
    (0, mongoose_1.Prop)((0, mongoose_1.raw)({
        temperature_celsius: { type: Number, required: true },
        shock_g_force: { type: Number, required: true },
    })),
    __metadata("design:type", Object)
], ShipmentEventDocument.prototype, "telemetry", void 0);
exports.ShipmentEventDocument = ShipmentEventDocument = __decorate([
    (0, mongoose_1.Schema)({
        collection: 'shipment_events',
        timestamps: false,
        autoIndex: false,
    })
], ShipmentEventDocument);
exports.ShipmentEventSchema = mongoose_1.SchemaFactory.createForClass(ShipmentEventDocument);
exports.ShipmentEventSchema.index({ location: '2dsphere' });
exports.ShipmentEventSchema.index({
    'metadata.tracking_number': 1,
    recorded_at: -1,
});
//# sourceMappingURL=shipment-event.schema.js.map