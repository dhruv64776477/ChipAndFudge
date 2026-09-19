'use client';

import { useState, useEffect } from 'react';
import QRCode from 'qrcode';

interface TicketQRCodeProps {
  url: string;
  size?: number;
}

export default function TicketQRCode({ url, size = 260 }: TicketQRCodeProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!url) return;
    QRCode.toDataURL(url, {
      width: size,
      margin: 2,
      color: {
        dark: '#1e130c',
        light: '#ffffff',
      },
    })
      .then(setDataUrl)
      .catch((e) => console.error('QR generation error:', e));
  }, [url, size]);

  if (!dataUrl) {
    return (
      <div
        style={{ width: size, height: size }}
        className="mx-auto rounded-2xl bg-[#26160d] border border-[#3f2516] flex items-center justify-center animate-pulse"
      >
        <span className="text-xs text-amber-500 font-bold">Generating QR...</span>
      </div>
    );
  }

  return (
    <div className="bg-white p-3.5 rounded-2xl inline-block shadow-xl border-4 border-amber-950/30">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={dataUrl} alt="Order QR Code" className="mx-auto rounded-lg" style={{ width: size, height: size }} />
    </div>
  );
}
