import { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production');

export interface AdminUser {
  id: string;
  email: string;
  role: 'admin';
  iat: number;
}

/**
 * Verify admin authentication from JWT token in cookies
 */
export async function verifyAdminAuth(): Promise<AdminUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin-token')?.value;

    if (!token) {
      return null;
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    
    if (payload.role !== 'admin' || !payload.id || !payload.email) {
      return null;
    }

    return {
      id: payload.id as string,
      email: payload.email as string,
      role: 'admin',
      iat: payload.iat as number
    };
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

/**
 * Check if user is authenticated admin (for API routes)
 */
export async function checkIsAdmin(request?: NextRequest): Promise<AdminUser | null> {
  try {
    let token: string | undefined;

    if (request) {
      // For API routes - get token from request cookies
      token = request.cookies.get('admin-token')?.value;
    } else {
      // For server components - get token from cookies()
      const cookieStore = await cookies();
      token = cookieStore.get('admin-token')?.value;
    }

    if (!token) {
      return null;
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    
    if (payload.role !== 'admin' || !payload.id || !payload.email) {
      return null;
    }

    return {
      id: payload.id as string,
      email: payload.email as string,
      role: 'admin',
      iat: payload.iat as number
    };
  } catch (error) {
    console.error('Admin auth check failed:', error);
    return null;
  }
}

/**
 * Middleware function to protect admin API routes
 */
export async function requireAdmin(request: NextRequest) {
  const admin = await checkIsAdmin(request);
  
  if (!admin) {
    throw new Error('Unauthorized: Admin access required');
  }
  
  return admin;
}
