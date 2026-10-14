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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (body.action === 'update_status') {
      const ok = serverDb.updateActionItemStatus(body.wardId, body.itemIndex, body.newStatus);
      return NextResponse.json({ success: ok });
    } else if (body.action === 'add_item') {
      const ok = serverDb.addActionItem(body.wardId, body.itemText);
      return NextResponse.json({ success: ok });
    }
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error updating pulse action items:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
