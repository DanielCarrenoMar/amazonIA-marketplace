"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderStatus = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["BUYER"] = "BUYER";
    UserRole["SELLER"] = "SELLER";
    UserRole["ADMIN"] = "ADMIN";
})(UserRole || (exports.UserRole = UserRole = {}));
var OrderStatus;
(function (OrderStatus) {
    OrderStatus["PENDING"] = "PENDING";
    OrderStatus["PAID"] = "PAID";
    OrderStatus["SHIPPED"] = "SHIPPED";
    OrderStatus["DELIVERED"] = "DELIVERED";
    OrderStatus["CANCELED"] = "CANCELED";
    OrderStatus["REFUNDED"] = "REFUNDED";
})(OrderStatus || (exports.OrderStatus = OrderStatus = {}));
//# sourceMappingURL=enums.js.map