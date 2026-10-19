import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const token = request.cookies.get('admin_token')?.value;
  const { pathname } = request.nextUrl;

  const isLoginPage = pathname === '/login';

  const protectedRoutes = [
    '/dashboard',
    '/users',
    '/verifications',
    '/orders',
    '/disputes',
    '/reviews',
    '/analytics',
    '/notifications',
    '/activity-logs',
    '/settings',
    '/profile',
  ];

  const isProtectedRoute =
    protectedRoutes.some((route) => pathname.startsWith(route)) ||
    pathname === '/';

  if (!token && isProtectedRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (token && isLoginPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/users/:path*',
    '/verifications/:path*',
    '/orders/:path*',
    '/disputes/:path*',
    '/reviews/:path*',
    '/analytics/:path*',
    '/notifications/:path*',
    '/activity-logs/:path*',
    '/settings/:path*',
    '/profile/:path*',
    '/login',
    '/',
  ],
};
