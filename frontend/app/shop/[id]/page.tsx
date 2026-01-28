'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { addToCart, getCartItemCount } from '@/utils/cart';

interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
  category: string;
  rating?: number;
  reviews?: number;
  images: string[];
  tags: string[];
  featured?: boolean;
  active?: boolean;
  stock?: number;
  weight?: number;
  dimensions?: string;
  createdAt?: string;
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

// Helper untuk ambil token
const getAuthToken = () => {
  if (typeof window === 'undefined') return null;
  return document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1] || 
         localStorage.getItem('token');
};

// Fungsi tambah ke cart via API
const addToCartAPI = async (productId: string, quantity: number): Promise<boolean> => {
  try {
    const token = getAuthToken();
    if (!token) {
      alert('Silakan login terlebih dahulu untuk menambahkan ke keranjang');
      return false;
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cart/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ productId, quantity }),
    });

    const data = await response.json();
    
    if (data.success) {
      window.dispatchEvent(new Event('cartUpdated'));
      return true;
    } else {
      alert(data.error || 'Gagal menambahkan ke keranjang');
      return false;
    }
  } catch (error) {
    console.error('Error adding to cart:', error);
    alert('Terjadi kesalahan saat menambahkan ke keranjang');
    return false;
  }
};

// Fungsi tambah ke cart localStorage (fallback)
const addToCartLocalStorage = (product: {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  stock: number;
}, quantity: number = 1) => {
  try {
    const CART_STORAGE_KEY = 'florist_cart_local_fallback';
    const cartData = localStorage.getItem(CART_STORAGE_KEY);
    let cart = cartData ? JSON.parse(cartData) : { items: [], expiry: null };
    
    // Cek apakah cart expired
    if (cart.expiry && new Date(cart.expiry) < new Date()) {
      cart = { items: [], expiry: null };
    }
    
    const existingItemIndex = cart.items.findIndex((item: any) => item.productId === product.id);
    
    if (existingItemIndex >= 0) {
      // Update existing item
      cart.items[existingItemIndex].quantity += quantity;
      
      // Check stock limit
      if (cart.items[existingItemIndex].quantity > product.stock) {
        cart.items[existingItemIndex].quantity = product.stock;
      }
    } else {
      // Add new item
      cart.items.push({
        id: `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: Math.min(quantity, product.stock),
        image: product.image,
        category: product.category,
        stock: product.stock,
        createdAt: new Date().toISOString(),
      });
    }
    
    // Set expiry 7 hari dari sekarang
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 7);
    cart.expiry = expiry.toISOString();
    
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    window.dispatchEvent(new Event('cartUpdated'));
    
    return true;
  } catch (error) {
    console.error('Error saving to localStorage:', error);
    return false;
  }
};

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Gunakan endpoint public tanpa auth
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${productId}`);
        const data = await response.json();
        
        if (data.success) {
          setProduct({
            id: data.data.id,
            name: data.data.name,
            price: data.data.price,
            description: data.data.description,
            category: data.data.category,
            images: data.data.images || [],
            tags: data.data.tags || [],
            featured: data.data.featured || false,
            active: data.data.active || false,
            stock: data.data.stock || 0,
            weight: data.data.weight,
            dimensions: data.data.dimensions,
            createdAt: data.data.createdAt,
            rating: data.data.rating || 4.5,
            reviews: data.data.reviewCount || 0,
          });
        } else {
          setError('Produk tidak ditemukan');
        }
      } catch (err: any) {
        console.error('Error fetching product:', err);
        setError(err.message || 'Gagal memuat produk');
      } finally {
        setLoading(false);
      }
    };

    const fetchRelatedProducts = async (category: string) => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/products?category=${category}&limit=4&active=true`
        );
        const data = await response.json();
        
        if (data.success) {
          // Exclude current product
          const related = data.data
            .filter((p: any) => p.id !== productId)
            .map((p: any) => ({
              id: p.id,
              name: p.name,
              price: p.price,
              category: p.category,
              rating: p.rating || 4.5,
              reviews: p.reviewCount || 0,
              images: p.images || [],
              tags: p.tags || [],
              featured: p.featured || false,
              stock: p.stock || 0,
            }));
          setRelatedProducts(related.slice(0, 3));
        }
      } catch (err) {
        console.error('Error fetching related products:', err);
      }
    };

    fetchProduct();
    
    // Fetch related products after product is loaded
    if (product) {
      fetchRelatedProducts(product.category);
    }
  }, [productId, product?.category]);

// Di bagian atas file, tambahkan import:

// Di dalam komponen, ubah fungsi handleAddToCart:
const handleAddToCart = () => {
  if (!product) return;
  
  // Cek stok
  if (!product.stock || product.stock <= 0) {
    alert('Maaf, produk ini sedang habis stok!');
    return;
  }
  
  // Validasi quantity
  const maxQuantity = Math.min(product.stock, 10); // Batas maksimal 10 per item
  const actualQuantity = quantity > maxQuantity ? maxQuantity : quantity;
  
  if (actualQuantity <= 0) {
    alert('Jumlah produk harus lebih dari 0');
    return;
  }
  
  // Tambah ke cart
  const cartItem = addToCart({
    id: product.id,
    name: product.name,
    price: product.price,
    image: product.images && product.images.length > 0 
      ? `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${product.images[0]}`
      : '/placeholder.jpg',
    category: product.category,
    stock: product.stock || 0,
  }, actualQuantity);
  
  // Tampilkan konfirmasi
  alert(`${actualQuantity} x ${product.name} berhasil ditambahkan ke keranjang!\n\nTotal: ${formatRupiah(product.price * actualQuantity)}`);
  
  // Refresh cart count (jika ada komponen cart count di header)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('cartUpdated'));
  }
};

  const handleAddToWishlist = () => {
    if (!product) return;
    alert(`Ditambahkan ${product.name} ke wishlist!`);
  };

  const handleShare = () => {
    if (!product) return;
    const shareUrl = `${window.location.origin}/shop/${product.id}`;
    navigator.clipboard.writeText(shareUrl);
    alert('Link produk berhasil disalin!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-48 mb-4"></div>
            <div className="flex flex-col lg:flex-row gap-8">
              <div className="lg:w-1/2">
                <div className="h-96 bg-gray-200 rounded-xl"></div>
              </div>
              <div className="lg:w-1/2">
                <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-6"></div>
                <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="h-32 bg-gray-200 rounded mb-6"></div>
                <div className="h-12 bg-gray-200 rounded w-full mb-4"></div>
                <div className="h-12 bg-gray-200 rounded w-full"></div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error && !product) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">Produk Tidak Ditemukan</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">{error}</p>
            <button
              onClick={() => router.push('/shop')}
              className="px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:from-pink-700 hover:to-purple-700 transition-all duration-300 font-medium"
            >
              Kembali ke Toko
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <Header />

      {/* Breadcrumb */}
      <div className="bg-gradient-to-r from-pink-50 to-purple-50 border-b">
        <div className="container mx-auto px-4 py-4">
          <nav className="text-sm text-gray-600">
            <ol className="flex flex-wrap items-center space-x-2">
              <li>
                <Link href="/" className="hover:text-pink-600 transition-colors">Beranda</Link>
              </li>
              <li className="text-gray-400">/</li>
              <li>
                <Link href="/shop" className="hover:text-pink-600 transition-colors">Toko</Link>
              </li>
              <li className="text-gray-400">/</li>
              <li>
                <Link href={`/shop?category=${product.category}`} className="hover:text-pink-600 transition-colors capitalize">
                  {product.category}
                </Link>
              </li>
              <li className="text-gray-400">/</li>
              <li className="text-pink-600 font-medium truncate max-w-xs">
                {product.name}
              </li>
            </ol>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Product Details */}
        <div className="flex flex-col lg:flex-row gap-8 mb-16">
          {/* Product Images */}
          <div className="lg:w-1/2">
            <div className="sticky top-24">
              {/* Main Image */}
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-4">
                <div className="aspect-square bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
                  {product.images && product.images.length > 0 && product.images[0] ? (
                    <img 
                      src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${product.images[selectedImage]}`}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder.jpg';
                      }}
                    />
                  ) : (
                    <div className="text-8xl">💐</div>
                  )}
                </div>
              </div>

              {/* Thumbnail Images */}
              {product.images && product.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto py-2">
                  {product.images.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImage === index 
                          ? 'border-pink-500 shadow-md' 
                          : 'border-gray-200 hover:border-pink-300'
                      }`}
                    >
                      <div className="w-full h-full bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
                        {img ? (
                          <img 
                            src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${img}`}
                            alt={`Thumbnail ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/placeholder.jpg';
                            }}
                          />
                        ) : (
                          <div className="text-2xl">💐</div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className="lg:w-1/2">
            <div className="bg-white rounded-2xl shadow-lg p-6 lg:p-8">
              {/* Category & Badges */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-pink-600 bg-pink-50 px-3 py-1 rounded-full capitalize">
                  {product.category}
                </span>
                <div className="flex items-center gap-2">
                  {product.featured && (
                    <span className="px-3 py-1 bg-pink-600 text-white text-xs font-bold rounded-full">
                      UNGGULAN
                    </span>
                  )}
                  {product.stock && product.stock < 10 && (
                    <span className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                      STOK MENIPIS
                    </span>
                  )}
                </div>
              </div>

              {/* Product Name */}
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-4">
                {product.name}
              </h1>

              {/* Rating */}
              <div className="flex items-center gap-2 mb-6">
                <div className="flex items-center text-amber-500">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                  <span className="ml-1 font-bold">{product.rating || 4.5}</span>
                </div>
                <span className="text-gray-500">({product.reviews || 0} ulasan)</span>
                {product.stock && (
                  <span className={`text-sm font-medium ${product.stock > 10 ? 'text-green-600' : 'text-red-600'}`}>
                    • {product.stock > 0 ? `${product.stock} tersedia` : 'Stok habis'}
                  </span>
                )}
              </div>

              {/* Price */}
              <div className="mb-6">
                <div className="text-5xl font-bold text-pink-600 mb-2">
                  {formatRupiah(product.price)}
                </div>
                {product.weight && (
                  <p className="text-gray-600">
                    Berat: {product.weight}g • Ukuran: {product.dimensions}
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="mb-8">
                <h3 className="text-lg font-bold text-gray-800 mb-3">Deskripsi</h3>
                <p className="text-gray-600 leading-relaxed">
                  {product.description || 'Rangkaian bunga segar yang indah, cocok untuk berbagai acara. Dibuat dengan penuh perhatian oleh florist ahli kami.'}
                </p>
              </div>

              {/* Tags */}
              {product.tags && product.tags.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-bold text-gray-800 mb-3">Tag</h3>
                  <div className="flex flex-wrap gap-2">
                    {product.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm capitalize"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity & Actions */}
              <div className="space-y-6">
                {/* Quantity Selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Jumlah
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center border border-gray-300 rounded-lg">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-12 h-12 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-l-lg"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      </button>
                      <input
                        type="number"
                        min="1"
                        max={product.stock || 10}
                        value={quantity}
                        onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                        className="w-12 h-12 flex items-center justify-center font-bold text-gray-800 text-center border-x border-gray-300 focus:outline-none"
                      />
                      <button
                        onClick={() => setQuantity(Math.min(product.stock || 10, quantity + 1))}
                        className="w-12 h-12 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-r-lg"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>
                    <div className="text-lg font-bold text-gray-800">
                      Total: {formatRupiah(product.price * quantity)}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={handleAddToCart}
                    disabled={!product.stock || product.stock <= 0}
                    className={`flex-1 px-8 py-4 rounded-lg font-bold text-lg transition-all duration-300 ${
                      !product.stock || product.stock <= 0
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-pink-600 to-purple-600 text-white hover:from-pink-700 hover:to-purple-700 hover:shadow-xl'
                    }`}
                  >
                    {!product.stock || product.stock <= 0 ? 'Stok Habis' : 'Tambah ke Keranjang'}
                  </button>
                  <div className="flex gap-4">
                    <button
                      onClick={handleAddToWishlist}
                      className="w-14 h-14 flex items-center justify-center border-2 border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                      title="Tambah ke Wishlist"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </button>
                    <button
                      onClick={handleShare}
                      className="w-14 h-14 flex items-center justify-center border-2 border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                      title="Bagikan Produk"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="pt-6 border-t border-gray-200">
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Gratis ongkir untuk order di atas Rp 500.000
                    </div>
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Pengiriman hari yang sama tersedia
                    </div>
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Garansi kesegaran 7 hari
                    </div>
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Dibuat oleh florist ahli
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-800">Produk Terkait</h2>
              <Link
                href={`/shop?category=${product.category}`}
                className="text-pink-600 hover:text-pink-700 font-medium inline-flex items-center"
              >
                Lihat semua di {product.category}
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <div
                  key={relatedProduct.id}
                  className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300"
                >
                  <Link href={`/shop/${relatedProduct.id}`}>
                    <div className="relative">
                      <div className="h-48 bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center overflow-hidden">
                        {relatedProduct.images && relatedProduct.images.length > 0 ? (
                          <img 
                            src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${relatedProduct.images[0]}`}
                            alt={relatedProduct.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/placeholder.jpg';
                            }}
                          />
                        ) : (
                          <div className="text-5xl">💐</div>
                        )}
                      </div>
                      
                      {relatedProduct.featured && (
                        <span className="absolute top-3 left-3 px-3 py-1 bg-pink-600 text-white text-xs font-bold rounded-full">
                          UNGGULAN
                        </span>
                      )}
                    </div>
                    
                    <div className="p-5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-500 capitalize">{relatedProduct.category}</span>
                        <div className="flex items-center text-amber-500">
                          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                          </svg>
                          <span className="ml-1 text-sm font-medium">{relatedProduct.rating}</span>
                        </div>
                      </div>
                      
                      <h3 className="font-bold text-gray-800 group-hover:text-pink-600 transition-colors mb-2 line-clamp-1">
                        {relatedProduct.name}
                      </h3>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-bold text-pink-600">
                          {formatRupiah(relatedProduct.price)}
                        </span>
                        <button className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all duration-300 font-medium">
                          Lihat
                        </button>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Product Reviews */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Ulasan Pelanggan</h2>
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">Belum Ada Ulasan</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Jadilah yang pertama untuk berbagi pendapat tentang rangkaian bunga ini!
            </p>
            <button className="px-6 py-3 border-2 border-pink-600 text-pink-600 rounded-lg hover:bg-pink-50 transition-colors font-medium">
              Tulis Ulasan
            </button>
          </div>
        </div>
      </div>

      {/* Newsletter Section */}
      <section className="bg-gradient-to-r from-pink-50 to-purple-50 border-t">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Berlangganan untuk Penawaran Spesial
            </h2>
            <p className="text-gray-600 mb-8">
              Dapatkan diskon 10% untuk order pertama dan jadi yang pertama tahu tentang penawaran eksklusif dan produk baru.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Alamat email Anda"
                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
              <button className="px-8 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg font-bold hover:from-pink-700 hover:to-purple-700 transition-all duration-300">
                Berlangganan
              </button>
            </div>
            <p className="text-gray-500 text-sm mt-4">
              Kami menghormati privasi Anda. Berhenti berlangganan kapan saja.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}