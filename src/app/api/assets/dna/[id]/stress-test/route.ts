import { NextRequest, NextResponse } from 'next/server';
import { serverDb } from '@/lib/server/db';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const updated = serverDb.simulateAssetStress(params.id);
    return NextResponse.json({ success: true, asset: updated });
  } catch (error: any) {
    console.error('Error running stress simulation:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to run asset stress simulation' },
      { status: 400 }
    );
  }
}
