import { NextResponse } from 'next/server';
import { serverDb } from '@/lib/server/db';

export async function GET() {
  try {
    const departments = serverDb.getDepartments();
    return NextResponse.json({ departments });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
