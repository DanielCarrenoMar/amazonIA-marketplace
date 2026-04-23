"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateTribeDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_tribe_dto_1 = require("./create-tribe.dto");
class UpdateTribeDto extends (0, mapped_types_1.PartialType)(create_tribe_dto_1.CreateTribeDto) {
}
exports.UpdateTribeDto = UpdateTribeDto;
//# sourceMappingURL=update-tribe.dto.js.map