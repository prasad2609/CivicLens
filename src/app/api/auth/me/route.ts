import { NextRequest, NextResponse } from 'next/server';
import { serverDb } from '@/lib/server/db';

export async function GET(req: NextRequest) {
  try {
    const userIdFromCookie = req.cookies.get('civiclens_session_user_id')?.value;
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId') || userIdFromCookie || 'user-citizen-1';

    const user = serverDb.findUserById(userId);
    if (!user) {
      return NextResponse.json({ user: null });
    }

    const { password_hash, ...profile } = user;
    return NextResponse.json({ user: profile });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
