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
 * Verifies the HTTP-only session cookie JWT AND that the credential ID
 * in the token maps to a registered admin device in the database.
 */
export async function requireAdminAuth(
  req: NextRequest
): Promise<{ errorResponse?: NextResponse; auth?: AdminAuthResult }> {
  const session = await getAdminSessionFromRequest(req);
  if (!session || !session.credentialId) {
    return {
      errorResponse: NextResponse.json(
        { success: false, error: 'Unauthorized. Admin session required.' },
        { status: 401 }
      ),
    };
  }

  await connectToDatabase();
  const adminDevice = await AdminDevice.findOne({
    credentialId: session.credentialId,
  });

  if (!adminDevice) {
    return {
      errorResponse: NextResponse.json(
        { success: false, error: 'Forbidden. Admin device is not authorized.' },
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
