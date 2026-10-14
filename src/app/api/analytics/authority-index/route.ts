import { NextRequest, NextResponse } from 'next/server';
import { serverDb } from '@/lib/server/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const officer_id = searchParams.get('officer_id') || undefined;
    const department_id = searchParams.get('department_id') || undefined;
    const promotion_status = searchParams.get('promotion_status') || undefined;

    const data = serverDb.getAuthorityPerformanceIndex({
      officer_id,
      department_id,
      promotion_status,
    });
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching authority performance index:', error);
    return NextResponse.json(
      { error: 'Failed to calculate authority performance index' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { officerId, actionType, remarks } = await req.json();
    const updated = serverDb.recordOfficerAppraisalAction(officerId, actionType, remarks);
    return NextResponse.json({ success: true, officer: updated });
  } catch (error: any) {
    console.error('Error executing DPC promotion action:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to execute DPC promotion action' },
      { status: 400 }
    );
  }
}
