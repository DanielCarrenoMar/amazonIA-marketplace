"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateUserAccountDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_user_account_dto_1 = require("./create-user-account.dto");
class UpdateUserAccountDto extends (0, mapped_types_1.PartialType)(create_user_account_dto_1.CreateUserAccountDto) {
}
exports.UpdateUserAccountDto = UpdateUserAccountDto;
//# sourceMappingURL=update-user-account.dto.js.map