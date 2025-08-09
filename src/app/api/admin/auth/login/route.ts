import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { adminLoginSchema } from '@/lib/validations';
import { createApiResponse, createApiError, getErrorMessage } from '@/lib/utils';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedData = adminLoginSchema.parse(body);
    const { email, password } = validatedData;

    // Find admin in database
    const admin = await db.admin.findUnique({
      where: { email }
    });

    if (!admin) {
      return NextResponse.json(
        createApiError('Invalid email or password', 401),
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    
    if (!isPasswordValid) {
      return NextResponse.json(
        createApiError('Invalid email or password', 401),
        { status: 401 }
      );
    }

    // Create JWT token
    const token = await new SignJWT({ 
      id: admin.id,
      email: admin.email,
      role: 'admin',
      iat: Math.floor(Date.now() / 1000)
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d') // Token expires in 7 days
      .sign(JWT_SECRET);

    // Set HTTP-only cookie
    const response = NextResponse.json(
      createApiResponse({ 
        message: 'Login successful',
        user: { id: admin.id, email: admin.email, role: 'admin' }
      })
    );

    response.cookies.set('admin-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/'
    });

    return response;

  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      createApiError(getErrorMessage(error), 500),
      { status: 500 }
    );
  }
}
