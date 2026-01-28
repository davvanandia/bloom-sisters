'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import DashboardHeader from '@/components/DashboardHeader';

interface Voucher {
  id: string;
  code: string;
  discount: number;
  type: 'PERCENTAGE' | 'FIXED';
  minPurchase: number | null;
  maxDiscount: number | null;
  expiryDate: string | null;
  maxUsage: number | null;
  usageCount: number;
  isActive: boolean;
  createdAt: string;
}

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

export default function VouchersPage() {
  const router = useRouter();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [allVouchers, setAllVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Pagination & Filter
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const vouchersPerPage = 10;

  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const checkAuthAndFetchVouchers = async () => {
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
      await fetchAllVouchers();
      
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const fetchAllVouchers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_URL}/vouchers`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch vouchers');
      }

      setAllVouchers(result.data || []);
      applyFilters(result.data || []);
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const applyFilters = useCallback((vouchersData = allVouchers) => {
    let filteredVouchers = [...vouchersData];

    if (debouncedSearchTerm) {
      const searchLower = debouncedSearchTerm.toLowerCase();
      filteredVouchers = filteredVouchers.filter((voucher: Voucher) =>
        voucher.code.toLowerCase().includes(searchLower)
      );
    }

    if (statusFilter !== 'ALL') {
      const isActive = statusFilter === 'ACTIVE';
      filteredVouchers = filteredVouchers.filter((voucher: Voucher) => voucher.isActive === isActive);
    }

    if (typeFilter !== 'ALL') {
      filteredVouchers = filteredVouchers.filter((voucher: Voucher) => voucher.type === typeFilter);
    }

    const totalVouchers = filteredVouchers.length;
    const indexOfLastVoucher = currentPage * vouchersPerPage;
    const indexOfFirstVoucher = indexOfLastVoucher - vouchersPerPage;
    const currentVouchers = filteredVouchers.slice(indexOfFirstVoucher, indexOfLastVoucher);

    setVouchers(currentVouchers);
    setTotalPages(Math.ceil(totalVouchers / vouchersPerPage));
  }, [debouncedSearchTerm, statusFilter, typeFilter, currentPage, allVouchers]);

  useEffect(() => {
    checkAuthAndFetchVouchers();
  }, [currentPage]);

  useEffect(() => {
    if (!loading) {
      applyFilters();
    }
  }, [debouncedSearchTerm, statusFilter, typeFilter]);

  const toggleVoucherStatus = async (voucherId: string, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/vouchers/${voucherId}/toggle`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        fetchAllVouchers();
      } else {
        const result = await response.json();
        throw new Error(result.error || 'Failed to toggle voucher status');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Tidak kedaluwarsa';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Loading Skeleton Components
  const TableSkeleton = () => {
    return (
      <div className="bg-gray-800 rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Kode</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Diskon</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Min. Belanja</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Kedaluwarsa</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Penggunaan</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {[...Array(5)].map((_, index) => (
                <tr key={index} className="animate-pulse">
                  <td className="px-6 py-4">
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-700 rounded w-16"></div>
                      <div className="h-3 bg-gray-700 rounded w-20"></div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="h-4 bg-gray-700 rounded w-12"></div>
                      <div className="h-3 bg-gray-700 rounded w-16"></div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-gray-700 rounded w-16"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-gray-700 rounded w-20"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-6 bg-gray-700 rounded-full w-16"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-gray-700 rounded w-12"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <div className="h-8 w-20 bg-gray-700 rounded"></div>
                      <div className="h-8 w-12 bg-gray-700 rounded"></div>
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
          <div key={index} className="bg-gray-800 rounded-xl shadow p-4 animate-pulse">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="h-5 bg-gray-700 rounded w-24"></div>
                <div className="h-3 bg-gray-700 rounded w-16"></div>
              </div>
              <div className="h-6 bg-gray-700 rounded-full w-16"></div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <div className="h-3 bg-gray-700 rounded w-20"></div>
                <div className="h-4 bg-gray-700 rounded w-16"></div>
              </div>
              <div className="space-y-1">
                <div className="h-3 bg-gray-700 rounded w-20"></div>
                <div className="h-4 bg-gray-700 rounded w-20"></div>
              </div>
            </div>
            <div className="mt-4 flex justify-between">
              <div className="h-8 w-20 bg-gray-700 rounded"></div>
              <div className="h-8 w-12 bg-gray-700 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
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

            {/* Filter Skeleton */}
            <div className="bg-gray-800 rounded-xl shadow p-4 mb-4">
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

  if (error) {
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
                  Voucher Management
                </h1>
                <p className="text-gray-400 mt-1 text-sm">
                  Manage all vouchers and promo codes
                </p>
              </div>
              <Link
                href="/dashboard/vouchers/add"
                className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white px-4 py-2.5 rounded-lg flex items-center justify-center shadow hover:shadow-md transition-all duration-300 w-full sm:w-auto"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add New Voucher
              </Link>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-xl p-4 mb-4 border border-gray-700">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Search Vouchers</label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by code..."
                  className="w-full px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50 transition-all duration-300 text-white text-sm placeholder-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Filter by Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50 transition-all duration-300 text-white text-sm"
                >
                  <option value="ALL">All Status</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Filter by Type</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50 transition-all duration-300 text-white text-sm"
                >
                  <option value="ALL">All Types</option>
                  <option value="PERCENTAGE">Percentage</option>
                  <option value="FIXED">Fixed Amount</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Actions</label>
                <div className="flex space-x-2">
                  <button
                    onClick={fetchAllVouchers}
                    className="flex-1 bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 text-gray-300 px-3 py-2 rounded-lg transition-all duration-300 flex items-center justify-center shadow-sm text-sm border border-gray-700"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                  </button>
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('ALL');
                      setTypeFilter('ALL');
                      setCurrentPage(1);
                    }}
                    className="flex-1 bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 text-gray-300 px-3 py-2 rounded-lg transition-all duration-300 flex items-center justify-center shadow-sm text-sm border border-gray-700"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Clear
                  </button>
                </div>
              </div>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Kode</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Diskon</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Min. Belanja</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Kedaluwarsa</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Penggunaan</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800/30 divide-y divide-gray-700">
                  {vouchers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <div className="text-gray-400">
                          <svg className="w-12 h-12 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                          </svg>
                          <p className="text-lg font-medium text-gray-300">No vouchers found</p>
                          <p className="mt-1 text-gray-500">Try adjusting your search or filters</p>
                          <Link
                            href="/dashboard/vouchers/add"
                            className="mt-4 inline-block bg-gradient-to-r from-pink-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-pink-700 hover:to-purple-700 transition-all duration-300"
                          >
                            Create First Voucher
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    vouchers.map((voucher) => (
                      <tr key={voucher.id} className="hover:bg-gray-800/50 transition-colors duration-200">
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-bold text-white">{voucher.code}</div>
                            <div className="text-xs text-gray-400">
                              {voucher.type === 'PERCENTAGE' ? 'Persentase' : 'Nominal'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <span className="font-semibold text-white">
                              {voucher.type === 'PERCENTAGE' 
                                ? `${voucher.discount}%` 
                                : formatCurrency(voucher.discount)}
                            </span>
                            {voucher.maxDiscount && (
                              <div className="text-xs text-gray-400">
                                Maks: {formatCurrency(voucher.maxDiscount)}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-white">
                          {voucher.minPurchase 
                            ? formatCurrency(voucher.minPurchase)
                            : <span className="text-gray-500">Tidak ada</span>}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-400">
                          {formatDate(voucher.expiryDate)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            voucher.isActive 
                              ? 'bg-green-900/30 text-green-300 border border-green-800/50' 
                              : 'bg-red-900/30 text-red-300 border border-red-800/50'
                          }`}>
                            {voucher.isActive ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-white">
                          {voucher.usageCount} {voucher.maxUsage ? `/ ${voucher.maxUsage}` : ''}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => toggleVoucherStatus(voucher.id, voucher.isActive)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                                voucher.isActive
                                  ? 'bg-red-900/30 text-red-300 hover:bg-red-800/50 border border-red-800/50'
                                  : 'bg-green-900/30 text-green-300 hover:bg-green-800/50 border border-green-800/50'
                              }`}
                            >
                              {voucher.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                            </button>
                            <Link
                              href={`/dashboard/vouchers/${voucher.id}/edit`}
                              className="px-3 py-1.5 bg-blue-900/30 text-blue-300 rounded-lg text-xs font-medium hover:bg-blue-800/50 border border-blue-800/50 transition-all duration-200"
                            >
                              Edit
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="block lg:hidden space-y-3">
            {vouchers.length === 0 ? (
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-xl p-6 text-center border border-gray-700">
                <svg className="w-10 h-10 mx-auto text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
                <p className="text-base font-medium text-gray-300">No vouchers found</p>
                <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filters</p>
                <Link
                  href="/dashboard/vouchers/add"
                  className="mt-4 inline-block bg-gradient-to-r from-pink-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-pink-700 hover:to-purple-700 transition-all duration-300 text-sm"
                >
                  Create First Voucher
                </Link>
              </div>
            ) : (
              vouchers.map((voucher) => (
                <div key={voucher.id} className="bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-xl p-4 border border-gray-700">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-white text-sm">{voucher.code}</div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {voucher.type === 'PERCENTAGE' ? 'Persentase' : 'Nominal'}
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      voucher.isActive 
                        ? 'bg-green-900/30 text-green-300 border border-green-800/50' 
                        : 'bg-red-900/30 text-red-300 border border-red-800/50'
                    }`}>
                      {voucher.isActive ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>
                  
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-400">Diskon</p>
                      <p className="font-medium text-white text-sm">
                        {voucher.type === 'PERCENTAGE' 
                          ? `${voucher.discount}%` 
                          : formatCurrency(voucher.discount)}
                      </p>
                      {voucher.maxDiscount && (
                        <p className="text-xs text-gray-400">Maks: {formatCurrency(voucher.maxDiscount)}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Min. Belanja</p>
                      <p className="font-medium text-white text-sm">
                        {voucher.minPurchase 
                          ? formatCurrency(voucher.minPurchase)
                          : 'Tidak ada'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-400">Kedaluwarsa</p>
                      <p className="font-medium text-white text-sm">{formatDate(voucher.expiryDate)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Penggunaan</p>
                      <p className="font-medium text-white text-sm">
                        {voucher.usageCount} {voucher.maxUsage ? `/ ${voucher.maxUsage}` : ''}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex justify-between">
                    <button
                      onClick={() => toggleVoucherStatus(voucher.id, voucher.isActive)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                        voucher.isActive
                          ? 'bg-red-900/30 text-red-300 hover:bg-red-800/50 border border-red-800/50'
                          : 'bg-green-900/30 text-green-300 hover:bg-green-800/50 border border-green-800/50'
                      }`}
                    >
                      {voucher.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>
                    <Link
                      href={`/dashboard/vouchers/${voucher.id}/edit`}
                      className="px-3 py-1.5 bg-blue-900/30 text-blue-300 rounded-lg text-xs font-medium hover:bg-blue-800/50 border border-blue-800/50 transition-all duration-200"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 lg:mt-6 flex justify-center">
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
    </div>
  );
}