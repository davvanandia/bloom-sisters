"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../../lib/prisma"));
const auth_1 = require("../../middleware/auth");
const router = (0, express_1.Router)();
// Apply auth middleware to all order routes
router.use(auth_1.authMiddleware);
// GET /api/orders - Get all orders (Admin only)
router.get('/', (0, auth_1.roleMiddleware)(['ADMIN', 'SUPERADMIN']), async (req, res) => {
    try {
        console.log('GET /api/orders called by user:', req.user?.username);
        const { page = '1', limit = '10', search = '', status = '', startDate = '', endDate = '', userId = '' } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        // Build where clause
        const where = {};
        if (status && status !== 'ALL') {
            where.status = status;
        }
        if (userId) {
            where.userId = userId;
        }
        if (search) {
            where.OR = [
                { id: { contains: search, mode: 'insensitive' } },
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
        console.log('Query conditions:', where);
        // Get orders with relations
        const orders = await prisma_1.default.order.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        email: true
                    }
                },
                voucher: {
                    select: {
                        code: true,
                        discount: true,
                        type: true
                    }
                },
                orderItems: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                price: true,
                                images: true
                            }
                        }
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
        const total = await prisma_1.default.order.count({ where });
        console.log(`Found ${orders.length} orders out of ${total}`);
        res.json({
            success: true,
            data: orders,
            pagination: {
                currentPage: pageNum,
                totalPages: Math.ceil(total / limitNum),
                totalItems: total,
                itemsPerPage: limitNum
            }
        });
    }
    catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch orders',
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});
// GET /api/orders/:id - Get order by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;
        console.log(`GET /api/orders/${id} called by user:`, user.username);
        const order = await prisma_1.default.order.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                        createdAt: true
                    }
                },
                voucher: {
                    select: {
                        id: true,
                        code: true,
                        discount: true,
                        type: true,
                        minPurchase: true,
                        maxDiscount: true
                    }
                },
                orderItems: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                slug: true,
                                price: true,
                                images: true,
                                category: true
                            }
                        }
                    }
                }
            }
        });
        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Order not found'
            });
        }
        // Check permission (admin or order owner)
        if (user.role === 'USER' && order.userId !== user.userId) {
            return res.status(403).json({
                success: false,
                error: 'You do not have permission to view this order'
            });
        }
        res.json({
            success: true,
            data: order
        });
    }
    catch (error) {
        console.error(`Get order ${req.params.id} error:`, error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch order'
        });
    }
});
// PUT /api/orders/:id - Update order status (Admin only)
router.put('/:id', (0, auth_1.roleMiddleware)(['ADMIN', 'SUPERADMIN']), async (req, res) => {
    try {
        const { id } = req.params;
        const { status, total } = req.body;
        const user = req.user;
        console.log(`PUT /api/orders/${id} called by user:`, user.username, 'with data:', req.body);
        // Check if order exists
        const existingOrder = await prisma_1.default.order.findUnique({
            where: { id }
        });
        if (!existingOrder) {
            return res.status(404).json({
                success: false,
                error: 'Order not found'
            });
        }
        // Validate status
        const validStatuses = ['PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED'];
        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid order status'
            });
        }
        // Update order
        const updatedOrder = await prisma_1.default.order.update({
            where: { id },
            data: {
                ...(status && { status }),
                ...(total !== undefined && { total }),
                updatedAt: new Date()
            },
            include: {
                user: {
                    select: {
                        username: true,
                        email: true
                    }
                },
                orderItems: {
                    include: {
                        product: {
                            select: {
                                name: true
                            }
                        }
                    }
                }
            }
        });
        console.log(`Order ${id} updated successfully`);
        res.json({
            success: true,
            message: 'Order updated successfully',
            data: updatedOrder
        });
    }
    catch (error) {
        console.error(`Update order ${req.params.id} error:`, error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to update order'
        });
    }
});
// DELETE /api/orders/:id - Delete order (Admin only)
router.delete('/:id', (0, auth_1.roleMiddleware)(['ADMIN', 'SUPERADMIN']), async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;
        console.log(`DELETE /api/orders/${id} called by user:`, user.username);
        // Check if order exists
        const order = await prisma_1.default.order.findUnique({
            where: { id }
        });
        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Order not found'
            });
        }
        // Delete order items first (foreign key constraint)
        await prisma_1.default.orderItem.deleteMany({
            where: { orderId: id }
        });
        // Delete order
        await prisma_1.default.order.delete({
            where: { id }
        });
        console.log(`Order ${id} deleted successfully by ${user.username}`);
        res.json({
            success: true,
            message: 'Order deleted successfully'
        });
    }
    catch (error) {
        console.error(`Delete order ${req.params.id} error:`, error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to delete order'
        });
    }
});
// GET /api/orders/status/counts - Get order counts by status (Admin only)
router.get('/status/counts', (0, auth_1.roleMiddleware)(['ADMIN', 'SUPERADMIN']), async (req, res) => {
    try {
        console.log('GET /api/orders/status/counts called');
        const counts = await prisma_1.default.order.groupBy({
            by: ['status'],
            _count: {
                id: true
            }
        });
        const result = {
            PENDING: 0,
            PROCESSING: 0,
            COMPLETED: 0,
            CANCELLED: 0,
            TOTAL: 0
        };
        counts.forEach(item => {
            const status = item.status;
            result[status] = item._count.id;
            result.TOTAL += item._count.id;
        });
        console.log('Order counts:', result);
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        console.error('Get order counts error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch order counts',
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});
exports.default = router;
