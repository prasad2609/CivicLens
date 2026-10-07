import { NextRequest, NextResponse } from 'next/server';
import { serverDb } from '@/lib/server/db';

export async function GET(req: NextRequest) {
  try {
    const data = serverDb.getAuthorityPerformanceIndex();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching authority performance index:', error);
    return NextResponse.json(
      { error: 'Failed to calculate authority performance index' },
      { status: 500 }
    );
  }
}
