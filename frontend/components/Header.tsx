'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Cookies from 'js-cookie';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const router = useRouter();
  const pathname = usePathname();
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const profileButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    checkAuthStatus();
    updateCartCount();
  }, []);

  useEffect(() => {
    // Handle click outside untuk close mobile menu dan dropdown
    const handleClickOutside = (event: MouseEvent) => {
      // Close profile dropdown jika klik di luar dropdown DAN di luar tombol profil
      if (profileDropdownRef.current && 
          profileButtonRef.current &&
          !profileDropdownRef.current.contains(event.target as Node) &&
          !profileButtonRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
      
      // Close mobile menu jika klik di luar
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        // Cek apakah yang diklik bukan tombol menu mobile
        const menuButton = (event.target as Element).closest('button[aria-label="Toggle menu"]');
        if (!menuButton) {
          setIsMenuOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    // Close mobile menu on route change
    setIsMenuOpen(false);
    setIsProfileDropdownOpen(false);
  }, [pathname]);

  const checkAuthStatus = () => {
    const token = Cookies.get('token') || localStorage.getItem('token');
    const userData = Cookies.get('user') || localStorage.getItem('user');
    
    if (token && userData) {
      try {
        const parsedUser = typeof userData === 'string' ? JSON.parse(userData) : userData;
        setIsLoggedIn(true);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing user data:', error);
        clearAuth();
      }
    }
    setLoading(false);
  };

  const updateCartCount = () => {
    // Simulate cart count
    setCartCount(3);
  };

  const clearAuth = () => {
    Cookies.remove('token');
    Cookies.remove('user');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setUser(null);
    setIsProfileDropdownOpen(false);
  };

  const handleLogout = () => {
    clearAuth();
    router.push('/');
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  // Fungsi untuk mendapatkan warna badge role
  const getRoleBadgeColor = (role: string) => {
    // Semua role menggunakan warna yang sama (purple)
    return 'bg-purple-100 text-purple-700 border border-purple-200';
  };

  // Komponen NavLink dengan efek underline dari kanan ke kiri
  const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => {
    const isActive = pathname === href;
    return (
      <Link
        href={href}
        className={`relative font-medium transition-colors duration-300 group ${
          isActive ? 'text-pink-600' : 'text-gray-700 hover:text-pink-600'
        }`}
      >
        {children}
        <span className={`absolute left-0 bottom-0 w-0 h-0.5 bg-pink-600 transition-all duration-300 group-hover:w-full ${
          isActive ? 'w-full' : ''
        }`}></span>
      </Link>
    );
  };

  // Komponen MobileNavLink dengan efek yang sama
  const MobileNavLink = ({ href, children }: { href: string; children: React.ReactNode }) => {
    const isActive = pathname === href;
    return (
      <Link
        href={href}
        className={`relative font-medium transition-colors duration-300 group py-3 block ${
          isActive ? 'text-pink-600' : 'text-gray-700 hover:text-pink-600'
        }`}
        onClick={() => setIsMenuOpen(false)}
      >
        {children}
        <span className={`absolute left-0 bottom-3 w-0 h-0.5 bg-pink-600 transition-all duration-300 group-hover:w-full ${
          isActive ? 'w-full' : ''
        }`}></span>
      </Link>
    );
  };

  // Komponen untuk ikon di mobile
  const MobileIconLink = ({ href, children, onClick }: { href?: string; children: React.ReactNode; onClick?: () => void }) => {
    if (href) {
      return (
        <Link
          href={href}
          className="flex items-center space-x-3 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-100 transition-all duration-300 w-full"
          onClick={() => {
            setIsMenuOpen(false);
            if (onClick) onClick();
          }}
        >
          {children}
        </Link>
      );
    }
    
    return (
      <button
        onClick={onClick}
        className="flex items-center space-x-3 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-100 transition-all duration-300 w-full"
      >
        {children}
      </button>
    );
  };

  const handleProfileButtonClick = () => {
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
  };

  if (loading) {
    return (
      <header className="bg-white/95 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="animate-pulse bg-gradient-to-r from-gray-200 to-gray-300 h-8 w-40 rounded-lg"></div>
            <div className="hidden md:flex items-center space-x-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse bg-gray-200 h-6 w-20 rounded"></div>
              ))}
              <div className="flex items-center space-x-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse bg-gray-200 h-10 w-10 rounded-full"></div>
                ))}
              </div>
            </div>
            <div className="animate-pulse bg-gray-200 h-10 w-10 rounded-full md:hidden"></div>
          </div>
        </div>
      </header>
    );
  }

  // Dapatkan role user dengan default 'USER'
  const userRole = user?.role || 'USER';

  return (
    <header className="bg-white/95 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link 
            href="/" 
            className="flex items-center space-x-2 group"
          >
            <div className="w-10 h-10 relative">
              <Image
                src="/logo.png"
                alt="Bloom Sisters Logo"
                width={40}
                height={40}
                className="object-contain"
                priority
              />
            </div>
            <div className="hidden sm:block">
              <div className="text-xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                Bloom Sisters
              </div>
              <div className="text-xs text-gray-500 -mt-1">Floral Elegance</div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            <NavLink href="/">Home</NavLink>
            <NavLink href="/shop">Shop</NavLink>
            <NavLink href="/about">About</NavLink>
            <NavLink href="/contact">Contact</NavLink>
            
            {/* Conditional Login/Register or Icons */}
            {!isLoggedIn ? (
              <div className="flex items-center space-x-4 ml-4">
                <Link
                  href="/login"
                  className="relative overflow-hidden px-5 py-2.5 rounded-lg group transition-all duration-300 hover:shadow-md"
                >
                  <span className="relative z-10 font-medium text-gray-700 group-hover:text-pink-600">Login</span>
                  <span className="absolute inset-0 bg-gradient-to-r from-pink-50 to-purple-50 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300"></span>
                </Link>
                <Link
                  href="/register"
                  className="relative overflow-hidden px-5 py-2.5 rounded-lg bg-gradient-to-r from-pink-600 to-purple-600 text-white font-medium hover:from-pink-700 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg"
                >
                  <span className="relative z-10">Register</span>
                  <span className="absolute inset-0 bg-gradient-to-r from-pink-700 to-purple-700 transform -translate-x-full hover:translate-x-0 transition-transform duration-300"></span>
                </Link>
              </div>
            ) : (
              <div className="flex items-center space-x-6 ml-4">
                {/* Transaksi Icon */}
                <Link
                  href="/transactions"
                  className="text-gray-700 hover:text-pink-600 transition-colors duration-300 relative group"
                  title="Transactions"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-pink-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                </Link>

                {/* Keranjang Icon */}
                <Link
                  href="/cart"
                  className="text-gray-700 hover:text-pink-600 transition-colors duration-300 relative group"
                  title="Cart"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-pink-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                </Link>
                
                {/* Profile Dropdown */}
                <div className="relative">
                  <button 
                    ref={profileButtonRef}
                    className="flex items-center space-x-2 focus:outline-none group"
                    onClick={handleProfileButtonClick}
                    title="Profile"
                  >
                    <div className="w-10 h-10 bg-gradient-to-r from-pink-600 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold shadow-md group-hover:shadow-lg transition-shadow duration-300">
                      {user?.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <svg className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isProfileDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {/* Dropdown Menu */}
                  {isProfileDropdownOpen && (
                    <div 
                      ref={profileDropdownRef}
                      className="absolute right-0 mt-3 w-64 bg-white rounded-xl shadow-xl border border-gray-100 py-2 animate-slideDown z-50"
                    >
                      <div className="px-4 py-3 border-b border-gray-100">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-r from-pink-600 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                            {user?.username?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-800 truncate">{user?.username}</p>
                            <p className="text-sm text-gray-500 truncate">{user?.email}</p>
                            <div className="flex items-center mt-1">
                              <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleBadgeColor(userRole)}`}>
                                {userRole}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="py-2">
                        <div className="border-t border-gray-100 my-2"></div>
                        
                        <button 
                          onClick={() => {
                            setIsProfileDropdownOpen(false);
                            handleLogout();
                          }}
                          className="flex items-center w-full px-4 py-3 text-red-600 hover:bg-red-50 transition-colors duration-200 group mt-1"
                        >
                          <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </nav>

          {/* Mobile Icons and Menu Button */}
          <div className="flex items-center space-x-4 lg:hidden">
            {/* Transaksi Icon Mobile (hanya jika login) */}
            {isLoggedIn && (
              <Link
                href="/transactions"
                className="relative text-gray-700 hover:text-pink-600 transition-colors duration-300"
                title="Transactions"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-pink-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              </Link>
            )}

            {/* Cart Icon Mobile */}
            <Link
              href="/cart"
              className="relative text-gray-700 hover:text-pink-600 transition-colors duration-300"
              title="Cart"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </Link>

            {/* Mobile menu button */}
            <button
              className="relative w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors duration-200"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              <div className="relative w-6 h-6">
                <span className={`absolute top-1 left-0 w-6 h-0.5 bg-gray-700 transition-all duration-300 ${isMenuOpen ? 'rotate-45 top-3' : ''}`}></span>
                <span className={`absolute top-3 left-0 w-6 h-0.5 bg-gray-700 transition-all duration-300 ${isMenuOpen ? 'opacity-0' : ''}`}></span>
                <span className={`absolute top-5 left-0 w-6 h-0.5 bg-gray-700 transition-all duration-300 ${isMenuOpen ? '-rotate-45 top-3' : ''}`}></span>
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div 
          ref={mobileMenuRef}
          className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            isMenuOpen ? 'max-h-screen mt-4 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="flex flex-col space-y-1 pb-4">
            <MobileNavLink href="/">Home</MobileNavLink>
            <MobileNavLink href="/shop">Shop</MobileNavLink>
            <MobileNavLink href="/about">About</MobileNavLink>
            <MobileNavLink href="/contact">Contact</MobileNavLink>
            
            {!isLoggedIn ? (
              <div className="pt-4 space-y-3">
                <MobileIconLink href="/login">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  <span>Login</span>
                </MobileIconLink>
                <MobileIconLink href="/register">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  <span>Register</span>
                </MobileIconLink>
              </div>
            ) : (
              <div className="pt-4 space-y-3">
                {/* User Info */}
                <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg">
                  <div className="w-12 h-12 bg-gradient-to-r from-pink-600 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                    {user?.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 truncate">{user?.username}</p>
                    <p className="text-sm text-gray-500 truncate">{user?.email}</p>
                    <div className="flex items-center mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleBadgeColor(userRole)}`}>
                        {userRole}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Transaksi di Mobile Menu */}
                <MobileIconLink href="/transactions">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span>Transactions</span>
                </MobileIconLink>
                
                <div className="border-t border-gray-200 my-2"></div>
                
                <MobileIconLink onClick={handleLogout}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="text-red-600">Logout</span>
                </MobileIconLink>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Tambahkan style untuk animasi slideDown */}
      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideDown {
          animation: slideDown 0.2s ease-out;
        }
      `}</style>
    </header>
  );
}