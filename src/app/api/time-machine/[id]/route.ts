import { NextRequest, NextResponse } from 'next/server';
import { serverDb } from '@/lib/server/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const record = serverDb.getTimeMachineRecordById(params.id);
    if (!record) {
      return NextResponse.json({ error: 'Time machine record not found' }, { status: 404 });
    }
    return NextResponse.json({ record });
  } catch (error) {
    console.error('Error fetching time machine record:', error);
    return NextResponse.json({ error: 'Failed to fetch time machine record' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const updated = serverDb.addTimeMachineSnapshot(params.id, body);
    return NextResponse.json({ success: true, record: updated });
  } catch (error: any) {
    console.error('Error adding snapshot:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add snapshot' },
      { status: 400 }
    );
  }
}
