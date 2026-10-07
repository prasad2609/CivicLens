import { NextRequest, NextResponse } from 'next/server';
import { serverDb } from '@/lib/server/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const issueId = searchParams.get('issue_id');

    if (issueId) {
      const record = serverDb.getTimeMachineRecordByIssueId(issueId);
      return NextResponse.json({ record });
    }

    const records = serverDb.getTimeMachineRecords();
    return NextResponse.json({ records, count: records.length });
  } catch (error) {
    console.error('Error fetching time machine records:', error);
    return NextResponse.json({ error: 'Failed to fetch time machine records' }, { status: 500 });
  }
}
