import { NextRequest, NextResponse } from 'next/server';
import { serverDb } from '@/lib/server/db';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { officialNote, proofPhotoUrl, officerId } = body;

    if (!officialNote) {
      return NextResponse.json(
        { error: 'Official resolution notes are required.' },
        { status: 400 }
      );
    }

    const officer = officerId ? serverDb.findUserById(officerId) : undefined;
    const updated = serverDb.updateIssueStatus(
      params.id,
      'resolved',
      officialNote,
      officer,
      proofPhotoUrl
    );

    return NextResponse.json({
      success: true,
      issue: updated,
      message: 'Work marked resolved. Notification dispatched to citizen for verification.',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
