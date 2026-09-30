import { NextResponse } from 'next/server';

export async function POST() {
  const res = NextResponse.json({ success: true, message: 'Logged out successfully' });
  res.cookies.delete('civiclens_session_user_id');
  return res;
}
