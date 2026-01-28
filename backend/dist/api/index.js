"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = __importDefault(require("./auth"));
const users_1 = __importDefault(require("./users"));
const products_1 = __importDefault(require("./products"));
const vouchers_1 = __importDefault(require("./vouchers"));
const orders_1 = __importDefault(require("./orders"));
const logs_1 = __importDefault(require("./logs"));
const profile_1 = __importDefault(require("./profile")); // Add this line
const router = (0, express_1.Router)();
// Mount semua API routes
router.use('/auth', auth_1.default);
router.use('/users', users_1.default);
router.use('/products', products_1.default);
router.use('/vouchers', vouchers_1.default);
router.use('/orders', orders_1.default);
router.use('/logs', logs_1.default);
router.use('/profile', profile_1.default); // Add this line
exports.default = router;
