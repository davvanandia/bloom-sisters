// app/dashboard/orders/page.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import DashboardHeader from '@/components/DashboardHeader';

// TIPE DATA YANG SESUAI DENGAN API
interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  product: {
    id: string;
    name: string;
    price: number;
    images: string[];
  };
}

interface Order {
  id: string;
  userId: string;
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
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    username: string;
    email: string;
  };
  voucher: {
    code: string;
    discount: number;
    type: 'PERCENTAGE' | 'FIXED';
  } | null;
  orderItems: OrderItem[];
}

interface OrderStatusCounts {
  PENDING: number;
  PROCESSING: number;
  SHIPPED: number;
  DELIVERED: number;
  COMPLETED: number;
  CANCELLED: number;
  TOTAL: number;
}

interface SyncStatus {
  [key: string]: boolean; // orderId -> sedang di-sync atau tidak
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function OrderManagementPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Modal states
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Form states
  const [statusFormData, setStatusFormData] = useState({
    status: 'PENDING' as Order['status']
  });
  
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderStats, setOrderStats] = useState<OrderStatusCounts>({
    PENDING: 0,
    PROCESSING: 0,
    SHIPPED: 0,
    DELIVERED: 0,
    COMPLETED: 0,
    CANCELLED: 0,
    TOTAL: 0
  });

  // Pagination & Filter
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const itemsPerPage = 10;

  // Auto-sync states
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  const [syncInterval, setSyncInterval] = useState(60); // seconds
  const [lastSyncTime, setLastSyncTime] = useState<string>('');
  const [syncingOrders, setSyncingOrders] = useState<SyncStatus>({});
  const [syncLog, setSyncLog] = useState<string[]>([]);
  const [showSyncSettings, setShowSyncSettings] = useState(false);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const autoSyncRef = useRef<NodeJS.Timeout | null>(null);

  const checkAuthAndFetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');

      if (!token || !userData) {
        router.push('/login');
        return;
      }

      const parsedUser = JSON.parse(userData);
      
      if (parsedUser.role !== 'ADMIN' && parsedUser.role !== 'SUPERADMIN') {
        router.push('/dashboard');
        return;
      }

      setCurrentUser(parsedUser);
      console.log('Current user loaded:', parsedUser);
      
      // Fetch orders terlebih dahulu
      await fetchOrders();
      
      // Setelah orders berhasil, fetch stats
      await fetchOrderStats();
      
      // Start auto-sync
      startAutoSync();
      
    } catch (err: any) {
      console.error('Error in checkAuthAndFetchOrders:', err);
      setError(err.message || 'Failed to initialize page');
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'ALL' && { status: statusFilter }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate })
      });

      console.log('Fetching orders with params:', params.toString());

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      try {
        const response = await fetch(`${API_URL}/orders?${params}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            router.push('/login');
            return;
          }
          
          const errorText = await response.text();
          throw new Error(`Failed to fetch orders: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch orders');
        }

        console.log('Orders fetched successfully:', result.data.length, 'orders');
        setOrders(result.data);
        setTotalPages(result.pagination?.totalPages || 1);
        setTotalItems(result.pagination?.totalItems || 0);
        setError('');
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          throw new Error('Request timeout. Please check your internet connection.');
        }
        throw fetchError;
      }
    } catch (err: any) {
      console.error('Error fetching orders:', err);
      setError(err.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderStats = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.warn('No authentication token found for order stats');
        return;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      try {
        const response = await fetch(`${API_URL}/orders/status/counts`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            console.warn('Authentication failed for stats, redirecting to login...');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            router.push('/login');
            return;
          }
          
          console.warn(`Order stats API returned ${response.status}: ${response.statusText}`);
          return;
        }

        const result = await response.json();

        if (result.success) {
          console.log('Order stats loaded successfully:', result.data);
          setOrderStats(result.data);
        } else {
          console.warn('Order stats API returned error:', result.error);
        }
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          console.warn('Order stats fetch timeout');
        } else {
          console.warn('Failed to fetch order stats:', fetchError.message);
        }
      }
    } catch (err: any) {
      console.warn('Error in fetchOrderStats:', err.message);
    }
  };

  // AUTO-SYNC FUNCTIONS
  const syncSingleOrderPayment = async (orderId: string) => {
    try {
      // Skip if already syncing
      if (syncingOrders[orderId]) {
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) return;

      // Mark as syncing
      setSyncingOrders(prev => ({ ...prev, [orderId]: true }));

      const response = await fetch(`${API_URL}/orders/payment/sync/${orderId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        const logMessage = `✅ ${new Date().toLocaleTimeString()} - Order ${orderId.substring(0, 8)}: ${result.data.paymentStatus}`;
        setSyncLog(prev => [logMessage, ...prev.slice(0, 9)]); // Keep last 10 logs
        
        // Update local orders state immediately for better UX
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
      }

      return result;
    } catch (err: any) {
      const logMessage = `❌ ${new Date().toLocaleTimeString()} - Order ${orderId.substring(0, 8)}: ${err.message}`;
      setSyncLog(prev => [logMessage, ...prev.slice(0, 9)]);
      console.error('Error syncing order:', err);
    } finally {
      // Remove from syncing state
      setSyncingOrders(prev => {
        const newState = { ...prev };
        delete newState[orderId];
        return newState;
      });
    }
  };

  const autoSyncPendingPayments = async () => {
    if (!autoSyncEnabled) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Get pending orders that need syncing
      const pendingOrders = orders.filter(order => 
        order.midtransOrderId && 
        (order.paymentStatus === 'PENDING' || order.paymentStatus === 'pending') &&
        !syncingOrders[order.id]
      );

      if (pendingOrders.length === 0) {
        return;
      }

      console.log(`Auto-syncing ${pendingOrders.length} pending payments...`);
      
      const logMessage = `🔄 ${new Date().toLocaleTimeString()} - Syncing ${pendingOrders.length} pending orders`;
      setSyncLog(prev => [logMessage, ...prev.slice(0, 9)]);

      // Sync orders sequentially to avoid rate limiting
      for (const order of pendingOrders.slice(0, 5)) { // Max 5 at a time
        await syncSingleOrderPayment(order.id);
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      setLastSyncTime(new Date().toLocaleTimeString());
      
      // Refresh orders after sync to get latest data
      setTimeout(() => {
        fetchOrders();
        fetchOrderStats();
      }, 2000);
      
    } catch (err: any) {
      console.error('Error in auto-sync:', err);
    }
  };

  const startAutoSync = () => {
    if (autoSyncRef.current) {
      clearInterval(autoSyncRef.current);
    }

    if (autoSyncEnabled) {
      // Run immediately
      autoSyncPendingPayments();
      
      // Then run every X seconds
      autoSyncRef.current = setInterval(() => {
        autoSyncPendingPayments();
      }, syncInterval * 1000);
    }
  };

  const stopAutoSync = () => {
    if (autoSyncRef.current) {
      clearInterval(autoSyncRef.current);
      autoSyncRef.current = null;
    }
  };

  const toggleAutoSync = () => {
    const newState = !autoSyncEnabled;
    setAutoSyncEnabled(newState);
    
    if (newState) {
      startAutoSync();
    } else {
      stopAutoSync();
    }
  };

  // Effects
  useEffect(() => {
    checkAuthAndFetchOrders();

    return () => {
      stopAutoSync();
    };
  }, []);

  useEffect(() => {
    if (!loading && autoSyncEnabled) {
      startAutoSync();
    }
  }, [orders.length, autoSyncEnabled]);

  useEffect(() => {
    if (!loading) {
      fetchOrders();
    }
  }, [debouncedSearchTerm, statusFilter, startDate, endDate]);

  useEffect(() => {
    if (currentPage !== 1 && !loading) {
      fetchOrders();
    }
  }, [currentPage]);

  // Functions
  const handleUpdateStatus = async () => {
    if (!selectedOrder) return;
    
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      console.log('Updating order status:', selectedOrder.id, 'to:', statusFormData.status);

      const response = await fetch(`${API_URL}/orders/${selectedOrder.id}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: statusFormData.status }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update order status');
      }

      setShowStatusModal(false);
      setSelectedOrder(null);
      setError('');
      
      // Refresh data
      await fetchOrders();
      await fetchOrderStats();
      
      console.log('Order status updated successfully:', result.message);
    } catch (err: any) {
      console.error('Error updating order status:', err);
      setError(err.message);
    }
  };

  const handleManualSyncOrder = async (orderId: string) => {
    try {
      const result = await syncSingleOrderPayment(orderId);
      
      if (result?.success) {
        // Show success message
        const order = orders.find(o => o.id === orderId);
        if (order) {
          alert(`✅ Payment status synced!\n\nOrder: ${orderId.substring(0, 8)}...\nNew Status: ${result.data.status}\nPayment: ${result.data.paymentStatus}`);
        }
        
        // Refresh data
        await fetchOrders();
        await fetchOrderStats();
      }
    } catch (err: any) {
      alert(`❌ Failed to sync payment status: ${err.message}`);
    }
  };

  const handleSyncAllPending = async () => {
    const pendingOrders = orders.filter(order => 
      order.midtransOrderId && 
      (order.paymentStatus === 'PENDING' || order.paymentStatus === 'pending')
    );

    if (pendingOrders.length === 0) {
      alert('No pending orders to sync.');
      return;
    }

    if (!confirm(`Sync payment status for ${pendingOrders.length} pending orders?`)) {
      return;
    }

    try {
      // Sync all pending orders
      for (const order of pendingOrders) {
        await syncSingleOrderPayment(order.id);
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      // Refresh data
      await fetchOrders();
      await fetchOrderStats();
      
      alert(`✅ Successfully synced ${pendingOrders.length} orders.`);
    } catch (err: any) {
      alert(`❌ Error syncing orders: ${err.message}`);
    }
  };

  const handleDeleteOrder = async () => {
    if (!selectedOrder) return;
    
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      console.log('Deleting order:', selectedOrder.id);

      const response = await fetch(`${API_URL}/orders/${selectedOrder.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete order');
      }

      setShowDeleteModal(false);
      setSelectedOrder(null);
      setError('');
      fetchOrders();
      fetchOrderStats();
      
      console.log('Order deleted successfully:', result.message);
    } catch (err: any) {
      console.error('Error deleting order:', err);
      setError(err.message);
    }
  };

  const openDetailModal = (order: Order) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  const openStatusModal = (order: Order) => {
    setSelectedOrder(order);
    setStatusFormData({
      status: order.status
    });
    setShowStatusModal(true);
  };

  const openDeleteModal = (order: Order) => {
    setSelectedOrder(order);
    setShowDeleteModal(true);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-900/30 text-yellow-300 border border-yellow-800/50';
      case 'PROCESSING':
        return 'bg-blue-900/30 text-blue-300 border border-blue-800/50';
      case 'SHIPPED':
        return 'bg-indigo-900/30 text-indigo-300 border border-indigo-800/50';
      case 'DELIVERED':
        return 'bg-purple-900/30 text-purple-300 border border-purple-800/50';
      case 'COMPLETED':
        return 'bg-green-900/30 text-green-300 border border-green-800/50';
      case 'CANCELLED':
        return 'bg-red-900/30 text-red-300 border border-red-800/50';
      default:
        return 'bg-gray-800 text-gray-300 border border-gray-700';
    }
  };

  const getPaymentStatusBadgeColor = (status: string) => {
    const statusUpper = status?.toUpperCase();
    switch (statusUpper) {
      case 'PAID':
      case 'SETTLEMENT':
        return 'bg-green-900/30 text-green-300 border border-green-800/50';
      case 'PENDING':
        return 'bg-yellow-900/30 text-yellow-300 border border-yellow-800/50';
      case 'CHALLENGE':
        return 'bg-orange-900/30 text-orange-300 border border-orange-800/50';
      case 'DENIED':
      case 'EXPIRED':
      case 'CANCELLED':
        return 'bg-red-900/30 text-red-300 border border-red-800/50';
      default:
        return 'bg-gray-800 text-gray-300 border border-gray-700';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPendingOrdersCount = () => {
    return orders.filter(order => 
      order.midtransOrderId && 
      (order.paymentStatus === 'PENDING' || order.paymentStatus === 'pending')
    ).length;
  };

  // Loading Skeleton Components
  const TableSkeleton = () => {
    return (
      <div className="bg-gray-800 rounded-xl shadow overflow-hidden border border-gray-700">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-900">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {[...Array(5)].map((_, index) => (
                <tr key={index} className="animate-pulse">
                  <td className="px-4 py-4">
                    <div className="h-4 bg-gray-700 rounded w-24"></div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-700 rounded w-20"></div>
                      <div className="h-3 bg-gray-700 rounded w-28"></div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="h-4 bg-gray-700 rounded w-16"></div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="h-6 bg-gray-700 rounded-full w-20"></div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="h-4 bg-gray-700 rounded w-24"></div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex space-x-2">
                      <div className="h-8 w-8 bg-gray-700 rounded"></div>
                      <div className="h-8 w-8 bg-gray-700 rounded"></div>
                      <div className="h-8 w-8 bg-gray-700 rounded"></div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const CardSkeleton = () => {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, index) => (
          <div key={index} className="bg-gray-800 rounded-xl shadow p-4 animate-pulse border border-gray-700">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="h-4 bg-gray-700 rounded w-32"></div>
                <div className="h-3 bg-gray-700 rounded w-24"></div>
              </div>
              <div className="flex space-x-2">
                <div className="h-8 w-8 bg-gray-700 rounded"></div>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div className="h-6 bg-gray-700 rounded-full w-20"></div>
              <div className="h-4 bg-gray-700 rounded w-16"></div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading && currentPage === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
        <DashboardHeader user={currentUser} />
        
        <div className="flex">
          <Sidebar userRole={currentUser?.role || 'USER'} />
          
          <main className="flex-1 p-4 lg:p-6">
            {/* Header Skeleton */}
            <div className="mb-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <div className="space-y-2">
                  <div className="h-7 bg-gray-700 rounded w-36 animate-pulse"></div>
                  <div className="h-4 bg-gray-700 rounded w-48 animate-pulse"></div>
                </div>
                <div className="h-10 bg-gray-700 rounded w-full sm:w-32 animate-pulse"></div>
              </div>
            </div>

            {/* Stats Skeleton */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="bg-gray-800 rounded-xl p-4 animate-pulse border border-gray-700">
                  <div className="h-4 bg-gray-700 rounded w-16 mb-2"></div>
                  <div className="h-6 bg-gray-700 rounded w-12"></div>
                </div>
              ))}
            </div>

            {/* Filter Skeleton */}
            <div className="bg-gray-800 rounded-xl shadow p-4 mb-4 border border-gray-700">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, index) => (
                  <div key={index}>
                    <div className="h-4 bg-gray-700 rounded w-20 mb-2 animate-pulse"></div>
                    <div className="h-10 bg-gray-700 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Desktop Skeleton */}
            <div className="hidden lg:block">
              <TableSkeleton />
            </div>
            
            {/* Mobile Skeleton */}
            <div className="block lg:hidden">
              <CardSkeleton />
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error && !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="text-center max-w-md mx-4">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-white mb-2">Error Occurred</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => router.push('/')}
              className="bg-gradient-to-r from-pink-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-pink-700 hover:to-purple-700 transition-all duration-300 shadow"
            >
              Back to Home
            </button>
            <button
              onClick={() => router.push('/login')}
              className="bg-gray-800 text-gray-200 px-6 py-3 rounded-lg border border-gray-700 hover:bg-gray-700 transition-all duration-300 shadow"
            >
              Re-login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="text-center max-w-md mx-4">
          <div className="text-red-500 text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-gray-300 mb-4">You don't have permission to access this page</p>
          <button
            onClick={() => router.push('/login')}
            className="bg-gradient-to-r from-pink-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:from-pink-700 hover:to-purple-700 transition-all duration-300"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      <DashboardHeader user={currentUser} />
      
      <div className="flex">
        <Sidebar userRole={currentUser.role} />
        
        <main className="flex-1 p-4 lg:p-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                  Order Management
                </h1>
                <p className="text-gray-400 mt-1 text-sm">
                  Manage and track all customer orders
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => setShowSyncSettings(true)}
                  className="bg-gradient-to-r from-purple-800 to-pink-800 hover:from-purple-700 hover:to-pink-700 text-purple-300 px-4 py-2.5 rounded-lg flex items-center justify-center shadow hover:shadow-md transition-all duration-300 border border-purple-700 text-sm"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Sync Settings
                </button>
                <button
                  onClick={fetchOrders}
                  className="bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 text-gray-300 px-4 py-2.5 rounded-lg flex items-center justify-center shadow hover:shadow-md transition-all duration-300 border border-gray-700"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh Orders
                </button>
              </div>
            </div>
          </div>

          {/* Auto-Sync Status Bar */}
          <div className="mb-6 bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <button
                    onClick={toggleAutoSync}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 ${autoSyncEnabled ? 'bg-green-600' : 'bg-gray-700'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${autoSyncEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                  <div className="absolute -top-2 -right-2">
                    {autoSyncEnabled ? (
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    ) : (
                      <div className="w-3 h-3 bg-gray-600 rounded-full"></div>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-white">
                    Auto-Sync Payment Status {autoSyncEnabled ? 'ON' : 'OFF'}
                  </div>
                  <div className="text-xs text-gray-400">
                    {autoSyncEnabled 
                      ? `Checking every ${syncInterval} seconds • Last sync: ${lastSyncTime || 'Never'}`
                      : 'Payment status sync is disabled'
                    }
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="px-3 py-1.5 bg-blue-900/30 border border-blue-800/50 rounded-lg">
                  <div className="text-xs text-blue-300">Pending to Sync</div>
                  <div className="text-sm font-bold text-white text-center">{getPendingOrdersCount()}</div>
                </div>
                <button
                  onClick={handleSyncAllPending}
                  disabled={getPendingOrdersCount() === 0}
                  className={`px-4 py-2 rounded-lg flex items-center justify-center transition-all duration-300 ${getPendingOrdersCount() > 0 
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white' 
                    : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Sync All Pending
                </button>
              </div>
            </div>
            
            {/* Sync Log (Collapsible) */}
            {syncLog.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-700">
                <div className="text-xs font-medium text-gray-400 mb-2">Recent Sync Activity</div>
                <div className="max-h-20 overflow-y-auto space-y-1">
                  {syncLog.map((log, index) => (
                    <div key={index} className="text-xs font-mono px-2 py-1 bg-gray-900/50 rounded">
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
              <div className="text-sm text-gray-400 mb-1">Total Orders</div>
              <div className="text-2xl font-bold text-white">{orderStats.TOTAL}</div>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-yellow-800/30">
              <div className="text-sm text-yellow-400 mb-1">Pending</div>
              <div className="text-2xl font-bold text-yellow-300">{orderStats.PENDING}</div>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-blue-800/30">
              <div className="text-sm text-blue-400 mb-1">Processing</div>
              <div className="text-2xl font-bold text-blue-300">{orderStats.PROCESSING}</div>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-indigo-800/30">
              <div className="text-sm text-indigo-400 mb-1">Shipped</div>
              <div className="text-2xl font-bold text-indigo-300">{orderStats.SHIPPED}</div>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-green-800/30">
              <div className="text-sm text-green-400 mb-1">Completed</div>
              <div className="text-2xl font-bold text-green-300">{orderStats.COMPLETED}</div>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-red-800/30">
              <div className="text-sm text-red-400 mb-1">Cancelled</div>
              <div className="text-2xl font-bold text-red-300">{orderStats.CANCELLED}</div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-xl p-4 mb-4 border border-gray-700">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Search Orders</label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by order ID, customer, phone..."
                  className="w-full px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50 transition-all duration-300 text-white text-sm placeholder-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50 transition-all duration-300 text-white text-sm"
                >
                  <option value="ALL">All Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="PROCESSING">Processing</option>
                  <option value="SHIPPED">Shipped</option>
                  <option value="DELIVERED">Delivered</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50 transition-all duration-300 text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50 transition-all duration-300 text-white text-sm"
                />
              </div>
            </div>
            <div className="flex justify-end mt-4 space-x-2">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('ALL');
                  setStartDate('');
                  setEndDate('');
                  setCurrentPage(1);
                }}
                className="px-4 py-2 bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 text-gray-300 rounded-lg transition-all duration-300 text-sm border border-gray-700"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-900/30 border-l-4 border-red-600 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-red-300 text-sm">{error}</span>
              </div>
            </div>
          )}

          {/* Desktop Table View */}
          <div className="hidden lg:block bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-xl overflow-hidden border border-gray-700">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Items
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Payment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800/30 divide-y divide-gray-700">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center">
                        <div className="text-gray-400">
                          <svg className="w-12 h-12 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          <p className="text-lg font-medium text-gray-300">No orders found</p>
                          <p className="mt-1 text-gray-500">Try adjusting your search or filters</p>
                          <button
                            onClick={fetchOrders}
                            className="mt-4 px-4 py-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:from-pink-700 hover:to-purple-700 transition-all duration-300 text-sm"
                          >
                            Refresh Orders
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    orders.map((order) => {
                      const isSyncing = syncingOrders[order.id];
                      const needsSync = order.midtransOrderId && 
                        (order.paymentStatus === 'PENDING' || order.paymentStatus === 'pending') &&
                        order.status !== 'CANCELLED';

                      return (
                        <tr key={order.id} className="hover:bg-gray-800/50 transition-colors duration-200">
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-white">
                              {order.id.substring(0, 8)}...
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              {order.midtransOrderId ? `Midtrans: ${order.midtransOrderId.substring(0, 10)}...` : 'No Midtrans ID'}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-white">
                              {order.customerName}
                            </div>
                            <div className="text-xs text-gray-400">
                              {order.customerPhone}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-300">
                              {order.orderItems.length} items
                            </div>
                            <div className="text-xs text-gray-400">
                              {order.orderItems.slice(0, 2).map(item => item.product.name).join(', ')}
                              {order.orderItems.length > 2 && '...'}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-semibold text-white">
                              {formatCurrency(order.total)}
                            </div>
                            {order.shippingFee > 0 && (
                              <div className="text-xs text-gray-400">
                                +{formatCurrency(order.shippingFee)} shipping
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(order.status)}`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPaymentStatusBadgeColor(order.paymentStatus)}`}>
                                {order.paymentStatus || 'N/A'}
                              </span>
                              {needsSync && !isSyncing && (
                                <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
                              )}
                              {isSyncing && (
                                <svg className="w-4 h-4 text-blue-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                              )}
                            </div>
                            {order.paymentMethod && (
                              <div className="text-xs text-gray-400 mt-1">
                                {order.paymentMethod}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-300">
                              {formatDate(order.createdAt)}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => openDetailModal(order)}
                                className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/30 p-2 rounded-lg transition-colors duration-200 border border-blue-800/50"
                                title="View Details"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => openStatusModal(order)}
                                className="text-green-400 hover:text-green-300 hover:bg-green-900/30 p-2 rounded-lg transition-colors duration-200 border border-green-800/50"
                                title="Update Order Status"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              {order.midtransOrderId && (
                                <button
                                  onClick={() => handleManualSyncOrder(order.id)}
                                  disabled={isSyncing}
                                  className={`p-2 rounded-lg transition-colors duration-200 border ${isSyncing 
                                    ? 'text-gray-400 border-gray-700 cursor-not-allowed' 
                                    : 'text-purple-400 hover:text-purple-300 hover:bg-purple-900/30 border-purple-800/50'
                                  }`}
                                  title={isSyncing ? "Syncing..." : "Sync Payment Status"}
                                >
                                  {isSyncing ? (
                                    <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                  ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                  )}
                                </button>
                              )}
                              <button
                                onClick={() => openDeleteModal(order)}
                                className="text-red-400 hover:text-red-300 hover:bg-red-900/30 p-2 rounded-lg transition-colors duration-200 border border-red-800/50"
                                title="Delete Order"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="block lg:hidden space-y-3">
            {orders.length === 0 ? (
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-xl p-6 text-center border border-gray-700">
                <svg className="w-10 h-10 mx-auto text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-base font-medium text-gray-300">No orders found</p>
                <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filters</p>
                <button
                  onClick={fetchOrders}
                  className="mt-4 px-4 py-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:from-pink-700 hover:to-purple-700 transition-all duration-300 text-sm"
                >
                  Refresh Orders
                </button>
              </div>
            ) : (
              orders.map((order) => {
                const isSyncing = syncingOrders[order.id];
                const needsSync = order.midtransOrderId && 
                  (order.paymentStatus === 'PENDING' || order.paymentStatus === 'pending') &&
                  order.status !== 'CANCELLED';

                return (
                  <div key={order.id} className="bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-xl p-4 border border-gray-700">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-sm font-medium text-white mb-1">
                          Order: {order.id.substring(0, 8)}...
                        </div>
                        <div className="text-xs text-gray-400 mb-2">
                          {order.customerName} • {order.customerPhone}
                        </div>
                        <div className="text-sm text-gray-300">
                          {order.orderItems.length} items • {formatCurrency(order.total)}
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => openDetailModal(order)}
                          className="text-blue-400 hover:text-blue-300 p-1.5 rounded-lg hover:bg-blue-900/30 border border-blue-800/50"
                          title="View Details"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        {order.midtransOrderId && (
                          <button
                            onClick={() => handleManualSyncOrder(order.id)}
                            disabled={isSyncing}
                            className={`p-1.5 rounded-lg border ${isSyncing 
                              ? 'text-gray-400 border-gray-700' 
                              : 'text-purple-400 hover:text-purple-300 hover:bg-purple-900/30 border-purple-800/50'
                            }`}
                            title={isSyncing ? "Syncing..." : "Sync Payment"}
                          >
                            {isSyncing ? (
                              <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex flex-col space-y-1">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(order.status)}`}>
                          {order.status}
                        </span>
                        <div className="flex items-center space-x-1">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPaymentStatusBadgeColor(order.paymentStatus)}`}>
                            {order.paymentStatus || 'N/A'}
                          </span>
                          {needsSync && !isSyncing && (
                            <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-gray-400">
                        {formatDate(order.createdAt)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 lg:mt-6 flex justify-between items-center">
              <div className="text-sm text-gray-400">
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} orders
              </div>
              <nav className="flex items-center space-x-1">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-700 bg-gray-800 text-gray-400 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
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
                      className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors duration-200 ${
                        currentPage === pageNum
                          ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white border-pink-700 shadow'
                          : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-gray-700 bg-gray-800 text-gray-400 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </nav>
            </div>
          )}
        </main>
      </div>

      {/* MODALS */}

      {/* Order Detail Modal */}
      {showDetailModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-gray-700">
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">Order Details</h3>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-300"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Order Info */}
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-3">ORDER INFORMATION</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Order ID:</span>
                      <span className="text-white font-medium">{selectedOrder.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Status:</span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(selectedOrder.status)}`}>
                        {selectedOrder.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Payment Status:</span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPaymentStatusBadgeColor(selectedOrder.paymentStatus)}`}>
                        {selectedOrder.paymentStatus || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Payment Method:</span>
                      <span className="text-white">{selectedOrder.paymentMethod || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Midtrans Order ID:</span>
                      <span className="text-white text-sm">{selectedOrder.midtransOrderId || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Created:</span>
                      <span className="text-white">{formatDate(selectedOrder.createdAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Updated:</span>
                      <span className="text-white">{formatDate(selectedOrder.updatedAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Voucher:</span>
                      <span className="text-white">
                        {selectedOrder.voucher ? (
                          <div>
                            <div className="text-right">{selectedOrder.voucher.code}</div>
                            <div className="text-xs text-gray-400">
                              {selectedOrder.voucher.type === 'PERCENTAGE' 
                                ? `${selectedOrder.voucher.discount}% discount`
                                : `${formatCurrency(selectedOrder.voucher.discount)} off`
                              }
                            </div>
                          </div>
                        ) : 'No voucher'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Customer Info */}
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-3">CUSTOMER INFORMATION</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Name:</span>
                      <span className="text-white">{selectedOrder.customerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Email:</span>
                      <span className="text-white">{selectedOrder.customerEmail}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Phone:</span>
                      <span className="text-white">{selectedOrder.customerPhone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Shipping Address:</span>
                      <span className="text-white text-right max-w-xs">{selectedOrder.shippingAddress}</span>
                    </div>
                    {selectedOrder.notes && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Notes:</span>
                        <span className="text-white text-right max-w-xs">{selectedOrder.notes}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Order Summary */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-400 mb-3">ORDER SUMMARY</h4>
                <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                  <div className="flex justify-between text-sm text-gray-300 mb-2">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(selectedOrder.total - selectedOrder.shippingFee)}</span>
                  </div>
                  {selectedOrder.shippingFee > 0 && (
                    <div className="flex justify-between text-sm text-gray-300 mb-2">
                      <span>Shipping Fee:</span>
                      <span>{formatCurrency(selectedOrder.shippingFee)}</span>
                    </div>
                  )}
                  {selectedOrder.voucher && (
                    <div className="flex justify-between text-sm text-gray-300 mb-2">
                      <span>Voucher Discount:</span>
                      <span className="text-green-400">
                        -{selectedOrder.voucher.type === 'PERCENTAGE' 
                          ? `${selectedOrder.voucher.discount}%` 
                          : formatCurrency(selectedOrder.voucher.discount)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold text-white pt-2 border-t border-gray-700">
                    <span>Total:</span>
                    <span>{formatCurrency(selectedOrder.total)}</span>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-400 mb-3">ORDER ITEMS</h4>
                <div className="bg-gray-900/50 rounded-lg border border-gray-700 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-800">
                      <thead>
                        <tr className="bg-gray-900">
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-300">Product</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-300">Price</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-300">Quantity</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-300">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                        {selectedOrder.orderItems.map((item) => (
                          <tr key={item.id}>
                            <td className="px-4 py-3">
                              <div className="flex items-center space-x-3">
                                {item.product.images && item.product.images.length > 0 ? (
                                  <div className="w-10 h-10 rounded overflow-hidden bg-gray-800">
                                    <img 
                                      src={item.product.images[0]} 
                                      alt={item.product.name}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                ) : (
                                  <div className="w-10 h-10 rounded bg-gray-800 flex items-center justify-center">
                                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                  </div>
                                )}
                                <div>
                                  <div className="text-sm font-medium text-white">
                                    {item.product.name}
                                  </div>
                                  <div className="text-xs text-gray-400">
                                    Product ID: {item.productId.substring(0, 8)}...
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-300">
                              {formatCurrency(item.price)}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-300">
                              {item.quantity}
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-white">
                              {formatCurrency(item.price * item.quantity)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    openStatusModal(selectedOrder);
                  }}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg transition-all duration-300 shadow hover:shadow-lg"
                >
                  Update Order Status
                </button>
                {selectedOrder.midtransOrderId && (
                  <button
                    onClick={() => {
                      handleManualSyncOrder(selectedOrder.id);
                      setShowDetailModal(false);
                    }}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition-all duration-300 shadow hover:shadow-lg"
                  >
                    Sync Payment Status
                  </button>
                )}
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="flex-1 px-4 py-2.5 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors duration-200 border border-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update Status Modal */}
      {showStatusModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-gray-700">
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">
                  Update Order Status
                </h3>
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="text-gray-400 hover:text-gray-300"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Order ID</label>
                  <input
                    type="text"
                    value={selectedOrder.id}
                    disabled
                    className="w-full px-3 py-2 bg-gray-900/30 border border-gray-700 rounded-lg text-gray-400 text-sm cursor-not-allowed"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Current Status</label>
                  <div className={`px-3 py-2 rounded-lg ${getStatusBadgeColor(selectedOrder.status)}`}>
                    {selectedOrder.status}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Payment Status</label>
                  <div className={`px-3 py-2 rounded-lg ${getPaymentStatusBadgeColor(selectedOrder.paymentStatus)}`}>
                    {selectedOrder.paymentStatus || 'N/A'}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Payment status updated automatically via Midtrans
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">New Order Status</label>
                  <select
                    value={statusFormData.status}
                    onChange={(e) => setStatusFormData({ ...statusFormData, status: e.target.value as Order['status'] })}
                    className="w-full px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50 transition-all duration-300 text-white"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="PROCESSING">Processing</option>
                    <option value="SHIPPED">Shipped</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>

                <div className="bg-yellow-900/20 border border-yellow-800/50 rounded-lg p-3">
                  <p className="text-sm text-yellow-300">
                    <strong>Note:</strong> Changing status to CANCELLED will automatically restore product stock.
                  </p>
                </div>
              </div>
              
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="flex-1 px-4 py-2.5 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors duration-200 border border-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateStatus}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white rounded-lg transition-all duration-300 shadow hover:shadow-lg"
                >
                  Update Status
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sync Settings Modal */}
      {showSyncSettings && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-gray-700">
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">
                  Auto-Sync Settings
                </h3>
                <button
                  onClick={() => setShowSyncSettings(false)}
                  className="text-gray-400 hover:text-gray-300"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-300">Auto-Sync Payment Status</label>
                    <button
                      onClick={toggleAutoSync}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 ${autoSyncEnabled ? 'bg-green-600' : 'bg-gray-700'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${autoSyncEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                  <p className="text-xs text-gray-400">
                    Automatically sync payment status from Midtrans for pending orders.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Sync Interval (seconds)
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="300"
                    step="10"
                    value={syncInterval}
                    onChange={(e) => setSyncInterval(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>10s</span>
                    <span className="text-white font-medium">{syncInterval}s</span>
                    <span>5m</span>
                  </div>
                </div>

                <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-3">
                  <p className="text-sm text-blue-300">
                    <strong>How it works:</strong>
                  </p>
                  <ul className="text-xs text-blue-200 mt-2 space-y-1">
                    <li>• Automatically checks payment status from Midtrans</li>
                    <li>• Only syncs orders with PENDING payment status</li>
                    <li>• Updates order status based on Midtrans response</li>
                    <li>• Manual sync button available for individual orders</li>
                  </ul>
                </div>

                <div className="bg-gray-900/50 rounded-lg p-3">
                  <div className="text-xs font-medium text-gray-300 mb-2">Current Status</div>
                  <div className="text-sm text-gray-400 space-y-1">
                    <div className="flex justify-between">
                      <span>Auto-Sync:</span>
                      <span className={autoSyncEnabled ? 'text-green-400' : 'text-red-400'}>
                        {autoSyncEnabled ? 'ENABLED' : 'DISABLED'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Interval:</span>
                      <span className="text-white">{syncInterval} seconds</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pending Orders:</span>
                      <span className="text-yellow-300">{getPendingOrdersCount()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Last Sync:</span>
                      <span className="text-white">{lastSyncTime || 'Never'}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setShowSyncSettings(false)}
                  className="flex-1 px-4 py-2.5 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors duration-200 border border-gray-700"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    startAutoSync();
                    setShowSyncSettings(false);
                  }}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition-all duration-300 shadow hover:shadow-lg"
                >
                  Apply Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Order Modal */}
      {showDeleteModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl shadow-xl w-full max-w-md border border-gray-700">
            <div className="p-4 sm:p-6">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-900/30 mb-4 border border-red-800/50">
                  <svg className="h-6 w-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Delete Order</h3>
                <p className="text-gray-300 mb-4">
                  Are you sure you want to delete order <strong className="text-pink-400">{selectedOrder.id.substring(0, 8)}...</strong>?
                </p>
                <div className="bg-red-900/20 border border-red-800/50 rounded-lg p-3 mb-4">
                  <p className="text-sm text-red-300">
                    This will permanently delete:
                  </p>
                  <ul className="text-sm text-red-200 mt-2 space-y-1">
                    <li>• Order details</li>
                    <li>• {selectedOrder.orderItems.length} order items</li>
                    <li>• Order history</li>
                  </ul>
                  <p className="text-sm text-yellow-300 mt-2">
                    Product stock will be automatically restored.
                  </p>
                </div>
                <p className="text-sm text-gray-400 mb-6">This action cannot be undone.</p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2.5 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors duration-200 border border-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteOrder}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white rounded-lg transition-all duration-300 shadow hover:shadow-lg"
                >
                  Delete Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}