"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const prisma_1 = __importDefault(require("../../lib/prisma"));
const zod_1 = require("zod");
const router = (0, express_1.Router)();
// Schema validasi
const cartItemSchema = zod_1.z.object({
    productId: zod_1.z.string().min(1, 'Product ID is required'),
    quantity: zod_1.z.number().int().positive('Quantity must be positive'),
});
// GET /api/cart - Get user's cart
router.get('/', auth_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        // Find or create pending order (cart)
        let cart = await prisma_1.default.order.findFirst({
            where: {
                userId,
                status: 'PENDING',
            },
            include: {
                orderItems: {
                    include: {
                        product: true,
                    },
                },
            },
        });
        if (!cart) {
            // Create new cart
            cart = await prisma_1.default.order.create({
                data: {
                    userId,
                    status: 'PENDING',
                    total: 0,
                },
                include: {
                    orderItems: {
                        include: {
                            product: true,
                        },
                    },
                },
            });
        }
        res.json({
            success: true,
            data: cart,
        });
    }
    catch (error) {
        console.error('Error getting cart:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
// POST /api/cart/add - Add item to cart
router.post('/add', auth_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId, quantity } = req.body;
        // Validasi input
        const validationResult = cartItemSchema.safeParse({ productId, quantity });
        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                error: 'Validation error',
                details: validationResult.error.errors
            });
        }
        // Cek produk
        const product = await prisma_1.default.product.findUnique({
            where: { id: productId },
        });
        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }
        if (!product.active) {
            return res.status(400).json({
                success: false,
                error: 'Product is not available'
            });
        }
        if (product.stock < quantity) {
            return res.status(400).json({
                success: false,
                error: `Insufficient stock. Only ${product.stock} available`
            });
        }
        // Cari atau buat cart
        let cart = await prisma_1.default.order.findFirst({
            where: {
                userId,
                status: 'PENDING',
            },
        });
        if (!cart) {
            cart = await prisma_1.default.order.create({
                data: {
                    userId,
                    status: 'PENDING',
                    total: 0,
                },
            });
        }
        // Cek apakah produk sudah ada di cart
        const existingItem = await prisma_1.default.orderItem.findFirst({
            where: {
                orderId: cart.id,
                productId,
            },
        });
        if (existingItem) {
            // Update quantity
            const newQuantity = existingItem.quantity + quantity;
            if (product.stock < newQuantity) {
                return res.status(400).json({
                    success: false,
                    error: `Insufficient stock. Maximum ${product.stock} allowed`
                });
            }
            await prisma_1.default.orderItem.update({
                where: { id: existingItem.id },
                data: { quantity: newQuantity },
            });
        }
        else {
            // Add new item
            await prisma_1.default.orderItem.create({
                data: {
                    orderId: cart.id,
                    productId,
                    quantity,
                    price: product.price,
                },
            });
        }
        // Update cart total
        const orderItems = await prisma_1.default.orderItem.findMany({
            where: { orderId: cart.id },
            include: { product: true },
        });
        const total = orderItems.reduce((sum, item) => {
            return sum + (item.price * item.quantity);
        }, 0);
        await prisma_1.default.order.update({
            where: { id: cart.id },
            data: { total },
        });
        // Get updated cart
        const updatedCart = await prisma_1.default.order.findUnique({
            where: { id: cart.id },
            include: {
                orderItems: {
                    include: {
                        product: true,
                    },
                },
            },
        });
        res.json({
            success: true,
            message: 'Item added to cart',
            data: updatedCart,
        });
    }
    catch (error) {
        console.error('Error adding to cart:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
// PUT /api/cart/:itemId - Update cart item quantity
router.put('/:itemId', auth_1.authMiddleware, async (req, res) => {
    try {
        const { itemId } = req.params;
        const { quantity } = req.body;
        if (!quantity || quantity < 0) {
            return res.status(400).json({
                success: false,
                error: 'Quantity must be positive'
            });
        }
        // Cek item
        const cartItem = await prisma_1.default.orderItem.findUnique({
            where: { id: itemId },
            include: {
                product: true,
                order: true,
            },
        });
        if (!cartItem) {
            return res.status(404).json({
                success: false,
                error: 'Cart item not found'
            });
        }
        // Cek user authorization
        if (cartItem.order.userId !== req.user.id) {
            return res.status(403).json({
                success: false,
                error: 'Unauthorized'
            });
        }
        if (quantity === 0) {
            // Remove item
            await prisma_1.default.orderItem.delete({
                where: { id: itemId },
            });
        }
        else {
            // Cek stok
            if (cartItem.product.stock < quantity) {
                return res.status(400).json({
                    success: false,
                    error: `Insufficient stock. Only ${cartItem.product.stock} available`
                });
            }
            // Update quantity
            await prisma_1.default.orderItem.update({
                where: { id: itemId },
                data: { quantity },
            });
        }
        // Update cart total
        const orderItems = await prisma_1.default.orderItem.findMany({
            where: { orderId: cartItem.orderId },
            include: { product: true },
        });
        const total = orderItems.reduce((sum, item) => {
            return sum + (item.price * item.quantity);
        }, 0);
        await prisma_1.default.order.update({
            where: { id: cartItem.orderId },
            data: { total },
        });
        res.json({
            success: true,
            message: quantity === 0 ? 'Item removed from cart' : 'Cart updated',
        });
    }
    catch (error) {
        console.error('Error updating cart:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
// DELETE /api/cart/:itemId - Remove item from cart
router.delete('/:itemId', auth_1.authMiddleware, async (req, res) => {
    try {
        const { itemId } = req.params;
        // Cek item
        const cartItem = await prisma_1.default.orderItem.findUnique({
            where: { id: itemId },
            include: {
                order: true,
            },
        });
        if (!cartItem) {
            return res.status(404).json({
                success: false,
                error: 'Cart item not found'
            });
        }
        // Cek user authorization
        if (cartItem.order.userId !== req.user.id) {
            return res.status(403).json({
                success: false,
                error: 'Unauthorized'
            });
        }
        // Delete item
        await prisma_1.default.orderItem.delete({
            where: { id: itemId },
        });
        // Update cart total
        const orderItems = await prisma_1.default.orderItem.findMany({
            where: { orderId: cartItem.orderId },
            include: { product: true },
        });
        const total = orderItems.reduce((sum, item) => {
            return sum + (item.price * item.quantity);
        }, 0);
        await prisma_1.default.order.update({
            where: { id: cartItem.orderId },
            data: { total },
        });
        res.json({
            success: true,
            message: 'Item removed from cart',
        });
    }
    catch (error) {
        console.error('Error removing from cart:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
// DELETE /api/cart - Clear cart
router.delete('/', auth_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        // Cari cart
        const cart = await prisma_1.default.order.findFirst({
            where: {
                userId,
                status: 'PENDING',
            },
        });
        if (cart) {
            // Hapus semua item di cart
            await prisma_1.default.orderItem.deleteMany({
                where: { orderId: cart.id },
            });
            // Update cart total ke 0
            await prisma_1.default.order.update({
                where: { id: cart.id },
                data: { total: 0 },
            });
        }
        res.json({
            success: true,
            message: 'Cart cleared',
        });
    }
    catch (error) {
        console.error('Error clearing cart:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
exports.default = router;
