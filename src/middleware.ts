import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production');

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for public routes and API routes that don't need auth
  if (
    pathname.startsWith('/api/quiz') || // Public quiz API
    pathname.startsWith('/quiz/') || // Public quiz pages
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname === '/admin/login' ||
    pathname === '/api/admin/auth/login' // Allow access to login page
  ) {
    return NextResponse.next();
  }

  // Protect admin routes
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    const token = request.cookies.get('admin-token')?.value;

    if (!token) {
      // Redirect to login if no token
      if (pathname.startsWith('/admin')) {
        return NextResponse.redirect(new URL('/admin/login', request.url));
      }
      // Return 401 for API routes
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    try {
      // Verify JWT token
      const { payload } = await jwtVerify(token, JWT_SECRET);
      
      if (payload.role !== 'admin') {
        throw new Error('Invalid role');
      }

      // Token is valid, continue
      return NextResponse.next();
    } catch (error) {
      console.error('JWT verification failed:', error);
      
      // Clear invalid token
      const response = pathname.startsWith('/admin')
        ? NextResponse.redirect(new URL('/admin/login', request.url))
        : NextResponse.json(
            { success: false, message: 'Invalid token' },
            { status: 401 }
          );

      response.cookies.set('admin-token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0,
        path: '/'
      });

      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
