"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// backend/src/api/categories/index.ts
const express_1 = require("express");
const prisma_1 = __importDefault(require("../../lib/prisma"));
const router = (0, express_1.Router)();
// GET /api/categories - Get all product categories (PUBLIC - tanpa auth)
router.get('/', async (req, res) => {
    try {
        // Ambil SEMUA kategori dari produk yang aktif
        const categories = await prisma_1.default.product.findMany({
            distinct: ['category'],
            select: {
                category: true
            },
            where: {
                active: true,
                // HAPUS filter kategori spesifik
                // category: {
                //   in: ['Valentine', 'Graduation', 'Custom'] // DIHAPUS
                // }
            },
            orderBy: {
                category: 'asc'
            }
        });
        // Format response
        const categoryList = categories
            .map(c => c.category)
            .filter(c => c && c.trim() !== '');
        // Jika tidak ada kategori, gunakan default
        if (categoryList.length === 0) {
            categoryList.push('Valentine', 'Graduation', 'Custom');
        }
        res.json({
            success: true,
            data: categoryList
        });
    }
    catch (error) {
        console.error('Error getting categories:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            data: ['Valentine', 'Graduation', 'Custom'] // Fallback data
        });
    }
});
exports.default = router;
