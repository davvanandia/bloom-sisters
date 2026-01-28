'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import DashboardHeader from '@/components/DashboardHeader';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (!token || !userData) {
          router.push('/login');
          return;
        }

        const parsedUser = JSON.parse(userData);
        
        if (parsedUser.role !== 'ADMIN' && parsedUser.role !== 'SUPERADMIN') {
          router.push('/');
          return;
        }

        setUser(parsedUser);
        setLoading(false);
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  // Loading Skeleton Components
  const StatsSkeleton = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="bg-gray-800 rounded-xl shadow p-4 animate-pulse border border-gray-700">
            <div className="h-5 bg-gray-700 rounded w-32 mb-3"></div>
            <div className="h-8 bg-gray-700 rounded w-24 mb-2"></div>
            <div className="h-4 bg-gray-700 rounded w-28"></div>
          </div>
        ))}
      </div>
    );
  };

  const QuickActionsSkeleton = () => {
    return (
      <div className="bg-gray-800 rounded-xl shadow p-4 mb-6 border border-gray-700">
        <div className="h-6 bg-gray-700 rounded w-32 mb-4"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="h-12 bg-gray-700 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  };

  const WelcomeCardSkeleton = () => {
    return (
      <div className="bg-gradient-to-r from-pink-900/30 to-purple-900/30 rounded-xl shadow p-4 animate-pulse border border-pink-800/30">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-3">
            <div className="h-6 bg-white/10 rounded w-48"></div>
            <div className="h-4 bg-white/10 rounded w-64"></div>
            <div className="h-10 bg-white/20 rounded w-32"></div>
          </div>
          <div className="h-12 w-12 bg-white/10 rounded-lg"></div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
        <DashboardHeader user={user} />
        
        <div className="flex">
          <Sidebar userRole={user?.role || 'USER'} />
          
          <main className="flex-1 p-4 lg:p-6">
            {/* Header Skeleton */}
            <div className="mb-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <div className="space-y-2">
                  <div className="h-7 bg-gray-700 rounded w-40 animate-pulse"></div>
                  <div className="h-4 bg-gray-700 rounded w-56 animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Stats Cards Skeleton */}
            <StatsSkeleton />

            {/* Quick Actions Skeleton */}
            <QuickActionsSkeleton />

            {/* Welcome Card Skeleton */}
            <WelcomeCardSkeleton />
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      <DashboardHeader user={user} />
      
      <div className="flex">
        <Sidebar userRole={user.role} />
        
        <main className="flex-1 p-4 lg:p-6">
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                  Dashboard Overview
                </h1>
                <p className="text-gray-400 mt-1 text-sm">
                  Welcome back, <span className="font-semibold text-pink-400">{user.username}</span>! Here's your store activity summary today.
                </p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-xl p-4 border-l-4 border-pink-600 border border-gray-700">
              <h3 className="text-sm font-medium text-gray-300 mb-2">Total Revenue</h3>
              <p className="text-2xl font-bold text-pink-400">$12.5K</p>
              <p className="text-xs text-green-400 mt-1">↑ 12% from last month</p>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-xl p-4 border-l-4 border-purple-600 border border-gray-700">
              <h3 className="text-sm font-medium text-gray-300 mb-2">Total Orders</h3>
              <p className="text-2xl font-bold text-purple-400">1,234</p>
              <p className="text-xs text-green-400 mt-1">↑ 8% from last month</p>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-xl p-4 border-l-4 border-blue-600 border border-gray-700">
              <h3 className="text-sm font-medium text-gray-300 mb-2">Total Users</h3>
              <p className="text-2xl font-bold text-blue-400">5,678</p>
              <p className="text-xs text-green-400 mt-1">↑ 15% from last month</p>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-xl p-4 border-l-4 border-green-600 border border-gray-700">
              <h3 className="text-sm font-medium text-gray-300 mb-2">Active Products</h3>
              <p className="text-2xl font-bold text-green-400">89</p>
              <p className="text-xs text-gray-400 mt-1">+5 new products</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-xl p-4 mb-6 border border-gray-700">
            <h2 className="text-lg font-bold text-white mb-3">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <button 
                onClick={() => router.push('/dashboard/users')}
                className="bg-gradient-to-r from-pink-600 to-pink-700 hover:from-pink-700 hover:to-pink-800 text-white p-3 rounded-lg transition-all duration-300 shadow hover:shadow-md flex items-center justify-center text-sm"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 3.75l-2.25 1.25v-2.5l2.25-1.25m0 0l2.25 1.25M21 11.25v2.5l-2.25 1.25" />
                </svg>
                Manage Users
              </button>
              <button 
                onClick={() => router.push('/dashboard/orders')}
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white p-3 rounded-lg transition-all duration-300 shadow hover:shadow-md flex items-center justify-center text-sm"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                View Orders
              </button>
              <button 
                onClick={() => router.push('/dashboard/products')}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white p-3 rounded-lg transition-all duration-300 shadow hover:shadow-md flex items-center justify-center text-sm"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Product
              </button>
              <button 
                onClick={() => router.push('/dashboard/reports')}
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white p-3 rounded-lg transition-all duration-300 shadow hover:shadow-md flex items-center justify-center text-sm"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                View Reports
              </button>
            </div>
          </div>

          {/* Welcome Card */}
          <div className="bg-gradient-to-r from-pink-900/30 to-purple-900/30 rounded-xl shadow-xl p-4 text-white border border-pink-800/30">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold mb-2">Welcome to Admin Dashboard!</h2>
                <p className="text-sm opacity-90 mb-3 text-gray-300">
                  You are logged in as <span className="font-bold">{user.role}</span>. Use this panel to manage all aspects of your Bloom Sisters store.
                </p>
                <button className="bg-white/20 hover:bg-white/30 text-white border border-white/30 px-4 py-2 rounded-lg font-medium transition-all duration-300 shadow text-sm">
                  Start Tour
                </button>
              </div>
              <div className="flex justify-center sm:justify-end">
                <div className="h-12 w-12 bg-white/10 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}