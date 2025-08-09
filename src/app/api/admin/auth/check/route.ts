import { NextRequest, NextResponse } from 'next/server';
import { checkIsAdmin } from '@/lib/auth';
import { createApiResponse, createApiError } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const admin = await checkIsAdmin(request);

    if (!admin) {
      return NextResponse.json(
        createApiError('Not authenticated', 401),
        { status: 401 }
      );
    }

    return NextResponse.json(
      createApiResponse({
        message: 'Authenticated',
        user: {
          id: admin.id,
          email: admin.email,
          role: admin.role
        }
      })
    );

  } catch (error) {
    console.error('Auth check failed:', error);
    return NextResponse.json(
      createApiError('Authentication check failed', 500),
      { status: 500 }
    );
  }
}
