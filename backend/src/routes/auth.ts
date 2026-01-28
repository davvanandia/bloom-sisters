import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { register, login, googleAuth, verifyToken } from '../controllers/authController';
import prisma from '../lib/prisma';

const router = Router();

// Route debug untuk melihat semua user
router.get('/debug/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        password: true, // Tampilkan password hash untuk debugging
        createdAt: true
      }
    });
    
    // Mask password for security logging
    const maskedUsers = users.map(user => ({
      ...user,
      password: user.password ? 
        `[HASH: ${user.password.substring(0, 10)}...${user.password.substring(user.password.length - 5)}]` : 
        null
    }));
    
    res.json({
      success: true,
      count: users.length,
      users: maskedUsers
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Route debug untuk test bcrypt
router.get('/debug/test-bcrypt', async (req, res) => {
  try {
    const testPassword = 'admin123';
    const hash = await bcrypt.hash(testPassword, 10);
    const compareResult = await bcrypt.compare(testPassword, hash);
    
    res.json({
      success: true,
      testPassword,
      hash,
      compareResult,
      hashLength: hash.length,
      hashStartsWith: hash.substring(0, 7)
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth);
router.get('/verify', verifyToken);

export default router;