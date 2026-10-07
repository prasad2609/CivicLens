import { NextRequest, NextResponse } from 'next/server';
import { serverDb } from '@/lib/server/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const wardId = searchParams.get('ward_id');

    if (wardId) {
      const genome = serverDb.getConstituencyGenomeByWard(wardId);
      if (!genome) {
        return NextResponse.json({ error: 'Genome not found for ward' }, { status: 404 });
      }
      return NextResponse.json({ genome });
    }

    const genomes = serverDb.getConstituencyGenomes();
    return NextResponse.json({ genomes });
  } catch (error) {
    console.error('Error fetching constituency genome:', error);
    return NextResponse.json(
      { error: 'Failed to fetch constituency genome data' },
      { status: 500 }
    );
  }
}
