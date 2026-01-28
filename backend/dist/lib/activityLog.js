"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createActivityLog = void 0;
const prisma_1 = __importDefault(require("./prisma"));
const createActivityLog = async (userId, action, details, ipAddress) => {
    try {
        await prisma_1.default.activityLog.create({
            data: {
                userId,
                action,
                details,
                ipAddress
            }
        });
    }
    catch (error) {
        console.error('Error creating activity log:', error);
    }
};
exports.createActivityLog = createActivityLog;
