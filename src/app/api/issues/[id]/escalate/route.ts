import { NextRequest, NextResponse } from 'next/server';
import { serverDb } from '@/lib/server/db';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { reason, details, citizenId } = body;

    if (!reason) {
      return NextResponse.json(
        { error: 'Escalation reason is required.' },
        { status: 400 }
      );
    }

    const citizen = citizenId ? serverDb.findUserById(citizenId) : undefined;
    const updated = serverDb.escalateIssue(params.id, reason, details, citizen);

    return NextResponse.json({
      success: true,
      issue: updated,
      message: 'Complaint successfully escalated to Zonal Municipal Commissioner.',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
