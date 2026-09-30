import { NextRequest, NextResponse } from 'next/server';
import { serverDb } from '@/lib/server/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const project = serverDb.getProjectById(params.id);
    if (!project) {
      return NextResponse.json({ error: 'Project record not found.' }, { status: 404 });
    }
    return NextResponse.json({ project });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
