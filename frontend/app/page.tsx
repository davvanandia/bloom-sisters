'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getCurrentUser } from '@/lib/auth';
import { addToCart } from '@/utils/cart';

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

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const currentUser = getCurrentUser();
      setUser(currentUser);

      if (currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'SUPERADMIN')) {
        router.push('/dashboard');
        return;
      }

      setTimeout(() => {
        setLoading(false);
      }, 800);
    };

    setTimeout(checkAuth, 100);
  }, [router]);

  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      
      try {
        // Fetch semua produk aktif, tidak hanya yang featured
        const params: Record<string, string> = {
          limit: '8',
          active: 'true'
        };

        const queryString = new URLSearchParams(params).toString();
        const response = await fetch(`${apiUrl}/products?${queryString}`);
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
          
          // Ambil 4 produk pertama, atau gabungkan dengan produk featured jika kurang dari 4
          let productsToShow = transformedProducts.slice(0, 4);
          
          // Jika kurang dari 4 produk, tambahkan produk featured lainnya
          if (productsToShow.length < 4) {
            const featuredProducts = transformedProducts.filter((p: any) => p.featured);
            const additionalProducts = featuredProducts.slice(0, 4 - productsToShow.length);
            productsToShow = [...productsToShow, ...additionalProducts];
          }
          
          // Jika masih kurang, ambil dari mock data
          if (productsToShow.length < 4) {
            const mockProducts = getMockProducts();
            const needed = 4 - productsToShow.length;
            productsToShow = [...productsToShow, ...mockProducts.slice(0, needed)];
          }
          
          setProducts(productsToShow.slice(0, 4)); // Pastikan selalu 4 produk
          return;
        }
      } catch (apiError) {
        console.log('API error, using mock data:', apiError);
      }
      
      // Fallback ke mock data jika API gagal
      console.log('Menggunakan data mock karena API gagal');
      setProducts(getMockProducts());
      
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts(getMockProducts());
    } finally {
      setLoadingProducts(false);
    }
  };

  const getMockProducts = (): Product[] => {
    return [
      { 
        id: '1', 
        name: 'Valentine Buket', 
        price: 24000,
        description: 'Buket bunga spesial untuk hari Valentine dengan mawar merah dan dekorasi elegan',
        category: 'Valentine', 
        image: '/placeholder.jpg', 
        tags: ['valentine', 'buket', 'romantis', 'mawar'], 
        featured: true,
        stock: 10 
      },
      { 
        id: '2', 
        name: 'Buunga (Salinan)', 
        price: 79000,
        description: 'Rangkaian bunga cantik untuk berbagai acara dengan kombinasi warna yang menarik',
        category: 'Birthday', 
        image: '/placeholder.jpg', 
        tags: ['birthday', 'cantik', 'warna-warni'], 
        featured: false,
        stock: 3 
      },
      { 
        id: '3', 
        name: 'Buunga Premium', 
        price: 120000,
        description: 'Rangkaian bunga segar dengan desain menarik menggunakan bunga import berkualitas',
        category: 'Birthday', 
        image: '/placeholder.jpg', 
        tags: ['birthday', 'premium', 'import'], 
        featured: true,
        stock: 5 
      },
      { 
        id: '4', 
        name: 'Tropical Paradisee', 
        price: 79000,
        description: 'Rangkaian bunga tropis yang eksotis dan segar untuk dekorasi ruangan',
        category: 'Roses', 
        image: '/placeholder.jpg', 
        tags: ['tropical', 'eksotis', 'dekorasi'], 
        featured: true,
        stock: 20 
      },
    ];
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleShopClick = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    if (!user) {
      router.push('/register');
    } else {
      router.push(href);
    }
  };

  const handleProductClick = (productId: string) => {
    router.push(`/shop/${productId}`);
  };

  const handleAddToCart = async (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    
    // Cek login
    const isLoggedIn = checkAuth();
    if (!isLoggedIn) {
      const { default: Swal } = await import('sweetalert2');
      const result = await Swal.fire({
        title: 'Login Diperlukan',
        text: 'Silakan login terlebih dahulu untuk menambahkan produk ke keranjang',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#EC4899',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Login Sekarang',
        cancelButtonText: 'Nanti'
      });
      
      if (result.isConfirmed) {
        router.push('/login');
      }
      return;
    }
    
    if (!product.stock || product.stock <= 0) {
      const { default: Swal } = await import('sweetalert2');
      await Swal.fire({
        icon: 'warning',
        title: 'Stok Habis',
        text: 'Maaf, produk ini sedang habis stok!',
        confirmButtonColor: '#EC4899',
      });
      return;
    }
    
    // Tambah ke cart dengan quantity 1
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      category: product.category,
      stock: product.stock || 0,
    }, 1);
    
    const { default: Swal } = await import('sweetalert2');
    await Swal.fire({
      icon: 'success',
      title: 'Ditambahkan ke Keranjang!',
      text: `${product.name} berhasil ditambahkan ke keranjang`,
      showConfirmButton: true,
      confirmButtonText: 'OK',
      confirmButtonColor: '#EC4899',
      timer: 2000,
      timerProgressBar: true,
    });
    
    // Refresh cart count
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('cartUpdated'));
    }
  };

  const testimonials = [
    {
      image: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=200',
      name: 'Sarah Wijaya',
      handle: '@sarahwj',
      date: '20 April 2024',
      content: 'Bunganya segar dan tahan lama! Pengiriman tepat waktu, pelayanan ramah. Sangat direkomendasikan!'
    },
    {
      image: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200',
      name: 'Andi Pratama',
      handle: '@andiprtm',
      date: '15 Mei 2024',
      content: 'Pesan buket untuk anniversary istri, dia sangat suka! Kualitas bunga premium, packaging rapi.'
    },
    {
      image: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=200&auto=format&fit=crop&q=60',
      name: 'Dewi Lestari',
      handle: '@dewils',
      date: '8 Juni 2024',
      content: 'Sudah langganan beli bunga disini. Fresh selalu, pilihan warna lengkap, harga kompetitif.'
    },
    {
      image: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop&q=60',
      name: 'Budi Santoso',
      handle: '@budist',
      date: '25 Mei 2024',
      content: 'Untuk acara kantor, pesan 20 buket. Semua datang tepat waktu, kondisi bunga perfect!'
    },
    {
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=60',
      name: 'Maya Sari',
      handle: '@mayasr',
      date: '12 Juni 2024',
      content: 'Custom buket sesuai request, hasilnya persis seperti yang saya mau. Puas banget!'
    },
    {
      image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=200&auto=format&fit=crop&q=60',
      name: 'Rina Hartati',
      handle: '@rinahrt',
      date: '30 Mei 2024',
      content: 'Pelayanan customer service sangat membantu. Bunga anggrek untuk ibu masih segar seminggu.'
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 h-56 sm:h-64 rounded-xl mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* ================= HERO SECTION ================= */}
      <section className="relative overflow-hidden bg-gradient-to-br from-pink-400 via-pink-500 to-purple-600">
        <div className="absolute inset-0 bg-black/5"></div>
        <div className="relative container mx-auto px-4 py-12 md:py-20 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            
            {/* LEFT CONTENT */}
            <div className="text-white space-y-4 md:space-y-6 max-w-xl order-2 lg:order-1">
              <div className="inline-flex items-center px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-white/20 backdrop-blur-sm">
                <span className="text-xs md:text-sm font-medium">KOLEKSI TERBARU</span>
              </div>
              
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                Temukan Keindahan Abadi dalam Setiap 
                <span className="text-yellow-300 block md:inline"> Kelopak Bunga</span>
              </h1>
              
              <p className="text-base md:text-lg text-white/90 leading-relaxed">
                Anggrek melambangkan cinta, kemewahan, kekuatan, dan keanggunan. Setiap rangkaian menceritakan kisah 
                kekaguman dan apresiasi tulus—sempurna untuk ulang tahun, pernikahan, dan setiap momen berharga.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 pt-2 md:pt-4">
                <style jsx>{`
                  @keyframes rotate {
                    100% {
                      transform: rotate(1turn);
                    }
                  }
                  .rainbow-glow::before {
                    content: '';
                    position: absolute;
                    z-index: -2;
                    left: -50%;
                    top: -50%;
                    width: 200%;
                    height: 200%;
                    background-position: 100% 50%;
                    background-repeat: no-repeat;
                    background-size: 50% 30%;
                    filter: blur(6px);
                    background-image: linear-gradient(#FF0A7F,#780EFF);
                    animation: rotate 4s linear infinite;
                  }
                `}</style>
                <div className="rainbow-glow relative z-0 overflow-hidden p-0.5 flex items-center justify-center rounded-full hover:scale-105 transition duration-300 active:scale-100">
                  <button
                    onClick={(e) => handleShopClick(e, '/shop')}
                    className="px-6 md:px-8 py-3 md:py-4 text-white rounded-full font-bold bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 transition-all duration-300 text-sm md:text-base w-full sm:w-auto"
                  >
                    Belanja Sekarang →
                  </button>
                </div>
                <Link
                  href="/about"
                  className="px-6 md:px-8 py-3 md:py-4 border-2 border-white text-white rounded-full font-bold hover:bg-white/10 transition-all duration-300 text-center text-sm md:text-base"
                >
                  Tentang Kami
                </Link>
              </div>
            </div>

            {/* RIGHT IMAGE */}
            <div className="relative order-1 lg:order-2">
              <div className="relative z-10 transform hover:scale-105 transition-transform duration-500">
                <img
                  src="/download__11_-removebg-preview.png"
                  alt="Bunga Anggrek"
                  className="w-full max-w-md lg:max-w-lg mx-auto drop-shadow-2xl"
                />
              </div>
              <div className="absolute -bottom-4 -right-4 w-48 h-48 md:w-64 md:h-64 bg-gradient-to-br from-yellow-400/20 to-pink-400/20 rounded-full blur-2xl"></div>
              <div className="absolute -top-4 -left-4 w-32 h-32 md:w-48 md:h-48 bg-gradient-to-br from-purple-400/20 to-blue-400/20 rounded-full blur-2xl"></div>
            </div>

          </div>
        </div>
        
        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="w-full">
            <path fill="#ffffff" fillOpacity="1" d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,192C672,181,768,139,864,138.7C960,139,1056,181,1152,192C1248,203,1344,181,1392,170.7L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
          </svg>
        </div>
      </section>

      {/* ================= FEATURED PRODUCTS ================= */}
      <section className="py-12 md:py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 md:mb-12">
            <div className="mb-4 md:mb-0">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-800 mb-2">
                Koleksi Unggulan
              </h2>
              <p className="text-gray-600 text-sm md:text-base">Rangkaian terlaris yang disukai pelanggan kami</p>
            </div>
            <Link
              href="/shop"
              className="inline-flex items-center text-pink-600 hover:text-pink-700 font-semibold text-sm md:text-base"
            >
              Lihat Semua Produk
              <svg className="w-4 h-4 md:w-5 md:h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>

          {loadingProducts ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 h-56 sm:h-64 rounded-xl mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
              {products.map((product) => (
                <div 
                  key={product.id} 
                  className="group bg-white rounded-xl md:rounded-2xl overflow-hidden border border-gray-100 hover:border-pink-300 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
                  onClick={() => handleProductClick(product.id)}
                >
                  <div className="relative overflow-hidden">
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
                    
                    <div className="absolute top-3 left-3 flex flex-col gap-2">
                      {product.featured && (
                        <span className="px-3 py-1 bg-pink-600 text-white text-xs font-bold rounded-full">
                          UNGGULAN
                        </span>
                      )}
                      {product.stock && product.stock <= 0 && (
                        <span className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                          HABIS
                        </span>
                      )}
                      {product.stock && product.stock > 0 && product.stock < 5 && (
                        <span className="px-3 py-1 bg-yellow-500 text-white text-xs font-bold rounded-full">
                          STOK TERBATAS
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="p-4 md:p-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-500 capitalize">{product.category}</span>
                      {product.stock && product.stock > 0 && (
                        <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                          Stok: {product.stock}
                        </span>
                      )}
                    </div>
                    
                    <h3 className="font-bold text-gray-800 group-hover:text-pink-600 transition-colors text-sm md:text-base mb-2 line-clamp-1">
                      {product.name}
                    </h3>
                    
                    <p className="text-gray-600 text-xs md:text-sm mb-3 md:mb-4 line-clamp-2">
                      {product.description || 'Rangkaian bunga segar yang indah, cocok untuk berbagai acara'}
                    </p>
                    
                    <div className="flex flex-wrap gap-1 mb-3 md:mb-4">
                      {product.tags.slice(0, 3).map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded capitalize">
                          {tag}
                        </span>
                      ))}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-lg md:text-xl lg:text-2xl font-bold text-pink-600">
                          {formatRupiah(product.price)}
                        </span>
                      </div>
                      <button
                        onClick={(e) => handleAddToCart(e, product)}
                        disabled={!product.stock || product.stock <= 0}
                        className={`px-3 py-1.5 md:px-4 md:py-2.5 rounded-lg font-medium transition-all duration-300 text-xs md:text-sm ${
                          !product.stock || product.stock <= 0
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700'
                        }`}
                      >
                        <svg className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        {!product.stock || product.stock <= 0 ? 'Stok Habis' : 'Tambah'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {products.length === 0 && !loadingProducts && (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Belum ada produk</h3>
              <p className="text-gray-600 mb-6">Produk akan segera tersedia</p>
            </div>
          )}
        </div>
      </section>

      {/* ================= TESTIMONIALS ================= */}
      <section className="py-12 md:py-16 bg-white overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-800 mb-2">
              Dipercaya Ribuan Pelanggan
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-sm md:text-base">
              Lihat apa kata pelanggan tentang pengalaman berbelanja di Bloom Sisters
            </p>
          </div>

          <style jsx>{`
            @keyframes marqueeScroll {
              0% { transform: translateX(0%); }
              100% { transform: translateX(-50%); }
            }
            .marquee-inner {
              animation: marqueeScroll 30s linear infinite;
              display: flex;
              will-change: transform;
            }
            .marquee-inner:hover {
              animation-play-state: paused;
            }
            @media (max-width: 768px) {
              .marquee-inner {
                animation: marqueeScroll 20s linear infinite;
              }
            }
          `}</style>

          {/* Single Marquee Row */}
          <div className="relative">
            <div className="marquee-inner flex transform-gpu py-4 md:py-6">
              {[...testimonials, ...testimonials].map((card, index) => (
                <div key={index} className="p-4 md:p-6 rounded-xl md:rounded-2xl mx-3 md:mx-4 border border-gray-200 hover:border-pink-300 transition-all duration-300 w-64 md:w-80 shrink-0 bg-white">
                  <div className="flex gap-3 items-center mb-4">
                    <img className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover" src={card.image} alt={card.name} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <p className="font-semibold text-gray-800 truncate text-sm md:text-base">{card.name}</p>
                        <svg className="mt-0.5 flex-shrink-0" width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" clipRule="evenodd" d="M4.555.72a4 4 0 0 1-.297.24c-.179.12-.38.202-.59.244a4 4 0 0 1-.38.041c-.48.039-.721.058-.922.129a1.63 1.63 0 0 0-.992.992c-.071.2-.09.441-.129.922a4 4 0 0 1-.041.38 1.6 1.6 0 0 1-.245.59 3 3 0 0 1-.239.297c-.313.368-.47.551-.56.743-.213.444-.213.96 0 1.404.09.192.247.375.56.743.125.146.187.219.24.297.12.179.202.38.244.59.018.093.026.189.041.38.039.48.058.721.129.922.163.464.528.829.992.992.2.071.441.09.922.129.191.015.287.023.38.041.21.042.411.125.59.245.078.052.151.114.297.239.368.313.551.47.743.56.444.213.96.213 1.404 0 .192-.09.375-.247.743-.56.146-.125.219-.187.297-.24.179-.12.38-.202.59-.244a4 4 0 0 1 .38-.041c.48-.039.721-.058.922-.129.464-.163.829-.528.992-.992.071-.2.09-.441.129-.922a4 4 0 0 1 .041-.38c.042-.21.125-.411.245-.59.052-.078.114-.151.239-.297.313-.368.47-.551.56-.743.213-.444.213-.96 0-1.404-.09-.192-.247-.375-.56-.743a4 4 0 0 1-.24-.297 1.6 1.6 0 0 1-.244-.59 3 3 0 0 1-.041-.38c-.039-.48-.058-.721-.129-.922a1.63 1.63 0 0 0-.992-.992c-.2-.071-.441-.09-.922-.129a4 4 0 0 1-.38-.041 1.6 1.6 0 0 1-.59-.245A3 3 0 0 1 7.445.72C7.077.407 6.894.25 6.702.16a1.63 1.63 0 0 0-1.404 0c-.192.09-.375.247-.743.56m4.07 3.998a.488.488 0 0 0-.691-.69l-2.91 2.91-.958-.957a.488.488 0 0 0-.69.69l1.302 1.302c.19.191.5.191.69 0z" fill="#2196F3" />
                        </svg>
                      </div>
                      <span className="text-xs text-gray-500 truncate block">{card.handle}</span>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 mb-4 text-xs md:text-sm leading-relaxed line-clamp-3">{card.content}</p>
                  
                  <div className="flex items-center justify-between text-gray-500 text-xs pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-1">
                      <span>Diposting pada</span>
                      <a href="https://x.com" target="_blank" className="hover:text-blue-500 transition-colors">
                        <svg width="11" height="10" viewBox="0 0 11 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="m.027 0 4.247 5.516L0 10h.962l3.742-3.926L7.727 10H11L6.514 4.174 10.492 0H9.53L6.084 3.616 3.3 0zM1.44.688h1.504l6.64 8.624H8.082z" fill="currentColor" />
                        </svg>
                      </a>
                    </div>
                    <p className="font-medium">{card.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================= CTA SECTION ================= */}
      {!user && (
        <section className="py-12 md:py-16 bg-gradient-to-r from-pink-500 to-purple-600">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-2xl lg:max-w-3xl mx-auto">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4 md:mb-6">
                Siap Membuat Hari Seseorang Lebih Cerah?
              </h2>
              <p className="text-white/90 text-sm md:text-lg mb-6 md:mb-8">
                Bergabunglah dengan ribuan pelanggan puas dan rasakan perbedaan Bloom Sisters. 
                Daftar hari ini dan dapatkan diskon 15% untuk pembelian pertama!
              </p>
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
                <Link
                  href="/register"
                  className="px-6 md:px-8 py-3 md:py-4 bg-white text-pink-600 rounded-full font-bold hover:bg-gray-100 transition-all duration-300 transform hover:-translate-y-1 text-sm md:text-base"
                >
                  Buat Akun Gratis
                </Link>
                <Link
                  href="/shop"
                  className="px-6 md:px-8 py-3 md:py-4 border-2 border-white text-white rounded-full font-bold hover:bg-white/10 transition-all duration-300 text-sm md:text-base"
                >
                  Jelajahi Koleksi
                </Link>
              </div>
              <p className="text-white/70 text-xs md:text-sm mt-4 md:mt-6">
                Tidak memerlukan kartu kredit • Garansi kepuasan 30 hari
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ================= FOOTER ================= */}
      <Footer />
    </div>
  );
}