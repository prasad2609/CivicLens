import { NextResponse } from 'next/server';
import { serverDb } from '@/lib/server/db';

export async function GET() {
  try {
    const projects = serverDb.getProjects();
    return NextResponse.json({ projects, total: projects.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
