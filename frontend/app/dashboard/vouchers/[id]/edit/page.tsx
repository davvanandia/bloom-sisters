'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import DashboardHeader from '@/components/DashboardHeader';
import { z } from 'zod';

const voucherSchema = z.object({
  code: z.string()
    .min(3, 'Kode voucher minimal 3 karakter')
    .max(20, 'Kode voucher maksimal 20 karakter')
    .regex(/^[A-Z0-9_-]+$/, 'Hanya huruf kapital, angka, underscore, dan dash'),
  discount: z.number()
    .min(1, 'Diskon minimal 1')
    .max(1000000, 'Diskon maksimal 1,000,000'),
  type: z.enum(['PERCENTAGE', 'FIXED']),
  minPurchase: z.number().min(0).optional(),
  maxDiscount: z.number().min(0).optional(),
  expiryDate: z.string().optional(),
  maxUsage: z.number().min(1).optional(),
  isActive: z.boolean(),
});

type VoucherFormData = z.infer<typeof voucherSchema>;

export default function EditVoucherPage() {
  const router = useRouter();
  const params = useParams();
  const voucherId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [voucherNotFound, setVoucherNotFound] = useState(false);

  const [formData, setFormData] = useState<VoucherFormData>({
    code: '',
    discount: 0,
    type: 'PERCENTAGE',
    minPurchase: undefined,
    maxDiscount: undefined,
    expiryDate: '',
    maxUsage: undefined,
    isActive: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const checkAuth = useCallback(async () => {
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
      setAuthChecked(true);
      
      // Fetch voucher data setelah auth berhasil
      await fetchVoucherData();
      
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }, [router, voucherId]);

  const fetchVoucherData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Token tidak ditemukan');
      }

      const response = await fetch(`${API_URL}/vouchers/${voucherId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          setVoucherNotFound(true);
          return;
        }
        throw new Error('Gagal mengambil data voucher');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Gagal mengambil data voucher');
      }

      const voucher = result.data;
      
      // Format data untuk form
      setFormData({
        code: voucher.code,
        discount: voucher.discount,
        type: voucher.type,
        minPurchase: voucher.minPurchase || undefined,
        maxDiscount: voucher.maxDiscount || undefined,
        expiryDate: voucher.expiryDate 
          ? new Date(voucher.expiryDate).toISOString().slice(0, 16)
          : '',
        maxUsage: voucher.maxUsage || undefined,
        isActive: voucher.isActive,
      });
      
      setLoading(false);
    } catch (err: any) {
      console.error('Error fetching voucher:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (voucherId) {
      checkAuth();
    }
  }, [voucherId, checkAuth]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (name === 'code') {
      setFormData(prev => ({
        ...prev,
        [name]: value.toUpperCase()
      }));
    } else if (name === 'discount' || name === 'minPurchase' || name === 'maxDiscount' || name === 'maxUsage') {
      setFormData(prev => ({
        ...prev,
        [name]: value === '' ? undefined : parseFloat(value)
      }));
    } else if (name === 'isActive') {
      setFormData(prev => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    try {
      voucherSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Anda harus login terlebih dahulu');
      }

      const response = await fetch(`${API_URL}/vouchers/${voucherId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          minPurchase: formData.minPurchase || null,
          maxDiscount: formData.maxDiscount || null,
          expiryDate: formData.expiryDate || null,
          maxUsage: formData.maxUsage || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal memperbarui voucher');
      }

      setSuccess('Voucher berhasil diperbarui!');
      
      setTimeout(() => {
        router.push('/dashboard/vouchers');
      }, 2000);

    } catch (err: any) {
      console.error('Error updating voucher:', err);
      setError(err.message || 'Terjadi kesalahan');
    } finally {
      setSubmitting(false);
    }
  };

const deleteVoucher = async () => {
  if (!window.confirm('Apakah Anda yakin ingin menghapus voucher ini? Tindakan ini tidak dapat dibatalkan.')) {
    return;
  }

  try {
    setError('');
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Anda harus login terlebih dahulu');
    }

    const response = await fetch(`${API_URL}/vouchers/${voucherId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Gagal menghapus voucher');
    }

    alert('Voucher berhasil dihapus!');
    router.push('/dashboard/vouchers');
    
  } catch (err: any) {
    console.error('Error deleting voucher:', err);
    setError(err.message || 'Terjadi kesalahan saat menghapus');
    
    // Tampilkan alert untuk error spesifik
    if (err.message.includes('sudah digunakan')) {
      alert(err.message + '\n\nAnda dapat menonaktifkan voucher ini dari halaman daftar voucher.');
    }
  }
};

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Loading state
  if (loading || !authChecked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="animate-pulse p-6">
          <div className="h-8 bg-gray-700 rounded mb-6 w-1/3"></div>
          <div className="h-64 bg-gray-700 rounded-lg"></div>
        </div>
      </div>
    );
  }

  // Voucher not found
  if (voucherNotFound) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
        <DashboardHeader user={currentUser} />
        
        <div className="flex">
          <Sidebar userRole={currentUser.role} />
          
          <main className="flex-1 p-4 lg:p-6">
            <div className="max-w-4xl mx-auto">
              <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-900/30 flex items-center justify-center">
                  <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-white mb-3">Voucher Tidak Ditemukan</h1>
                <p className="text-gray-400 mb-8 max-w-md mx-auto">
                  Voucher yang Anda cari tidak ditemukan atau mungkin telah dihapus.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link
                    href="/dashboard/vouchers"
                    className="px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:from-pink-700 hover:to-purple-700 transition-all duration-300 inline-flex items-center justify-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Kembali ke Daftar Voucher
                  </Link>
                  <Link
                    href="/dashboard/vouchers/add"
                    className="px-6 py-3 bg-gray-800 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-700 transition-all duration-300 inline-flex items-center justify-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Buat Voucher Baru
                  </Link>
                </div>
              </div>
            </div>
          </main>
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
          {/* Breadcrumbs */}
          <div className="mb-6">
            <nav className="flex" aria-label="Breadcrumb">
              <ol className="inline-flex items-center space-x-1 md:space-x-3">
                <li className="inline-flex items-center">
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center text-sm font-medium text-gray-300 hover:text-pink-400"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    Dashboard
                  </Link>
                </li>
                <li>
                  <div className="flex items-center">
                    <svg className="w-6 h-6 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                    <Link
                      href="/dashboard/vouchers"
                      className="ml-1 text-sm font-medium text-gray-300 hover:text-pink-400 md:ml-2"
                    >
                      Vouchers
                    </Link>
                  </div>
                </li>
                <li aria-current="page">
                  <div className="flex items-center">
                    <svg className="w-6 h-6 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="ml-1 text-sm font-medium text-gray-400 md:ml-2">
                      Edit Voucher
                    </span>
                  </div>
                </li>
              </ol>
            </nav>
          </div>

          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">Edit Voucher</h1>
                <p className="text-gray-400 mt-2">Perbarui informasi voucher</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={deleteVoucher}
                  className="px-4 py-2.5 text-sm font-medium text-red-300 bg-red-900/20 border border-red-800/50 rounded-lg hover:bg-red-900/30 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Hapus Voucher
                </button>
                <Link
                  href="/dashboard/vouchers"
                  className="px-4 py-2.5 text-sm font-medium text-gray-300 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Kembali ke Daftar
                </Link>
              </div>
            </div>
          </div>

          {/* Success/Error Messages */}
          {success && (
            <div className="mb-6 p-4 bg-green-900/30 border border-green-700 rounded-lg flex items-center gap-3">
              <div className="w-5 h-5 bg-green-900/50 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-green-300 font-medium">{success}</p>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-900/30 border border-red-700 rounded-lg flex items-center gap-3">
              <div className="w-5 h-5 bg-red-900/50 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="text-red-300 font-medium">{error}</p>
            </div>
          )}

          {/* Form */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-700 overflow-hidden">
            <div className="p-6 md:p-8">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Basic Information */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-6 bg-gradient-to-b from-pink-500 to-purple-500 rounded-full"></div>
                    <h3 className="text-lg font-semibold text-white">
                      Informasi Dasar
                    </h3>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Code */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Kode Voucher <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        name="code"
                        value={formData.code}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 rounded-lg bg-gray-900/50 border ${
                          errors.code ? 'border-red-500/50' : 'border-gray-700'
                        } focus:ring-2 focus:ring-pink-500/50 focus:border-transparent transition-all duration-300 text-white placeholder-gray-500`}
                        placeholder="CONTOH: DISKON50"
                        maxLength={20}
                        required
                      />
                      {errors.code && (
                        <p className="mt-2 text-sm text-red-400">{errors.code}</p>
                      )}
                      <p className="mt-2 text-xs text-gray-400">
                        Hanya huruf kapital, angka, underscore (_), dan dash (-).
                      </p>
                    </div>

                    {/* Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Tipe Diskon <span className="text-red-400">*</span>
                      </label>
                      <select
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-lg bg-gray-900/50 border border-gray-700 focus:ring-2 focus:ring-pink-500/50 focus:border-transparent transition-all duration-300 text-white"
                      >
                        <option value="PERCENTAGE" className="bg-gray-800">Persentase (%)</option>
                        <option value="FIXED" className="bg-gray-800">Nominal Tetap (IDR)</option>
                      </select>
                    </div>
                  </div>

                  {/* Discount */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Besaran Diskon <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        name="discount"
                        value={formData.discount || ''}
                        onChange={handleChange}
                        min="1"
                        max={formData.type === 'PERCENTAGE' ? '100' : '1000000'}
                        step="0.01"
                        className={`w-full px-4 py-3 rounded-lg bg-gray-900/50 border ${
                          errors.discount ? 'border-red-500/50' : 'border-gray-700'
                        } focus:ring-2 focus:ring-pink-500/50 focus:border-transparent transition-all duration-300 text-white pr-12`}
                        required
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                        {formData.type === 'PERCENTAGE' ? '%' : 'IDR'}
                      </div>
                    </div>
                    {errors.discount && (
                      <p className="mt-2 text-sm text-red-400">{errors.discount}</p>
                    )}
                  </div>

                  {formData.type === 'PERCENTAGE' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Maksimal Diskon (Opsional)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          name="maxDiscount"
                          value={formData.maxDiscount || ''}
                          onChange={handleChange}
                          min="0"
                          step="1"
                          className={`w-full px-4 py-3 rounded-lg bg-gray-900/50 border ${
                            errors.maxDiscount ? 'border-red-500/50' : 'border-gray-700'
                          } focus:ring-2 focus:ring-pink-500/50 focus:border-transparent transition-all duration-300 text-white pr-12`}
                          placeholder="0"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                          IDR
                        </div>
                      </div>
                      <p className="mt-2 text-xs text-gray-400">
                        Batas maksimal diskon dalam Rupiah.
                      </p>
                    </div>
                  )}
                </div>

                {/* Conditions */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-6 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full"></div>
                    <h3 className="text-lg font-semibold text-white">
                      Kondisi & Batasan
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Minimum Purchase */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Minimum Pembelian (Opsional)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          name="minPurchase"
                          value={formData.minPurchase || ''}
                          onChange={handleChange}
                          min="0"
                          step="1000"
                          className={`w-full px-4 py-3 rounded-lg bg-gray-900/50 border ${
                            errors.minPurchase ? 'border-red-500/50' : 'border-gray-700'
                          } focus:ring-2 focus:ring-pink-500/50 focus:border-transparent transition-all duration-300 text-white pr-12`}
                          placeholder="0"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                          IDR
                        </div>
                      </div>
                      <p className="mt-2 text-xs text-gray-400">
                        Minimum total belanja untuk menggunakan voucher
                      </p>
                    </div>

                    {/* Max Usage */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Maksimal Penggunaan (Opsional)
                      </label>
                      <input
                        type="number"
                        name="maxUsage"
                        value={formData.maxUsage || ''}
                        onChange={handleChange}
                        min="1"
                        step="1"
                        className={`w-full px-4 py-3 rounded-lg bg-gray-900/50 border ${
                          errors.maxUsage ? 'border-red-500/50' : 'border-gray-700'
                        } focus:ring-2 focus:ring-pink-500/50 focus:border-transparent transition-all duration-300 text-white`}
                        placeholder="Tidak terbatas"
                      />
                      <p className="mt-2 text-xs text-gray-400">
                        Jumlah maksimal penggunaan. Kosongkan untuk unlimited
                      </p>
                    </div>
                  </div>

                  {/* Expiry Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Tanggal Kedaluwarsa (Opsional)
                    </label>
                    <input
                      type="datetime-local"
                      name="expiryDate"
                      value={formData.expiryDate}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 rounded-lg bg-gray-900/50 border ${
                        errors.expiryDate ? 'border-red-500/50' : 'border-gray-700'
                      } focus:ring-2 focus:ring-pink-500/50 focus:border-transparent transition-all duration-300 text-white`}
                    />
                    <p className="mt-2 text-xs text-gray-400">
                      Kosongkan jika voucher berlaku selamanya
                    </p>
                  </div>
                </div>

                {/* Status */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-6 bg-gradient-to-b from-yellow-500 to-orange-500 rounded-full"></div>
                    <h3 className="text-lg font-semibold text-white">
                      Status Voucher
                    </h3>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="isActive"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleChange}
                      className="w-5 h-5 rounded bg-gray-900/50 border border-gray-700 focus:ring-2 focus:ring-pink-500/50 focus:border-transparent text-pink-600"
                    />
                    <label htmlFor="isActive" className="text-gray-300">
                      Voucher aktif dan dapat digunakan oleh pelanggan
                    </label>
                  </div>
                  <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${formData.isActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                      <span className={`font-medium ${formData.isActive ? 'text-green-400' : 'text-red-400'}`}>
                        {formData.isActive 
                          ? 'Voucher saat ini AKTIF dan dapat digunakan pelanggan'
                          : 'Voucher saat ini NONAKTIF dan tidak dapat digunakan'}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-gray-400">
                      Anda dapat mengaktifkan atau menonaktifkan voucher kapan saja.
                    </p>
                  </div>
                </div>

                {/* Preview */}
                <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl p-6 border border-gray-700">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-2 h-6 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></div>
                    <h3 className="text-lg font-semibold text-white">Preview Voucher</h3>
                  </div>
                  
                  <div className="bg-gray-900/70 rounded-lg p-6 border border-gray-700">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                          formData.isActive 
                            ? 'bg-gradient-to-r from-pink-600 to-purple-600' 
                            : 'bg-gradient-to-r from-gray-700 to-gray-800'
                        }`}>
                          <svg className={`w-7 h-7 ${formData.isActive ? 'text-white' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-xl">{formData.code || 'KODE_VOUCHER'}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              formData.type === 'PERCENTAGE' 
                                ? 'bg-blue-900/50 text-blue-300 border border-blue-700/50' 
                                : 'bg-green-900/50 text-green-300 border border-green-700/50'
                            }`}>
                              {formData.type === 'PERCENTAGE' ? 'Persentase' : 'Nominal'}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              formData.isActive
                                ? 'bg-green-900/50 text-green-300 border border-green-700/50'
                                : 'bg-red-900/50 text-red-300 border border-red-700/50'
                            }`}>
                              {formData.isActive ? 'Aktif' : 'Nonaktif'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-white">
                          {formData.type === 'PERCENTAGE' 
                            ? `${formData.discount}% OFF` 
                            : formatCurrency(formData.discount)}
                        </div>
                        {formData.maxDiscount && (
                          <div className="text-sm text-gray-400">
                            Maks: {formatCurrency(formData.maxDiscount)}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <p className="text-gray-400 text-sm">Minimum Belanja</p>
                        <p className="font-medium text-white text-lg">
                          {formData.minPurchase ? formatCurrency(formData.minPurchase) : 'Tidak Ada'}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-gray-400 text-sm">Kedaluwarsa</p>
                        <p className="font-medium text-white text-lg">
                          {formData.expiryDate 
                            ? new Date(formData.expiryDate).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : 'Tidak Ada'}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-gray-400 text-sm">Maks. Penggunaan</p>
                        <p className="font-medium text-white text-lg">
                          {formData.maxUsage || 'Tidak Terbatas'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-700">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-medium py-3.5 px-6 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg"
                  >
                    {submitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Memperbarui...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                        </svg>
                        <span>Simpan Perubahan</span>
                      </>
                    )}
                  </button>
                  <Link
                    href="/dashboard/vouchers"
                    className="flex-1 py-3.5 px-6 rounded-lg border border-gray-600 text-gray-300 font-medium hover:bg-gray-800 transition-colors text-center"
                  >
                    Batalkan
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}