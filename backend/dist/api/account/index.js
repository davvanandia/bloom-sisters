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
// GET /api/account/status - Get account status
router.get('/status', async (req, res) => {
    try {
        const user = await prisma_1.default.user.findUnique({
            where: { id: req.user.userId },
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
                createdAt: true,
                updatedAt: true
            }
        });
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        // Get user stats
        const orderCount = await prisma_1.default.order.count({
            where: { userId: req.user.userId }
        });
        const totalSpent = await prisma_1.default.order.aggregate({
            where: {
                userId: req.user.userId,
                status: { not: 'CANCELLED' }
            },
            _sum: { total: true }
        });
        res.json({
            success: true,
            data: {
                user,
                stats: {
                    orderCount,
                    totalSpent: totalSpent._sum.total || 0
                },
                accountStatus: 'ACTIVE', // You can add more logic here
                lastLogin: new Date().toISOString()
            }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
exports.default = router;
