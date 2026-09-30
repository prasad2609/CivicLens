import { NextRequest, NextResponse } from 'next/server';
import { serverDb } from '@/lib/server/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { full_name, email, password, phone, role, preferred_language, area } = body;

    if (!full_name || !email) {
      return NextResponse.json(
        { error: 'Full name and email are required.' },
        { status: 400 }
      );
    }

    const newUser = serverDb.createUser({
      full_name,
      email,
      password: password || 'civiclens123',
      phone,
      role: role || 'citizen',
      preferred_language: preferred_language || 'en',
      area,
    });

    const res = NextResponse.json({
      success: true,
      user: newUser,
      message: 'Account registered successfully',
    });

    res.cookies.set('civiclens_session_user_id', newUser.id, {
      path: '/',
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Registration failed' },
      { status: 400 }
    );
  }
}
