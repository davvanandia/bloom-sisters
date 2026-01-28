// backend/src/api/products/index.ts
import { Router } from 'express';
import { authMiddleware, roleMiddleware } from '../../middleware/auth';
import { uploadMultiple, deleteFile } from '../../middleware/upload';
import prisma from '../../lib/prisma';
import { z } from 'zod';
import path from 'path';

const router = Router();

// Schema validasi untuk product
const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  price: z.number().positive('Price must be positive'),
  stock: z.number().int().nonnegative('Stock must be non-negative'),
  category: z.string().min(1, 'Category is required'),
  featured: z.boolean().default(false),
  active: z.boolean().default(true),
  tags: z.array(z.string()).optional().default([]),
  weight: z.number().positive().optional(),
  dimensions: z.string().optional(),
});

// Helper untuk generate slug
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// 🔵 GET /api/products - Get all products (PUBLIC - tanpa auth)
router.get('/', async (req, res) => {
  try {
    const {
      page = '1',
      limit = '10',
      category,
      featured,
      active = 'true', // Default true untuk public
      minPrice,
      maxPrice,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build filter - untuk public hanya tampilkan produk aktif
    const where: any = {
      active: true
    };

    if (category) where.category = category;
    if (featured !== undefined) where.featured = featured === 'true';
    
    // Cek jika user adalah admin (dari token)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET!);
        
        // Jika admin, bisa filter berdasarkan active
        if (decoded.role === 'ADMIN' || decoded.role === 'SUPERADMIN') {
          delete where.active; // Admin bisa lihat semua
          if (active !== undefined) where.active = active === 'true';
        }
      } catch (error) {
        // Token invalid, tetap sebagai public user
        console.log('Token invalid or expired, using public access');
      }
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice as string);
      if (maxPrice) where.price.lte = parseFloat(maxPrice as string);
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
        { tags: { has: search as string } }
      ];
    }

    // Validasi sortBy
    const allowedSortFields = ['name', 'price', 'createdAt', 'updatedAt', 'stock'];
    const sortField = allowedSortFields.includes(sortBy as string) ? sortBy : 'createdAt';

    // Get total count
    const total = await prisma.product.count({ where });

    // Get products
    const products = await prisma.product.findMany({
      where,
      orderBy: { [sortField as string]: sortOrder as 'asc' | 'desc' },
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
  } catch (error: any) {
    console.error('Error getting products:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// 🔵 GET /api/products/:id - Get product by ID (PUBLIC - tanpa auth)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Cek jika user adalah admin (dari token)
    let isAdmin = false;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET!);
        isAdmin = decoded.role === 'ADMIN' || decoded.role === 'SUPERADMIN';
      } catch (error) {
        // Token invalid, bukan admin
        console.log('Token invalid or expired, using public access');
      }
    }

    // Build where condition
    const where: any = { id };
    // Public users hanya bisa melihat produk aktif
    if (!isAdmin) {
      where.active = true;
    }

    const product = await prisma.product.findUnique({
      where,
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
  } catch (error: any) {
    console.error('Error getting product:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// 🟠 Routes berikutnya memerlukan auth (Admin only)
// Gunakan authMiddleware sebelum roleMiddleware

// POST /api/products - Create product dengan gambar (Admin only)
router.post('/', authMiddleware, roleMiddleware(['ADMIN', 'SUPERADMIN']), uploadMultiple, async (req: any, res) => {
  try {
    // Validasi user
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    // Parse body data
    const {
      name,
      description,
      price,
      stock,
      category,
      featured = 'false',
      active = 'true',
      tags,
      weight,
      dimensions
    } = req.body;

    // Parse tags dari string JSON
    let parsedTags: string[] = [];
    if (tags) {
      try {
        parsedTags = JSON.parse(tags);
      } catch (error) {
        parsedTags = typeof tags === 'string' ? tags.split(',').map(tag => tag.trim()) : [];
      }
    }

    // Validasi data
const validationResult = productSchema.safeParse({
  name,
  description,
  price: parseFloat(price), // Langsung parse float, TANPA konversi
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
        req.files.forEach((file: any) => deleteFile(file.filename));
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
    const existingProduct = await prisma.product.findUnique({
      where: { slug }
    });

    if (existingProduct) {
      // Hapus file yang sudah diupload
      if (req.files && Array.isArray(req.files)) {
        req.files.forEach((file: any) => deleteFile(file.filename));
      }
      return res.status(400).json({ 
        success: false, 
        error: 'Product with similar name already exists' 
      });
    }

    // Get uploaded files
    const imageFiles = req.files as Express.Multer.File[];
    const imageNames = imageFiles.map(file => file.filename);

    // Create product
    const product = await prisma.product.create({
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
  } catch (error: any) {
    console.error('Error creating product:', error);
    
    // Hapus file yang sudah diupload jika ada error
    if (req.files && Array.isArray(req.files)) {
      req.files.forEach((file: any) => deleteFile(file.filename));
    }
    
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// PUT /api/products/:id - Update product dengan gambar (Admin only)
router.put('/:id', authMiddleware, roleMiddleware(['ADMIN', 'SUPERADMIN']), uploadMultiple, async (req: any, res) => {
  try {
    const { id } = req.params;
    
    // Check if product exists
    const existingProduct = await prisma.product.findUnique({ where: { id } });
    if (!existingProduct) {
      // Hapus file baru yang sudah diupload jika produk tidak ditemukan
      if (req.files && Array.isArray(req.files)) {
        req.files.forEach((file: any) => deleteFile(file.filename));
      }
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    // Parse body data
    const {
      name,
      description,
      price,
      stock,
      category,
      featured,
      active,
      tags,
      weight,
      dimensions,
      deleteImages // Array of image names to delete
    } = req.body;

    // Parse tags
    let parsedTags: string[] = existingProduct.tags;
    if (tags) {
      try {
        parsedTags = JSON.parse(tags);
      } catch (error) {
        parsedTags = typeof tags === 'string' ? tags.split(',').map(tag => tag.trim()) : existingProduct.tags;
      }
    }

    // Prepare update data
    const updateData: any = {
      name: name || existingProduct.name,
      description: description !== undefined ? description : existingProduct.description,
      price: price ? parseFloat(price) : existingProduct.price,
      stock: stock !== undefined ? parseInt(stock) : existingProduct.stock,
      category: category || existingProduct.category,
      featured: featured !== undefined ? featured === 'true' : existingProduct.featured,
      active: active !== undefined ? active === 'true' : existingProduct.active,
      tags: parsedTags,
    };

    if (weight !== undefined) updateData.weight = weight ? parseFloat(weight) : null;
    if (dimensions !== undefined) updateData.dimensions = dimensions;

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
          imagesToDelete.forEach((imgName: string) => {
            const baseName = path.basename(imgName);
            deleteFile(baseName);
          });
          
          // Filter gambar yang akan disimpan
          imagesToKeep = imagesToKeep.filter(img => !imagesToDelete.includes(img));
        }
      } catch (error) {
        console.error('Error parsing deleteImages:', error);
      }
    }

    // Tambahkan gambar baru
    const imageFiles = req.files as Express.Multer.File[];
    if (imageFiles && imageFiles.length > 0) {
      const newImageNames = imageFiles.map(file => file.filename);
      imagesToKeep = [...imagesToKeep, ...newImageNames];
    }

    updateData.images = imagesToKeep;

    // Update product
    const product = await prisma.product.update({
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
  } catch (error: any) {
    console.error('Error updating product:', error);
    
    // Hapus file baru yang sudah diupload jika ada error
    if (req.files && Array.isArray(req.files)) {
      req.files.forEach((file: any) => deleteFile(file.filename));
    }
    
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// DELETE /api/products/:id - Delete product (Admin only)
router.delete('/:id', authMiddleware, roleMiddleware(['ADMIN', 'SUPERADMIN']), async (req: any, res) => {
  try {
    const { id } = req.params;
    
    // Check if product exists
    const existingProduct = await prisma.product.findUnique({ 
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
        deleteFile(imgName);
      });
    }

    // Delete product
    await prisma.product.delete({ where: { id } });
    
    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting product:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

export default router;