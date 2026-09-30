import { NextResponse } from 'next/server';
import { serverDb } from '@/lib/server/db';

export async function GET() {
  try {
    const auditLogs = serverDb.getAuditLogs();
    return NextResponse.json({ auditLogs, total: auditLogs.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
