import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { AdminDevice } from '@/models/AdminDevice';
import { getAdminSessionFromRequest } from '@/lib/auth/session';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const registeredDevice = await AdminDevice.findOne({ enabled: true }).select('name deviceId createdAt').lean();
    const isConfigured = !!registeredDevice;

    const session = await getAdminSessionFromRequest(req);
    const isAuthenticated = !!(session && session.deviceId);

    return NextResponse.json({
      isConfigured,
      isAuthenticated,
      deviceName: registeredDevice?.name || null,
      deviceId: session?.deviceId || null,
    });
  } catch (error: unknown) {
    console.error('Session check error:', error);
    const message = error instanceof Error ? error.message : 'Session check failed';
    return NextResponse.json({ error: message, isConfigured: false, isAuthenticated: false }, { status: 500 });
  }
}
