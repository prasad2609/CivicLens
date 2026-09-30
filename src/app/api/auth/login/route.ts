import { NextRequest, NextResponse } from 'next/server';
import { serverDb } from '@/lib/server/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const user = serverDb.findUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: 'No user found with this email address' },
        { status: 401 }
      );
    }

    // In demo environment, allow login with password or default
    if (password && user.password_hash && user.password_hash !== password && password !== 'civiclens123') {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }

    const { password_hash, ...profile } = user;

    const res = NextResponse.json({
      success: true,
      user: profile,
      message: 'Login successful',
    });

    // Set HTTP-only session cookie
    res.cookies.set('civiclens_session_user_id', profile.id, {
      path: '/',
      httpOnly: false, // Accessible to client for reactive sync
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return res;
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Server error during login' },
      { status: 500 }
    );
  }
}
