import { NextRequest, NextResponse } from 'next/server';
import { serverDb } from '@/lib/server/db';

export async function GET(req: NextRequest) {
  try {
    const missions = serverDb.getSwarmMissions();
    return NextResponse.json({ missions, count: missions.length });
  } catch (error) {
    console.error('Error fetching swarm missions:', error);
    return NextResponse.json({ error: 'Failed to fetch swarm missions' }, { status: 500 });
  }
}
