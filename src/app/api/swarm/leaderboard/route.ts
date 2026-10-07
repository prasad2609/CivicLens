import { NextRequest, NextResponse } from 'next/server';
import { serverDb } from '@/lib/server/db';

export async function GET(req: NextRequest) {
  try {
    const leaderboard = serverDb.getVolunteerLeaderboard();
    return NextResponse.json({ leaderboard, count: leaderboard.length });
  } catch (error) {
    console.error('Error fetching volunteer leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch volunteer leaderboard' },
      { status: 500 }
    );
  }
}
