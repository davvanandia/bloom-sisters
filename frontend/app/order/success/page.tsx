'use client';
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { clearCart } from '@/utils/cart';

export default function OrderSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('orderId');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Clear cart on success page
    clearCart();
  }, []);

  const handleTrackOrder = () => {
    if (orderId) {
      router.push(`/transactions/${orderId}`);
    } else {
      router.push('/transactions');
    }
  };

  const handleContinueShopping = () => {
    router.push('/shop');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <Header />
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center">
              <svg className="w-16 h-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-4">Pembayaran Berhasil!</h1>
            <p className="text-gray-600 mb-6">
              Terima kasih atas pembelian Anda. Pesanan Anda sedang diproses.
            </p>
            {orderId && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-left">
                    <p className="text-green-800 font-medium">
                      Order ID: <span className="font-mono">{orderId}</span>
                    </p>
                    <p className="text-sm text-green-600 mt-1">
                      Simpan nomor ini untuk melacak pesanan Anda.
                    </p>
                  </div>
                  <button
                    onClick={() => navigator.clipboard.writeText(orderId)}
                    className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded hover:bg-green-200 transition-colors"
                  >
                    Salin ID
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-bold text-gray-800 mb-2">Konfirmasi Pesanan</h3>
              <p className="text-sm text-gray-600">
                Pesanan Anda telah diterima dan sedang diproses.
              </p>
            </div>

            <div 
              onClick={handleTrackOrder}
              className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer hover:bg-gray-50"
            >
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-bold text-gray-800 mb-2">Lacak Pesanan</h3>
              <p className="text-sm text-gray-600">
                Klik untuk melihat detail dan melacak status pesanan.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="font-bold text-gray-800 mb-2">Email Konfirmasi</h3>
              <p className="text-sm text-gray-600">
                Konfirmasi telah dikirim ke email Anda.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <button
              onClick={handleTrackOrder}
              disabled={isLoading}
              className="px-8 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:from-pink-700 hover:to-purple-700 transition-all duration-300 font-medium flex items-center justify-center disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 mr-2 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Memuat...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Lacak Pesanan
                </>
              )}
            </button>
            <button
              onClick={handleContinueShopping}
              className="px-8 py-3 border-2 border-pink-600 text-pink-600 rounded-lg hover:bg-pink-50 transition-colors font-medium flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Lanjutkan Belanja
            </button>
          </div>

          <div className="mt-12 pt-8 border-t">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Pertanyaan yang Sering Diajukan</h3>
            <div className="space-y-4 text-left max-w-xl mx-auto">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="font-medium text-gray-800 mb-1">Kapan pesanan saya akan dikirim?</p>
                <p className="text-sm text-gray-600">
                  Pesanan biasanya diproses dalam 1-2 hari kerja dan dikirim via kurir. Anda dapat melacak status pengiriman di detail pesanan.
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="font-medium text-gray-800 mb-1">Bagaimana cara melacak pesanan saya?</p>
                <p className="text-sm text-gray-600">
                  Klik tombol "Lacak Pesanan" di atas untuk melihat detail pesanan lengkap dan status terkini.
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="font-medium text-gray-800 mb-1">Apa yang harus saya lakukan jika ada masalah?</p>
                <p className="text-sm text-gray-600">
                  Hubungi customer service kami di +62 812 3456 7890 atau email help@bloomsisters.com. Siapkan Order ID Anda untuk proses yang lebih cepat.
                </p>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="mt-8 p-6 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl">
            <h4 className="font-bold text-gray-800 mb-3">Langkah Selanjutnya</h4>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href="/transactions"
                className="text-pink-600 hover:text-pink-700 font-medium text-sm"
              >
                Lihat Semua Transaksi →
              </Link>
              <Link
                href="/profile"
                className="text-purple-600 hover:text-purple-700 font-medium text-sm"
              >
                Perbarui Profil Saya →
              </Link>
              <Link
                href="/faq"
                className="text-gray-600 hover:text-gray-700 font-medium text-sm"
              >
                FAQ & Bantuan →
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}