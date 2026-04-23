"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateSellerDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_seller_dto_1 = require("./create-seller.dto");
class UpdateSellerDto extends (0, mapped_types_1.PartialType)(create_seller_dto_1.CreateSellerDto) {
}
exports.UpdateSellerDto = UpdateSellerDto;
//# sourceMappingURL=update-seller.dto.js.map