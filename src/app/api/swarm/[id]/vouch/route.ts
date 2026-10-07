import { NextRequest, NextResponse } from 'next/server';
import { serverDb } from '@/lib/server/db';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const userId = body.userId;

    const user = serverDb.getUsers().find((u) => u.id === userId) || {
      id: userId || 'user-citizen-1',
      full_name: 'Civic Member',
      email: 'member@civiclens.gov.in',
      role: 'citizen',
    };

    const mission = serverDb.vouchSwarmMission(params.id, user as any);
    return NextResponse.json({ success: true, mission });
  } catch (error: any) {
    console.error('Error vouching swarm mission:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to vouch for swarm mission' },
      { status: 400 }
    );
  }
}
