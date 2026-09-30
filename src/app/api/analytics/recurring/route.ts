import { NextResponse } from 'next/server';
import { serverDb } from '@/lib/server/db';

export async function GET() {
  try {
    const recurringClusters = serverDb.getRecurringIssues();
    return NextResponse.json({
      clusters: recurringClusters,
      totalClusters: recurringClusters.length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
