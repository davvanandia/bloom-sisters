"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// backend/src/api/products/index.ts
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const upload_1 = require("../../middleware/upload");
const prisma_1 = __importDefault(require("../../lib/prisma"));
const zod_1 = require("zod");
const path_1 = __importDefault(require("path"));
const router = (0, express_1.Router)();
// Schema validasi untuk product
const productSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Name is required'),
    description: zod_1.z.string().optional(),
    price: zod_1.z.number().positive('Price must be positive'),
    stock: zod_1.z.number().int().nonnegative('Stock must be non-negative'),
    category: zod_1.z.string().min(1, 'Category is required'),
    featured: zod_1.z.boolean().default(false),
    active: zod_1.z.boolean().default(true),
    tags: zod_1.z.array(zod_1.z.string()).optional().default([]),
    weight: zod_1.z.number().positive().optional(),
    dimensions: zod_1.z.string().optional(),
});
// Helper untuk generate slug
const generateSlug = (name) => {
    return name
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
};
// Apply auth middleware untuk semua routes
router.use(auth_1.authMiddleware);
// GET /api/products - Get all products (public) dengan filter
router.get('/', async (req, res) => {
    try {
        const { page = '1', limit = '10', category, featured, active, minPrice, maxPrice, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        // Build filter
        const where = {};
        if (category)
            where.category = category;
        if (featured !== undefined)
            where.featured = featured === 'true';
        if (active !== undefined)
            where.active = active === 'true';
        if (minPrice !== undefined || maxPrice !== undefined) {
            where.price = {};
            if (minPrice)
                where.price.gte = parseFloat(minPrice);
            if (maxPrice)
                where.price.lte = parseFloat(maxPrice);
        }
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { tags: { has: search } }
            ];
        }
        // Validasi sortBy
        const allowedSortFields = ['name', 'price', 'createdAt', 'updatedAt', 'stock'];
        const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
        // Get total count
        const total = await prisma_1.default.product.count({ where });
        // Get products
        const products = await prisma_1.default.product.findMany({
            where,
            orderBy: { [sortField]: sortOrder },
            skip,
            take: limitNum,
            include: {
                orderItems: {
                    select: {
                        id: true,
                        quantity: true,
                        price: true,
                    }
                }
            }
        });
        // Format response dengan URL gambar
        const formattedProducts = products.map(product => ({
            ...product,
            images: product.images.map(img => `/uploads/products/${img}`)
        }));
        res.json({
            success: true,
            data: formattedProducts,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum)
            }
        });
    }
    catch (error) {
        console.error('Error getting products:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});
// GET /api/products/:id - Get product by ID (public)
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const product = await prisma_1.default.product.findUnique({
            where: { id },
            include: {
                orderItems: {
                    select: {
                        id: true,
                        quantity: true,
                        price: true,
                        order: {
                            select: {
                                id: true,
                                status: true,
                                createdAt: true
                            }
                        }
                    }
                }
            }
        });
        if (!product) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }
        // Format response dengan URL gambar
        const formattedProduct = {
            ...product,
            images: product.images.map(img => `/uploads/products/${img}`)
        };
        res.json({ success: true, data: formattedProduct });
    }
    catch (error) {
        console.error('Error getting product:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});
// POST /api/products - Create product dengan gambar (Admin only)
router.post('/', (0, auth_1.roleMiddleware)(['ADMIN', 'SUPERADMIN']), upload_1.uploadMultiple, async (req, res) => {
    try {
        // Validasi user
        if (!req.user) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }
        // Parse body data
        const { name, description, price, stock, category, featured = 'false', active = 'true', tags, weight, dimensions } = req.body;
        // Parse tags dari string JSON
        let parsedTags = [];
        if (tags) {
            try {
                parsedTags = JSON.parse(tags);
            }
            catch (error) {
                parsedTags = typeof tags === 'string' ? tags.split(',').map(tag => tag.trim()) : [];
            }
        }
        // Validasi data
        const validationResult = productSchema.safeParse({
            name,
            description,
            price: parseFloat(price),
            stock: parseInt(stock),
            category,
            featured: featured === 'true',
            active: active === 'true',
            tags: parsedTags,
            weight: weight ? parseFloat(weight) : undefined,
            dimensions
        });
        if (!validationResult.success) {
            // Hapus file yang sudah diupload jika validasi gagal
            if (req.files && Array.isArray(req.files)) {
                req.files.forEach((file) => (0, upload_1.deleteFile)(file.filename));
            }
            return res.status(400).json({
                success: false,
                error: 'Validation error',
                details: validationResult.error.errors
            });
        }
        // Generate slug dari name
        const slug = generateSlug(name);
        // Check if slug already exists
        const existingProduct = await prisma_1.default.product.findUnique({
            where: { slug }
        });
        if (existingProduct) {
            // Hapus file yang sudah diupload
            if (req.files && Array.isArray(req.files)) {
                req.files.forEach((file) => (0, upload_1.deleteFile)(file.filename));
            }
            return res.status(400).json({
                success: false,
                error: 'Product with similar name already exists'
            });
        }
        // Get uploaded files
        const imageFiles = req.files;
        const imageNames = imageFiles.map(file => file.filename);
        // Create product
        const product = await prisma_1.default.product.create({
            data: {
                ...validationResult.data,
                slug,
                images: imageNames,
                tags: parsedTags
            }
        });
        // Format response dengan URL gambar
        const formattedProduct = {
            ...product,
            images: product.images.map(img => `/uploads/products/${img}`)
        };
        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            data: formattedProduct
        });
    }
    catch (error) {
        console.error('Error creating product:', error);
        // Hapus file yang sudah diupload jika ada error
        if (req.files && Array.isArray(req.files)) {
            req.files.forEach((file) => (0, upload_1.deleteFile)(file.filename));
        }
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
// PUT /api/products/:id - Update product dengan gambar (Admin only)
router.put('/:id', (0, auth_1.roleMiddleware)(['ADMIN', 'SUPERADMIN']), upload_1.uploadMultiple, async (req, res) => {
    try {
        const { id } = req.params;
        // Check if product exists
        const existingProduct = await prisma_1.default.product.findUnique({ where: { id } });
        if (!existingProduct) {
            // Hapus file baru yang sudah diupload jika produk tidak ditemukan
            if (req.files && Array.isArray(req.files)) {
                req.files.forEach((file) => (0, upload_1.deleteFile)(file.filename));
            }
            return res.status(404).json({ success: false, error: 'Product not found' });
        }
        // Parse body data
        const { name, description, price, stock, category, featured, active, tags, weight, dimensions, deleteImages // Array of image names to delete
         } = req.body;
        // Parse tags
        let parsedTags = existingProduct.tags;
        if (tags) {
            try {
                parsedTags = JSON.parse(tags);
            }
            catch (error) {
                parsedTags = typeof tags === 'string' ? tags.split(',').map(tag => tag.trim()) : existingProduct.tags;
            }
        }
        // Prepare update data
        const updateData = {
            name: name || existingProduct.name,
            description: description !== undefined ? description : existingProduct.description,
            price: price ? parseFloat(price) : existingProduct.price,
            stock: stock !== undefined ? parseInt(stock) : existingProduct.stock,
            category: category || existingProduct.category,
            featured: featured !== undefined ? featured === 'true' : existingProduct.featured,
            active: active !== undefined ? active === 'true' : existingProduct.active,
            tags: parsedTags,
        };
        if (weight !== undefined)
            updateData.weight = weight ? parseFloat(weight) : null;
        if (dimensions !== undefined)
            updateData.dimensions = dimensions;
        // Generate slug baru jika nama berubah
        if (name && name !== existingProduct.name) {
            updateData.slug = generateSlug(name);
        }
        // Handle images
        let imagesToKeep = existingProduct.images;
        // Hapus gambar yang diminta
        if (deleteImages) {
            try {
                const imagesToDelete = JSON.parse(deleteImages);
                if (Array.isArray(imagesToDelete)) {
                    // Hapus file dari storage
                    imagesToDelete.forEach((imgName) => {
                        const baseName = path_1.default.basename(imgName);
                        (0, upload_1.deleteFile)(baseName);
                    });
                    // Filter gambar yang akan disimpan
                    imagesToKeep = imagesToKeep.filter(img => !imagesToDelete.includes(img));
                }
            }
            catch (error) {
                console.error('Error parsing deleteImages:', error);
            }
        }
        // Tambahkan gambar baru
        const imageFiles = req.files;
        if (imageFiles && imageFiles.length > 0) {
            const newImageNames = imageFiles.map(file => file.filename);
            imagesToKeep = [...imagesToKeep, ...newImageNames];
        }
        updateData.images = imagesToKeep;
        // Update product
        const product = await prisma_1.default.product.update({
            where: { id },
            data: updateData
        });
        // Format response dengan URL gambar
        const formattedProduct = {
            ...product,
            images: product.images.map(img => `/uploads/products/${img}`)
        };
        res.json({
            success: true,
            message: 'Product updated successfully',
            data: formattedProduct
        });
    }
    catch (error) {
        console.error('Error updating product:', error);
        // Hapus file baru yang sudah diupload jika ada error
        if (req.files && Array.isArray(req.files)) {
            req.files.forEach((file) => (0, upload_1.deleteFile)(file.filename));
        }
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
// DELETE /api/products/:id - Delete product (Admin only)
router.delete('/:id', (0, auth_1.roleMiddleware)(['ADMIN', 'SUPERADMIN']), async (req, res) => {
    try {
        const { id } = req.params;
        // Check if product exists
        const existingProduct = await prisma_1.default.product.findUnique({
            where: { id },
            include: {
                orderItems: {
                    take: 1
                }
            }
        });
        if (!existingProduct) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }
        // Check if product has orders
        if (existingProduct.orderItems.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Cannot delete product with existing orders. Set to inactive instead.'
            });
        }
        // Hapus file gambar
        if (existingProduct.images && existingProduct.images.length > 0) {
            existingProduct.images.forEach(imgName => {
                (0, upload_1.deleteFile)(imgName);
            });
        }
        // Delete product
        await prisma_1.default.product.delete({ where: { id } });
        res.json({
            success: true,
            message: 'Product deleted successfully'
        });
    }
    catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
// GET /api/products/categories - Get all product categories
router.get('/api/categories', async (req, res) => {
    try {
        const categories = await prisma_1.default.product.findMany({
            distinct: ['category'],
            select: {
                category: true
            },
            where: {
                active: true
            }
        });
        res.json({
            success: true,
            data: categories.map(c => c.category)
        });
    }
    catch (error) {
        console.error('Error getting categories:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});
exports.default = router;
