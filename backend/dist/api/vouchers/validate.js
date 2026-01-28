"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../../lib/prisma"));
const router = (0, express_1.Router)();
// POST /api/vouchers/validate - Validate voucher for cart
router.post('/validate', async (req, res) => {
    try {
        const { code, cartTotal, userId } = req.body;
        if (!code) {
            return res.status(400).json({
                success: false,
                error: 'Kode voucher diperlukan'
            });
        }
        // Find voucher
        const voucher = await prisma_1.default.voucher.findUnique({
            where: { code: code.toUpperCase() }
        });
        if (!voucher) {
            return res.status(404).json({
                success: false,
                error: 'Voucher tidak ditemukan'
            });
        }
        // Check if voucher is active
        if (!voucher.isActive) {
            return res.status(400).json({
                success: false,
                error: 'Voucher tidak aktif'
            });
        }
        // Check expiry
        if (voucher.expiryDate && new Date() > new Date(voucher.expiryDate)) {
            return res.status(400).json({
                success: false,
                error: 'Voucher sudah kedaluwarsa'
            });
        }
        // Check max usage
        if (voucher.maxUsage && voucher.usageCount >= voucher.maxUsage) {
            return res.status(400).json({
                success: false,
                error: 'Voucher sudah mencapai batas penggunaan'
            });
        }
        // Check if user has already used this voucher
        if (userId) {
            const userOrdersWithVoucher = await prisma_1.default.order.count({
                where: {
                    userId: userId,
                    voucherId: voucher.id,
                    status: {
                        in: ['COMPLETED', 'PROCESSING']
                    }
                }
            });
            if (userOrdersWithVoucher > 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Anda sudah menggunakan voucher ini sebelumnya'
                });
            }
        }
        const total = parseFloat(cartTotal) || 0;
        // Check minimum purchase
        if (voucher.minPurchase && total < voucher.minPurchase) {
            return res.status(400).json({
                success: false,
                error: `Minimal pembelian ${new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: 'IDR'
                }).format(voucher.minPurchase)} untuk menggunakan voucher ini`
            });
        }
        // Calculate discount
        let discountAmount = 0;
        if (voucher.type === 'PERCENTAGE') {
            discountAmount = total * (voucher.discount / 100);
            if (voucher.maxDiscount && discountAmount > voucher.maxDiscount) {
                discountAmount = voucher.maxDiscount;
            }
        }
        else {
            discountAmount = voucher.discount;
            // Fixed discount cannot exceed total
            if (discountAmount > total) {
                discountAmount = total;
            }
        }
        const finalTotal = Math.max(0, total - discountAmount);
        res.json({
            success: true,
            message: 'Voucher valid',
            data: {
                voucher: {
                    id: voucher.id,
                    code: voucher.code,
                    discount: voucher.discount,
                    type: voucher.type,
                    minPurchase: voucher.minPurchase,
                    maxDiscount: voucher.maxDiscount,
                    discountAmount,
                    finalTotal
                }
            }
        });
    }
    catch (error) {
        console.error('Validate voucher error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});
exports.default = router;
