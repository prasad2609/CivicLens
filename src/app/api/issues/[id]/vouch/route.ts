import { NextRequest, NextResponse } from 'next/server';
import { serverDb } from '@/lib/server/db';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await serverDb.ensureHydrated();
    const body = await req.json();
    const userId = body.userId;
    const comment = body.comment;

    const user = serverDb.getUsers().find((u) => u.id === userId) || {
      id: userId || 'user-citizen-1',
      full_name: 'Community Member',
      email: 'member@civiclens.gov.in',
      role: 'citizen',
    };

    const updated = await serverDb.vouchIssueResolution(params.id, user as any, comment);
    return NextResponse.json({ success: true, issue: updated });
  } catch (error: any) {
    console.error('Error vouching issue resolution:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit community vouch' },
      { status: 400 }
    );
  }
}
