import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';

export const register = async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;

    // Validasi input
    if (!username || !email || !password) {
      return res.status(400).json({ 
        success: false,
        error: 'All fields are required' 
      });
    }

    // Validasi email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid email format' 
      });
    }

    // Validasi password strength
    if (password.length < 6) {
      return res.status(400).json({ 
        success: false,
        error: 'Password must be at least 6 characters' 
      });
    }

    // Cek jika user sudah ada
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }]
      }
    });

    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        error: 'User already exists',
        field: existingUser.email === email ? 'email' : 'username'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Buat user baru
    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        role: 'USER' // Default role
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

    // Hapus password dari response
    const { password: _, ...userWithoutPassword } = user;

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: userWithoutPassword,
      token
    });

  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    // DEBUG: Log request
    console.log('🔍 LOGIN ATTEMPT:', { 
      email, 
      passwordLength: password?.length,
      timestamp: new Date().toISOString() 
    });

    if (!email || !password) {
      console.log('❌ Missing email or password');
      return res.status(400).json({ 
        success: false,
        error: 'Email and password are required' 
      });
    }

    // Cari user by email
    console.log(`🔍 Searching for user with email: ${email}`);
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      console.log(`❌ User not found for email: ${email}`);
      return res.status(401).json({ 
        success: false,
        error: 'Invalid email or password' 
      });
    }

    // DEBUG: Log user data (excluding password for security)
    console.log('👤 USER FOUND:', {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      hasPassword: !!user.password,
      passwordLength: user.password?.length
    });

    // Periksa jika user menggunakan Google login (tidak punya password)
    if (!user.password) {
      console.log('⚠️ User has no password (Google login)');
      return res.status(401).json({ 
        success: false,
        error: 'Please login with Google or reset your password' 
      });
    }

    // Verify password
    console.log('🔐 Comparing password...');
    console.log(`   Input password: ${password.substring(0, 3)}... (length: ${password.length})`);
    console.log(`   Stored hash: ${user.password.substring(0, 20)}... (length: ${user.password.length})`);
    
    const isValidPassword = await bcrypt.compare(password, user.password);
    console.log(`✅ Password comparison result: ${isValidPassword}`);
    
    if (!isValidPassword) {
      console.log('❌ Password mismatch!');
      return res.status(401).json({ 
        success: false,
        error: 'Invalid email or password' 
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

    // Hapus password dari response
    const { password: _, ...userWithoutPassword } = user;

    console.log(`🎉 Login successful for: ${user.email}`);
    
    res.json({
      success: true,
      message: 'Login successful',
      user: userWithoutPassword,
      token
    });

  } catch (error: any) {
    console.error('🔥 LOGIN ERROR:', error);
    console.error('🔥 Error stack:', error.stack);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const googleAuth = async (req: Request, res: Response) => {
  try {
    const { email, name, googleId, imageUrl } = req.body;

    if (!email || !googleId) {
      return res.status(400).json({ 
        success: false,
        error: 'Email and Google ID are required' 
      });
    }

    // Generate username dari email jika name tidak tersedia
    const username = name || email.split('@')[0] + Math.random().toString(36).substring(2, 7);

    // Cari user by email atau googleId
    let user = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { googleId }]
      }
    });

    // Jika user tidak ada, buat baru
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          username,
          googleId,
          role: 'USER'
        }
      });
    } else if (!user.googleId) {
      // Update existing user dengan googleId jika belum ada
      user = await prisma.user.update({
        where: { id: user.id },
        data: { googleId }
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

    // Hapus password dari response
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: 'Google authentication successful',
      user: userWithoutPassword,
      token
    });

  } catch (error: any) {
    console.error('Google auth error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Tambahkan fungsi untuk cek token/user
export const verifyToken = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        error: 'No token provided' 
      });
    }

    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'bloom-sisters-secret-key-2024'
    ) as any;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
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
      return res.status(401).json({ 
        success: false,
        error: 'User not found' 
      });
    }

    res.json({
      success: true,
      user,
      token
    });

  } catch (error: any) {
    console.error('Token verification error:', error);
    res.status(401).json({ 
      success: false,
      error: 'Invalid or expired token' 
    });
  }
};