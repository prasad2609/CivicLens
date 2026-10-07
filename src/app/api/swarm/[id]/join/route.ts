import { NextRequest, NextResponse } from 'next/server';
import { serverDb } from '@/lib/server/db';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const userId = body.userId;
    const role = body.role || 'volunteer';

    const user = serverDb.getUsers().find((u) => u.id === userId) || {
      id: userId || 'user-citizen-1',
      full_name: body.userName || 'Civic Volunteer',
      email: 'volunteer@civiclens.gov.in',
      role: 'citizen',
    };

    const mission = serverDb.joinSwarmMission(params.id, user as any, role);
    return NextResponse.json({ success: true, mission });
  } catch (error: any) {
    console.error('Error joining swarm mission:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to join swarm mission' },
      { status: 400 }
    );
  }
}
