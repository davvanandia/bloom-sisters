'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function NotFound() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <div className="max-w-2xl mx-auto text-center">
        {/* Animated Flower */}
        <div className="relative mb-8">
          <div className="w-48 h-48 mx-auto">
            <div className="absolute inset-0 bg-gradient-to-br from-pink-400 to-purple-600 rounded-full opacity-20 animate-pulse"></div>
            <div className="absolute inset-8 bg-gradient-to-br from-pink-300 to-purple-500 rounded-full opacity-30 animate-pulse delay-150"></div>
            <div className="absolute inset-16 flex items-center justify-center">
              <div className="text-6xl animate-bounce">🌸</div>
            </div>
          </div>
        </div>

        {/* Error Code */}
        <div className="mb-6">
          <div className="inline-flex items-center px-6 py-2 rounded-full bg-gradient-to-r from-pink-100 to-purple-100 mb-4">
            <span className="text-sm font-medium text-pink-600">ERROR 404</span>
          </div>
          <h1 className="text-6xl md:text-7xl font-bold text-gray-800 mb-4">Page Not Found</h1>
          <p className="text-gray-600 text-lg">
            Oops! The page you're looking for seems to have wilted away...
          </p>
        </div>

        {/* Description */}
        <div className="bg-white rounded-2xl shadow-sm p-8 mb-8">
          <p className="text-gray-700 mb-6">
            Don't worry, it happens to the best of us. The page may have been moved, deleted, 
            or perhaps you mistyped the URL. Let's get you back to blooming beautiful content!
          </p>
          
          <div className="flex items-center justify-center text-sm text-gray-500 mb-4">
            <svg className="w-4 h-4 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Redirecting to homepage in {countdown} seconds...
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="px-8 py-4 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-xl font-bold hover:from-pink-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            <svg className="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Back to Home
          </Link>
          
          <Link
            href="/shop"
            className="px-8 py-4 border-2 border-pink-600 text-pink-600 rounded-xl font-bold hover:bg-pink-50 transition-all duration-300"
          >
            <svg className="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Browse Flowers
          </Link>
          
          <button
            onClick={() => router.back()}
            className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all duration-300"
          >
            <svg className="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Go Back
          </button>
        </div>

        {/* Help Section */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-gray-600 mb-4">Still lost? Here are some helpful links:</p>
          <div className="flex flex-wrap justify-center gap-4">
            {[
              { href: '/contact', label: 'Contact Support' },
              { href: '/faq', label: 'FAQ' },
              { href: '/sitemap', label: 'Sitemap' },
              { href: '/shop', label: 'Shop All' },
            ].map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-pink-600 hover:text-pink-700 font-medium text-sm"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Decorative Flowers */}
        <div className="mt-12 flex justify-center space-x-8 text-3xl opacity-20">
          <span className="animate-bounce delay-100">🌺</span>
          <span className="animate-bounce delay-200">🌹</span>
          <span className="animate-bounce delay-300">🌼</span>
          <span className="animate-bounce delay-400">🌻</span>
          <span className="animate-bounce delay-500">🌸</span>
        </div>
      </div>
    </div>
  );
}