import { NextResponse } from 'next/server';
import { createApiResponse } from '@/lib/utils';

export async function POST() {
  try {
    const response = NextResponse.json(
      createApiResponse({ message: 'Logout successful' })
    );

    // Clear the admin token cookie
    response.cookies.set('admin-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // Expire immediately
      path: '/'
    });

    return response;

  } catch (error) {
    console.error('Admin logout error:', error);
    return NextResponse.json(
      { success: false, message: 'Logout failed' },
      { status: 500 }
    );
  }
}
