// lib/whatsapp/auth.ts
//
// Authentication helper for WhatsApp API routes in Next.js.
// Validates: Authorization: Bearer <WHATSAPP_API_KEY | API_KEY>

import { NextRequest, NextResponse } from 'next/server';

export function validateApiKey(req: NextRequest): NextResponse | null {
  const apiKey = process.env.WHATSAPP_API_KEY || process.env.API_KEY;

  if (!apiKey || apiKey === 'change-this-secret') {
    console.warn(
      '[auth] WARNING: WHATSAPP_API_KEY is not set to a real secret. Set a strong WHATSAPP_API_KEY in .env.local.'
    );
  }

  const authHeader = req.headers.get('authorization') || '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return NextResponse.json(
      {
        success: false,
        error: 'Missing or malformed Authorization header. Expected: Bearer <API_KEY>',
      },
      { status: 401 }
    );
  }

  if (apiKey && token !== apiKey) {
    return NextResponse.json({ success: false, error: 'Invalid API key' }, { status: 401 });
  }

  return null; // Authentication successful
}
