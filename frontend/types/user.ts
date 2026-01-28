export interface User {
  id: string;
  username: string;
  email: string;
  role: 'SUPERADMIN' | 'ADMIN' | 'USER';
  createdAt?: string;
  updatedAt?: string;
  accountStatus?: string;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  role: 'SUPERADMIN' | 'ADMIN' | 'USER';
}

export interface UpdateUserRequest {
  username: string;
  email: string;
  role: 'SUPERADMIN' | 'ADMIN' | 'USER';
}

export interface UserStats {
  orderCount: number;
  totalSpent: number;
  accountStatus: string;
  lastLogin: string;
}