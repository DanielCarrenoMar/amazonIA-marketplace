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
exports.ClimateEventSchema = exports.ClimateEventDocument = void 0;
const mongoose_1 = require("@nestjs/mongoose");
let ClimateEventDocument = class ClimateEventDocument {
};
exports.ClimateEventDocument = ClimateEventDocument;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], ClimateEventDocument.prototype, "event_id", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], ClimateEventDocument.prototype, "event_type", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: Date }),
    __metadata("design:type", Date)
], ClimateEventDocument.prototype, "recorded_at", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: Date }),
    __metadata("design:type", Date)
], ClimateEventDocument.prototype, "ingested_at", void 0);
__decorate([
    (0, mongoose_1.Prop)((0, mongoose_1.raw)({
        sensor_id: { type: String, required: true },
        facility_id: { type: String, required: true },
        sensor_type: { type: String, required: true },
    })),
    __metadata("design:type", Object)
], ClimateEventDocument.prototype, "metadata", void 0);
__decorate([
    (0, mongoose_1.Prop)((0, mongoose_1.raw)({
        type: { type: String, default: 'Point' },
        coordinates: { type: [Number], required: true },
    })),
    __metadata("design:type", Object)
], ClimateEventDocument.prototype, "location", void 0);
__decorate([
    (0, mongoose_1.Prop)((0, mongoose_1.raw)({
        temperature_celsius: { type: Number, required: true },
        humidity_percent: { type: Number, required: true },
    })),
    __metadata("design:type", Object)
], ClimateEventDocument.prototype, "telemetry", void 0);
exports.ClimateEventDocument = ClimateEventDocument = __decorate([
    (0, mongoose_1.Schema)({
        collection: 'climate_events',
        timestamps: false,
        autoIndex: false,
    })
], ClimateEventDocument);
exports.ClimateEventSchema = mongoose_1.SchemaFactory.createForClass(ClimateEventDocument);
exports.ClimateEventSchema.index({ location: '2dsphere' });
exports.ClimateEventSchema.index({ 'metadata.sensor_id': 1, recorded_at: -1 });
//# sourceMappingURL=climate-event.schema.js.map