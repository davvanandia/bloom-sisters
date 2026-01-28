// app/checkout/page.tsx - Fixed Midtrans Integration
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { formatRupiah } from '@/utils/cart';

declare global {
  interface Window {
    snap?: {
      pay: (token: string, options: any) => void;
    };
  }
}

interface CheckoutItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  category: string;
  stock: number;
}

interface VoucherData {
  id: string;
  code: string;
  discountAmount: number;
}

interface CheckoutData {
  items: CheckoutItem[];
  subtotal: number;
  shippingFee: number;
  voucherDiscount: number;
  total: number;
  voucherData: VoucherData | null;
}

export default function CheckoutPage() {
  const router = useRouter();
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [snapReady, setSnapReady] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: 'Jakarta',
    postalCode: '12345',
    province: 'DKI Jakarta',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const MIDTRANS_CLIENT_KEY = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;

  useEffect(() => {
    const loadMidtransScript = () => {
      if (document.getElementById('midtrans-snap-script')) {
        console.log('Midtrans script already loaded');
        if (window.snap) {
          setSnapReady(true);
        }
        return;
      }

      const script = document.createElement('script');
      script.id = 'midtrans-snap-script';
      script.src = 'https://app.sandbox.midtrans.com/snap/snap.js';
      script.setAttribute('data-client-key', MIDTRANS_CLIENT_KEY);
      script.async = true;
      
      script.onload = () => {
        console.log('✅ Midtrans Snap script loaded successfully');
        setSnapReady(true);
      };
      
      script.onerror = () => {
        console.error('❌ Failed to load Midtrans Snap script');
        setSnapReady(false);
      };
      
      document.head.appendChild(script);
    };

    loadMidtransScript();

    const savedCheckoutData = localStorage.getItem('checkout_items');
    if (!savedCheckoutData) {
      console.warn('No checkout data found, redirecting to cart');
      router.push('/cart');
      return;
    }

    try {
      const parsedData = JSON.parse(savedCheckoutData);
      console.log('✅ Loaded checkout data:', parsedData);
      setCheckoutData(parsedData);
      
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        setFormData(prev => ({
          ...prev,
          name: user.name || user.username || '',
          email: user.email || '',
          phone: user.phone || ''
        }));
        console.log('✅ Loaded user data');
      }
    } catch (error) {
      console.error('❌ Error parsing checkout data:', error);
      router.push('/cart');
    }
  }, [router, MIDTRANS_CLIENT_KEY]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) newErrors.name = 'Nama lengkap harus diisi';
    if (!formData.email.trim()) newErrors.email = 'Email harus diisi';
    if (!formData.phone.trim()) newErrors.phone = 'Nomor telepon harus diisi';
    if (!formData.address.trim()) newErrors.address = 'Alamat harus diisi';
    if (!formData.city.trim()) newErrors.city = 'Kota harus diisi';
    if (!formData.province.trim()) newErrors.province = 'Provinsi harus diisi';
    if (!formData.postalCode.trim()) newErrors.postalCode = 'Kode pos harus diisi';
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Format email tidak valid';
    }
    
    const phoneRegex = /^[0-9]{10,13}$/;
    if (formData.phone && !phoneRegex.test(formData.phone.replace(/[^0-9]/g, ''))) {
      newErrors.phone = 'Nomor telepon harus 10-13 digit angka';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const openMidtransPopup = (token: string, orderId: string): Promise<any> => {
    return new Promise((resolve, reject) => {
      if (!window.snap) {
        console.error('❌ Midtrans Snap not loaded');
        reject(new Error('Midtrans SDK belum siap. Mohon refresh halaman.'));
        return;
      }

      console.log('🚀 Opening Midtrans payment popup for order:', orderId);

      window.snap.pay(token, {
        onSuccess: (result: any) => {
          console.log('✅ Payment success:', result);
          resolve({ status: 'success', result });
        },
        onPending: (result: any) => {
          console.log('⏳ Payment pending:', result);
          resolve({ status: 'pending', result });
        },
        onError: (result: any) => {
          console.error('❌ Payment error:', result);
          reject(new Error('Pembayaran gagal. Silakan coba lagi.'));
        },
        onClose: () => {
          console.log('⚠️ Payment popup closed by user');
          reject(new Error('POPUP_CLOSED'));
        }
      });
    });
  };

const handleSubmitOrder = async () => {
  if (!checkoutData) {
    alert('Data checkout tidak ditemukan');
    return;
  }

  if (!validateForm()) {
    alert('Harap perbaiki kesalahan pada form');
    const firstError = Object.keys(errors)[0];
    const element = document.getElementsByName(firstError)[0];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.focus();
    }
    return;
  }

  if (!snapReady || !window.snap) {
    alert('Sistem pembayaran belum siap. Mohon refresh halaman dan coba lagi.');
    return;
  }

  console.log('🛒 Checkout data:', checkoutData);
  console.log('💰 Total payment:', checkoutData.total);

  setIsLoading(true);

  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      alert('Silakan login terlebih dahulu untuk melakukan checkout');
      router.push('/login');
      return;
    }

    const shippingAddress = `${formData.address}, ${formData.city}, ${formData.province} ${formData.postalCode}`;

    const itemsForApi = checkoutData.items.map(item => ({
      productId: item.productId,
      price: item.price,
      quantity: item.quantity
    }));

    console.log('📦 Creating order with data:', {
      items: itemsForApi,
      total: checkoutData.total,
      shippingAddress,
      customerName: formData.name,
      customerEmail: formData.email,
      customerPhone: formData.phone,
      notes: formData.notes,
      voucherId: checkoutData.voucherData?.id || null,
      voucherDiscount: checkoutData.voucherDiscount,
      shippingFee: checkoutData.shippingFee,
      subtotal: checkoutData.subtotal
    });

    // 1. CREATE ORDER
    const orderResponse = await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        items: itemsForApi,
        total: checkoutData.total,
        shippingAddress: shippingAddress,
        customerName: formData.name,
        customerEmail: formData.email,
        customerPhone: formData.phone,
        notes: formData.notes,
        voucherId: checkoutData.voucherData?.id || null,
        voucherDiscount: checkoutData.voucherDiscount,
        shippingFee: checkoutData.shippingFee,
        subtotal: checkoutData.subtotal
      }),
    });

    const orderResult = await orderResponse.json();
    console.log('📄 Order creation response:', orderResult);

    if (!orderResponse.ok) {
      console.error('❌ Order creation failed:', orderResult);
      
      // Tangani kasus khusus
      if (orderResult.error?.includes('stock')) {
        throw new Error(orderResult.error);
      }
      if (orderResult.error?.includes('voucher')) {
        throw new Error(orderResult.error);
      }
      
      throw new Error(orderResult.error || 'Gagal membuat pesanan');
    }

    if (!orderResult.data?.orderId) {
      throw new Error('ID pesanan tidak ditemukan dalam respons');
    }

    console.log('✅ Order created successfully:', orderResult.data.orderId);

    const orderId = orderResult.data.orderId;
    
    // Periksa jika total 0 atau kurang
    if (checkoutData.total <= 0) {
      console.log('💰 Total is 0, skipping payment gateway');
      localStorage.removeItem('checkout_items');
      localStorage.removeItem('florist_cart');
      router.push(`/order/success?orderId=${orderId}`);
      return;
    }
    
    setIsProcessingPayment(true);
    setIsLoading(false);
    
    console.log('💳 Creating Midtrans payment token for order:', orderId);
    
    // 2. CREATE PAYMENT TOKEN
    const paymentResponse = await fetch(`${API_URL}/payment/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ orderId }),
    });

    const paymentData = await paymentResponse.json();
    console.log('📄 Payment creation response:', paymentData);

    if (!paymentResponse.ok) {
      console.error('❌ Payment creation failed:', paymentData);
      throw new Error(paymentData.error || 'Gagal membuat pembayaran');
    }

    if (!paymentData.token) {
      console.error('❌ No payment token returned:', paymentData);
      throw new Error('Token pembayaran tidak ditemukan. Silakan coba lagi.');
    }

    console.log('✅ Payment token created successfully');
    
    // 3. OPEN MIDTRANS POPUP
    setIsProcessingPayment(true);
    
    const paymentResult = await new Promise((resolve, reject) => {
      console.log('🪟 Opening Midtrans popup...');
      
      window.snap!.pay(paymentData.token, {
        onSuccess: (result: any) => {
          console.log('✅ Payment success:', result);
          resolve({ status: 'success', result });
        },
        onPending: (result: any) => {
          console.log('⏳ Payment pending:', result);
          resolve({ status: 'pending', result });
        },
        onError: (result: any) => {
          console.error('❌ Payment error:', result);
          reject(new Error('Pembayaran gagal. Silakan coba lagi.'));
        },
        onClose: () => {
          console.log('⚠️ Payment popup closed by user');
          reject(new Error('POPUP_CLOSED'));
        }
      });
    });
    
    // 4. HANDLE PAYMENT RESULT
    localStorage.removeItem('checkout_items');
    localStorage.removeItem('florist_cart');
    
    if (paymentResult.status === 'success') {
      console.log('✅ Payment completed successfully');
      router.push(`/order/success?orderId=${orderId}`);
    } else if (paymentResult.status === 'pending') {
      console.log('⏳ Payment is pending');
      router.push(`/order/pending?orderId=${orderId}`);
    }
    
  } catch (error: any) {
    console.error('❌ Error in checkout process:', error);
    
    // Periksa apakah error karena popup ditutup
    if (error.message === 'POPUP_CLOSED') {
      const shouldGoToOrders = confirm(
        'Popup pembayaran ditutup. Pesanan Anda sudah dibuat.\n\n' +
        'Klik OK untuk melihat pesanan Anda dan melanjutkan pembayaran, atau Cancel untuk tetap di halaman ini.'
      );
      
      if (shouldGoToOrders) {
        localStorage.removeItem('checkout_items');
        router.push(`/orders`);
        return;
      }
    } else {
      let errorMessage = 'Terjadi kesalahan saat memproses pesanan';
      
      if (error.message.includes('Insufficient stock')) {
        errorMessage = error.message;
      } else if (error.message.includes('Voucher')) {
        errorMessage = error.message;
      } else if (error.message.includes('Midtrans')) {
        errorMessage = 'Terjadi kesalahan pada sistem pembayaran. Silakan coba lagi.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
    }
    
    setIsLoading(false);
    setIsProcessingPayment(false);
  }
};

  if (!checkoutData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat data checkout...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Checkout</h1>
        <p className="text-gray-600 mb-8">Lengkapi informasi pengiriman dan pembayaran</p>

        {!snapReady && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-600 mr-3"></div>
              <p className="text-sm text-yellow-800">Memuat sistem pembayaran Midtrans...</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6">Informasi Pengiriman</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nama Lengkap *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="Masukkan nama lengkap"
                    required
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="nama@email.com"
                    required
                  />
                  {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Nomor Telepon *</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 ${errors.phone ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="081234567890"
                  required
                />
                {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Alamat Lengkap *</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows={3}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 ${errors.address ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Nama jalan, nomor rumah, RT/RW"
                  required
                />
                {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Provinsi *</label>
                  <select
                    name="province"
                    value={formData.province}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 ${errors.province ? 'border-red-500' : 'border-gray-300'}`}
                    required
                  >
                    <option value="DKI Jakarta">DKI Jakarta</option>
                    <option value="Jawa Barat">Jawa Barat</option>
                    <option value="Jawa Tengah">Jawa Tengah</option>
                    <option value="Jawa Timur">Jawa Timur</option>
                    <option value="Bali">Bali</option>
                    <option value="Banten">Banten</option>
                    <option value="DIY Yogyakarta">DIY Yogyakarta</option>
                  </select>
                  {errors.province && <p className="mt-1 text-sm text-red-600">{errors.province}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Kota *</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 ${errors.city ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="Jakarta Selatan"
                    required
                  />
                  {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Kode Pos *</label>
                  <input
                    type="text"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 ${errors.postalCode ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="12345"
                    required
                  />
                  {errors.postalCode && <p className="mt-1 text-sm text-red-600">{errors.postalCode}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Catatan (Opsional)</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder="Contoh: Jangan pakai pita merah, kirim sebelum jam 3 sore"
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6">Metode Pembayaran</h2>
              
              <div className="p-4 border-2 border-pink-500 bg-pink-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-gray-800">Midtrans Payment Gateway</span>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Aman & Terpercaya</span>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Berbagai metode: Transfer Bank, E-Wallet, Kartu Kredit/Debit
                </p>
                <div className="flex flex-wrap gap-2">
                  {['BCA', 'Mandiri', 'BNI', 'BRI', 'Gopay', 'OVO', 'Dana', 'ShopeePay', 'Visa', 'Mastercard'].map((method) => (
                    <span key={method} className="px-2 py-1 bg-white text-gray-600 rounded text-xs border">
                      {method}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  🔒 <strong>Keamanan Terjamin:</strong> Transaksi diproses melalui Midtrans yang tersertifikasi PCI-DSS Level 1
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
                <h2 className="text-xl font-bold text-gray-800 mb-6">Ringkasan Pesanan</h2>
                
                <div className="mb-6">
                  <p className="font-medium text-gray-700 mb-3">Produk ({checkoutData.items.length} item)</p>
                  <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                    {checkoutData.items.map((item, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="text-xl">💐</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800 text-sm truncate">{item.name}</p>
                          <p className="text-sm text-gray-600">{item.quantity} × {formatRupiah(item.price)}</p>
                        </div>
                        <div className="font-medium text-gray-800 text-sm">
                          {formatRupiah(item.price * item.quantity)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">{formatRupiah(checkoutData.subtotal)}</span>
                  </div>
                  
                  {checkoutData.voucherData && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Diskon ({checkoutData.voucherData.code})</span>
                      <span className="font-medium text-green-600">-{formatRupiah(checkoutData.voucherDiscount)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ongkos Kirim</span>
                    <span className="font-medium">
                      {checkoutData.shippingFee === 0 ? (
                        <span className="text-green-600">Gratis</span>
                      ) : (
                        formatRupiah(checkoutData.shippingFee)
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-6 border-t">
                  <div>
                    <p className="font-bold text-lg text-gray-800">Total Pembayaran</p>
                    <p className="text-sm text-gray-500">Termasuk pajak</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-pink-600">{formatRupiah(checkoutData.total)}</p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleSubmitOrder}
                disabled={isLoading || isProcessingPayment || !snapReady}
                className="w-full py-4 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-xl font-semibold hover:from-pink-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-lg"
              >
                {!snapReady ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-2"></div>
                    Memuat Pembayaran...
                  </>
                ) : isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-2"></div>
                    Membuat Pesanan...
                  </>
                ) : isProcessingPayment ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-2"></div>
                    Membuka Pembayaran...
                  </>
                ) : (
                  <>
                    <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                    </svg>
                    Bayar Sekarang
                  </>
                )}
              </button>

              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  ⚠️ <strong>Perhatian:</strong> Jangan tutup popup pembayaran hingga transaksi selesai
                </p>
              </div>

              <div className="mt-4 text-center">
                <button
                  onClick={() => router.push('/cart')}
                  className="inline-flex items-center text-pink-600 hover:text-pink-700 font-medium"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                  </svg>
                  Kembali ke Keranjang
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}