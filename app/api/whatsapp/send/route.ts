// app/api/whatsapp/send/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey } from '@/lib/whatsapp/auth';
import { sendWhatsAppMessage } from '@/lib/whatsapp/sender';

export async function POST(req: NextRequest) {
  const authError = validateApiKey(req);
  if (authError) return authError;

  let body: { phone?: string; message?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const { phone, message } = body;
  if (!phone || !message) {
    return NextResponse.json(
      { success: false, error: 'phone and message are required fields' },
      { status: 400 }
    );
  }

  const result = await sendWhatsAppMessage(phone, message);

  if (!result.success) {
    return NextResponse.json(
      { success: false, error: result.error },
      { status: result.status || 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: 'WhatsApp message sent',
    jobId: result.jobId,
    messageId: result.messageId,
  });
}
