import { NextRequest, NextResponse } from 'next/server';
import { serverDb } from '@/lib/server/db';
import { VerificationResult } from '@/types';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { result, comment, newEvidenceUrl, citizenId } = body;

    if (!result) {
      return NextResponse.json(
        { error: 'Verification result is required (completely_resolved, partially_resolved, or not_resolved).' },
        { status: 400 }
      );
    }

    const citizen = citizenId ? serverDb.findUserById(citizenId) : undefined;
    const updated = serverDb.verifyResolution(
      params.id,
      result as VerificationResult,
      comment || '',
      newEvidenceUrl,
      citizen
    );

    return NextResponse.json({
      success: true,
      issue: updated,
      message:
        result === 'completely_resolved'
          ? 'Complaint verified and officially closed.'
          : 'Complaint verified as unresolved and reopened for corrective work.',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
