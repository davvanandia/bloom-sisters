'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Profile state
  const [profile, setProfile] = useState({
    name: 'Intan Permata',
    email: 'intan@example.com',
    phone: '+62 812-3456-7890',
    birthday: '1995-05-15',
    gender: 'female',
    bio: 'Flower enthusiast and gardening lover',
  });

  // Notification preferences
  const [notifications, setNotifications] = useState({
    emailPromotions: true,
    emailOrderUpdates: true,
    emailNewsletter: true,
    pushNotifications: true,
    smsUpdates: false,
  });

  // Privacy settings
  const [privacy, setPrivacy] = useState({
    showProfile: true,
    showWishlist: true,
    showReviews: true,
    dataCollection: true,
  });

  // Security
  const [security, setSecurity] = useState({
    twoFactorAuth: false,
    loginAlerts: true,
  });

  const tabs = [
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'privacy', label: 'Privacy', icon: '🔒' },
    { id: 'security', label: 'Security', icon: '🛡️' },
    { id: 'preferences', label: 'Preferences', icon: '⚙️' },
  ];

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    }, 1000);
  };

  const handleReset = () => {
    setProfile({
      name: 'Intan Permata',
      email: 'intan@example.com',
      phone: '+62 812-3456-7890',
      birthday: '1995-05-15',
      gender: 'female',
      bio: 'Flower enthusiast and gardening lover',
    });
    setNotifications({
      emailPromotions: true,
      emailOrderUpdates: true,
      emailNewsletter: true,
      pushNotifications: true,
      smsUpdates: false,
    });
    setPrivacy({
      showProfile: true,
      showWishlist: true,
      showReviews: true,
      dataCollection: true,
    });
    setSecurity({
      twoFactorAuth: false,
      loginAlerts: true,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <Header />
      
      {/* Breadcrumb */}
      <div className="container mx-auto px-4 py-4">
        <nav className="text-sm text-gray-600">
          <ol className="flex flex-wrap items-center space-x-2">
            <li>
              <Link href="/" className="hover:text-pink-600 transition-colors">Home</Link>
            </li>
            <li className="text-gray-400">/</li>
            <li className="text-pink-600 font-medium">Settings</li>
          </ol>
        </nav>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar */}
            <div className="lg:w-1/4">
              <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-24">
                <div className="mb-8">
                  <h1 className="text-2xl font-bold text-gray-800 mb-2">Settings</h1>
                  <p className="text-gray-600 text-sm">Manage your account preferences</p>
                </div>

                <div className="space-y-1">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center w-full px-4 py-3 rounded-xl transition-colors ${
                        activeTab === tab.id
                          ? 'bg-gradient-to-r from-pink-50 to-purple-50 text-pink-600'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span className="text-lg mr-3">{tab.icon}</span>
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  ))}
                </div>

                {/* Account Stats */}
                <div className="mt-8 pt-8 border-t border-gray-200">
                  <h3 className="font-bold text-gray-800 mb-4">Account Info</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Member Since</span>
                      <span className="font-medium">May 2023</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Orders</span>
                      <span className="font-medium">12</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Wishlist Items</span>
                      <span className="font-medium">5</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:w-3/4">
              <div className="bg-white rounded-2xl shadow-sm p-8">
                {/* Success Message */}
                {saveSuccess && (
                  <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                    <div className="flex items-center">
                      <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white mr-3">
                        ✓
                      </div>
                      <div>
                        <p className="font-medium text-green-800">Settings saved successfully!</p>
                        <p className="text-sm text-green-600">Your changes have been updated.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Profile Tab */}
                {activeTab === 'profile' && (
                  <div>
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-800">Profile Information</h2>
                        <p className="text-gray-600">Update your personal details</p>
                      </div>
                      <div className="w-20 h-20 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                        IP
                      </div>
                    </div>

                    <form className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Full Name
                          </label>
                          <input
                            type="text"
                            value={profile.name}
                            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email Address
                          </label>
                          <input
                            type="email"
                            value={profile.email}
                            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Phone Number
                          </label>
                          <input
                            type="tel"
                            value={profile.phone}
                            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Birthday
                          </label>
                          <input
                            type="date"
                            value={profile.birthday}
                            onChange={(e) => setProfile({ ...profile, birthday: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Gender
                        </label>
                        <div className="flex space-x-4">
                          {['male', 'female', 'other', 'prefer-not-to-say'].map((option) => (
                            <label key={option} className="flex items-center">
                              <input
                                type="radio"
                                name="gender"
                                checked={profile.gender === option}
                                onChange={() => setProfile({ ...profile, gender: option })}
                                className="w-4 h-4 text-pink-600 border-gray-300 focus:ring-pink-500"
                              />
                              <span className="ml-2 text-gray-700 capitalize">
                                {option.replace(/-/g, ' ')}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Bio
                        </label>
                        <textarea
                          value={profile.bio}
                          onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                          rows={3}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                          placeholder="Tell us about yourself..."
                        />
                      </div>
                    </form>
                  </div>
                )}

                {/* Notifications Tab */}
                {activeTab === 'notifications' && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-8">Notification Preferences</h2>
                    
                    <div className="space-y-6">
                      {Object.entries({
                        emailPromotions: 'Promotional emails',
                        emailOrderUpdates: 'Order updates',
                        emailNewsletter: 'Weekly newsletter',
                        pushNotifications: 'Push notifications',
                        smsUpdates: 'SMS updates',
                      }).map(([key, label]) => (
                        <div key={key} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                          <div>
                            <p className="font-medium text-gray-800">{label}</p>
                            <p className="text-sm text-gray-500 mt-1">
                              {key === 'smsUpdates' 
                                ? 'Receive text messages about your orders'
                                : `Receive ${label.toLowerCase()} about our products and services`}
                            </p>
                          </div>
                          <button
                            onClick={() => setNotifications({ 
                              ...notifications, 
                              [key]: !notifications[key as keyof typeof notifications] 
                            })}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              notifications[key as keyof typeof notifications] 
                                ? 'bg-pink-600' 
                                : 'bg-gray-300'
                            }`}
                          >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              notifications[key as keyof typeof notifications] 
                                ? 'translate-x-6' 
                                : 'translate-x-1'
                            }`} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Privacy Tab */}
                {activeTab === 'privacy' && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-8">Privacy Settings</h2>
                    
                    <div className="space-y-6">
                      {Object.entries({
                        showProfile: 'Show my profile to other users',
                        showWishlist: 'Make my wishlist public',
                        showReviews: 'Show my reviews publicly',
                        dataCollection: 'Allow data collection for personalization',
                      }).map(([key, label]) => (
                        <div key={key} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                          <div>
                            <p className="font-medium text-gray-800">{label}</p>
                            <p className="text-sm text-gray-500 mt-1">
                              {key === 'dataCollection'
                                ? 'We use this data to improve your shopping experience'
                                : 'Control who can see this information'}
                            </p>
                          </div>
                          <button
                            onClick={() => setPrivacy({ 
                              ...privacy, 
                              [key]: !privacy[key as keyof typeof privacy] 
                            })}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              privacy[key as keyof typeof privacy] 
                                ? 'bg-pink-600' 
                                : 'bg-gray-300'
                            }`}
                          >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              privacy[key as keyof typeof privacy] 
                                ? 'translate-x-6' 
                                : 'translate-x-1'
                            }`} />
                          </button>
                        </div>
                      ))}

                      <div className="p-4 border border-gray-200 rounded-xl">
                        <h3 className="font-bold text-gray-800 mb-2">Data Export</h3>
                        <p className="text-sm text-gray-600 mb-4">
                          Download a copy of your personal data including order history and preferences.
                        </p>
                        <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                          Request Data Export
                        </button>
                      </div>

                      <div className="p-4 border border-red-200 bg-red-50 rounded-xl">
                        <h3 className="font-bold text-red-800 mb-2">Delete Account</h3>
                        <p className="text-sm text-red-600 mb-4">
                          This action cannot be undone. All your data will be permanently deleted.
                        </p>
                        <button className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm">
                          Delete My Account
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Security Tab */}
                {activeTab === 'security' && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-8">Security Settings</h2>
                    
                    <div className="space-y-6">
                      {/* Change Password */}
                      <div className="p-6 border border-gray-200 rounded-xl">
                        <h3 className="font-bold text-gray-800 mb-4">Change Password</h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Current Password
                            </label>
                            <input
                              type="password"
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                            />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                New Password
                              </label>
                              <input
                                type="password"
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Confirm New Password
                              </label>
                              <input
                                type="password"
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                              />
                            </div>
                          </div>
                          <button className="px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-xl hover:from-pink-700 hover:to-purple-700 transition-all duration-300">
                            Update Password
                          </button>
                        </div>
                      </div>

                      {/* Two-Factor Authentication */}
                      <div className="flex items-center justify-between p-6 border border-gray-200 rounded-xl">
                        <div>
                          <h3 className="font-bold text-gray-800">Two-Factor Authentication</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            Add an extra layer of security to your account
                          </p>
                        </div>
                        <button
                          onClick={() => setSecurity({ ...security, twoFactorAuth: !security.twoFactorAuth })}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            security.twoFactorAuth 
                              ? 'bg-pink-600' 
                              : 'bg-gray-300'
                          }`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            security.twoFactorAuth 
                              ? 'translate-x-6' 
                              : 'translate-x-1'
                          }`} />
                        </button>
                      </div>

                      {/* Login Alerts */}
                      <div className="flex items-center justify-between p-6 border border-gray-200 rounded-xl">
                        <div>
                          <h3 className="font-bold text-gray-800">Login Alerts</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            Get notified when someone logs into your account
                          </p>
                        </div>
                        <button
                          onClick={() => setSecurity({ ...security, loginAlerts: !security.loginAlerts })}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            security.loginAlerts 
                              ? 'bg-pink-600' 
                              : 'bg-gray-300'
                          }`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            security.loginAlerts 
                              ? 'translate-x-6' 
                              : 'translate-x-1'
                          }`} />
                        </button>
                      </div>

                      {/* Active Sessions */}
                      <div className="p-6 border border-gray-200 rounded-xl">
                        <h3 className="font-bold text-gray-800 mb-4">Active Sessions</h3>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Chrome on Windows</p>
                              <p className="text-sm text-gray-500">Jakarta, Indonesia • Current session</p>
                            </div>
                            <button className="text-red-600 hover:text-red-700 text-sm">
                              Logout
                            </button>
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Safari on iPhone</p>
                              <p className="text-sm text-gray-500">Last active 2 days ago</p>
                            </div>
                            <button className="text-red-600 hover:text-red-700 text-sm">
                              Logout
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Preferences Tab */}
                {activeTab === 'preferences' && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-8">Preferences</h2>
                    
                    <div className="space-y-6">
                      <div className="p-6 border border-gray-200 rounded-xl">
                        <h3 className="font-bold text-gray-800 mb-4">Language & Region</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Language
                            </label>
                            <select className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent">
                              <option>English</option>
                              <option>Indonesian</option>
                              <option>Japanese</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Currency
                            </label>
                            <select className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent">
                              <option>USD ($)</option>
                              <option>IDR (Rp)</option>
                              <option>EUR (€)</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="p-6 border border-gray-200 rounded-xl">
                        <h3 className="font-bold text-gray-800 mb-4">Theme Preferences</h3>
                        <div className="flex space-x-4">
                          {['Light', 'Dark', 'System'].map((theme) => (
                            <button
                              key={theme}
                              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              {theme}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="p-6 border border-gray-200 rounded-xl">
                        <h3 className="font-bold text-gray-800 mb-4">Email Frequency</h3>
                        <div className="space-y-3">
                          {['Daily', 'Weekly', 'Monthly', 'Never'].map((frequency) => (
                            <label key={frequency} className="flex items-center">
                              <input
                                type="radio"
                                name="emailFrequency"
                                defaultChecked={frequency === 'Weekly'}
                                className="w-4 h-4 text-pink-600 border-gray-300 focus:ring-pink-500"
                              />
                              <span className="ml-2 text-gray-700">{frequency} updates</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-8 mt-8 border-t border-gray-200">
                  <button
                    onClick={handleReset}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Reset Changes
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-xl font-bold hover:from-pink-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2 inline-block"></div>
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}