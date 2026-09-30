import { NextRequest, NextResponse } from 'next/server';
import { serverDb } from '@/lib/server/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || undefined;
    const notifications = serverDb.getNotifications(userId);
    return NextResponse.json({ notifications, total: notifications.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { notificationId } = body;
    if (!notificationId) {
      return NextResponse.json({ error: 'notificationId is required' }, { status: 400 });
    }
    const updated = serverDb.markNotificationRead(notificationId);
    return NextResponse.json({ success: true, notification: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
