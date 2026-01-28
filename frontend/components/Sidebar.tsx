'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

interface SidebarProps {
  userRole: 'SUPERADMIN' | 'ADMIN' | 'USER';
}

export default function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    }
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const menuItems = {
    SUPERADMIN: [
      { name: 'Dashboard', href: '/dashboard', icon: 'Dashboard', access: true },
      { name: 'User Management', href: '/dashboard/users', icon: 'Users', access: true },
      { name: 'Product Management', href: '/dashboard/products', icon: 'Products', access: true },
      { name: 'Voucher Management', href: '/dashboard/vouchers', icon: 'Vouchers', access: true },
      { name: 'Order Management', href: '/dashboard/orders', icon: 'Orders', access: true },
      // { name: 'Payment Management', href: '/dashboard/payments', icon: 'Payments', access: true },
      { name: 'Activity Logs', href: '/dashboard/logs', icon: 'Logs', access: true },
      // { name: 'Reports', href: '/dashboard/reports', icon: 'Reports', access: true },
      { name: 'Profile', href: '/dashboard/profile', icon: 'Profile', access: true },
    ],
    ADMIN: [
      { name: 'Dashboard', href: '/dashboard', icon: 'Dashboard', access: true },
      { name: 'User Management', href: '/dashboard/users', icon: 'Users', access: true },
      { name: 'Product Management', href: '/dashboard/products', icon: 'Products', access: true },
      { name: 'Voucher Management', href: '/dashboard/vouchers', icon: 'Vouchers', access: true },
      { name: 'Order Management', href: '/dashboard/orders', icon: 'Orders', access: true },
      // { name: 'Payment Management', href: '/dashboard/payments', icon: 'Payments', access: true },
      { name: 'Activity Logs', href: '/dashboard/logs', icon: 'Logs', access: true },
    ],
    USER: [
      { name: 'My Dashboard', href: '/dashboard', icon: 'Dashboard', access: true },
      { name: 'My Profile', href: '/profile', icon: 'Profile', access: true },
      { name: 'My Orders', href: '/orders', icon: 'Orders', access: true },
      { name: 'Products', href: '/products', icon: 'Products', access: true },
      { name: 'Payment History', href: '/payments', icon: 'Payments', access: true },
      { name: 'My Wishlist', href: '/wishlist', icon: 'Wishlist', access: true },
    ]
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'SUPERADMIN':
        return 'bg-purple-900/30 text-purple-300 border border-purple-700/50';
      case 'ADMIN':
        return 'bg-blue-900/30 text-blue-300 border border-blue-700/50';
      case 'USER':
        return 'bg-green-900/30 text-green-300 border border-green-700/50';
      default:
        return 'bg-gray-800 text-gray-300 border border-gray-700';
    }
  };

  const renderIcon = (iconName: string, isActive: boolean = false) => {
    const iconClass = `w-5 h-5 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-300 transition-colors'}`;
    
    switch (iconName) {
      case 'Dashboard':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        );
      case 'Users':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 3.75l-2.25 1.25v-2.5l2.25-1.25m0 0l2.25 1.25M21 11.25v2.5l-2.25 1.25" />
          </svg>
        );
      case 'Logs':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'Payments':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        );
      case 'Orders':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        );
      case 'Products':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        );
      case 'Vouchers':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
          </svg>
        );
      case 'Profile':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      case 'Reports':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        );
      case 'Wishlist':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        );
      default:
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    document.cookie.split(";").forEach(c => {
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/");
    });
    setTimeout(() => {
      window.location.href = '/';
    }, 50);
  };

  // Perbaikan: Fungsi untuk menentukan apakah menu aktif
  const isMenuActive = (href: string) => {
    // Jika ini dashboard, hanya aktif jika pathname tepat '/dashboard'
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    // Untuk menu lainnya, aktif jika pathname dimulai dengan href
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const items = menuItems[userRole] || menuItems.USER;

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
        </svg>
      </button>

      {/* Sidebar */}
      <aside className={`
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 transform transition-all duration-300 ease-in-out
        fixed lg:static inset-y-0 left-0 z-40
        w-64 bg-gray-900 text-gray-100 min-h-screen overflow-y-auto
        border-r border-gray-800 shadow-xl
      `}>
        {/* Logo & User Info */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center space-x-3 mb-6">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-r from-pink-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-gray-900 rounded-full"></div>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Bloom Sisters</h1>
              <p className="text-xs text-gray-400">Admin Panel</p>
            </div>
          </div>
          
          <div className="relative p-4 bg-gray-800/50 rounded-lg border border-gray-700 backdrop-blur-sm">
            <div className="absolute top-0 left-4 -translate-y-1/2">
              <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center shadow">
                <span className="text-white font-bold text-xs">
                  {user?.username?.charAt(0).toUpperCase() || userRole?.charAt(0)}
                </span>
              </div>
            </div>
            <div className="pt-2">
              <p className="text-sm font-semibold text-white truncate">{user?.username || 'User'}</p>
              <p className="text-xs text-gray-400 truncate mb-2">{user?.email || 'email@example.com'}</p>
              <span className={`inline-block px-2 py-1 text-xs font-medium rounded-md ${getRoleBadgeColor(userRole)}`}>
                {userRole}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4">
          <ul className="space-y-1">
            {items.map((item) => (
              item.access && (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`
                      group flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 relative
                      ${isMenuActive(item.href)
                        ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-md' 
                        : 'text-gray-400 hover:bg-gray-800 hover:text-gray-300'
                      }
                    `}
                  >
                    {/* Active indicator - garis kiri */}
                    {isMenuActive(item.href) && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-pink-400 to-purple-400 rounded-r"></div>
                    )}
                    
                    <div className={`p-1.5 rounded-md ${
                      isMenuActive(item.href)
                        ? 'bg-white/20' 
                        : 'bg-gray-800/50 group-hover:bg-gray-700/50'
                    }`}>
                      {renderIcon(item.icon, isMenuActive(item.href))}
                    </div>
                    <span className="text-sm font-medium">{item.name}</span>
                  </Link>
                </li>
              )
            ))}
          </ul>

          {/* Logout Button */}
          <div className="mt-8 pt-6 border-t border-gray-800">
            <button
              onClick={handleLogout}
              className="group flex items-center justify-center space-x-2 w-full px-4 py-2.5 bg-gray-800/50 hover:bg-red-900/30 text-gray-300 hover:text-red-300 rounded-lg border border-gray-700 hover:border-red-700 transition-all duration-300"
            >
              <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </nav>
      </aside>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-30 transition-all duration-300"
        ></div>
      )}
    </>
  );
}