import { NextRequest, NextResponse } from 'next/server';
import { serverDb } from '@/lib/server/db';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: 'Email address is required' }, { status: 400 });
    }

    const user = serverDb.findUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: 'No registered user found with this email' },
        { status: 404 }
      );
    }

    // In demo environment, simulate sending reset link
    return NextResponse.json({
      success: true,
      message: `Password reset instructions have been dispatched to ${email}.`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
