'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { formatRupiah, formatDate } from '@/utils/cart';

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product: {
    id: string;
    name: string;
    slug: string;
    images: string[];
    category: string;
  };
}

interface Voucher {
  id: string;
  code: string;
  discount: number;
  type: 'PERCENTAGE' | 'FIXED';
  minPurchase: number | null;
  maxDiscount: number | null;
}

interface Order {
  id: string;
  createdAt: string;
  updatedAt: string;
  total: number;
  subtotal: number;
  shippingFee: number;
  status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED';
  paymentStatus: string;
  paymentMethod: string;
  paymentToken: string;
  paymentUrl: string;
  midtransOrderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  notes: string;
  voucher: Voucher | null;
  orderItems: OrderItem[];
  user: {
    username: string;
    email: string;
  };
}

export default function TransactionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncingPayment, setIsSyncingPayment] = useState(false);
  const [activeTab, setActiveTab] = useState('detail');
  
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    fetchOrder();
  }, [params.id]);

  const fetchOrder = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`${API_URL}/orders/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
        return;
      }

      if (!response.ok) {
        if (response.status === 404) {
          router.push('/transactions');
          return;
        }
        throw new Error('Failed to fetch order');
      }

      const data = await response.json();
      
      if (data.success) {
        setOrder(data.data);
      }
    } catch (error) {
      console.error('Error fetching order:', error);
      alert('Gagal memuat detail transaksi');
      router.push('/transactions');
    } finally {
      setIsLoading(false);
    }
  };

  const syncPaymentStatus = async () => {
    try {
      setIsSyncingPayment(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/orders/payment/sync/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to sync payment');
      }

      const data = await response.json();
      
      if (data.success) {
        setOrder(data.data);
        alert('Status pembayaran berhasil disinkronisasi');
      }
    } catch (error) {
      console.error('Error syncing payment:', error);
      alert('Gagal menyinkronisasi status pembayaran');
    } finally {
      setIsSyncingPayment(false);
    }
  };

  const handlePayNow = () => {
    if (order?.paymentUrl) {
      window.open(order.paymentUrl, '_blank');
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'PROCESSING':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'SHIPPED':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'DELIVERED':
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Menunggu Pembayaran';
      case 'PROCESSING': return 'Diproses';
      case 'SHIPPED': return 'Dikirim';
      case 'DELIVERED': return 'Terkirim';
      case 'COMPLETED': return 'Selesai';
      case 'CANCELLED': return 'Dibatalkan';
      default: return status;
    }
  };

  const getPaymentStatusText = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'Menunggu Pembayaran';
      case 'paid': return 'Lunas';
      case 'settlement': return 'Berhasil';
      case 'expired': return 'Kedaluwarsa';
      case 'denied': return 'Ditolak';
      case 'cancelled': return 'Dibatalkan';
      case 'challenge': return 'Dalam Tantangan';
      default: return status || 'Pending';
    }
  };

  const getTimelineSteps = () => {
    const steps = [
      { 
        key: 'order_placed', 
        label: 'Pesanan Dibuat', 
        date: order?.createdAt,
        completed: true 
      },
      { 
        key: 'payment', 
        label: 'Pembayaran', 
        date: order?.paymentStatus === 'PAID' ? order.updatedAt : null,
        completed: ['PAID', 'SETTLEMENT'].includes(order?.paymentStatus?.toUpperCase() || '') 
      },
      { 
        key: 'processing', 
        label: 'Diproses', 
        date: order?.status === 'PROCESSING' ? order.updatedAt : null,
        completed: ['PROCESSING', 'SHIPPED', 'DELIVERED', 'COMPLETED'].includes(order?.status || '') 
      },
      { 
        key: 'shipped', 
        label: 'Dikirim', 
        date: order?.status === 'SHIPPED' ? order.updatedAt : null,
        completed: ['SHIPPED', 'DELIVERED', 'COMPLETED'].includes(order?.status || '') 
      },
      { 
        key: 'delivered', 
        label: 'Terkirim', 
        date: order?.status === 'DELIVERED' || order?.status === 'COMPLETED' ? order.updatedAt : null,
        completed: ['DELIVERED', 'COMPLETED'].includes(order?.status || '') 
      },
    ];

    return steps;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="mb-6">
            <svg className="w-24 h-24 text-gray-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Transaksi Tidak Ditemukan</h1>
          <p className="text-gray-600 mb-8">Transaksi yang Anda cari tidak ditemukan atau telah dihapus.</p>
          <Link
            href="/transactions"
            className="inline-flex items-center px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
          >
            Kembali ke Daftar Transaksi
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const timelineSteps = getTimelineSteps();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Detail Transaksi</h1>
              <p className="text-gray-600">Order ID: {order.id}</p>
            </div>
            <Link
              href="/transactions"
              className="flex items-center text-pink-600 hover:text-pink-700 font-medium"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Kembali
            </Link>
          </div>
          
          {/* Status Badges */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 shadow-sm flex-1 min-w-[200px]">
              <p className="text-sm text-gray-600 mb-1">Status Pesanan</p>
              <div className="flex items-center">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusBadgeClass(order.status)}`}>
                  {getStatusText(order.status)}
                </span>
                {order.status === 'PENDING' && (
                  <button
                    onClick={syncPaymentStatus}
                    disabled={isSyncingPayment}
                    className="ml-3 text-sm text-blue-600 hover:text-blue-700 flex items-center"
                  >
                    {isSyncingPayment ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-1"></div>
                        Menyinkronkan...
                      </>
                    ) : (
                      'Cek Status'
                    )}
                  </button>
                )}
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 shadow-sm flex-1 min-w-[200px]">
              <p className="text-sm text-gray-600 mb-1">Status Pembayaran</p>
              <div className="flex items-center">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  order.paymentStatus?.toUpperCase() === 'PAID' || order.paymentStatus?.toUpperCase() === 'SETTLEMENT'
                    ? 'bg-green-100 text-green-800 border border-green-200'
                    : order.paymentStatus?.toUpperCase() === 'PENDING'
                    ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                    : 'bg-red-100 text-red-800 border border-red-200'
                }`}>
                  {getPaymentStatusText(order.paymentStatus)}
                </span>
                {order.paymentStatus === 'PENDING' && order.paymentUrl && (
                  <button
                    onClick={handlePayNow}
                    className="ml-3 text-sm bg-pink-600 text-white px-3 py-1 rounded-lg hover:bg-pink-700 transition-colors"
                  >
                    Bayar Sekarang
                  </button>
                )}
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 shadow-sm flex-1 min-w-[200px]">
              <p className="text-sm text-gray-600 mb-1">Total Pembayaran</p>
              <p className="text-2xl font-bold text-pink-600">{formatRupiah(order.total)}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-sm mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex overflow-x-auto">
              <button
                onClick={() => setActiveTab('detail')}
                className={`px-6 py-4 text-sm font-medium whitespace-nowrap ${activeTab === 'detail' ? 'border-b-2 border-pink-600 text-pink-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Detail Pesanan
              </button>
              <button
                onClick={() => setActiveTab('timeline')}
                className={`px-6 py-4 text-sm font-medium whitespace-nowrap ${activeTab === 'timeline' ? 'border-b-2 border-pink-600 text-pink-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Timeline
              </button>
              <button
                onClick={() => setActiveTab('payment')}
                className={`px-6 py-4 text-sm font-medium whitespace-nowrap ${activeTab === 'payment' ? 'border-b-2 border-pink-600 text-pink-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Info Pembayaran
              </button>
            </nav>
          </div>
          
          <div className="p-6">
            {activeTab === 'detail' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Order Items */}
                <div className="lg:col-span-2">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Produk yang Dipesan</h3>
                  <div className="space-y-4">
                    {order.orderItems.map((item) => (
                      <div key={item.id} className="bg-gray-50 rounded-xl p-4">
                        <div className="flex items-start gap-4">
                          <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center overflow-hidden">
                            {item.product.images && item.product.images.length > 0 ? (
                              <img 
                                src={item.product.images[0]} 
                                alt={item.product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="text-2xl">🌺</div>
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <Link href={`/shop/${item.product.slug}`}>
                              <h4 className="font-medium text-gray-800 hover:text-pink-600 transition-colors">
                                {item.product.name}
                              </h4>
                            </Link>
                            <p className="text-sm text-gray-600 mb-2">Kategori: {item.product.category}</p>
                            
                            <div className="flex justify-between items-center">
                              <div>
                                <span className="font-medium text-gray-800">{formatRupiah(item.price)}</span>
                                <span className="text-gray-600 mx-2">×</span>
                                <span className="text-gray-600">{item.quantity}</span>
                              </div>
                              <div className="font-semibold text-gray-800">
                                {formatRupiah(item.price * item.quantity)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Order Summary */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Ringkasan Pesanan</h3>
                  <div className="bg-gray-50 rounded-xl p-6">
                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="font-medium">{formatRupiah(order.subtotal || order.total - order.shippingFee + (order.voucher?.discount || 0))}</span>
                      </div>
                      
                      {order.voucher && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Diskon Voucher ({order.voucher.code})</span>
                          <span className="font-medium text-green-600">
                            {order.voucher.type === 'PERCENTAGE' 
                              ? `-${order.voucher.discount}%` 
                              : `-${formatRupiah(order.voucher.discount)}`}
                          </span>
                        </div>
                      )}
                      
                      <div className="flex justify-between">
                        <span className="text-gray-600">Ongkos Kirim</span>
                        <span className="font-medium">
                          {order.shippingFee === 0 ? (
                            <span className="text-green-600">Gratis</span>
                          ) : (
                            formatRupiah(order.shippingFee)
                          )}
                        </span>
                      </div>
                      
                      <div className="border-t pt-3">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-gray-800">Total</span>
                          <span className="text-2xl font-bold text-pink-600">{formatRupiah(order.total)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Metode Pembayaran</p>
                        <p className="text-sm text-gray-600">
                          {order.paymentMethod ? order.paymentMethod.replace(/_/g, ' ').toUpperCase() : 'Midtrans Payment Gateway'}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Tanggal Pesanan</p>
                        <p className="text-sm text-gray-600">
                          {formatDate(order.createdAt)} • {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      
                      {order.notes && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">Catatan Pesanan</p>
                          <p className="text-sm text-gray-600 italic">{order.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'timeline' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-6">Timeline Pesanan</h3>
                <div className="space-y-6">
                  {timelineSteps.map((step, index) => (
                    <div key={step.key} className="flex items-start">
                      <div className="flex flex-col items-center mr-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          step.completed ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                        }`}>
                          {step.completed ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <span className="text-sm font-medium">{index + 1}</span>
                          )}
                        </div>
                        {index < timelineSteps.length - 1 && (
                          <div className={`w-0.5 h-12 ${step.completed ? 'bg-green-200' : 'bg-gray-200'} mt-1`}></div>
                        )}
                      </div>
                      
                      <div className="flex-1 pb-8">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-800">{step.label}</p>
                            {step.date ? (
                              <p className="text-sm text-gray-600 mt-1">
                                {formatDate(step.date)} • {new Date(step.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            ) : (
                              <p className="text-sm text-gray-500 mt-1">Menunggu...</p>
                            )}
                          </div>
                          {step.completed && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                              Selesai
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {activeTab === 'payment' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Payment Details */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Detail Pembayaran</h3>
                  <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Status Pembayaran</p>
                      <p className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        order.paymentStatus?.toUpperCase() === 'PAID' || order.paymentStatus?.toUpperCase() === 'SETTLEMENT'
                          ? 'bg-green-100 text-green-800 border border-green-200'
                          : order.paymentStatus?.toUpperCase() === 'PENDING'
                          ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                          : 'bg-red-100 text-red-800 border border-red-200'
                      }`}>
                        {getPaymentStatusText(order.paymentStatus)}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Metode Pembayaran</p>
                      <p className="text-gray-800">{order.paymentMethod || 'Midtrans Payment Gateway'}</p>
                    </div>
                    
                    {order.midtransOrderId && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">ID Transaksi Midtrans</p>
                        <p className="font-mono text-sm text-gray-600">{order.midtransOrderId}</p>
                      </div>
                    )}
                    
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Total Dibayar</p>
                      <p className="text-2xl font-bold text-pink-600">{formatRupiah(order.total)}</p>
                    </div>
                    
                    {order.paymentStatus === 'PENDING' && order.paymentUrl && (
                      <div className="pt-4">
                        <button
                          onClick={handlePayNow}
                          className="w-full py-3 bg-pink-600 text-white rounded-lg font-medium hover:bg-pink-700 transition-colors mb-3"
                        >
                          Lanjutkan Pembayaran
                        </button>
                        <button
                          onClick={syncPaymentStatus}
                          disabled={isSyncingPayment}
                          className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center"
                        >
                          {isSyncingPayment ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                              Menyinkronkan...
                            </>
                          ) : (
                            'Cek Status Terbaru'
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Shipping Details */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Informasi Pengiriman</h3>
                  <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Nama Penerima</p>
                      <p className="text-gray-800">{order.customerName}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Email</p>
                      <p className="text-gray-800">{order.customerEmail}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Telepon</p>
                      <p className="text-gray-800">{order.customerPhone}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Alamat Pengiriman</p>
                      <p className="text-gray-800 whitespace-pre-line">{order.shippingAddress}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Catatan</p>
                      <p className="text-gray-800 italic">{order.notes || 'Tidak ada catatan'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 justify-between items-center">
          <div className="text-sm text-gray-600">
            <p>Punya pertanyaan tentang pesanan ini?</p>
            <p className="font-medium">Hubungi Customer Service: 0800-123-4567</p>
          </div>
          
          <div className="flex gap-3">
            {order.status === 'PENDING' && order.paymentUrl && (
              <button
                onClick={handlePayNow}
                className="px-6 py-3 bg-pink-600 text-white rounded-lg font-medium hover:bg-pink-700 transition-colors"
              >
                Lanjutkan Pembayaran
              </button>
            )}
            
            <button
              onClick={() => window.print()}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cetak Invoice
            </button>
            
            <Link
              href="/transactions"
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Kembali ke Daftar
            </Link>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}