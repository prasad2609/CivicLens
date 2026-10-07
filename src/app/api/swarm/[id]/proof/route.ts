import { NextRequest, NextResponse } from 'next/server';
import { serverDb } from '@/lib/server/db';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { userId, photoUrl, note, latitude, longitude } = body;

    const user = serverDb.getUsers().find((u) => u.id === userId) || {
      id: userId || 'user-citizen-1',
      full_name: body.userName || 'Civic Volunteer',
      email: 'volunteer@civiclens.gov.in',
      role: 'citizen',
    };

    const mission = serverDb.submitSwarmProof(
      params.id,
      user as any,
      photoUrl,
      note,
      latitude,
      longitude
    );
    return NextResponse.json({ success: true, mission });
  } catch (error: any) {
    console.error('Error submitting swarm proof:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit swarm proof' },
      { status: 400 }
    );
  }
}
