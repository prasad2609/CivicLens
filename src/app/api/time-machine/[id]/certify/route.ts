import { NextRequest, NextResponse } from 'next/server';
import { serverDb } from '@/lib/server/db';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json().catch(() => ({}));
    const updated = serverDb.certifyTimeMachineDurability(params.id, body.certifierName);
    return NextResponse.json({ success: true, record: updated });
  } catch (error: any) {
    console.error('Error certifying time machine durability:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to certify time machine durability' },
      { status: 400 }
    );
  }
}
