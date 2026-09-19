import { NextRequest, NextResponse } from 'next/server';
import { getAdminSessionFromRequest } from './session';
import { connectToDatabase } from '@/lib/mongodb';
import { AdminDevice } from '@/models/AdminDevice';
import { IAdminDeviceDocument } from '@/models/AdminDevice';
import { AdminSessionPayload } from '@/types/admin';

export interface AdminAuthResult {
  session: AdminSessionPayload;
  adminDevice: IAdminDeviceDocument;
}

/**
 * Server-side admin verification.
 * Verifies both the HTTP-only session cookie AND that the bound admin device
 * is registered, active, and enabled in the database.
 */
export async function requireAdminAuth(
  req: NextRequest
): Promise<{ errorResponse?: NextResponse; auth?: AdminAuthResult }> {
  const session = await getAdminSessionFromRequest(req);
  if (!session || !session.deviceId) {
    return {
      errorResponse: NextResponse.json(
        { success: false, error: 'Unauthorized. Admin session required.' },
        { status: 401 }
      ),
    };
  }

  await connectToDatabase();
  const adminDevice = await AdminDevice.findOne({
    deviceId: session.deviceId,
    enabled: true,
  });

  if (!adminDevice) {
    return {
      errorResponse: NextResponse.json(
        { success: false, error: 'Forbidden. Admin device is not authorized or has been disabled.' },
        { status: 403 }
      ),
    };
  }

  return {
    auth: {
      session,
      adminDevice,
    },
  };
}
