"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const prisma_1 = __importDefault(require("../../lib/prisma"));
const router = (0, express_1.Router)();
// Apply auth middleware untuk semua routes
router.use(auth_1.authMiddleware);
// GET /api/payments - Get all payment status (Admin/Superadmin)
router.get('/', (0, auth_1.roleMiddleware)(['ADMIN', 'SUPERADMIN']), async (req, res) => {
    try {
        const payments = await prisma_1.default.order.findMany({
            select: {
                id: true,
                total: true,
                status: true,
                createdAt: true,
                user: {
                    select: {
                        id: true,
                        username: true,
                        email: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json({
            success: true,
            data: payments,
            count: payments.length
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
// GET /api/payments/user - Get user's payment history
router.get('/user', async (req, res) => {
    try {
        const payments = await prisma_1.default.order.findMany({
            where: { userId: req.user.userId },
            select: {
                id: true,
                total: true,
                status: true,
                createdAt: true
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json({
            success: true,
            data: payments,
            count: payments.length
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
exports.default = router;
