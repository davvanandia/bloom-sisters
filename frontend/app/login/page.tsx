'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FcGoogle } from 'react-icons/fc';
import { FaEye, FaEyeSlash, FaEnvelope, FaLock } from 'react-icons/fa';
import Swal from 'sweetalert2';
import { setAuthTokens } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const showErrorAlert = (message: string) => {
    Swal.fire({
      icon: 'error',
      title: 'Gagal Masuk',
      text: message,
      background: '#fff',
      color: '#374151',
      confirmButtonColor: '#db2777',
      confirmButtonText: 'Coba Lagi',
      customClass: {
        popup: 'rounded-2xl border border-gray-200 shadow-xl',
        title: 'text-xl font-bold text-gray-800',
        confirmButton: 'px-6 py-2 rounded-lg font-medium',
      }
    });
  };

  const showSuccessAlert = (role: string) => {
    const isAdmin = role === 'ADMIN' || role === 'SUPERADMIN';
    const title = isAdmin ? 'Login Berhasil!' : 'Selamat Datang!';
    const text = isAdmin 
      ? 'Anda akan diarahkan ke Dashboard Admin' 
      : 'Selamat datang kembali di Bloom Sisters';

    Swal.fire({
      icon: 'success',
      title: title,
      text: text,
      background: '#fff',
      color: '#374151',
      showConfirmButton: false,
      timer: 1500,
      timerProgressBar: true,
      didOpen: () => {
        Swal.showLoading();
      },
      customClass: {
        popup: 'rounded-2xl border border-gray-200 shadow-xl',
        title: 'text-xl font-bold text-gray-800',
      }
    });
  };

  const showLoadingAlert = () => {
    Swal.fire({
      title: 'Sedang Memproses...',
      text: 'Harap tunggu sebentar',
      allowOutsideClick: false,
      showConfirmButton: false,
      background: '#fff',
      color: '#374151',
      customClass: {
        popup: 'rounded-2xl border border-gray-200 shadow-xl',
      },
      didOpen: () => {
        Swal.showLoading();
      },
    });
  };

  const closeLoadingAlert = () => {
    Swal.close();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validasi form
    if (!formData.email || !formData.password) {
      showErrorAlert('Harap isi semua field yang diperlukan');
      return;
    }

    // Validasi format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      showErrorAlert('Format email tidak valid');
      return;
    }

    setLoading(true);
    showLoadingAlert();

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login gagal. Silakan cek kembali email dan password Anda.');
      }

      // Gunakan utility function untuk set auth
      setAuthTokens(data.token, data.user);
      
      closeLoadingAlert();
      showSuccessAlert(data.user.role);

      // 🔥 TAMBAHKAN LOGIKA REDIRECT BERDASARKAN ROLE 🔥
      const userRole = data.user.role;
      let redirectPath = '/'; // Default untuk user biasa
      
      // Jika role adalah SUPERADMIN atau ADMIN, redirect ke dashboard
      if (userRole === 'SUPERADMIN' || userRole === 'ADMIN') {
        redirectPath = '/dashboard';
      }

      // Tunggu alert sukses selesai sebelum redirect
      setTimeout(() => {
        router.push(redirectPath);
        // Refresh halaman untuk update header
        setTimeout(() => {
          window.location.reload();
        }, 100);
      }, 1500);

    } catch (err: any) {
      closeLoadingAlert();
      
      // Handle error spesifik
      if (err.message.includes('network')) {
        showErrorAlert('Koneksi jaringan bermasalah. Periksa koneksi internet Anda.');
      } else if (err.message.includes('Invalid credentials')) {
        showErrorAlert('Email atau password salah. Silakan coba lagi.');
      } else if (err.message.includes('User not found')) {
        showErrorAlert('Akun tidak ditemukan. Silakan daftar terlebih dahulu.');
      } else if (err.message.includes('Account locked')) {
        showErrorAlert('Akun terkunci. Silakan hubungi administrator.');
      } else {
        showErrorAlert(err.message || 'Terjadi kesalahan. Silakan coba lagi nanti.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    Swal.fire({
      title: 'Login dengan Google',
      text: 'Fitur ini akan segera tersedia',
      icon: 'info',
      background: '#fff',
      color: '#374151',
      confirmButtonColor: '#db2777',
      confirmButtonText: 'Mengerti',
      showCancelButton: true,
      cancelButtonText: 'Batal',
      cancelButtonColor: '#9ca3af',
      customClass: {
        popup: 'rounded-2xl border border-gray-200 shadow-xl',
        title: 'text-xl font-bold text-gray-800',
        confirmButton: 'px-6 py-2 rounded-lg font-medium',
        cancelButton: 'px-6 py-2 rounded-lg font-medium border border-gray-300',
      }
    });
  };

  const handleForgotPassword = () => {
    Swal.fire({
      title: 'Lupa Password?',
      html: `
        <div class="text-left">
          <p class="mb-4">Masukkan email Anda untuk mereset password:</p>
          <input 
            type="email" 
            id="forgot-email" 
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            placeholder="nama@email.com"
          />
          <p class="mt-3 text-sm text-gray-600">
            Kami akan mengirimkan link reset password ke email Anda.
          </p>
        </div>
      `,
      icon: 'question',
      background: '#fff',
      color: '#374151',
      showCancelButton: true,
      confirmButtonText: 'Kirim Link Reset',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#db2777',
      cancelButtonColor: '#9ca3af',
      showLoaderOnConfirm: true,
      preConfirm: async () => {
        const email = (document.getElementById('forgot-email') as HTMLInputElement).value;
        
        if (!email) {
          Swal.showValidationMessage('Harap masukkan email');
          return false;
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          Swal.showValidationMessage('Format email tidak valid');
          return false;
        }
        
        try {
          const API_URL = process.env.NEXT_PUBLIC_API_URL;
          const response = await fetch(`${API_URL}/auth/forgot-password`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Gagal mengirim email reset');
          }

          return { success: true, message: data.message };
        } catch (error: any) {
          Swal.showValidationMessage(error.message || 'Gagal mengirim email reset');
          return false;
        }
      },
      customClass: {
        popup: 'rounded-2xl border border-gray-200 shadow-xl',
        title: 'text-xl font-bold text-gray-800',
        confirmButton: 'px-6 py-2 rounded-lg font-medium',
        cancelButton: 'px-6 py-2 rounded-lg font-medium border border-gray-300',
      },
      allowOutsideClick: () => !Swal.isLoading()
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: 'Email Terkirim!',
          text: 'Cek email Anda untuk link reset password',
          icon: 'success',
          background: '#fff',
          color: '#374151',
          confirmButtonColor: '#db2777',
          confirmButtonText: 'Mengerti',
          customClass: {
            popup: 'rounded-2xl border border-gray-200 shadow-xl',
            title: 'text-xl font-bold text-gray-800',
            confirmButton: 'px-6 py-2 rounded-lg font-medium',
          }
        });
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-8 bg-white/90 backdrop-blur-sm p-8 rounded-3xl shadow-xl border border-pink-100">
        {/* Logo and Header */}
        <div className="text-center">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              Bloom Sisters
            </h1>
          </Link>
          <h2 className="mt-4 text-2xl font-bold text-gray-800">
            Masuk ke Akun Anda
          </h2>
          <p className="mt-2 text-gray-600">
            Selamat datang kembali! Silakan masuk untuk melanjutkan
          </p>
        </div>

        {/* Login Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-5">
            {/* Email Field */}
            <div className="relative">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Alamat Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaEnvelope className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-300"
                  placeholder="nama@email.com"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="relative">
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Kata Sandi
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm font-medium text-pink-600 hover:text-pink-500 transition-colors duration-300"
                  disabled={loading}
                >
                  Lupa kata sandi?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-300"
                  placeholder="Masukkan kata sandi"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? (
                    <FaEyeSlash className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors duration-300" />
                  ) : (
                    <FaEye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors duration-300" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white transition-all duration-300 transform hover:scale-[1.02] ${
                loading 
                  ? 'bg-gradient-to-r from-pink-400 to-purple-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500`}
            >
              {loading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Sedang Memproses...</span>
                </div>
              ) : (
                <span className="font-semibold">Masuk</span>
              )}
            </button>
          </div>

          {/* Divider */}
          <div className="relative mt-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500 font-medium">Atau lanjutkan dengan</span>
            </div>
          </div>

          {/* Google Login Button */}
          <div className="mt-6">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full inline-flex justify-center items-center py-3 px-4 border-2 border-gray-300 rounded-xl shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
            >
              <FcGoogle className="w-5 h-5 mr-3" />
              <span className="font-medium">Masuk dengan Google</span>
            </button>
          </div>
        </form>

        {/* Registration Link */}
        <div className="mt-8 text-center">
          <p className="text-gray-600">
            Belum punya akun?{' '}
            <Link
              href="/register"
              className="font-semibold text-pink-600 hover:text-pink-700 transition-colors duration-300 relative group"
            >
              <span className="relative">
                Daftar di sini
                <span className="absolute left-0 bottom-0 w-0 h-0.5 bg-pink-600 transition-all duration-300 group-hover:w-full"></span>
              </span>
            </Link>
          </p>
        </div>

        {/* Additional Links */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-center">
            <Link
              href="/"
              className="text-sm text-gray-600 hover:text-pink-600 transition-colors duration-300 flex items-center justify-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Beranda
            </Link>
            <Link
              href="/contact"
              className="text-sm text-gray-600 hover:text-pink-600 transition-colors duration-300 flex items-center justify-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Kontak
            </Link>
          </div>
        </div>
      </div>
      
      {/* Background Decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-60 -left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-40 left-40 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Add CSS Animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}