import { NextRequest, NextResponse } from 'next/server';
import { serverDb } from '@/lib/server/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const wardId = searchParams.get('ward_id') || undefined;
    const assetType = searchParams.get('asset_type') || undefined;

    const assets = serverDb.getAssets({ ward_id: wardId, asset_type: assetType });
    return NextResponse.json({ assets, count: assets.length });
  } catch (error) {
    console.error('Error fetching assets:', error);
    return NextResponse.json({ error: 'Failed to fetch infrastructure assets' }, { status: 500 });
  }
}
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const newAsset = serverDb.createAsset(body);
    return NextResponse.json({ success: true, asset: newAsset }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating asset:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create infrastructure asset' },
      { status: 400 }
    );
  }
}
