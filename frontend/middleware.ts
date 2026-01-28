//frontend/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Cek token dari cookies
  const token = request.cookies.get('token')?.value;
  const userCookie = request.cookies.get('user')?.value;
  
  let userRole = null;
  let isAdmin = false;
  
  // Parse user data dari cookie
  if (userCookie) {
    try {
      const userData = JSON.parse(decodeURIComponent(userCookie));
      userRole = userData.role;
      isAdmin = userRole === 'ADMIN' || userRole === 'SUPERADMIN';
    } catch (error) {
      console.error('Error parsing user cookie:', error);
    }
  }

  const pathname = request.nextUrl.pathname;
  
  // Debug logging
  console.log('🔍 Middleware:', {
    pathname,
    hasToken: !!token,
    userRole,
    isAdmin
  });

  // 🔴 BLOCK: Non-admin trying to access dashboard
  if (pathname.startsWith('/dashboard')) {
    if (!token) {
      console.log('❌ No token, redirecting to login');
      return NextResponse.redirect(new URL('/login', request.url));
    }

    if (!isAdmin) {
      console.log('❌ Not admin, redirecting to home');
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // 🟢 REDIRECT: Admin already logged in - trying to access home page
  if (token && isAdmin && pathname === '/') {
    console.log('🔄 Admin accessing home, redirecting to dashboard');
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 🟢 REDIRECT: Already logged in - trying to access login/register
  if (token && (pathname === '/login' || pathname === '/register')) {
    const redirectPath = isAdmin ? '/dashboard' : '/';
    console.log(`🔄 Already logged in, redirecting to ${redirectPath}`);
    return NextResponse.redirect(new URL(redirectPath, request.url));
  }

  // 🟢 REDIRECT: Admin accessing any non-dashboard page (except public pages)
  const publicPages = ['/', '/about', '/contact', '/products'];
  if (token && isAdmin && !publicPages.includes(pathname) && !pathname.startsWith('/dashboard')) {
    console.log('🔄 Admin accessing non-dashboard page, redirecting to dashboard');
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/dashboard/:path*',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/verify-reset',
    '/profile/:path*',
    '/settings/:path*',
    '/orders/:path*',
    '/products/:path*'
  ],
};