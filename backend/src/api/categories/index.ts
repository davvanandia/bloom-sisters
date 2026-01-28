// backend/src/api/categories/index.ts
import { Router } from 'express';
import prisma from '../../lib/prisma';

const router = Router();

// GET /api/categories - Get all product categories (PUBLIC - tanpa auth)
router.get('/', async (req, res) => {
  try {
    // Ambil SEMUA kategori dari produk yang aktif
    const categories = await prisma.product.findMany({
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
  } catch (error: any) {
    console.error('Error getting categories:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      data: ['Valentine', 'Graduation', 'Custom'] // Fallback data
    });
  }
});

export default router;