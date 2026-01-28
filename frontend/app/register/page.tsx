'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FcGoogle } from 'react-icons/fc';
import { FaEye, FaEyeSlash, FaUser, FaEnvelope, FaLock, FaCheckCircle } from 'react-icons/fa';
import Swal from 'sweetalert2';
import { setAuthTokens } from '@/lib/auth';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Hitung kekuatan password jika field password berubah
    if (name === 'password') {
      calculatePasswordStrength(value);
    }
  };

  const calculatePasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 6) strength += 25;
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    setPasswordStrength(strength);
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength >= 75) return 'bg-green-500';
    if (passwordStrength >= 50) return 'bg-yellow-500';
    if (passwordStrength >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength >= 75) return 'Kuat';
    if (passwordStrength >= 50) return 'Cukup';
    if (passwordStrength >= 25) return 'Lemah';
    return 'Sangat Lemah';
  };

  const showErrorAlert = (message: string) => {
    Swal.fire({
      icon: 'error',
      title: 'Registrasi Gagal',
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

  const showSuccessAlert = () => {
    Swal.fire({
      icon: 'success',
      title: 'Registrasi Berhasil!',
      html: `
        <div class="text-center">
          <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <p class="text-gray-600 mb-2">Akun Anda telah berhasil dibuat</p>
          <p class="text-sm text-gray-500">Selamat datang di Bloom Sisters!</p>
        </div>
      `,
      background: '#fff',
      color: '#374151',
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true,
      customClass: {
        popup: 'rounded-2xl border border-gray-200 shadow-xl',
      }
    });
  };

  const showLoadingAlert = () => {
    Swal.fire({
      title: 'Sedang Membuat Akun...',
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

  const showPasswordRequirements = () => {
    Swal.fire({
      title: 'Persyaratan Kata Sandi',
      html: `
        <div class="text-left space-y-2">
          <div class="flex items-center">
            <div class="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mr-3">
              <svg class="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <span class="text-sm">Minimal 6 karakter</span>
          </div>
          <div class="flex items-center">
            <div class="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mr-3">
              <svg class="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <span class="text-sm">Disarankan 8 karakter atau lebih</span>
          </div>
          <div class="flex items-center">
            <div class="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mr-3">
              <svg class="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <span class="text-sm">Mengandung huruf kapital</span>
          </div>
          <div class="flex items-center">
            <div class="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mr-3">
              <svg class="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <span class="text-sm">Mengandung angka</span>
          </div>
        </div>
      `,
      icon: 'info',
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validasi form
    if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
      showErrorAlert('Harap isi semua field yang diperlukan');
      return;
    }

    // Validasi format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      showErrorAlert('Format email tidak valid');
      return;
    }

    // Validasi username minimal 3 karakter
    if (formData.username.length < 3) {
      showErrorAlert('Username minimal 3 karakter');
      return;
    }

    // Validasi password
    if (formData.password.length < 6) {
      showErrorAlert('Password harus minimal 6 karakter');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      showErrorAlert('Konfirmasi password tidak cocok');
      return;
    }

    setLoading(true);
    showLoadingAlert();

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registrasi gagal. Silakan coba lagi.');
      }

      // Gunakan utility function untuk set auth
      setAuthTokens(data.token, data.user);
      
      closeLoadingAlert();
      showSuccessAlert();

      // Tunggu alert sukses selesai sebelum redirect
      setTimeout(() => {
        router.push('/');
        // Refresh halaman untuk update header
        setTimeout(() => {
          window.location.reload();
        }, 100);
      }, 2000);

    } catch (err: any) {
      closeLoadingAlert();
      
      // Handle error spesifik
      if (err.message.includes('network')) {
        showErrorAlert('Koneksi jaringan bermasalah. Periksa koneksi internet Anda.');
      } else if (err.message.includes('Email already exists') || err.message.includes('email already')) {
        showErrorAlert('Email sudah terdaftar. Silakan gunakan email lain.');
      } else if (err.message.includes('Username already exists')) {
        showErrorAlert('Username sudah digunakan. Silakan pilih username lain.');
      } else {
        showErrorAlert(err.message || 'Terjadi kesalahan. Silakan coba lagi nanti.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = () => {
    Swal.fire({
      title: 'Daftar dengan Google',
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-8 bg-white/90 backdrop-blur-sm p-8 rounded-3xl shadow-xl border border-pink-100">
        {/* Logo and Header */}
        <div className="text-center">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              Bloom Sisters
            </h1>
          </Link>
          <h2 className="mt-4 text-2xl font-bold text-gray-800">
            Buat Akun Baru
          </h2>
          <p className="mt-2 text-gray-600">
            Bergabunglah dengan komunitas kami dan nikmati berbagai keuntungan
          </p>
        </div>

        {/* Registration Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-5">
            {/* Username Field */}
            <div className="relative">
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaUser className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-300"
                  placeholder="Pilih username"
                  disabled={loading}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">Minimal 3 karakter</p>
            </div>

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
                  onClick={showPasswordRequirements}
                  className="text-sm font-medium text-pink-600 hover:text-pink-500 transition-colors duration-300"
                  disabled={loading}
                >
                  Syarat kata sandi
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
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-300"
                  placeholder="Minimal 6 karakter"
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
              
              {/* Password Strength Meter */}
              {formData.password && (
                <div className="mt-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600">Kekuatan kata sandi:</span>
                    <span className={`font-medium ${
                      passwordStrength >= 75 ? 'text-green-600' :
                      passwordStrength >= 50 ? 'text-yellow-600' :
                      passwordStrength >= 25 ? 'text-orange-600' : 'text-red-600'
                    }`}>
                      {getPasswordStrengthText()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                      style={{ width: `${passwordStrength}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="relative">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Konfirmasi Kata Sandi
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-300"
                  placeholder="Ulangi kata sandi"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading}
                >
                  {showConfirmPassword ? (
                    <FaEyeSlash className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors duration-300" />
                  ) : (
                    <FaEye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors duration-300" />
                  )}
                </button>
              </div>
              
              {/* Password Match Check */}
              {formData.confirmPassword && (
                <div className="mt-2 flex items-center">
                  {formData.password === formData.confirmPassword ? (
                    <>
                      <FaCheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      <span className="text-xs text-green-600">Kata sandi cocok</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span className="text-xs text-red-600">Kata sandi tidak cocok</span>
                    </>
                  )}
                </div>
              )}
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
                  <span>Membuat Akun...</span>
                </div>
              ) : (
                <span className="font-semibold">Buat Akun</span>
              )}
            </button>
          </div>

          {/* Divider */}
          <div className="relative mt-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500 font-medium">Atau daftar dengan</span>
            </div>
          </div>

          {/* Google Register Button */}
          <div className="mt-6">
            <button
              type="button"
              onClick={handleGoogleRegister}
              disabled={loading}
              className="w-full inline-flex justify-center items-center py-3 px-4 border-2 border-gray-300 rounded-xl shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
            >
              <FcGoogle className="w-5 h-5 mr-3" />
              <span className="font-medium">Daftar dengan Google</span>
            </button>
          </div>
        </form>

        {/* Login Link */}
        <div className="mt-8 text-center">
          <p className="text-gray-600">
            Sudah punya akun?{' '}
            <Link
              href="/login"
              className="font-semibold text-pink-600 hover:text-pink-700 transition-colors duration-300 relative group"
            >
              <span className="relative">
                Masuk di sini
                <span className="absolute left-0 bottom-0 w-0 h-0.5 bg-pink-600 transition-all duration-300 group-hover:w-full"></span>
              </span>
            </Link>
          </p>
        </div>

        {/* Terms and Privacy */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-center text-gray-500">
            Dengan mendaftar, Anda menyetujui{' '}
            <button
              onClick={() => {
                Swal.fire({
                  title: 'Syarat dan Ketentuan',
                  text: 'Isi syarat dan ketentuan akan ditampilkan di sini.',
                  icon: 'info',
                  confirmButtonColor: '#db2777',
                  confirmButtonText: 'Mengerti'
                });
              }}
              className="text-pink-600 hover:text-pink-700"
            >
              Syarat dan Ketentuan
            </button>{' '}
            serta{' '}
            <button
              onClick={() => {
                Swal.fire({
                  title: 'Kebijakan Privasi',
                  text: 'Isi kebijakan privasi akan ditampilkan di sini.',
                  icon: 'info',
                  confirmButtonColor: '#db2777',
                  confirmButtonText: 'Mengerti'
                });
              }}
              className="text-pink-600 hover:text-pink-700"
            >
              Kebijakan Privasi
            </button>{' '}
            kami.
          </p>
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