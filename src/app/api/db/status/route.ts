import { NextResponse } from 'next/server';
import { testPgConnection, isPgConfigured } from '@/lib/server/pgPool';

export async function GET() {
  try {
    const dbStatus = await testPgConnection();
    return NextResponse.json({
      success: dbStatus.connected,
      mode: process.env.DATABASE_MODE || (isPgConfigured ? 'supabase' : 'local'),
      ...dbStatus,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Database status check failed',
      },
      { status: 500 }
    );
  }
}
