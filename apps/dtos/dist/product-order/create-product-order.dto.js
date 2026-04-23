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
exports.CreateProductOrderDto = void 0;
const class_validator_1 = require("class-validator");
const enums_1 = require("../enums");
class CreateProductOrderDto {
    productId;
    // buyerId is NOT accepted from the client — injected automatically from the JWT token
    quantity;
    totalAmount;
    orderNotes;
    sellerRatingValue;
    buyerRatingValue;
    transactionHash;
    currentStatus;
}
exports.CreateProductOrderDto = CreateProductOrderDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateProductOrderDto.prototype, "productId", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Number)
], CreateProductOrderDto.prototype, "quantity", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Number)
], CreateProductOrderDto.prototype, "totalAmount", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateProductOrderDto.prototype, "orderNotes", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateProductOrderDto.prototype, "sellerRatingValue", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateProductOrderDto.prototype, "buyerRatingValue", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], CreateProductOrderDto.prototype, "transactionHash", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(enums_1.OrderStatus),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateProductOrderDto.prototype, "currentStatus", void 0);
//# sourceMappingURL=create-product-order.dto.js.map