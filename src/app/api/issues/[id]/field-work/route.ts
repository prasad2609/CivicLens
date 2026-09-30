import { NextRequest, NextResponse } from 'next/server';
import { serverDb } from '@/lib/server/db';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { notes, photoDataUrl, isCompleted, workerId } = body;

    if (!notes) {
      return NextResponse.json(
        { error: 'Field notes are required.' },
        { status: 400 }
      );
    }

    const worker = workerId ? serverDb.findUserById(workerId) : undefined;
    const updated = serverDb.submitFieldWork(
      params.id,
      notes,
      photoDataUrl,
      Boolean(isCompleted),
      worker
    );

    return NextResponse.json({
      success: true,
      issue: updated,
      message: isCompleted
        ? 'Field work marked completed and sent for review.'
        : 'Field progress updated successfully.',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
