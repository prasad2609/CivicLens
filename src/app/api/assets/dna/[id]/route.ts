import { NextRequest, NextResponse } from 'next/server';
import { serverDb } from '@/lib/server/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const asset = serverDb.getAssetById(params.id);
    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }
    return NextResponse.json({ asset });
  } catch (error) {
    console.error('Error fetching asset by id:', error);
    return NextResponse.json({ error: 'Failed to fetch asset' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const updated = serverDb.addAssetRepair(params.id, body);
    return NextResponse.json({ success: true, asset: updated });
  } catch (error: any) {
    console.error('Error adding asset repair:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add repair record' },
      { status: 400 }
    );
  }
}
