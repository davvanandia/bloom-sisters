"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// backend/src/api/orders/index.ts
const express_1 = require("express");
const prisma_1 = __importDefault(require("../../lib/prisma"));
const auth_1 = require("../../middleware/auth");
const router = (0, express_1.Router)();
// Apply auth middleware to all order routes
router.use(auth_1.authMiddleware);
// GET /api/orders/payment/sync/:id - Sync payment status from Midtrans
router.get('/payment/sync/:id', (0, auth_1.roleMiddleware)(['ADMIN', 'SUPERADMIN']), async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;
        console.log(`Syncing payment status for order ${id} by admin:`, user.username);
        // Get order with payment info
        const order = await prisma_1.default.order.findUnique({
            where: { id },
            include: {
                orderItems: {
                    include: {
                        product: true
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
        // Check if order has Midtrans transaction ID
        if (!order.midtransOrderId) {
            return res.status(400).json({
                success: false,
                error: 'Order does not have a Midtrans transaction'
            });
        }
        // Import Midtrans client
        const midtransClient = require('midtrans-client');
        const snap = new midtransClient.Snap({
            isProduction: false,
            serverKey: process.env.MIDTRANS_SERVER_KEY,
            clientKey: process.env.MIDTRANS_CLIENT_KEY
        });
        // Get transaction status from Midtrans
        const transaction = await snap.transaction.status(order.midtransOrderId);
        console.log('Midtrans transaction status:', transaction.transaction_status);
        let newStatus = order.status;
        let paymentStatus = transaction.transaction_status;
        // Map Midtrans status to our order status
        switch (transaction.transaction_status) {
            case 'capture':
                if (transaction.fraud_status === 'challenge') {
                    newStatus = 'PENDING';
                    paymentStatus = 'CHALLENGE';
                }
                else if (transaction.fraud_status === 'accept') {
                    newStatus = 'PROCESSING'; // Payment successful, order is processing
                    paymentStatus = 'PAID';
                }
                break;
            case 'settlement':
                newStatus = 'PROCESSING'; // Payment settled, order is processing
                paymentStatus = 'PAID';
                break;
            case 'pending':
                newStatus = 'PENDING';
                paymentStatus = 'PENDING';
                break;
            case 'deny':
                newStatus = 'CANCELLED';
                paymentStatus = 'DENIED';
                // Restore stock if denied
                for (const item of order.orderItems) {
                    await prisma_1.default.product.update({
                        where: { id: item.productId },
                        data: {
                            stock: {
                                increment: item.quantity
                            }
                        }
                    });
                }
                break;
            case 'expire':
                newStatus = 'CANCELLED';
                paymentStatus = 'EXPIRED';
                // Restore stock if expired
                for (const item of order.orderItems) {
                    await prisma_1.default.product.update({
                        where: { id: item.productId },
                        data: {
                            stock: {
                                increment: item.quantity
                            }
                        }
                    });
                }
                break;
            case 'cancel':
                newStatus = 'CANCELLED';
                paymentStatus = 'CANCELLED';
                // Restore stock if cancelled
                for (const item of order.orderItems) {
                    await prisma_1.default.product.update({
                        where: { id: item.productId },
                        data: {
                            stock: {
                                increment: item.quantity
                            }
                        }
                    });
                }
                break;
        }
        // Update order
        const updatedOrder = await prisma_1.default.order.update({
            where: { id },
            data: {
                status: newStatus,
                paymentStatus: paymentStatus,
                updatedAt: new Date(),
                paymentMethod: transaction.payment_type || order.paymentMethod
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
        // Create activity log
        await prisma_1.default.activityLog.create({
            data: {
                userId: user.userId,
                action: 'SYNC_PAYMENT_STATUS',
                details: `Admin synced payment status for order ${id}: ${transaction.transaction_status}`,
                ipAddress: req.ip || 'unknown'
            }
        });
        console.log(`Order ${id} payment status synced to ${paymentStatus}, order status: ${newStatus}`);
        res.json({
            success: true,
            message: 'Payment status synced successfully',
            data: updatedOrder
        });
    }
    catch (error) {
        console.error(`Sync payment status error for order ${req.params.id}:`, error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to sync payment status'
        });
    }
});
// POST /api/orders - Create new order
router.post('/', async (req, res) => {
    try {
        const user = req.user;
        console.log('POST /api/orders called by user:', user.username);
        const { items, total, shippingAddress, customerName, customerEmail, customerPhone, notes, voucherId, subtotal, shippingFee = 0, voucherDiscount = 0 } = req.body;
        // Validate required fields
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Items are required and must be an array'
            });
        }
        if (!total || total <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Valid total amount is required'
            });
        }
        if (!shippingAddress || !customerName || !customerEmail || !customerPhone) {
            return res.status(400).json({
                success: false,
                error: 'Shipping address, customer name, email, and phone are required'
            });
        }
        // Validate items structure
        for (const item of items) {
            if (!item.productId || !item.price || !item.quantity) {
                return res.status(400).json({
                    success: false,
                    error: 'Each item must have productId, price, and quantity'
                });
            }
        }
        // Validate voucher if provided
        let voucher = null;
        if (voucherId) {
            voucher = await prisma_1.default.voucher.findUnique({
                where: { id: voucherId }
            });
            if (!voucher) {
                return res.status(400).json({
                    success: false,
                    error: 'Voucher not found'
                });
            }
            if (!voucher.isActive) {
                return res.status(400).json({
                    success: false,
                    error: 'Voucher is not active'
                });
            }
            if (voucher.expiryDate && new Date() > new Date(voucher.expiryDate)) {
                return res.status(400).json({
                    success: false,
                    error: 'Voucher has expired'
                });
            }
            if (voucher.maxUsage && voucher.usageCount >= voucher.maxUsage) {
                return res.status(400).json({
                    success: false,
                    error: 'Voucher usage limit reached'
                });
            }
            // Check minimum purchase
            const calculatedSubtotal = subtotal || items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            if (voucher.minPurchase && calculatedSubtotal < voucher.minPurchase) {
                return res.status(400).json({
                    success: false,
                    error: `Minimum purchase of ${voucher.minPurchase} required for this voucher`
                });
            }
        }
        // Start transaction for order creation
        const result = await prisma_1.default.$transaction(async (tx) => {
            // Create order
            const order = await tx.order.create({
                data: {
                    userId: user.userId,
                    total: parseFloat(total),
                    shippingFee: parseFloat(shippingFee),
                    status: 'PENDING',
                    shippingAddress,
                    customerName,
                    customerEmail,
                    customerPhone,
                    notes: notes || '',
                    voucherId: voucher ? voucher.id : null
                }
            });
            console.log('Order created:', order.id);
            // Create order items and update product stock
            for (const item of items) {
                // Check product availability
                const product = await tx.product.findUnique({
                    where: { id: item.productId }
                });
                if (!product) {
                    throw new Error(`Product ${item.productId} not found`);
                }
                if (product.stock < item.quantity) {
                    throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`);
                }
                // Create order item
                await tx.orderItem.create({
                    data: {
                        orderId: order.id,
                        productId: item.productId,
                        quantity: item.quantity,
                        price: item.price
                    }
                });
                // Update product stock
                await tx.product.update({
                    where: { id: item.productId },
                    data: {
                        stock: {
                            decrement: item.quantity
                        }
                    }
                });
            }
            // Update voucher usage count if voucher used
            if (voucher) {
                await tx.voucher.update({
                    where: { id: voucher.id },
                    data: {
                        usageCount: voucher.usageCount + 1
                    }
                });
            }
            // Create activity log
            await tx.activityLog.create({
                data: {
                    userId: user.userId,
                    action: 'CREATE_ORDER',
                    details: `Created order ${order.id} with total ${total}`,
                    ipAddress: req.ip || 'unknown'
                }
            });
            return order;
        });
        // Get complete order data
        const orderWithDetails = await prisma_1.default.order.findUnique({
            where: { id: result.id },
            include: {
                user: {
                    select: {
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
            }
        });
        console.log(`Order created successfully: ${result.id}`);
        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            data: {
                order: orderWithDetails,
                orderId: result.id
            }
        });
    }
    catch (error) {
        console.error('Create order error:', error);
        if (error.message.includes('Insufficient stock')) {
            return res.status(400).json({
                success: false,
                error: error.message
            });
        }
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to create order'
        });
    }
});
// GET /api/orders - Get all orders (Admin only)
router.get('/', (0, auth_1.roleMiddleware)(['ADMIN', 'SUPERADMIN']), async (req, res) => {
    try {
        const user = req.user;
        console.log('GET /api/orders called by admin:', user.username);
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
                { customerName: { contains: search, mode: 'insensitive' } },
                { customerEmail: { contains: search, mode: 'insensitive' } },
                { customerPhone: { contains: search, mode: 'insensitive' } },
                { shippingAddress: { contains: search, mode: 'insensitive' } },
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
        console.log('Admin order query conditions:', where);
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
        console.log(`Admin found ${orders.length} orders out of ${total}`);
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
        console.error('Admin get orders error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch orders',
            stack: process.env.NODE_ENV ? error.stack : undefined
        });
    }
});
// GET /api/orders/user/my-orders - Get orders for current user
router.get('/user/my-orders', async (req, res) => {
    try {
        const user = req.user;
        const { page = '1', limit = '10', status = '' } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        // Build where clause
        const where = { userId: user.userId };
        if (status && status !== 'ALL') {
            where.status = status;
        }
        const orders = await prisma_1.default.order.findMany({
            where,
            include: {
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
        const total = await prisma_1.default.order.count({ where });
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
        console.error('Get user orders error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch user orders'
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
        const { status, total, notes, paymentStatus } = req.body;
        const user = req.user;
        console.log(`Admin updating order ${id} with data:`, req.body);
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
        const validStatuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'CANCELLED'];
        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid order status'
            });
        }
        // Prepare update data
        const updateData = {
            updatedAt: new Date()
        };
        if (status)
            updateData.status = status;
        if (total !== undefined)
            updateData.total = parseFloat(total);
        if (notes !== undefined)
            updateData.notes = notes;
        if (paymentStatus)
            updateData.paymentStatus = paymentStatus;
        // If cancelling order, restore product stock
        if (status === 'CANCELLED' && existingOrder.status !== 'CANCELLED') {
            // Get order items
            const orderItems = await prisma_1.default.orderItem.findMany({
                where: { orderId: id },
                include: { product: true }
            });
            // Restore stock for each product
            for (const item of orderItems) {
                await prisma_1.default.product.update({
                    where: { id: item.productId },
                    data: {
                        stock: {
                            increment: item.quantity
                        }
                    }
                });
            }
            // If voucher was used, decrement usage count
            if (existingOrder.voucherId) {
                const voucher = await prisma_1.default.voucher.findUnique({
                    where: { id: existingOrder.voucherId }
                });
                if (voucher) {
                    await prisma_1.default.voucher.update({
                        where: { id: voucher.id },
                        data: {
                            usageCount: Math.max(0, voucher.usageCount - 1)
                        }
                    });
                }
            }
        }
        // Update order
        const updatedOrder = await prisma_1.default.order.update({
            where: { id },
            data: updateData,
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
        // Create activity log
        await prisma_1.default.activityLog.create({
            data: {
                userId: user.userId,
                action: 'UPDATE_ORDER',
                details: `Admin updated order ${id}: status=${status || 'unchanged'}`,
                ipAddress: req.ip || 'unknown'
            }
        });
        console.log(`Order ${id} updated successfully by admin`);
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
// PATCH /api/orders/:id/status - Update only order status (Admin only)
router.patch('/:id/status', (0, auth_1.roleMiddleware)(['ADMIN', 'SUPERADMIN']), async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const user = req.user;
        if (!status) {
            return res.status(400).json({
                success: false,
                error: 'Status is required'
            });
        }
        // Validate status
        const validStatuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'CANCELLED'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid order status'
            });
        }
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
        // If cancelling order, restore product stock
        if (status === 'CANCELLED' && existingOrder.status !== 'CANCELLED') {
            // Get order items
            const orderItems = await prisma_1.default.orderItem.findMany({
                where: { orderId: id },
                include: { product: true }
            });
            // Restore stock for each product
            for (const item of orderItems) {
                await prisma_1.default.product.update({
                    where: { id: item.productId },
                    data: {
                        stock: {
                            increment: item.quantity
                        }
                    }
                });
            }
            // If voucher was used, decrement usage count
            if (existingOrder.voucherId) {
                const voucher = await prisma_1.default.voucher.findUnique({
                    where: { id: existingOrder.voucherId }
                });
                if (voucher) {
                    await prisma_1.default.voucher.update({
                        where: { id: voucher.id },
                        data: {
                            usageCount: Math.max(0, voucher.usageCount - 1)
                        }
                    });
                }
            }
        }
        // Update only status
        const updatedOrder = await prisma_1.default.order.update({
            where: { id },
            data: {
                status,
                updatedAt: new Date()
            }
        });
        // Create activity log
        await prisma_1.default.activityLog.create({
            data: {
                userId: user.userId,
                action: 'UPDATE_ORDER_STATUS',
                details: `Admin changed order ${id} status from ${existingOrder.status} to ${status}`,
                ipAddress: req.ip || 'unknown'
            }
        });
        console.log(`Order ${id} status updated to ${status} by admin`);
        res.json({
            success: true,
            message: 'Order status updated successfully',
            data: updatedOrder
        });
    }
    catch (error) {
        console.error(`Update order status error:`, error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to update order status'
        });
    }
});
// DELETE /api/orders/:id - Delete order (Admin only)
router.delete('/:id', (0, auth_1.roleMiddleware)(['ADMIN', 'SUPERADMIN']), async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;
        console.log(`DELETE /api/orders/${id} called by admin:`, user.username);
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
        // Restore product stock before deleting
        const orderItems = await prisma_1.default.orderItem.findMany({
            where: { orderId: id }
        });
        for (const item of orderItems) {
            await prisma_1.default.product.update({
                where: { id: item.productId },
                data: {
                    stock: {
                        increment: item.quantity
                    }
                }
            });
        }
        // If voucher was used, decrement usage count
        if (order.voucherId) {
            const voucher = await prisma_1.default.voucher.findUnique({
                where: { id: order.voucherId }
            });
            if (voucher) {
                await prisma_1.default.voucher.update({
                    where: { id: voucher.id },
                    data: {
                        usageCount: Math.max(0, voucher.usageCount - 1)
                    }
                });
            }
        }
        // Delete order items first (foreign key constraint)
        await prisma_1.default.orderItem.deleteMany({
            where: { orderId: id }
        });
        // Delete order
        await prisma_1.default.order.delete({
            where: { id }
        });
        // Create activity log
        await prisma_1.default.activityLog.create({
            data: {
                userId: user.userId,
                action: 'DELETE_ORDER',
                details: `Admin deleted order ${id}`,
                ipAddress: req.ip || 'unknown'
            }
        });
        console.log(`Order ${id} deleted successfully by admin`);
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
        console.log('GET /api/orders/status/counts called by admin');
        const counts = await prisma_1.default.order.groupBy({
            by: ['status'],
            _count: {
                id: true
            }
        });
        const result = {
            PENDING: 0,
            PROCESSING: 0,
            SHIPPED: 0,
            DELIVERED: 0,
            COMPLETED: 0,
            CANCELLED: 0,
            TOTAL: 0
        };
        counts.forEach(item => {
            const status = item.status;
            if (status in result) {
                result[status] = item._count.id;
                result.TOTAL += item._count.id;
            }
        });
        console.log('Order counts for admin:', result);
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
            stack: process.env.NODE_ENV ? error.stack : undefined
        });
    }
});
// GET /api/orders/stats/summary - Get order summary stats (Admin only)
router.get('/stats/summary', (0, auth_1.roleMiddleware)(['ADMIN', 'SUPERADMIN']), async (req, res) => {
    try {
        console.log('GET /api/orders/stats/summary called by admin');
        // Get today's date range
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        // Get this month's date range
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        lastDayOfMonth.setHours(23, 59, 59, 999);
        // Get total revenue
        const totalRevenueResult = await prisma_1.default.order.aggregate({
            where: {
                status: {
                    in: ['COMPLETED', 'DELIVERED']
                }
            },
            _sum: {
                total: true
            }
        });
        // Get today's revenue
        const todayRevenueResult = await prisma_1.default.order.aggregate({
            where: {
                createdAt: {
                    gte: today,
                    lt: tomorrow
                },
                status: {
                    in: ['COMPLETED', 'DELIVERED']
                }
            },
            _sum: {
                total: true
            }
        });
        // Get this month's revenue
        const monthRevenueResult = await prisma_1.default.order.aggregate({
            where: {
                createdAt: {
                    gte: firstDayOfMonth,
                    lte: lastDayOfMonth
                },
                status: {
                    in: ['COMPLETED', 'DELIVERED']
                }
            },
            _sum: {
                total: true
            }
        });
        // Get total orders count
        const totalOrders = await prisma_1.default.order.count();
        // Get today's orders count
        const todayOrders = await prisma_1.default.order.count({
            where: {
                createdAt: {
                    gte: today,
                    lt: tomorrow
                }
            }
        });
        // Get recent orders (last 7 days)
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);
        const recentOrders = await prisma_1.default.order.count({
            where: {
                createdAt: {
                    gte: lastWeek
                }
            }
        });
        const summary = {
            totalRevenue: totalRevenueResult._sum.total || 0,
            todayRevenue: todayRevenueResult._sum.total || 0,
            monthRevenue: monthRevenueResult._sum.total || 0,
            totalOrders,
            todayOrders,
            recentOrders
        };
        console.log('Order summary stats:', summary);
        res.json({
            success: true,
            data: summary
        });
    }
    catch (error) {
        console.error('Get order summary error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch order summary'
        });
    }
});
// GET /api/orders/recent/activity - Get recent order activity (Admin only)
router.get('/recent/activity', (0, auth_1.roleMiddleware)(['ADMIN', 'SUPERADMIN']), async (req, res) => {
    try {
        const { limit = '10' } = req.query;
        const limitNum = parseInt(limit);
        const recentOrders = await prisma_1.default.order.findMany({
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
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: limitNum
        });
        res.json({
            success: true,
            data: recentOrders
        });
    }
    catch (error) {
        console.error('Get recent activity error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch recent activity'
        });
    }
});
exports.default = router;
