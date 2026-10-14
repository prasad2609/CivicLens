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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const newMission = serverDb.createSwarmMission(body);
    return NextResponse.json({ success: true, mission: newMission }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating swarm mission:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to launch swarm mission' },
      { status: 400 }
    );
  }
}
