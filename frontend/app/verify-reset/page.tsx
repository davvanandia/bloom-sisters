'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

function VerifyResetContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  const [formData, setFormData] = useState({
    email,
    code: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    setFormData(prev => ({ ...prev, email }));
  }, [email]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${API_URL}/auth/verify-reset-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          token: formData.code,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      setVerified(true);
      setSuccess('Code verified successfully!');
      
      // Redirect ke halaman reset password
      setTimeout(() => {
        router.push(`/reset-password?email=${encodeURIComponent(formData.email)}&token=${formData.code}`);
      }, 1000);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Verify Reset Code
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter the 6-digit code sent to your email
          </p>
          {email && (
            <p className="mt-1 text-center text-sm text-pink-600">
              {email}
            </p>
          )}
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleVerify}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="mt-1 appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-pink-500 focus:border-pink-500 focus:z-10 sm:text-sm"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                Verification Code
              </label>
              <input
                id="code"
                name="code"
                type="text"
                required
                maxLength={6}
                pattern="[0-9]{6}"
                value={formData.code}
                onChange={handleChange}
                className="mt-1 appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-pink-500 focus:border-pink-500 focus:z-10 sm:text-sm"
                placeholder="Enter 6-digit code"
              />
              <p className="mt-1 text-xs text-gray-500">
                6-digit code sent to your email
              </p>
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">
              {error}
            </div>
          )}

          {success && (
            <div className="text-green-600 text-sm text-center">
              {success}
              {verified && (
                <p className="mt-1 text-gray-600 text-xs">
                  Redirecting to reset password...
                </p>
              )}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading || verified}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white ${
                loading || verified ? 'bg-pink-400' : 'bg-pink-600 hover:bg-pink-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition duration-300`}
            >
              {loading ? 'Verifying...' : verified ? 'Verified!' : 'Verify Code'}
            </button>
          </div>

          <div className="text-center">
            <Link
              href="/login"
              className="font-medium text-pink-600 hover:text-pink-500"
            >
              Back to login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function VerifyResetPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-lg">
          <div className="text-center">
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Verify Reset Code
            </h2>
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pink-600"></div>
            </div>
            <p className="text-sm text-gray-600">Loading verification form...</p>
          </div>
        </div>
      </div>
    }>
      <VerifyResetContent />
    </Suspense>
  );
}