"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const prisma_1 = __importDefault(require("../../lib/prisma"));
const validate_1 = __importDefault(require("./validate"));
const router = (0, express_1.Router)();
router.use(validate_1.default);
// Apply auth middleware untuk semua routes
router.use(auth_1.authMiddleware);
// GET /api/vouchers - Get all vouchers (Admin/Superadmin)
router.get('/', (0, auth_1.roleMiddleware)(['ADMIN', 'SUPERADMIN']), async (req, res) => {
    try {
        const vouchers = await prisma_1.default.voucher.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json({
            success: true,
            data: vouchers,
            count: vouchers.length
        });
    }
    catch (error) {
        console.error('Get vouchers error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});
// POST /api/vouchers - Create voucher (Admin/Superadmin)
router.post('/', (0, auth_1.roleMiddleware)(['ADMIN', 'SUPERADMIN']), async (req, res) => {
    try {
        const { code, discount, type, minPurchase, maxDiscount, expiryDate, maxUsage } = req.body;
        // Validasi
        if (!code || !discount || !type) {
            return res.status(400).json({
                success: false,
                error: 'Kode, diskon, dan tipe wajib diisi'
            });
        }
        // Check if voucher code exists
        const existingVoucher = await prisma_1.default.voucher.findUnique({
            where: { code: code.toUpperCase() }
        });
        if (existingVoucher) {
            return res.status(400).json({
                success: false,
                error: 'Kode voucher sudah digunakan'
            });
        }
        // Validate percentage discount
        if (type === 'PERCENTAGE' && (discount < 1 || discount > 100)) {
            return res.status(400).json({
                success: false,
                error: 'Diskon persentase harus antara 1 dan 100'
            });
        }
        // Validate fixed amount discount
        if (type === 'FIXED' && discount <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Diskon nominal harus lebih dari 0'
            });
        }
        // Create voucher
        const voucher = await prisma_1.default.voucher.create({
            data: {
                code: code.toUpperCase(),
                discount: parseFloat(discount),
                type,
                minPurchase: minPurchase ? parseFloat(minPurchase) : null,
                maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
                expiryDate: expiryDate ? new Date(expiryDate) : null,
                maxUsage: maxUsage ? parseInt(maxUsage) : null,
                isActive: true,
                usageCount: 0
            }
        });
        // Log activity
        try {
            await prisma_1.default.activityLog.create({
                data: {
                    userId: req.user.userId,
                    action: 'CREATE_VOUCHER',
                    details: `Created voucher: ${code.toUpperCase()}`,
                    ipAddress: req.ip || 'unknown'
                }
            });
        }
        catch (logError) {
            console.error('Failed to create activity log:', logError);
        }
        res.status(201).json({
            success: true,
            message: 'Voucher berhasil dibuat',
            data: voucher
        });
    }
    catch (error) {
        console.error('Create voucher error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});
// GET /api/vouchers/:id - Get voucher by ID (Admin/Superadmin)
router.get('/:id', (0, auth_1.roleMiddleware)(['ADMIN', 'SUPERADMIN']), async (req, res) => {
    try {
        const { id } = req.params;
        const voucher = await prisma_1.default.voucher.findUnique({
            where: { id }
        });
        if (!voucher) {
            return res.status(404).json({ success: false, error: 'Voucher tidak ditemukan' });
        }
        res.json({
            success: true,
            data: voucher
        });
    }
    catch (error) {
        console.error('Get voucher by ID error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});
// PUT /api/vouchers/:id - Update voucher (Admin/Superadmin)
router.put('/:id', (0, auth_1.roleMiddleware)(['ADMIN', 'SUPERADMIN']), async (req, res) => {
    try {
        const { id } = req.params;
        const { code, discount, type, minPurchase, maxDiscount, expiryDate, maxUsage, isActive } = req.body;
        // Check if voucher exists
        const existingVoucher = await prisma_1.default.voucher.findUnique({
            where: { id }
        });
        if (!existingVoucher) {
            return res.status(404).json({ success: false, error: 'Voucher tidak ditemukan' });
        }
        // Check if new code already exists (if code is being changed)
        if (code && code.toUpperCase() !== existingVoucher.code) {
            const duplicateVoucher = await prisma_1.default.voucher.findUnique({
                where: { code: code.toUpperCase() }
            });
            if (duplicateVoucher) {
                return res.status(400).json({
                    success: false,
                    error: 'Kode voucher sudah digunakan'
                });
            }
        }
        // Validate percentage discount
        if (type === 'PERCENTAGE' && discount && (discount < 1 || discount > 100)) {
            return res.status(400).json({
                success: false,
                error: 'Diskon persentase harus antara 1 dan 100'
            });
        }
        // Validate fixed amount discount
        if (type === 'FIXED' && discount && discount <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Diskon nominal harus lebih dari 0'
            });
        }
        // Update voucher
        const updatedVoucher = await prisma_1.default.voucher.update({
            where: { id },
            data: {
                code: code ? code.toUpperCase() : existingVoucher.code,
                discount: discount !== undefined ? parseFloat(discount) : existingVoucher.discount,
                type: type || existingVoucher.type,
                minPurchase: minPurchase !== undefined ? (minPurchase ? parseFloat(minPurchase) : null) : existingVoucher.minPurchase,
                maxDiscount: maxDiscount !== undefined ? (maxDiscount ? parseFloat(maxDiscount) : null) : existingVoucher.maxDiscount,
                expiryDate: expiryDate !== undefined ? (expiryDate ? new Date(expiryDate) : null) : existingVoucher.expiryDate,
                maxUsage: maxUsage !== undefined ? (maxUsage ? parseInt(maxUsage) : null) : existingVoucher.maxUsage,
                isActive: isActive !== undefined ? isActive : existingVoucher.isActive
            }
        });
        // Log activity
        try {
            await prisma_1.default.activityLog.create({
                data: {
                    userId: req.user.userId,
                    action: 'UPDATE_VOUCHER',
                    details: `Updated voucher: ${updatedVoucher.code}`,
                    ipAddress: req.ip || 'unknown'
                }
            });
        }
        catch (logError) {
            console.error('Failed to create activity log:', logError);
        }
        res.json({
            success: true,
            message: 'Voucher berhasil diperbarui',
            data: updatedVoucher
        });
    }
    catch (error) {
        console.error('Update voucher error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});
// PUT /api/vouchers/:id/toggle - Toggle voucher status
router.put('/:id/toggle', (0, auth_1.roleMiddleware)(['ADMIN', 'SUPERADMIN']), async (req, res) => {
    try {
        const { id } = req.params;
        const voucher = await prisma_1.default.voucher.findUnique({
            where: { id }
        });
        if (!voucher) {
            return res.status(404).json({ success: false, error: 'Voucher tidak ditemukan' });
        }
        const updatedVoucher = await prisma_1.default.voucher.update({
            where: { id },
            data: { isActive: !voucher.isActive }
        });
        // Log activity
        try {
            await prisma_1.default.activityLog.create({
                data: {
                    userId: req.user.userId,
                    action: 'TOGGLE_VOUCHER',
                    details: `${voucher.isActive ? 'Deactivated' : 'Activated'} voucher: ${voucher.code}`,
                    ipAddress: req.ip || 'unknown'
                }
            });
        }
        catch (logError) {
            console.error('Failed to create activity log:', logError);
        }
        res.json({
            success: true,
            message: `Voucher berhasil ${updatedVoucher.isActive ? 'diaktifkan' : 'dinonaktifkan'}`,
            data: updatedVoucher
        });
    }
    catch (error) {
        console.error('Toggle voucher error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});
// DELETE /api/vouchers/:id - Delete voucher (hard delete dengan pengecekan relasi)
router.delete('/:id', (0, auth_1.roleMiddleware)(['ADMIN', 'SUPERADMIN']), async (req, res) => {
    try {
        const { id } = req.params;
        // Cek apakah voucher ada
        const voucher = await prisma_1.default.voucher.findUnique({
            where: { id },
            include: {
                orders: {
                    take: 1 // Cek apakah ada order yang menggunakan voucher ini
                }
            }
        });
        if (!voucher) {
            return res.status(404).json({
                success: false,
                error: 'Voucher tidak ditemukan'
            });
        }
        // Cek apakah voucher sudah pernah digunakan di order
        if (voucher.orders.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Voucher tidak dapat dihapus karena sudah digunakan dalam pesanan. Gunakan fitur nonaktifkan voucher.'
            });
        }
        // Hard delete voucher (karena tidak ada relasi order)
        await prisma_1.default.voucher.delete({
            where: { id }
        });
        // Log activity
        try {
            await prisma_1.default.activityLog.create({
                data: {
                    userId: req.user.userId,
                    action: 'DELETE_VOUCHER',
                    details: `Deleted voucher: ${voucher.code}`,
                    ipAddress: req.ip || 'unknown'
                }
            });
        }
        catch (logError) {
            console.error('Failed to create activity log:', logError);
        }
        res.json({
            success: true,
            message: 'Voucher berhasil dihapus'
        });
    }
    catch (error) {
        console.error('Delete voucher error:', error);
        // Handle foreign key constraint error
        if (error.code === 'P2003' || error.message.includes('foreign key constraint')) {
            return res.status(400).json({
                success: false,
                error: 'Voucher tidak dapat dihapus karena sudah digunakan. Gunakan fitur nonaktifkan voucher.'
            });
        }
        res.status(500).json({ success: false, error: error.message });
    }
});
// POST /api/vouchers/apply - Apply voucher
router.post('/apply', auth_1.authMiddleware, async (req, res) => {
    try {
        const { code, orderId, cartTotal } = req.body;
        if (!code || (!orderId && !cartTotal)) {
            return res.status(400).json({
                success: false,
                error: 'Kode voucher dan orderId atau cartTotal diperlukan'
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
        // Check minimum purchase
        let total = 0;
        if (orderId) {
            const order = await prisma_1.default.order.findUnique({
                where: { id: orderId }
            });
            if (!order) {
                return res.status(404).json({
                    success: false,
                    error: 'Pesanan tidak ditemukan'
                });
            }
            total = order.total || 0;
        }
        else {
            total = parseFloat(cartTotal) || 0;
        }
        if (voucher.minPurchase && total < voucher.minPurchase) {
            return res.status(400).json({
                success: false,
                error: `Minimal pembelian ${voucher.minPurchase} untuk menggunakan voucher ini`
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
        }
        const finalTotal = Math.max(0, total - discountAmount);
        // Update usage count
        await prisma_1.default.voucher.update({
            where: { id: voucher.id },
            data: {
                usageCount: voucher.usageCount + 1
            }
        });
        // Jika ada orderId, update order dengan voucher
        if (orderId) {
            await prisma_1.default.order.update({
                where: { id: orderId },
                data: {
                    voucherId: voucher.id
                }
            });
        }
        // Log activity
        try {
            await prisma_1.default.activityLog.create({
                data: {
                    userId: req.user.userId,
                    action: 'APPLY_VOUCHER',
                    details: `Applied voucher ${voucher.code} - Discount: ${discountAmount}`,
                    ipAddress: req.ip || 'unknown'
                }
            });
        }
        catch (logError) {
            console.error('Failed to create activity log:', logError);
        }
        res.json({
            success: true,
            message: 'Voucher berhasil digunakan',
            data: {
                voucher,
                originalTotal: total,
                discountAmount,
                finalTotal
            }
        });
    }
    catch (error) {
        console.error('Apply voucher error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});
exports.default = router;
