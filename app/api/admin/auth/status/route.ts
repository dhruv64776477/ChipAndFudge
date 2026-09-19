import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { AdminDevice } from '@/models/AdminDevice';
import { requireAdminAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const deviceCount = await AdminDevice.countDocuments();
    const isConfigured = deviceCount > 0;

    const session = await requireAdminAuth(req);
    const isAuthenticated = !!session;

    return NextResponse.json({
      isConfigured,
      isAuthenticated,
    });
  } catch (error: unknown) {
    console.error('Status check error:', error);
    const message = error instanceof Error ? error.message : 'Status check failed';
    return NextResponse.json({ error: message, isConfigured: false, isAuthenticated: false }, { status: 500 });
  }
}
