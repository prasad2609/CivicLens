import { NextRequest, NextResponse } from 'next/server';
import { serverDb } from '@/lib/server/db';
import { IssueStatus } from '@/types';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const issue = serverDb.getIssueById(params.id);
    if (!issue) {
      return NextResponse.json({ error: 'Complaint record not found.' }, { status: 404 });
    }
    return NextResponse.json({ issue });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { status, note, evidenceUrl, actorId } = body;

    const actor = actorId ? serverDb.findUserById(actorId) : undefined;
    const updated = serverDb.updateIssueStatus(
      params.id,
      status as IssueStatus,
      note,
      actor,
      evidenceUrl
    );

    return NextResponse.json({
      success: true,
      issue: updated,
      message: `Status updated to ${status}.`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
