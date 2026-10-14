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

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (body.action === 'issue_penalty') {
      const res = serverDb.issueContractorPenaltyNotice(
        body.clusterKey,
        body.penaltyAmount,
        body.reason
      );
      return NextResponse.json({ success: true, ...res });
    } else if (body.action === 'convert_to_project' || body.action === 'sanction_project') {
      const newProj = await serverDb.convertClusterToCapitalProject(
        body.clusterKey,
        body.title,
        body.budget,
        body.departmentId
      );
      return NextResponse.json({ success: true, project: newProj }, { status: 201 });
    }
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    console.error('Error handling recurring action:', err);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
