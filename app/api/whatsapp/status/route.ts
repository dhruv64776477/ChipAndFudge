// app/api/whatsapp/status/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey } from '@/lib/whatsapp/auth';
import { getConnectionStatus } from '@/lib/whatsapp/client';
import { ensureWhatsAppConnected } from '@/lib/whatsapp/connection';

export async function GET(req: NextRequest) {
  const authError = validateApiKey(req);
  if (authError) return authError;

  await ensureWhatsAppConnected();

  return NextResponse.json({
    success: true,
    status: getConnectionStatus(),
  });
}
