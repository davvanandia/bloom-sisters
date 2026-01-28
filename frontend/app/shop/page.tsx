'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { addToCart } from '@/utils/cart';
import { useRouter } from 'next/navigation';

interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
  category: string;
  image: string;
  images?: string[];
  tags: string[];
  featured?: boolean;
  active?: boolean;
  stock?: number;
}

// Fungsi format Rupiah
const formatRupiah = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Helper untuk cek apakah user sudah login
const checkAuth = () => {
  if (typeof window === 'undefined') return false;
  
  // Cek token dari cookies atau localStorage
  const tokenFromCookie = document.cookie
    .split('; ')
    .find(row => row.startsWith('token='))
    ?.split('=')[1];
  
  const tokenFromStorage = localStorage.getItem('token');
  const userCookie = document.cookie
    .split('; ')
    .find(row => row.startsWith('user='))
    ?.split('=')[1];
  
  return !!(tokenFromCookie || tokenFromStorage || userCookie);
};

// Loading skeleton untuk grid view
const GridSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
    {Array.from({ length: 6 }).map((_, index) => (
      <div key={index} className="bg-white rounded-xl md:rounded-2xl overflow-hidden shadow-lg">
        <div className="h-48 sm:h-56 md:h-64 bg-gray-200 animate-pulse"></div>
        <div className="p-4 md:p-6">
          <div className="h-4 bg-gray-200 rounded animate-pulse mb-3"></div>
          <div className="h-6 bg-gray-200 rounded animate-pulse mb-4"></div>
          <div className="flex gap-2 mb-4">
            <div className="h-5 w-16 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-5 w-20 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="flex items-center justify-between">
            <div className="h-7 w-28 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

// Loading skeleton untuk list view
const ListSkeleton = () => (
  <div className="space-y-4 md:space-y-6">
    {Array.from({ length: 3 }).map((_, index) => (
      <div key={index} className="bg-white rounded-xl md:rounded-2xl shadow-sm overflow-hidden">
        <div className="flex flex-col md:flex-row">
          <div className="md:w-1/4">
            <div className="h-48 md:h-full bg-gray-200 animate-pulse"></div>
          </div>
          <div className="flex-1 p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-5 w-16 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="h-6 w-3/4 bg-gray-200 rounded animate-pulse mb-3"></div>
                <div className="h-4 w-full bg-gray-200 rounded animate-pulse mb-4"></div>
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="md:w-1/3 md:text-right mt-4 md:mt-0">
                <div className="h-8 w-32 bg-gray-200 rounded animate-pulse ml-auto mb-4"></div>
                <div className="h-12 w-full bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

export default function ShopPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('featured');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000000]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [itemsPerPage, setItemsPerPage] = useState<number>(12);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Auto scroll ke konten setelah loading
  useEffect(() => {
    if (!loading && contentRef.current) {
      contentRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [loading]);

  // Fetch products from API
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build API filters
      const params: Record<string, string> = {
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        active: 'true'
      };

      if (selectedCategory !== 'all') {
        params.category = selectedCategory;
      }

      if (priceRange[0] > 0) params.minPrice = priceRange[0].toString();
      if (priceRange[1] < 5000000) params.maxPrice = priceRange[1].toString();

      if (searchQuery) {
        params.search = searchQuery;
      }

      if (sortBy === 'price-low') {
        params.sortBy = 'price';
        params.sortOrder = 'asc';
      } else if (sortBy === 'price-high') {
        params.sortBy = 'price';
        params.sortOrder = 'desc';
      } else if (sortBy === 'featured') {
        params.sortBy = 'createdAt';
        params.sortOrder = 'desc';
      }

      const queryString = new URLSearchParams(params).toString();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products?${queryString}`);
      const data = await response.json();
      
      if (data.success) {
        const transformedProducts = data.data.map((product: any) => ({
          id: product.id,
          name: product.name,
          price: product.price,
          description: product.description,
          category: product.category,
          image: product.images && product.images.length > 0 
            ? `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${product.images[0]}`
            : '/placeholder.jpg',
          images: product.images || [],
          tags: product.tags || [],
          featured: product.featured || false,
          active: product.active || false,
          stock: product.stock || 0
        }));
        
        setProducts(transformedProducts);
        setFilteredProducts(transformedProducts);
      } else {
        setError('Gagal memuat produk');
        setProducts(getMockProducts());
        setFilteredProducts(getMockProducts());
      }
    } catch (err: any) {
      console.error('Error fetching products:', err);
      setError(err.message || 'Gagal memuat produk');
      setProducts(getMockProducts());
      setFilteredProducts(getMockProducts());
    } finally {
      setLoading(false);
    }
  };

  // Mock data for development/fallback
  const getMockProducts = (): Product[] => {
    return [
      { 
        id: '1', 
        name: 'Buket Mawar Valentine Special', 
        price: 899000,
        category: 'Valentine', 
        image: '/placeholder.jpg', 
        tags: ['romantis', 'mewah', 'segar', 'mawar'], 
        featured: true,
        stock: 25 
      },
      { 
        id: '2', 
        name: 'Rangkaian Bunga Hati', 
        price: 759000,
        category: 'Valentine', 
        image: '/placeholder.jpg', 
        tags: ['romantis', 'bentuk hati'], 
        featured: true, 
        stock: 15 
      },
      { 
        id: '3', 
        name: 'Buket Wisuda Elegant', 
        price: 655000,
        category: 'Graduation', 
        image: '/placeholder.jpg', 
        tags: ['wisuda', 'selamat'], 
        featured: false, 
        stock: 20 
      },
      { 
        id: '4', 
        name: 'Rangkaian Diploma', 
        price: 850000,
        category: 'Graduation', 
        image: '/placeholder.jpg', 
        tags: ['wisuda', 'diploma'], 
        featured: true, 
        stock: 12 
      },
      { 
        id: '5', 
        name: 'Buket Ulang Tahun Custom', 
        price: 950000,
        category: 'Custom', 
        image: '/placeholder.jpg', 
        tags: ['ulang tahun', 'custom'], 
        featured: true, 
        stock: 10 
      },
      { 
        id: '6', 
        name: 'Rangkaian Anniversary Personalized', 
        price: 1200000,
        category: 'Custom', 
        image: '/placeholder.jpg', 
        tags: ['anniversary', 'personalized'], 
        featured: true, 
        stock: 8 
      },
    ];
  };

  // Initialize data
  useEffect(() => {
    fetchProducts();
  }, [currentPage, itemsPerPage, selectedCategory, sortBy]);

  // Apply filters locally when category or search changes
  useEffect(() => {
    let filtered = [...products];
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    filtered = filtered.filter(product =>
      product.price >= priceRange[0] && product.price <= priceRange[1]
    );

    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      default:
        filtered.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
        break;
    }

    setFilteredProducts(filtered);
    setCurrentPage(1);
  }, [selectedCategory, sortBy, priceRange, searchQuery, products]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  // Handle add to cart dengan SweetAlert dan cek login
  const handleAddToCart = async (product: Product) => {
    // Cek apakah user sudah login
    const isLoggedIn = checkAuth();
    if (!isLoggedIn) {
      if (typeof window !== 'undefined') {
        const { default: Swal } = await import('sweetalert2');
        const result = await Swal.fire({
          title: 'Login Diperlukan',
          text: 'Silakan login terlebih dahulu untuk menambahkan produk ke keranjang',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#ec4899',
          cancelButtonColor: '#6b7280',
          confirmButtonText: 'Login Sekarang',
          cancelButtonText: 'Nanti'
        });
        
        if (result.isConfirmed) {
          router.push('/login');
        }
      }
      return;
    }
    
    // Cek stok
    if (!product.stock || product.stock <= 0) {
      if (typeof window !== 'undefined') {
        const { default: Swal } = await import('sweetalert2');
        Swal.fire({
          title: 'Stok Habis',
          text: 'Maaf, produk ini sedang habis stok!',
          icon: 'warning',
          confirmButtonColor: '#ec4899',
          confirmButtonText: 'OK'
        });
      }
      return;
    }
    
    try {
      // Tambah ke cart dengan quantity 1
      addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        category: product.category,
        stock: product.stock || 0,
      }, 1);
      
      if (typeof window !== 'undefined') {
        const { default: Swal } = await import('sweetalert2');
        Swal.fire({
          title: 'Berhasil!',
          text: `${product.name} berhasil ditambahkan ke keranjang!`,
          icon: 'success',
          confirmButtonColor: '#ec4899',
          confirmButtonText: 'OK'
        });
      }
      
      // Refresh cart count
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('cartUpdated'));
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      if (typeof window !== 'undefined') {
        const { default: Swal } = await import('sweetalert2');
        Swal.fire({
          title: 'Gagal!',
          text: 'Gagal menambahkan produk ke keranjang',
          icon: 'error',
          confirmButtonColor: '#ec4899',
          confirmButtonText: 'OK'
        });
      }
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
  };

  const handlePriceRangeChange = (value: number) => {
    setPriceRange([0, value]);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  if (loading && products.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="container mx-auto px-4 py-8">
          {viewMode === 'grid' ? <GridSkeleton /> : <ListSkeleton />}
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Breadcrumb */}
      <div className="bg-white">
        <div className="container mx-auto px-4 py-4 md:py-6">
          <nav className="text-sm text-gray-600">
            <ol className="flex flex-wrap items-center space-x-2">
              <li>
                <Link href="/" className="hover:text-pink-600 transition-colors">Home</Link>
              </li>
              <li className="text-gray-400">/</li>
              <li className="text-pink-600 font-medium">Shop</li>
            </ol>
          </nav>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-800 mt-1 md:mt-2">
            Koleksi Bunga
          </h1>
          <p className="text-gray-600 mt-1 md:mt-2 text-sm md:text-base">
            Temukan pilihan bunga premium dan rangkaian eksklusif kami
          </p>
        </div>
      </div>

      <div ref={contentRef} className="container mx-auto px-3 sm:px-4 py-4 md:py-8">
        {/* Toolbar dengan Price Range - Responsif */}
        <div className="bg-white rounded-xl md:rounded-2xl shadow-sm p-4 md:p-6 mb-4 md:mb-6">
          <div className="flex flex-col space-y-4 md:space-y-0">
            {/* Info Jumlah Produk */}
            <div className="text-gray-600 text-sm md:text-base">
              {error ? (
                <div className="text-red-500">{error}</div>
              ) : (
                <>
                  Menampilkan <span className="font-bold text-gray-800">{startIndex + 1}-{Math.min(endIndex, filteredProducts.length)}</span> dari{' '}
                  <span className="font-bold text-gray-800">{filteredProducts.length}</span> produk
                </>
              )}
            </div>

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
              {/* Price Range - Mobile friendly */}
              <div className="w-full lg:w-64">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-800 font-medium">Rentang Harga:</span>
                    <span className="text-gray-600 text-xs md:text-sm">
                      {formatRupiah(priceRange[0])} - {formatRupiah(priceRange[1])}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="5000000"
                    step="100000"
                    value={priceRange[1]}
                    onChange={(e) => handlePriceRangeChange(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-pink-500"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Rp 0</span>
                    <span>Rp 2.5jt</span>
                    <span>Rp 5jt</span>
                  </div>
                </div>
              </div>

              {/* Controls Group - Responsif */}
              <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-3 md:space-x-4">
                {/* View Mode */}
                <div className="flex items-center space-x-1 md:space-x-2">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-pink-100 text-pink-600' : 'text-gray-500 hover:bg-gray-100'}`}
                    aria-label="Grid view"
                  >
                    <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-pink-100 text-pink-600' : 'text-gray-500 hover:bg-gray-100'}`}
                    aria-label="List view"
                  >
                    <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                </div>

                {/* Sort By */}
                <div className="flex items-center space-x-2">
                  <span className="text-gray-800 text-sm font-medium whitespace-nowrap">Urutkan:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-2 md:px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm text-gray-800 bg-white w-full sm:w-auto"
                  >
                    <option value="featured">Unggulan</option>
                    <option value="price-low">Harga: Rendah ke Tinggi</option>
                    <option value="price-high">Harga: Tinggi ke Rendah</option>
                  </select>
                </div>

                {/* Items Per Page */}
                <div className="flex items-center space-x-2">
                  <span className="text-gray-800 text-sm font-medium whitespace-nowrap">Tampilkan:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(parseInt(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-2 md:px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm text-gray-800 bg-white w-full sm:w-auto"
                  >
                    <option value="12">12</option>
                    <option value="24">24</option>
                    <option value="48">48</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Products Section */}
        {loading ? (
          viewMode === 'grid' ? <GridSkeleton /> : <ListSkeleton />
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
            {currentProducts.map((product) => (
              <div
                key={product.id}
                className="group bg-white rounded-xl md:rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <Link href={`/shop/${product.id}`}>
                  <div className="relative">
                    {/* Product Image */}
                    <div className="h-48 sm:h-56 md:h-64 bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center overflow-hidden">
                      {product.image && product.image !== '/placeholder.jpg' ? (
                        <img 
                          src={product.image} 
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.onerror = null;
                            target.src = '/placeholder.jpg';
                          }}
                        />
                      ) : (
                        <div className="text-5xl">💐</div>
                      )}
                    </div>
                    
                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1 md:gap-2">
                      {product.featured && (
                        <span className="px-2 py-1 bg-pink-600 text-white text-xs font-bold rounded-full">
                          UNGGULAN
                        </span>
                      )}
                      {product.stock && product.stock < 10 && (
                        <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                          STOK MENIPIS
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="p-4 md:p-5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs md:text-sm text-gray-500 capitalize">{product.category}</span>
                    </div>
                    
                    <h3 className="font-bold text-gray-800 group-hover:text-pink-600 transition-colors mb-2 text-sm md:text-base line-clamp-1">
                      {product.name}
                    </h3>
                    
                    <div className="flex flex-wrap gap-1 mb-3 md:mb-4">
                      {product.tags.slice(0, 2).map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded capitalize">
                          {tag}
                        </span>
                      ))}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-lg md:text-xl lg:text-2xl font-bold text-pink-600">{formatRupiah(product.price)}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleAddToCart(product);
                        }}
                        disabled={!product.stock || product.stock <= 0}
                        className={`px-3 py-2 md:px-4 md:py-2 rounded-lg font-medium shadow-sm hover:shadow-md flex items-center transition-all duration-300 text-xs md:text-sm ${
                          !product.stock || product.stock <= 0
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700'
                        }`}
                      >
                        <svg className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        {!product.stock || product.stock <= 0 ? 'Stok Habis' : 'Tambah'}
                      </button>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          // List View - Responsif
          <div className="space-y-4 md:space-y-6 mb-6 md:mb-8">
            {currentProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-xl md:rounded-2xl shadow-sm overflow-hidden group hover:shadow-lg transition-shadow duration-300"
              >
                <Link href={`/shop/${product.id}`}>
                  <div className="flex flex-col md:flex-row">
                    <div className="md:w-1/4">
                      {/* Product Image */}
                      <div className="h-48 md:h-full bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center overflow-hidden">
                        {product.image && product.image !== '/placeholder.jpg' ? (
                          <img 
                            src={product.image} 
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.onerror = null;
                              target.src = '/placeholder.jpg';
                            }}
                          />
                        ) : (
                          <div className="text-5xl">💐</div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex-1 p-4 md:p-6">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 md:gap-3 mb-2">
                            <span className="text-xs md:text-sm text-gray-500 capitalize">{product.category}</span>
                            {product.featured && (
                              <span className="px-2 py-1 bg-pink-100 text-pink-600 text-xs font-bold rounded">
                                UNGGULAN
                              </span>
                            )}
                            {product.stock && product.stock < 10 && (
                              <span className="px-2 py-1 bg-red-100 text-red-600 text-xs font-bold rounded">
                                STOK MENIPIS
                              </span>
                            )}
                          </div>
                          
                          <h3 className="text-base md:text-lg lg:text-xl font-bold text-gray-800 group-hover:text-pink-600 transition-colors mb-2">
                            {product.name}
                          </h3>
                          
                          <p className="text-gray-600 text-sm mb-3 md:mb-4 line-clamp-2">
                            {product.description || 'Rangkaian bunga segar yang indah, cocok untuk berbagai acara. Dibuat dengan penuh perhatian oleh florist ahli kami.'}
                          </p>
                          
                          <div className="flex flex-wrap gap-1 md:gap-2 mb-3 md:mb-4">
                            {product.tags.slice(0, 3).map((tag, index) => (
                              <span key={index} className="px-2 md:px-3 py-1 bg-gray-100 text-gray-600 text-xs md:text-sm rounded-lg capitalize">
                                {tag}
                              </span>
                            ))}
                          </div>
                          
                          <div className="flex items-center space-x-3 md:space-x-4">
                            {product.stock && (
                              <div className="text-xs md:text-sm text-gray-600">
                                Stok: <span className={`font-medium ${product.stock < 10 ? 'text-red-500' : 'text-green-600'}`}>
                                  {product.stock}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="md:w-1/3 md:text-right mt-4 md:mt-0">
                          <div className="mb-3 md:mb-4">
                            <div className="text-xl md:text-2xl lg:text-3xl font-bold text-pink-600">{formatRupiah(product.price)}</div>
                          </div>
                          
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              handleAddToCart(product);
                            }}
                            disabled={!product.stock || product.stock <= 0}
                            className={`w-full px-4 py-3 md:px-6 md:py-3 rounded-lg font-medium shadow-sm hover:shadow-md flex items-center justify-center transition-all duration-300 text-sm ${
                              !product.stock || product.stock <= 0
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700'
                            }`}
                          >
                            <svg className="w-4 h-4 md:w-5 md:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            {!product.stock || product.stock <= 0 ? 'Stok Habis' : 'Tambah ke Keranjang'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}

        {/* Pagination - Responsif */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-6 md:mt-8">
            <nav className="flex items-center space-x-1 md:space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 md:px-4 md:py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
              >
                Sebelumnya
              </button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 md:w-10 md:h-10 rounded-lg font-medium transition-colors text-sm ${
                      currentPage === pageNum
                        ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-md'
                        : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 md:px-4 md:py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
              >
                Selanjutnya
              </button>
            </nav>
          </div>
        )}

        {/* No Results */}
        {filteredProducts.length === 0 && !loading && (
          <div className="text-center py-8 md:py-16">
            <div className="w-16 h-16 md:w-24 md:h-24 mx-auto mb-4 md:mb-6 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 md:w-12 md:h-12 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-2 md:mb-3">Tidak Ditemukan Bunga</h3>
            <p className="text-gray-600 mb-6 md:mb-8 max-w-md mx-auto text-sm md:text-base">
              {error || "Kami tidak dapat menemukan bunga yang sesuai dengan kriteria Anda. Coba sesuaikan filter atau kata kunci pencarian."}
            </p>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
                setPriceRange([0, 5000000]);
                setSortBy('featured');
                fetchProducts();
              }}
              className="px-4 py-3 md:px-6 md:py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:from-pink-700 hover:to-purple-700 transition-all duration-300 font-medium text-sm md:text-base"
            >
              Hapus Semua Filter
            </button>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}