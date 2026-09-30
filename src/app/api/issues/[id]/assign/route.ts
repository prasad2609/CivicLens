import { NextRequest, NextResponse } from 'next/server';
import { serverDb } from '@/lib/server/db';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const workerId = body.workerId || body.fieldWorkerId;
    const { note, officerId } = body;

    if (!workerId) {
      return NextResponse.json(
        { error: 'Field worker ID is required for assignment.' },
        { status: 400 }
      );
    }

    const officer = officerId ? serverDb.findUserById(officerId) : undefined;
    const updated = serverDb.assignFieldWorker(params.id, workerId, note, officer);

    return NextResponse.json({
      success: true,
      issue: updated,
      message: `Field technician assigned and dispatched successfully.`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
