import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        error: 'No token provided' 
      });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'bloom-sisters-secret-key-2024'
    ) as any;
    
    // PERBAIKI: Pastikan userId ada
    const userId = decoded.userId || decoded.id || decoded.sub;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid token: No user ID found' 
      });
    }
    
    // Tambahkan user ke request object
    (req as any).user = {
      userId: userId, // INI YANG DIPAKAI DI VOUCHER ROUTES
      username: decoded.username,
      email: decoded.email,
      role: decoded.role
    };
    
    next();
  } catch (error: any) {
    return res.status(401).json({ 
      success: false, 
      error: 'Invalid or expired token' 
    });
  }
};

export const roleMiddleware = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user as {
      userId: string;
      username: string;
      email: string;
      role: string;
    } | undefined;
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Authentication required' 
      });
    }
    
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({ 
        success: false, 
        error: 'Insufficient permissions' 
      });
    }
    
    next();
  };
};