// frontend/services/productService.ts
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Setup axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor untuk menambahkan token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor untuk handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear local storage jika unauthorized
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export interface ProductFilters {
  page?: number;
  limit?: number;
  category?: string;
  featured?: boolean;
  active?: boolean;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateProductData {
  name: string;
  description?: string;
  price: number;
  stock: number;
  category: string;
  images: File[];
  featured?: boolean;
  active?: boolean;
  tags?: string[];
  weight?: number;
  dimensions?: string;
}

export interface UpdateProductData {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  category?: string;
  featured?: boolean;
  active?: boolean;
  tags?: string[];
  weight?: number;
  dimensions?: string;
  deleteImages?: string[];
  images?: File[];
}

export const productService = {
  // Get all products with filters
  async getProducts(filters: ProductFilters = {}) {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`/products?${params.toString()}`);
    return response.data;
  },

  // Get product by ID
  async getProductById(id: string) {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  // Create product
  async createProduct(data: CreateProductData) {
    const formData = new FormData();
    
    // Append all fields
    formData.append('name', data.name);
    if (data.description) formData.append('description', data.description);
    formData.append('price', data.price.toString());
    formData.append('stock', data.stock.toString());
    formData.append('category', data.category);
    if (data.featured !== undefined) formData.append('featured', data.featured.toString());
    if (data.active !== undefined) formData.append('active', data.active.toString());
    if (data.tags) formData.append('tags', JSON.stringify(data.tags));
    if (data.weight) formData.append('weight', data.weight.toString());
    if (data.dimensions) formData.append('dimensions', data.dimensions);
    
    // Append images
    data.images.forEach((image) => {
      formData.append('images', image);
    });

    const response = await api.post('/products', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Update product
  async updateProduct(id: string, data: UpdateProductData) {
    const formData = new FormData();
    
    // Append updated fields
    if (data.name) formData.append('name', data.name);
    if (data.description !== undefined) formData.append('description', data.description);
    if (data.price !== undefined) formData.append('price', data.price.toString());
    if (data.stock !== undefined) formData.append('stock', data.stock.toString());
    if (data.category) formData.append('category', data.category);
    if (data.featured !== undefined) formData.append('featured', data.featured.toString());
    if (data.active !== undefined) formData.append('active', data.active.toString());
    if (data.tags !== undefined) formData.append('tags', JSON.stringify(data.tags));
    if (data.weight !== undefined) formData.append('weight', data.weight?.toString() || '');
    if (data.dimensions !== undefined) formData.append('dimensions', data.dimensions || '');
    
    // Append images to delete
    if (data.deleteImages && data.deleteImages.length > 0) {
      formData.append('deleteImages', JSON.stringify(data.deleteImages));
    }
    
    // Append new images
    if (data.images && data.images.length > 0) {
      data.images.forEach((image) => {
        formData.append('images', image);
      });
    }

    const response = await api.put(`/products/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Delete product
  async deleteProduct(id: string) {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },

  // Get categories
  async getCategories() {
    const response = await api.get('/products/api/categories');
    return response.data;
  },

  // Toggle product status
  async toggleProductStatus(id: string, active: boolean) {
    const response = await api.put(`/products/${id}`, { active });
    return response.data;
  },

  // Toggle featured status
  async toggleFeaturedStatus(id: string, featured: boolean) {
    const response = await api.put(`/products/${id}`, { featured });
    return response.data;
  },
};

export default productService;