import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';

// Add paths that do NOT require authentication
const publicPaths = ['/login', '/api/webhooks', '/api/public'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('auth_token')?.value;

  // Verify token if present
  const payload = token ? await verifyToken(token) : null;

  // 1. If already authenticated and trying to access /login, redirect to homepage
  if (pathname === '/login' && payload) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // 2. Allow access to public paths (for unauthenticated users)
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // 3. Redirect unauthenticated users to /login
  if (!payload) {
    const loginUrl = new URL('/login', request.url);
    const response = NextResponse.redirect(loginUrl);
    if (token) {
      // Clear invalid token cookie if it existed
      response.cookies.delete('auth_token');
    }
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes that we might want to be public, handled inside)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
