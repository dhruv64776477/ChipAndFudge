import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SESSION_COOKIE_NAME } from '@/lib/auth/constants';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminPath = pathname.startsWith('/admin');
  const isAdminApiPath = pathname.startsWith('/api/admin');

  // Public auth & setup routes
  const isAuthPage =
    pathname === '/admin/login' ||
    pathname === '/admin/setup' ||
    pathname.startsWith('/api/admin/auth');

  if ((isAdminPath || isAdminApiPath) && !isAuthPage) {
    const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionCookie) {
      if (isAdminApiPath) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized. Admin session cookie required.' },
          { status: 401 }
        );
      }
      const loginUrl = new URL('/admin/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
