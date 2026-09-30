import { NextResponse } from 'next/server';
import { serverDb } from '@/lib/server/db';

export async function GET() {
  try {
    const analytics = serverDb.getConstituencyAnalytics();
    return NextResponse.json({ analytics });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
