import { NextResponse } from 'next/server';
import { serverDb } from '@/lib/server/db';

export async function POST() {
  try {
    serverDb.resetDatabase();
    return NextResponse.json({
      success: true,
      message: 'Server database reset to clean demonstration seed state.',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
