"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../../lib/prisma"));
const auth_1 = require("../../middleware/auth");
const router = (0, express_1.Router)();
// Apply auth middleware untuk semua routes
router.use(auth_1.authMiddleware);
// GET /api/logs - Get system logs dengan filter
router.get('/', (0, auth_1.roleMiddleware)(['SUPERADMIN', 'ADMIN']), async (req, res) => {
    try {
        const { page = '1', limit = '20', search = '', action = '', userId = '', startDate = '', endDate = '' } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        // Build where clause
        const where = {};
        if (action) {
            where.action = { contains: action, mode: 'insensitive' };
        }
        if (userId) {
            where.userId = userId;
        }
        if (search) {
            where.OR = [
                { action: { contains: search, mode: 'insensitive' } },
                { details: { contains: search, mode: 'insensitive' } },
                { ipAddress: { contains: search, mode: 'insensitive' } },
                {
                    user: {
                        OR: [
                            { username: { contains: search, mode: 'insensitive' } },
                            { email: { contains: search, mode: 'insensitive' } }
                        ]
                    }
                }
            ];
        }
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) {
                const start = new Date(startDate);
                start.setHours(0, 0, 0, 0);
                where.createdAt.gte = start;
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                where.createdAt.lte = end;
            }
        }
        // Get logs with user relation
        const logs = await prisma_1.default.activityLog.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                        role: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            skip,
            take: limitNum
        });
        // Get total count for pagination
        const total = await prisma_1.default.activityLog.count({ where });
        // Format logs for response
        const formattedLogs = logs.map(log => ({
            id: log.id,
            action: log.action,
            details: log.details,
            ipAddress: log.ipAddress,
            timestamp: log.createdAt,
            user: log.user ? {
                id: log.user.id,
                username: log.user.username,
                email: log.user.email,
                role: log.user.role
            } : null
        }));
        res.json({
            success: true,
            data: formattedLogs,
            pagination: {
                currentPage: pageNum,
                totalPages: Math.ceil(total / limitNum),
                totalItems: total,
                itemsPerPage: limitNum
            }
        });
    }
    catch (error) {
        console.error('Get logs error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch logs'
        });
    }
});
// GET /api/logs/stats - Get log statistics
router.get('/stats', (0, auth_1.roleMiddleware)(['SUPERADMIN', 'ADMIN']), async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const last7Days = new Date(today);
        last7Days.setDate(last7Days.getDate() - 7);
        const last30Days = new Date(today);
        last30Days.setDate(last30Days.getDate() - 30);
        // Get counts
        const [totalLogs, todayLogs, yesterdayLogs, last7DaysLogs, last30DaysLogs, topActions, topUsers] = await Promise.all([
            // Total logs
            prisma_1.default.activityLog.count(),
            // Today's logs
            prisma_1.default.activityLog.count({
                where: {
                    createdAt: {
                        gte: today
                    }
                }
            }),
            // Yesterday's logs
            prisma_1.default.activityLog.count({
                where: {
                    createdAt: {
                        gte: yesterday,
                        lt: today
                    }
                }
            }),
            // Last 7 days
            prisma_1.default.activityLog.count({
                where: {
                    createdAt: {
                        gte: last7Days
                    }
                }
            }),
            // Last 30 days
            prisma_1.default.activityLog.count({
                where: {
                    createdAt: {
                        gte: last30Days
                    }
                }
            }),
            // Top actions
            prisma_1.default.activityLog.groupBy({
                by: ['action'],
                _count: {
                    id: true
                },
                orderBy: {
                    _count: {
                        id: 'desc'
                    }
                },
                take: 5
            }),
            // Top users
            prisma_1.default.activityLog.groupBy({
                by: ['userId'],
                _count: {
                    id: true
                },
                orderBy: {
                    _count: {
                        id: 'desc'
                    }
                },
                take: 5
            })
        ]);
        // Get user details for top users
        const topUsersWithDetails = await Promise.all(topUsers.map(async (user) => {
            const userDetails = await prisma_1.default.user.findUnique({
                where: { id: user.userId },
                select: {
                    username: true,
                    email: true,
                    role: true
                }
            });
            return {
                userId: user.userId,
                count: user._count.id,
                ...userDetails
            };
        }));
        res.json({
            success: true,
            data: {
                totalLogs,
                todayLogs,
                yesterdayLogs,
                last7DaysLogs,
                last30DaysLogs,
                topActions: topActions.map(item => ({
                    action: item.action,
                    count: item._count.id
                })),
                topUsers: topUsersWithDetails
            }
        });
    }
    catch (error) {
        console.error('Get logs stats error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch log statistics'
        });
    }
});
// GET /api/logs/actions - Get unique actions list
router.get('/actions', (0, auth_1.roleMiddleware)(['SUPERADMIN', 'ADMIN']), async (req, res) => {
    try {
        const actions = await prisma_1.default.activityLog.groupBy({
            by: ['action'],
            _count: {
                id: true
            },
            orderBy: {
                action: 'asc'
            }
        });
        const formattedActions = actions.map(item => ({
            action: item.action,
            count: item._count.id
        }));
        res.json({
            success: true,
            data: formattedActions
        });
    }
    catch (error) {
        console.error('Get actions list error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch actions list'
        });
    }
});
// GET /api/logs/:id - Get log by ID
router.get('/:id', (0, auth_1.roleMiddleware)(['SUPERADMIN', 'ADMIN']), async (req, res) => {
    try {
        const { id } = req.params;
        const log = await prisma_1.default.activityLog.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                        role: true,
                        createdAt: true
                    }
                }
            }
        });
        if (!log) {
            return res.status(404).json({
                success: false,
                error: 'Log not found'
            });
        }
        res.json({
            success: true,
            data: {
                id: log.id,
                action: log.action,
                details: log.details,
                ipAddress: log.ipAddress,
                timestamp: log.createdAt,
                user: log.user
            }
        });
    }
    catch (error) {
        console.error(`Get log ${req.params.id} error:`, error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch log'
        });
    }
});
// DELETE /api/logs/:id - Delete log (Superadmin only)
router.delete('/:id', (0, auth_1.roleMiddleware)(['SUPERADMIN']), async (req, res) => {
    try {
        const { id } = req.params;
        // Check if log exists
        const log = await prisma_1.default.activityLog.findUnique({
            where: { id }
        });
        if (!log) {
            return res.status(404).json({
                success: false,
                error: 'Log not found'
            });
        }
        // Delete log
        await prisma_1.default.activityLog.delete({
            where: { id }
        });
        // Log this action
        const user = req.user;
        await prisma_1.default.activityLog.create({
            data: {
                userId: user.userId,
                action: 'LOG_DELETED',
                details: `Deleted log ${id}`,
                ipAddress: req.ip
            }
        });
        res.json({
            success: true,
            message: 'Log deleted successfully'
        });
    }
    catch (error) {
        console.error(`Delete log ${req.params.id} error:`, error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to delete log'
        });
    }
});
// POST /api/logs/clear - Clear old logs (Superadmin only)
router.post('/clear', (0, auth_1.roleMiddleware)(['SUPERADMIN']), async (req, res) => {
    try {
        const { days = 30 } = req.body;
        if (days < 1 || days > 365) {
            return res.status(400).json({
                success: false,
                error: 'Days must be between 1 and 365'
            });
        }
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        // Delete logs older than specified days
        const result = await prisma_1.default.activityLog.deleteMany({
            where: {
                createdAt: {
                    lt: cutoffDate
                }
            }
        });
        // Log this action
        const user = req.user;
        await prisma_1.default.activityLog.create({
            data: {
                userId: user.userId,
                action: 'LOGS_CLEARED',
                details: `Cleared logs older than ${days} days (${result.count} logs deleted)`,
                ipAddress: req.ip
            }
        });
        res.json({
            success: true,
            message: `Successfully cleared ${result.count} logs older than ${days} days`
        });
    }
    catch (error) {
        console.error('Clear logs error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to clear logs'
        });
    }
});
exports.default = router;
