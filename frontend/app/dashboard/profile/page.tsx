'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import DashboardHeader from '@/components/DashboardHeader';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  role: 'SUPERADMIN' | 'ADMIN' | 'USER';
  createdAt: string;
  updatedAt: string;
  _count: {
    orders: number;
    activityLogs: number;
  };
}

interface ProfileStats {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalSpent: number;
  recentActivity: Array<{
    action: string;
    details: string | null;
    time: string;
  }>;
  orderStats: {
    PENDING: number;
    PROCESSING: number;
    COMPLETED: number;
    CANCELLED: number;
  };
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Form states
  const [editForm, setEditForm] = useState({
    username: '',
    email: ''
  });
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [deleteForm, setDeleteForm] = useState({
    confirmation: '',
    password: ''
  });

  const checkAuthAndFetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');

      if (!token || !userData) {
        router.push('/login');
        return;
      }

      const parsedUser = JSON.parse(userData);
      setCurrentUser(parsedUser);
      
      await fetchProfile();
      await fetchProfileStats();
      
    } catch (err: any) {
      console.error('Error in checkAuthAndFetchProfile:', err);
      setError(err.message || 'Failed to initialize page');
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_URL}/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          router.push('/login');
          return;
        }
        
        const errorText = await response.text();
        throw new Error(`Failed to fetch profile: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch profile');
      }

      setProfile(result.data);
      setEditForm({
        username: result.data.username,
        email: result.data.email
      });
      setError('');
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      setError(err.message || 'Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchProfileStats = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        return;
      }

      const response = await fetch(`${API_URL}/profile/stats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setStats(result.data);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch profile stats:', err);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_URL}/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update profile');
      }

      // Update localStorage with new token if provided
      if (result.token) {
        localStorage.setItem('token', result.token);
      }

      // Update user data in localStorage
      const userData = localStorage.getItem('user');
      if (userData && result.data) {
        const parsedUser = JSON.parse(userData);
        const updatedUser = {
          ...parsedUser,
          username: result.data.username,
          email: result.data.email
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setCurrentUser(updatedUser);
      }

      setShowEditModal(false);
      setError('');
      fetchProfile();
      
      console.log('Profile updated successfully');
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message);
    }
  };

  const handleChangePassword = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_URL}/profile/password`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(passwordForm),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to change password');
      }

      setShowPasswordModal(false);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setError('');
      
      console.log('Password changed successfully');
    } catch (err: any) {
      console.error('Error changing password:', err);
      setError(err.message);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_URL}/profile`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(deleteForm),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete account');
      }

      // Clear localStorage and redirect to home
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push('/');
      
      console.log('Account deleted successfully');
    } catch (err: any) {
      console.error('Error deleting account:', err);
      setError(err.message);
    }
  };

  useEffect(() => {
    checkAuthAndFetchProfile();
  }, []);

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'SUPERADMIN':
        return 'bg-purple-900/30 text-purple-300 border border-purple-800/50';
      case 'ADMIN':
        return 'bg-blue-900/30 text-blue-300 border border-blue-800/50';
      case 'USER':
        return 'bg-green-900/30 text-green-300 border border-green-800/50';
      default:
        return 'bg-gray-800 text-gray-300 border border-gray-700';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) {
      return 'Just now';
    } else if (diffMin < 60) {
      return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
    } else if (diffHour < 24) {
      return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
    } else if (diffDay < 7) {
      return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
    } else {
      return formatDate(dateString);
    }
  };

  // Loading Skeleton
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
                  <div className="h-7 bg-gray-700 rounded w-32 animate-pulse"></div>
                  <div className="h-4 bg-gray-700 rounded w-48 animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Profile Card Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <div className="lg:col-span-2">
                <div className="bg-gray-800 rounded-xl p-6 animate-pulse border border-gray-700">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="w-20 h-20 bg-gray-700 rounded-full"></div>
                    <div className="space-y-2">
                      <div className="h-6 bg-gray-700 rounded w-32"></div>
                      <div className="h-4 bg-gray-700 rounded w-24"></div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="h-4 bg-gray-700 rounded w-full"></div>
                    <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-700 rounded w-2/3"></div>
                  </div>
                </div>
              </div>
              
              <div>
                <div className="bg-gray-800 rounded-xl p-6 animate-pulse border border-gray-700">
                  <div className="space-y-4">
                    <div className="h-4 bg-gray-700 rounded w-20 mb-4"></div>
                    {[...Array(4)].map((_, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="h-4 bg-gray-700 rounded w-16"></div>
                        <div className="h-4 bg-gray-700 rounded w-12"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Skeleton */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="bg-gray-800 rounded-xl p-4 animate-pulse border border-gray-700">
                  <div className="h-4 bg-gray-700 rounded w-16 mb-2"></div>
                  <div className="h-6 bg-gray-700 rounded w-12"></div>
                </div>
              ))}
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
                  My Profile
                </h1>
                <p className="text-gray-400 mt-1 text-sm">
                  Manage your account settings and preferences
                </p>
              </div>
              <button
                onClick={fetchProfile}
                className="bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 text-gray-300 px-4 py-2.5 rounded-lg flex items-center justify-center shadow hover:shadow-md transition-all duration-300 w-full sm:w-auto border border-gray-700"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-900/30 border-l-4 border-red-600 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-red-300 text-sm">{error}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Profile Card */}
            <div className="lg:col-span-2">
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-r from-pink-600 to-purple-600 flex items-center justify-center">
                    <span className="text-white text-2xl font-bold">
                      {profile?.username?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">{profile?.username}</h2>
                    <p className="text-gray-400">{profile?.email}</p>
                    <div className="mt-2">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(profile?.role || 'USER')}`}>
                        {profile?.role}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                    <div className="text-sm text-gray-400 mb-1">Account Created</div>
                    <div className="text-white font-medium">
                      {profile?.createdAt ? formatDate(profile.createdAt) : 'N/A'}
                    </div>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                    <div className="text-sm text-gray-400 mb-1">Last Updated</div>
                    <div className="text-white font-medium">
                      {profile?.updatedAt ? formatDate(profile.updatedAt) : 'N/A'}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-4 py-2 rounded-lg transition-all duration-300 shadow hover:shadow-md"
                  >
                    Edit Profile
                  </button>
                  <button
                    onClick={() => setShowPasswordModal(true)}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-4 py-2 rounded-lg transition-all duration-300 shadow hover:shadow-md"
                  >
                    Change Password
                  </button>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white px-4 py-2 rounded-lg transition-all duration-300 shadow hover:shadow-md"
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            </div>

            {/* Account Stats */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Account Statistics</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Total Orders</span>
                  <span className="text-white font-semibold">{profile?._count?.orders || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Activity Logs</span>
                  <span className="text-white font-semibold">{profile?._count?.activityLogs || 0}</span>
                </div>
                {stats && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Completed Orders</span>
                      <span className="text-white font-semibold">{stats.completedOrders}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Pending Orders</span>
                      <span className="text-white font-semibold">{stats.pendingOrders}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Total Spent</span>
                      <span className="text-white font-semibold">{formatCurrency(stats.totalSpent)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-blue-700/30">
                <div className="text-sm text-blue-400 mb-1">Total Orders</div>
                <div className="text-2xl font-bold text-blue-300">{stats.totalOrders}</div>
              </div>
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-yellow-700/30">
                <div className="text-sm text-yellow-400 mb-1">Pending</div>
                <div className="text-2xl font-bold text-yellow-300">{stats.orderStats.PENDING}</div>
              </div>
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-green-700/30">
                <div className="text-sm text-green-400 mb-1">Completed</div>
                <div className="text-2xl font-bold text-green-300">{stats.orderStats.COMPLETED}</div>
              </div>
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-purple-700/30">
                <div className="text-sm text-purple-400 mb-1">Total Spent</div>
                <div className="text-2xl font-bold text-purple-300">
                  {formatCurrency(stats.totalSpent).replace('Rp', '')}
                </div>
              </div>
            </div>
          )}

          {/* Recent Activity */}
          {stats && stats.recentActivity.length > 0 && (
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {stats.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg border border-gray-700">
                    <div>
                      <div className="text-sm font-medium text-white">{activity.action}</div>
                      <div className="text-xs text-gray-400 mt-1">{activity.details || 'No details'}</div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {getTimeAgo(activity.time)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MODALS */}

      {/* Edit Profile Modal */}
      {showEditModal && profile && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-gray-700">
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">
                  Edit Profile
                </h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-300"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Username *</label>
                  <input
                    type="text"
                    value={editForm.username}
                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50 transition-all duration-300 text-white"
                    placeholder="Enter your username"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Email *</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50 transition-all duration-300 text-white"
                    placeholder="Enter your email"
                  />
                </div>

                <div className="bg-yellow-900/20 border border-yellow-800/50 rounded-lg p-3">
                  <p className="text-sm text-yellow-300">
                    <strong>Note:</strong> Changing your email will require you to re-login with the new email address.
                  </p>
                </div>
              </div>
              
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2.5 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors duration-200 border border-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateProfile}
                  disabled={!editForm.username || !editForm.email}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white rounded-lg transition-all duration-300 shadow hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Update Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-gray-700">
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">
                  Change Password
                </h3>
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="text-gray-400 hover:text-gray-300"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Current Password *</label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50 transition-all duration-300 text-white"
                    placeholder="Enter current password"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">New Password *</label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50 transition-all duration-300 text-white"
                    placeholder="Enter new password (min. 6 characters)"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Confirm New Password *</label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50 transition-all duration-300 text-white"
                    placeholder="Confirm new password"
                  />
                </div>

                <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-3">
                  <p className="text-sm text-blue-300">
                    <strong>Password Requirements:</strong>
                    <ul className="mt-1 list-disc list-inside space-y-1">
                      <li>Minimum 6 characters</li>
                      <li>Should include letters and numbers</li>
                      <li>Avoid using common passwords</li>
                    </ul>
                  </p>
                </div>
              </div>
              
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 px-4 py-2.5 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors duration-200 border border-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleChangePassword}
                  disabled={!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword || passwordForm.newPassword.length < 6}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg transition-all duration-300 shadow hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Change Password
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-gray-700">
            <div className="p-4 sm:p-6">
              <div className="text-center mb-4">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-900/30 mb-4 border border-red-800/50">
                  <svg className="h-6 w-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Delete Account</h3>
                <p className="text-gray-300 mb-6">
                  This action cannot be undone. All your data will be permanently deleted.
                </p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Type <span className="text-red-400 font-bold">DELETE MY ACCOUNT</span> to confirm:
                  </label>
                  <input
                    type="text"
                    value={deleteForm.confirmation}
                    onChange={(e) => setDeleteForm({ ...deleteForm, confirmation: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50 transition-all duration-300 text-white"
                    placeholder="DELETE MY ACCOUNT"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Enter your password to confirm:</label>
                  <input
                    type="password"
                    value={deleteForm.password}
                    onChange={(e) => setDeleteForm({ ...deleteForm, password: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50 transition-all duration-300 text-white"
                    placeholder="Enter your password"
                  />
                </div>

                <div className="bg-red-900/20 border border-red-800/50 rounded-lg p-3">
                  <p className="text-sm text-red-300 font-medium">⚠️ Warning:</p>
                  <ul className="text-sm text-red-200 mt-2 space-y-1">
                    <li>• All your orders will be deleted</li>
                    <li>• All your activity logs will be deleted</li>
                    <li>• This action cannot be reversed</li>
                    <li>• You will be logged out immediately</li>
                    {profile?.role === 'SUPERADMIN' && (
                      <li className="text-yellow-300">• As a SUPERADMIN, please ensure there is another SUPERADMIN account</li>
                    )}
                  </ul>
                </div>
              </div>
              
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2.5 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors duration-200 border border-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteForm.confirmation !== 'DELETE MY ACCOUNT' || !deleteForm.password}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white rounded-lg transition-all duration-300 shadow hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Delete My Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}