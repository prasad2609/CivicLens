import { NextRequest, NextResponse } from 'next/server';
import { serverDb } from '@/lib/server/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const wardId = searchParams.get('ward_id') || 'ward-175';

    const pulse = serverDb.getConstituencyPulse(wardId);
    return NextResponse.json(pulse);
  } catch (error) {
    console.error('Error generating constituency pulse report:', error);
    return NextResponse.json(
      { error: 'Failed to generate constituency pulse briefing' },
      { status: 500 }
    );
  }
}
