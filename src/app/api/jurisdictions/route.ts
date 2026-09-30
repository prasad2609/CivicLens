import { NextResponse } from 'next/server';
import { serverDb } from '@/lib/server/db';

export async function GET() {
  try {
    const jurisdictions = serverDb.getJurisdictions();
    return NextResponse.json({ jurisdictions });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
