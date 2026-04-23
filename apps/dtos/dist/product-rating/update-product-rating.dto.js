"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateProductRatingDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_product_rating_dto_1 = require("./create-product-rating.dto");
class UpdateProductRatingDto extends (0, mapped_types_1.PartialType)(create_product_rating_dto_1.CreateProductRatingDto) {
}
exports.UpdateProductRatingDto = UpdateProductRatingDto;
//# sourceMappingURL=update-product-rating.dto.js.map