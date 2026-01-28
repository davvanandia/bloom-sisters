import { Router, Request, Response } from 'express';
import prisma from '../../lib/prisma';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { 
  sendPasswordResetEmail, 
  verifySMTPConnection,
  sendPasswordResetConfirmation 
} from '../../lib/email';

const router = Router();

// Endpoint untuk mengecek koneksi SMTP
router.get('/email-test', async (req: Request, res: Response) => {
  try {
    const isConnected = await verifySMTPConnection();
    
    if (!isConnected) {
      return res.status(500).json({
        success: false,
        error: 'SMTP connection failed. Check your email configuration.'
      });
    }
    
    res.json({
      success: true,
      message: 'SMTP connection is working properly',
      config: {
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        user: process.env.EMAIL_USER?.substring(0, 3) + '...'
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/auth/login - Login user
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email and password are required' 
      });
    }
    
    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid credentials' 
      });
    }
    
    // Check password
    const bcrypt = require('bcryptjs');
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid credentials' 
      });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET || 'bloom-sisters-secret-key-2024',
      { expiresIn: '7d' }
    );
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: userWithoutPassword
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/auth/register - Register new user
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;
    
    // Validasi
    if (!username || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Username, email, and password are required' 
      });
    }
    
    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }]
      }
    });
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User already exists'
      });
    }
    
    // Hash password
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        role: 'USER'
      }
    });
    
    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET || 'bloom-sisters-secret-key-2024',
      { expiresIn: '7d' }
    );
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: userWithoutPassword
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/auth/forgot-password - Request password reset
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email is required' 
      });
    }
    
    // Validasi format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a valid email address'
      });
    }
    
    // Cek apakah email terdaftar
    const user = await prisma.user.findUnique({ where: { email } });
    
    // Untuk keamanan, selalu return success meski email tidak ditemukan
    if (!user) {
      return res.json({ 
        success: true, 
        message: 'If the email exists in our system, you will receive a reset link shortly.' 
      });
    }
    
    // Generate reset token (6 digit angka)
    const resetToken = crypto.randomInt(100000, 999999).toString();
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 jam dari sekarang
    
    // Simpan token ke database
    await prisma.user.update({
      where: { email },
      data: {
        resetToken,
        resetTokenExpiry
      }
    });
    
    // Kirim email reset password
    const emailResult = await sendPasswordResetEmail(
      email, 
      user.username, 
      resetToken
    );
    
    if (!emailResult.success) {
      console.error('Email sending failed:', emailResult.error);
      
      // Jika gagal mengirim email, hapus token dari database
      await prisma.user.update({
        where: { email },
        data: {
          resetToken: null,
          resetTokenExpiry: null
        }
      });
      
      return res.status(500).json({
        success: false,
        error: 'Failed to send reset email. Please try again later.',
        debug: process.env.NODE_ENV ? emailResult.error : undefined
      });
    }
    
    res.json({
      success: true,
      message: 'If the email exists in our system, you will receive a reset link shortly.',
      // Hanya di development, kirim token untuk testing
      ...(process.env.NODE_ENV && { 
        resetToken,
        note: 'Token shown only in development mode'
      })
    });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'An unexpected error occurred. Please try again later.' 
    });
  }
});

// POST /api/auth/verify-reset-token - Verify reset token
router.post('/verify-reset-token', async (req: Request, res: Response) => {
  try {
    const { email, token } = req.body;
    
    if (!email || !token) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email and token are required' 
      });
    }
    
    const user = await prisma.user.findUnique({ 
      where: { email } 
    });
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }
    
    // Cek apakah token valid dan belum expired
    if (!user.resetToken || user.resetToken !== token) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid reset token' 
      });
    }
    
    if (!user.resetTokenExpiry || new Date() > user.resetTokenExpiry) {
      return res.status(400).json({ 
        success: false, 
        error: 'Reset token has expired' 
      });
    }
    
    res.json({
      success: true,
      message: 'Token is valid'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/auth/reset-password - Reset password with token
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { email, token, newPassword } = req.body;
    
    if (!email || !token || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email, token, and new password are required' 
      });
    }
    
    // Validasi password
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters'
      });
    }
    
    const user = await prisma.user.findUnique({ 
      where: { email } 
    });
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }
    
    // Cek apakah token valid dan belum expired
    if (!user.resetToken || user.resetToken !== token) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid reset token' 
      });
    }
    
    if (!user.resetTokenExpiry || new Date() > user.resetTokenExpiry) {
      // Hapus token yang sudah expired
      await prisma.user.update({
        where: { email },
        data: {
          resetToken: null,
          resetTokenExpiry: null
        }
      });
      
      return res.status(400).json({ 
        success: false, 
        error: 'Reset token has expired. Please request a new one.' 
      });
    }
    
    // Hash password baru
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password dan clear reset token
    await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null
      }
    });
    
    // Kirim email konfirmasi
    await sendPasswordResetConfirmation(email, user.username);
    
    res.json({
      success: true,
      message: 'Password has been reset successfully'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Ekspor router sebagai default
export default router;