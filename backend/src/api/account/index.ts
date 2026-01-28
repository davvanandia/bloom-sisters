import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth';
import prisma from '../../lib/prisma';

const router = Router();

// Apply auth middleware untuk semua routes
router.use(authMiddleware);

// GET /api/account/status - Get account status
router.get('/status', async (req: any, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    // Get user stats
    const orderCount = await prisma.order.count({
      where: { userId: req.user.userId }
    });
    
    const totalSpent = await prisma.order.aggregate({
      where: { 
        userId: req.user.userId,
        status: { not: 'CANCELLED' }
      },
      _sum: { total: true }
    });
    
    res.json({
      success: true,
      data: {
        user,
        stats: {
          orderCount,
          totalSpent: totalSpent._sum.total || 0
        },
        accountStatus: 'ACTIVE', // You can add more logic here
        lastLogin: new Date().toISOString()
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;