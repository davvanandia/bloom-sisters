import { Request } from 'express';

declare global {
  namespace Express {
    interface User {
      userId: string;
      username: string;
      email: string;
      role: string;
    }
    
    interface Request {
      user?: User;
    }
  }
}

export interface AuthRequest extends Request {
  user: {
    userId: string;
    username: string;
    email: string;
    role: string;
  };
}