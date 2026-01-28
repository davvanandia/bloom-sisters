'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import DashboardHeader from '@/components/DashboardHeader';
import ProductTable from '@/components/products/ProductTable';
import ProductFilters from '@/components/products/ProductFilters';
import ProductFormModal from '@/components/products/ProductFormModal';
import { Product, ProductFilter } from '@/types/product';
import productService, { ProductFilters as ApiProductFilters } from '@/services/productService';

// Fungsi format Rupiah
const formatRupiah = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function ProductsPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<ProductFilter>({});
  const [categories, setCategories] = useState<string[]>([]);
  const [apiFilters, setApiFilters] = useState<ApiProductFilters>({});
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const router = useRouter();

  // Load products from API
  const loadProducts = async (filters: ApiProductFilters = {}) => {
    try {
      setLoading(true);
      const response = await productService.getProducts({
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
      });
      
      if (response.success) {
        setProducts(response.data);
        setFilteredProducts(response.data);
        setPagination(response.pagination || pagination);
      } else {
        setError(response.error || 'Failed to load products');
      }
    } catch (err: any) {
      console.error('Error loading products:', err);
      setError(err.message || 'Failed to load products');
      
      // Fallback to mock data for development
      if (process.env.NODE_ENV === 'development') {
        const mockProducts: Product[] = [
          {
            id: '1',
            name: 'Buket Mawar Valentine Special',
            slug: 'buket-mawar-valentine-special',
            description: 'Buket mawar merah eksklusif untuk hari kasih sayang',
            price: 899000, // Dalam Rupiah
            stock: 25,
            category: 'Valentine',
            images: ['/placeholder.jpg'],
            featured: true,
            active: true,
            rating: 4.8,
            reviewCount: 124,
            tags: ['romantis', 'mewah', 'segar'],
            weight: 1500,
            dimensions: '30x30x40',
            createdAt: new Date('2024-01-15'),
            updatedAt: new Date('2024-01-20'),
          },
          {
            id: '2',
            name: 'Rangkaian Wisuda Elegant',
            slug: 'rangkaian-wisuda-elegant',
            description: 'Rangkaian bunga elegan untuk perayaan wisuda',
            price: 655000, // Dalam Rupiah
            stock: 15,
            category: 'Graduation',
            images: ['/placeholder.jpg'],
            featured: false,
            active: true,
            rating: 4.5,
            reviewCount: 89,
            tags: ['wisuda', 'elegan', 'prestasi'],
            weight: 1200,
            dimensions: '25x25x35',
            createdAt: new Date('2024-01-10'),
            updatedAt: new Date('2024-01-18'),
          },
          {
            id: '3',
            name: 'Buket Custom Anniversary',
            slug: 'buket-custom-anniversary',
            description: 'Buket bunga custom untuk hari jadi pernikahan',
            price: 1200000, // Dalam Rupiah
            stock: 8,
            category: 'Custom',
            images: ['/placeholder.jpg'],
            featured: true,
            active: true,
            rating: 4.9,
            reviewCount: 56,
            tags: ['custom', 'anniversary', 'spesial'],
            weight: 1800,
            dimensions: '35x35x45',
            createdAt: new Date('2024-01-05'),
            updatedAt: new Date('2024-01-12'),
          },
        ];
        setProducts(mockProducts);
        setFilteredProducts(mockProducts);
      }
    } finally {
      setLoading(false);
    }
  };

  // Load categories from API
  const loadCategories = async () => {
    try {
      const response = await productService.getCategories();
      if (response.success) {
        setCategories(response.data);
      }
    } catch (err) {
      console.error('Error loading categories:', err);
      // Fallback categories sesuai prompt
      setCategories(['Valentine', 'Graduation', 'Custom']);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (!token || !userData) {
          router.push('/login');
          return;
        }

        const parsedUser = JSON.parse(userData);
        
        if (parsedUser.role !== 'ADMIN' && parsedUser.role !== 'SUPERADMIN') {
          router.push('/');
          return;
        }

        setUser(parsedUser);
      } catch (err: any) {
        setError(err.message);
        router.push('/login');
      }
    };

    checkAuth();
  }, [router]);

  // Load data when component mounts
  useEffect(() => {
    if (user) {
      loadProducts(apiFilters);
      loadCategories();
    }
  }, [user, apiFilters, pagination.page]);

  // Apply frontend filters
  useEffect(() => {
    let filtered = [...products];
    
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (filters.category) {
      filtered = filtered.filter(p => p.category === filters.category);
    }

    if (filters.minPrice !== undefined) {
      filtered = filtered.filter(p => p.price >= filters.minPrice!);
    }

    if (filters.maxPrice !== undefined) {
      filtered = filtered.filter(p => p.price <= filters.maxPrice!);
    }

    if (filters.featured !== undefined) {
      filtered = filtered.filter(p => p.featured === filters.featured);
    }

    if (filters.active !== undefined) {
      filtered = filtered.filter(p => p.active === filters.active);
    }

    setFilteredProducts(filtered);
  }, [products, searchTerm, filters]);

  // Handle API filter changes
  const handleApiFilterChange = (newFilters: ApiProductFilters) => {
    setApiFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to page 1 when filters change
  };

  const handleAddProduct = async (productData: any) => {
    try {
      // Pastikan harga dalam Rupiah
      const dataToSend = {
        ...productData,
        images: productData.images || [],
      };
      
      const response = await productService.createProduct(dataToSend);
      
      if (response.success) {
        await loadProducts(apiFilters);
        setShowFormModal(false);
        alert('Produk berhasil dibuat!');
      } else {
        alert(response.error || 'Gagal membuat produk');
      }
    } catch (error: any) {
      console.error('Error creating product:', error);
      alert(error.message || 'Gagal membuat produk');
    }
  };

  const handleUpdateProduct = async (productData: any) => {
    if (!selectedProduct) return;
    
    try {
      const response = await productService.updateProduct(selectedProduct.id, productData);
      
      if (response.success) {
        await loadProducts(apiFilters);
        setSelectedProduct(null);
        setShowFormModal(false);
        setIsEditing(false);
        alert('Produk berhasil diperbarui!');
      } else {
        alert(response.error || 'Gagal memperbarui produk');
      }
    } catch (error: any) {
      console.error('Error updating product:', error);
      alert(error.message || 'Gagal memperbarui produk');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus produk ini? Tindakan ini tidak dapat dibatalkan.')) return;
    
    try {
      const response = await productService.deleteProduct(id);
      
      if (response.success) {
        await loadProducts(apiFilters);
        alert('Produk berhasil dihapus!');
      } else {
        alert(response.error || 'Gagal menghapus produk');
      }
    } catch (error: any) {
      console.error('Error deleting product:', error);
      alert(error.message || 'Gagal menghapus produk');
    }
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsEditing(true);
    setShowFormModal(true);
  };

  const handleToggleStatus = async (id: string) => {
    const product = products.find(p => p.id === id);
    if (!product) return;
    
    try {
      const response = await productService.toggleProductStatus(id, !product.active);
      
      if (response.success) {
        await loadProducts(apiFilters);
      } else {
        alert(response.error || 'Gagal memperbarui status produk');
      }
    } catch (error: any) {
      console.error('Error toggling product status:', error);
      alert(error.message || 'Gagal memperbarui status produk');
    }
  };

  const handleToggleFeatured = async (id: string) => {
    const product = products.find(p => p.id === id);
    if (!product) return;
    
    try {
      const response = await productService.toggleFeaturedStatus(id, !product.featured);
      
      if (response.success) {
        await loadProducts(apiFilters);
      } else {
        alert(response.error || 'Gagal memperbarui status featured');
      }
    } catch (error: any) {
      console.error('Error toggling featured status:', error);
      alert(error.message || 'Gagal memperbarui status featured');
    }
  };

  const handleDuplicateProduct = async (product: Product) => {
    if (!confirm('Buat salinan dari produk ini?')) return;
    
    try {
      const productData = {
        name: `${product.name} (Salinan)`,
        description: product.description || '',
        price: product.price,
        stock: product.stock,
        category: product.category,
        images: [],
        featured: false,
        active: true,
        tags: product.tags,
        weight: product.weight,
        dimensions: product.dimensions,
      };
      
      const response = await productService.createProduct(productData);
      
      if (response.success) {
        await loadProducts(apiFilters);
        alert('Produk berhasil diduplikasi! Silakan upload gambar baru.');
      } else {
        alert(response.error || 'Gagal menduplikasi produk');
      }
    } catch (error: any) {
      console.error('Error duplicating product:', error);
      alert(error.message || 'Gagal menduplikasi produk');
    }
  };

  // Pagination
  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const totalStock = products.reduce((sum, product) => sum + product.stock, 0);
  const lowStockProducts = products.filter(p => p.stock < 10).length;
  const activeProducts = products.filter(p => p.active).length;

  if (loading && products.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="flex">
          <Sidebar userRole={user?.role || 'USER'} />
          <main className="flex-1 p-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-700 rounded w-48 mb-6"></div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-24 bg-gray-800 rounded-xl"></div>
                ))}
              </div>
              <div className="h-12 bg-gray-800 rounded-xl mb-4"></div>
              <div className="h-64 bg-gray-800 rounded-xl"></div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error && products.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
        <DashboardHeader user={user} />
        <div className="flex">
          <Sidebar userRole={user?.role || 'USER'} />
          <main className="flex-1 p-6">
            <div className="text-center">
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-white mb-2">Error Loading Products</h2>
              <p className="text-gray-300 mb-6">{error}</p>
              <button
                onClick={() => loadProducts(apiFilters)}
                className="bg-gradient-to-r from-pink-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-pink-700 hover:to-purple-700 transition-all duration-300 shadow"
              >
                Retry
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      <DashboardHeader user={user} />
      
      <div className="flex">
        <Sidebar userRole={user?.role || 'USER'} />
        
        <main className="flex-1 p-4 lg:p-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                  Manajemen Produk
                </h1>
                <p className="text-gray-400 mt-1 text-sm">
                  Kelola produk bunga, inventaris, dan harga
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedProduct(null);
                  setIsEditing(false);
                  setShowFormModal(true);
                }}
                className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white px-4 py-2.5 rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Tambah Produk Baru
              </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-xl p-4 border-l-4 border-pink-600 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-300">Total Produk</h3>
                    <p className="text-2xl font-bold text-pink-400 mt-1">{products.length}</p>
                  </div>
                  <div className="p-2 bg-pink-900/30 rounded-lg">
                    <svg className="w-6 h-6 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-xl p-4 border-l-4 border-purple-600 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-300">Total Stok</h3>
                    <p className="text-2xl font-bold text-purple-400 mt-1">{totalStock}</p>
                  </div>
                  <div className="p-2 bg-purple-900/30 rounded-lg">
                    <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-xl p-4 border-l-4 border-blue-600 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-300">Stok Menipis</h3>
                    <p className="text-2xl font-bold text-blue-400 mt-1">{lowStockProducts}</p>
                  </div>
                  <div className="p-2 bg-blue-900/30 rounded-lg">
                    <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-xl p-4 border-l-4 border-green-600 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-300">Produk Aktif</h3>
                    <p className="text-2xl font-bold text-green-400 mt-1">{activeProducts}</p>
                  </div>
                  <div className="p-2 bg-green-900/30 rounded-lg">
                    <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <ProductFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            filters={filters}
            onFilterChange={(newFilters) => {
              setFilters(newFilters);
              // Convert frontend filters to API filters
              const apiFilters: ApiProductFilters = {
                category: newFilters.category,
                featured: newFilters.featured,
                active: newFilters.active,
                minPrice: newFilters.minPrice,
                maxPrice: newFilters.maxPrice,
                search: newFilters.search,
              };
              handleApiFilterChange(apiFilters);
            }}
            categories={categories}
            formatRupiah={formatRupiah}
          />

          {/* Products Table */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-xl border border-gray-700 overflow-hidden">
            <ProductTable
              products={filteredProducts}
              onEdit={handleEditProduct}
              onDelete={handleDeleteProduct}
              onToggleStatus={handleToggleStatus}
              onToggleFeatured={handleToggleFeatured}
              onDuplicate={handleDuplicateProduct}
              pagination={pagination}
              onPageChange={handlePageChange}
              formatRupiah={formatRupiah}
            />
          </div>

          {/* Product Form Modal */}
          {showFormModal && (
            <ProductFormModal
              product={selectedProduct}
              isEditing={isEditing}
              onClose={() => {
                setShowFormModal(false);
                setSelectedProduct(null);
                setIsEditing(false);
              }}
              onSubmit={isEditing ? handleUpdateProduct : handleAddProduct}
              categories={categories}
              formatRupiah={formatRupiah}
            />
          )}
        </main>
      </div>
    </div>
  );
}