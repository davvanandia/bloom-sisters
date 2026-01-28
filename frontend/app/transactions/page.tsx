'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { formatRupiah, formatDate } from '@/utils/cart';

interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  product: {
    id: string;
    name: string;
    images: string[];
  };
}

interface Order {
  id: string;
  createdAt: string;
  updatedAt: string;
  total: number;
  status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED';
  paymentStatus: string;
  paymentMethod?: string;
  midtransOrderId?: string;
  shippingFee: number;
  shippingAddress: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  notes?: string;
  voucher: {
    code: string;
    discount: number;
    type: 'PERCENTAGE' | 'FIXED';
  } | null;
  orderItems: OrderItem[];
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

interface SyncStatus {
  [key: string]: boolean;
}

// Cache untuk menyimpan data order
const orderCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 menit

export default function TransactionsPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  
  // Auto-sync states - DIKURANGI AGAR TIDAK TERLALU SERING
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  const [syncInterval] = useState(120); // DINAIIKAN JADI 120 DETIK (2 MENIT)
  const [lastSyncTime, setLastSyncTime] = useState<string>('');
  const [syncingOrders, setSyncingOrders] = useState<SyncStatus>({});
  const [showSyncSettings, setShowSyncSettings] = useState(false);
  
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  const autoSyncRef = useRef<NodeJS.Timeout | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Generate cache key berdasarkan parameter
  const generateCacheKey = useCallback((page: number, status: string, search: string, startDate: string, endDate: string) => {
    return `orders_${page}_${status}_${search}_${startDate}_${endDate}`;
  }, []);

  // Fetch orders dengan caching dan abort controller
  const fetchOrders = useCallback(async (page = 1, isRefresh = false) => {
    // Cancel previous request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        router.push('/login');
        return;
      }

      // Generate cache key
      const cacheKey = generateCacheKey(
        page, 
        statusFilter, 
        searchQuery, 
        dateRange.startDate, 
        dateRange.endDate
      );

      // Check cache first (unless refreshing)
      if (!isRefresh) {
        const cached = orderCache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
          console.log('Using cached data for:', cacheKey);
          setOrders(cached.data.data);
          setPagination(cached.data.pagination);
          setIsLoading(false);
          return;
        }
      }

      let url = `${API_URL}/orders/user/my-orders?page=${page}&limit=10`;
      
      if (statusFilter !== 'ALL') {
        url += `&status=${statusFilter}`;
      }

      if (searchQuery) {
        url += `&search=${encodeURIComponent(searchQuery)}`;
      }

      if (dateRange.startDate) {
        url += `&startDate=${dateRange.startDate}`;
      }

      if (dateRange.endDate) {
        url += `&endDate=${dateRange.endDate}`;
      }

      console.log('Fetching orders from API...');
      const startTime = performance.now();

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        signal: abortController.signal
      });

      if (abortController.signal.aborted) {
        console.log('Request aborted');
        return;
      }

      if (response.status === 401) {
        localStorage.removeItem('token');
        router.push('/login');
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch orders: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        const endTime = performance.now();
        console.log(`Orders fetched in ${(endTime - startTime).toFixed(2)}ms`);
        
        // Update cache
        orderCache.set(cacheKey, {
          data,
          timestamp: Date.now()
        });

        // Keep only last 10 cache entries to avoid memory issues
        if (orderCache.size > 10) {
          const firstKey = orderCache.keys().next().value;
          orderCache.delete(firstKey);
        }

        setOrders(data.data);
        setPagination(data.pagination);
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Fetch request was aborted');
        return;
      }
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [statusFilter, searchQuery, dateRange, router, API_URL, generateCacheKey]);

  // Debounced search
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Set new timeout for search
    searchTimeoutRef.current = setTimeout(() => {
      fetchOrders(1, true);
    }, 500);
  }, [fetchOrders]);

  // Sync functions
  const syncSingleOrderPayment = useCallback(async (orderId: string) => {
    try {
      if (syncingOrders[orderId]) return;

      const token = localStorage.getItem('token');
      if (!token) return;

      setSyncingOrders(prev => ({ ...prev, [orderId]: true }));

      const response = await fetch(`${API_URL}/orders/payment/sync/${orderId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const result = await response.json();
      
      if (result.success) {
        // Update orders state
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order.id === orderId 
              ? { ...order, 
                  status: result.data.status, 
                  paymentStatus: result.data.paymentStatus,
                  updatedAt: new Date().toISOString()
                }
              : order
          )
        );

        // Clear cache for this order's filter
        orderCache.clear();
        setLastSyncTime(new Date().toLocaleTimeString());
      }

      return result;
    } catch (err) {
      console.error('Error syncing order:', err);
    } finally {
      setSyncingOrders(prev => {
        const newState = { ...prev };
        delete newState[orderId];
        return newState;
      });
    }
  }, [API_URL, syncingOrders]);

  // Optimized auto-sync - only sync pending orders
  const autoSyncPendingPayments = useCallback(async () => {
    if (!autoSyncEnabled) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    // Get only pending payment orders that need syncing
    const pendingOrders = orders.filter(order => 
      order.midtransOrderId && 
      (order.paymentStatus === 'PENDING' || order.paymentStatus === 'pending') &&
      !syncingOrders[order.id] &&
      order.status !== 'CANCELLED'
    ).slice(0, 2); // Only sync 2 at a time

    if (pendingOrders.length === 0) return;

    console.log(`Auto-syncing ${pendingOrders.length} pending payments...`);
    
    // Sync sequentially with delay
    for (const order of pendingOrders) {
      await syncSingleOrderPayment(order.id);
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
    }
  }, [autoSyncEnabled, orders, syncingOrders, syncSingleOrderPayment]);

  // Auto-sync control
  const startAutoSync = useCallback(() => {
    if (autoSyncRef.current) {
      clearInterval(autoSyncRef.current);
    }

    if (autoSyncEnabled) {
      // Don't run immediately on load, wait a bit
      const initialDelay = setTimeout(() => {
        autoSyncPendingPayments();
      }, 10000); // 10 second initial delay

      // Then run at interval
      autoSyncRef.current = setInterval(() => {
        autoSyncPendingPayments();
      }, syncInterval * 1000);

      return () => clearTimeout(initialDelay);
    }
  }, [autoSyncEnabled, syncInterval, autoSyncPendingPayments]);

  const stopAutoSync = () => {
    if (autoSyncRef.current) {
      clearInterval(autoSyncRef.current);
      autoSyncRef.current = null;
    }
  };

  // Initial load
  useEffect(() => {
    fetchOrders(1);

    return () => {
      stopAutoSync();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [fetchOrders]);

  // Auto-sync effect
  useEffect(() => {
    if (orders.length > 0 && autoSyncEnabled) {
      startAutoSync();
    }

    return () => {
      stopAutoSync();
    };
  }, [orders.length, autoSyncEnabled, startAutoSync]);

  // Handler functions
  const handleManualSyncOrder = async (orderId: string) => {
    await syncSingleOrderPayment(orderId);
  };

  const handleSyncAllPending = async () => {
    const pendingOrders = orders.filter(order => 
      order.midtransOrderId && 
      (order.paymentStatus === 'PENDING' || order.paymentStatus === 'pending')
    );

    if (pendingOrders.length === 0) {
      alert('Tidak ada pesanan pending yang perlu disinkronisasi.');
      return;
    }

    if (!confirm(`Sinkronisasi ${pendingOrders.length} pesanan pending?`)) {
      return;
    }

    // Process in batches of 3
    for (let i = 0; i < pendingOrders.length; i += 3) {
      const batch = pendingOrders.slice(i, i + 3);
      await Promise.all(batch.map(order => syncSingleOrderPayment(order.id)));
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay between batches
    }
  };

  const getPendingOrdersCount = useMemo(() => {
    return orders.filter(order => 
      order.midtransOrderId && 
      (order.paymentStatus === 'PENDING' || order.paymentStatus === 'pending')
    ).length;
  }, [orders]);

  // Status utility functions
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'PROCESSING': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'SHIPPED': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'DELIVERED':
      case 'COMPLETED': return 'bg-green-100 text-green-800 border-green-200';
      case 'CANCELLED': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
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

  // Skeleton loader component
  const OrderSkeleton = () => (
    <div className="animate-pulse">
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
        <div className="flex items-center justify-between">
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-32"></div>
            <div className="h-3 bg-gray-200 rounded w-24"></div>
          </div>
          <div className="h-4 bg-gray-200 rounded w-16"></div>
        </div>
        <div className="mt-4 flex items-center space-x-4">
          <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
          <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
          <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Riwayat Transaksi</h1>
          <p className="text-gray-600">Kelola dan lacak pesanan Anda</p>
        </div>

        {/* Auto-Sync Status Bar */}
        <div className="mb-6 bg-white rounded-2xl shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <button
                  onClick={() => setAutoSyncEnabled(!autoSyncEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 ${autoSyncEnabled ? 'bg-green-600' : 'bg-gray-300'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${autoSyncEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
                <div className="absolute -top-2 -right-2">
                  {autoSyncEnabled ? (
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  ) : (
                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                  )}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-800">
                  Auto-Sync {autoSyncEnabled ? 'Aktif' : 'Nonaktif'}
                </div>
                <div className="text-xs text-gray-600">
                  {autoSyncEnabled 
                    ? `Memeriksa setiap ${syncInterval} detik` 
                    : 'Pembaruan otomatis dimatikan'
                  }
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              {getPendingOrdersCount > 0 && (
                <button
                  onClick={handleSyncAllPending}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg flex items-center justify-center transition-all duration-300"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Sync ({getPendingOrdersCount})
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filters - Simplified */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Filter Transaksi</h2>
            </div>
            
            <div className="flex flex-col md:flex-row gap-3">
              <input
                type="text"
                placeholder="Cari ID pesanan atau nama..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
              
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  fetchOrders(1, true);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              >
                <option value="ALL">Semua Status</option>
                <option value="PENDING">Menunggu Pembayaran</option>
                <option value="PROCESSING">Diproses</option>
                <option value="SHIPPED">Dikirim</option>
                <option value="DELIVERED">Terkirim</option>
                <option value="COMPLETED">Selesai</option>
                <option value="CANCELLED">Dibatalkan</option>
              </select>
            </div>
          </div>
        </div>

        {/* Orders List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <OrderSkeleton key={i} />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Belum ada transaksi</h3>
            <p className="text-gray-600 mb-6">Mulai belanja dan buat pesanan pertama Anda</p>
            <Link
              href="/shop"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:from-pink-700 hover:to-purple-700 transition-colors"
            >
              Mulai Belanja
            </Link>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tanggal
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pembayaran
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orders.map((order) => {
                      const isSyncing = syncingOrders[order.id];
                      const needsSync = order.midtransOrderId && 
                        (order.paymentStatus === 'PENDING' || order.paymentStatus === 'pending') &&
                        order.status !== 'CANCELLED';

                      return (
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">
                              {order.id.substring(0, 8)}...
                            </div>
                            <div className="text-sm text-gray-500">
                              {order.customerName}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">
                              {formatDate(order.createdAt)}
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-semibold text-gray-900">
                              {formatRupiah(order.total)}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadgeClass(order.status)}`}>
                              {getStatusText(order.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                order.paymentStatus?.toUpperCase() === 'PAID' || order.paymentStatus?.toUpperCase() === 'SETTLEMENT'
                                  ? 'bg-green-100 text-green-800 border border-green-200'
                                  : order.paymentStatus?.toUpperCase() === 'PENDING'
                                  ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                  : 'bg-red-100 text-red-800 border border-red-200'
                              }`}>
                                {getPaymentStatusText(order.paymentStatus)}
                              </span>
                              {needsSync && !isSyncing && (
                                <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              <Link
                                href={`/transactions/${order.id}`}
                                className="text-pink-600 hover:text-pink-900 text-sm font-medium"
                              >
                                Detail
                              </Link>
                              {order.midtransOrderId && (
                                <button
                                  onClick={() => handleManualSyncOrder(order.id)}
                                  disabled={isSyncing}
                                  className={`text-blue-600 hover:text-blue-900 text-sm font-medium ${isSyncing ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                  {isSyncing ? 'Syncing...' : 'Sync'}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination - Simplified */}
            {pagination.totalPages > 1 && (
              <div className="mt-6 flex justify-center">
                <nav className="flex items-center space-x-2">
                  <button
                    onClick={() => fetchOrders(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                    className={`px-3 py-1 rounded-md ${pagination.currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                  >
                    ←
                  </button>
                  
                  <span className="text-sm text-gray-700">
                    Halaman {pagination.currentPage} dari {pagination.totalPages}
                  </span>
                  
                  <button
                    onClick={() => fetchOrders(pagination.currentPage + 1)}
                    disabled={pagination.currentPage === pagination.totalPages}
                    className={`px-3 py-1 rounded-md ${pagination.currentPage === pagination.totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                  >
                    →
                  </button>
                </nav>
              </div>
            )}
          </>
        )}
      </div>
      
      <Footer />
    </div>
  );
}