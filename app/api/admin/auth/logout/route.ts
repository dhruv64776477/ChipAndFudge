import { NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME } from '@/lib/auth';

export async function POST() {
  const res = NextResponse.json({ success: true, message: 'Logged out successfully.' });
  res.cookies.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    maxAge: 0,
    path: '/',
  });
  return res;
}
