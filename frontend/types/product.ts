// frontend/types/product.ts
export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  stock: number;
  category: string;
  images: string[]; // Array of image URLs
  featured: boolean;
  active: boolean;
  rating?: number;
  reviewCount: number;
  tags: string[];
  weight?: number;
  dimensions?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductFormData {
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  images: File[];
  featured: boolean;
  active: boolean;
  tags: string[];
  weight?: number;
  dimensions?: string;
  existingImages?: string[];
  deleteImages?: string[];
}

export interface ProductFilter {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  featured?: boolean;
  active?: boolean;
  search?: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  productCount: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}