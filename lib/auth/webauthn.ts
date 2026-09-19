import { NextRequest } from 'next/server';

export function getWebAuthnConfig(req?: NextRequest | Request) {
  let rpID = process.env.WEBAUTHN_RP_ID || 'localhost';
  let origin = process.env.WEBAUTHN_ORIGIN || 'http://localhost:3000';
  const rpName = process.env.WEBAUTHN_RP_NAME || 'The Chip & Fudge';

  if (req) {
    const url = new URL(req.url);
    const hostHeader = req.headers.get('host') || url.host;
    const originHeader = req.headers.get('origin');

    if (originHeader) {
      origin = originHeader;
      try {
        const originUrl = new URL(originHeader);
        // If origin is not an IP, we can use its hostname as rpID
        const isIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(originUrl.hostname);
        if (!isIp) {
          rpID = originUrl.hostname;
        }
      } catch {
        // fallback
      }
    } else if (hostHeader) {
      const hostname = hostHeader.split(':')[0];
      const isIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname);
      if (!isIp) {
        rpID = hostname;
      }
      const proto = req.headers.get('x-forwarded-proto') || url.protocol.replace(':', '');
      origin = `${proto}://${hostHeader}`;
    }
  }

  return { rpName, rpID, origin };
}
