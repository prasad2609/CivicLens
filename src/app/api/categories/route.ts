import { NextResponse } from 'next/server';
import { serverDb } from '@/lib/server/db';

export async function GET() {
  try {
    const categories = serverDb.getCategories();
    return NextResponse.json({ categories });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
