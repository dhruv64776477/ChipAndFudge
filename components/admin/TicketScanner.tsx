'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, AlertCircle, RefreshCw } from 'lucide-react';

interface TicketScannerProps {
  onScan: (token: string) => void;
  paused?: boolean;
}

export default function TicketScanner({ onScan, paused }: TicketScannerProps) {
  const [started, setStarted] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const pausedRef = useRef(paused);
  const isMountedRef = useRef(true);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  const extractToken = (text: string): string => {
    try {
      if (text.includes('/t/')) {
        const parts = text.split('/t/');
        return parts[parts.length - 1].split('?')[0].split('#')[0].trim();
      }
    } catch {
      // ignore
    }
    return text.trim();
  };

  const startScanner = useCallback(async () => {
    if (!isMountedRef.current) return;
    setCameraError(null);

    // Safely stop any previously running scanner instance
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
      } catch {
        // ignore safely
      }
      try {
        scannerRef.current.clear();
      } catch {
        // ignore safely
      }
      scannerRef.current = null;
    }

    try {
      const html5QrCode = new Html5Qrcode('qr-reader-container', {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        verbose: false,
      });
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 12,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          if (isMountedRef.current && !pausedRef.current) {
            const token = extractToken(decodedText);
            if (token) onScan(token);
          }
        },
        () => {
          // Quiet frame failure
        }
      );

      if (isMountedRef.current) {
        setStarted(true);
      } else {
        // Component unmounted while start was resolving
        if (html5QrCode.isScanning) {
          html5QrCode
            .stop()
            .catch(() => {})
            .finally(() => {
              try {
                html5QrCode.clear();
              } catch {
                // ignore
              }
            });
        }
      }
    } catch (err: unknown) {
      if (isMountedRef.current) {
        console.warn('Camera failed to start:', err);
        setCameraError(
          'Camera permission denied or camera device not found. You can enter the token code manually.'
        );
        setStarted(false);
      }
    }
  }, [onScan]);

  useEffect(() => {
    isMountedRef.current = true;
    startScanner();

    return () => {
      isMountedRef.current = false;
      const scanner = scannerRef.current;
      if (scanner) {
        try {
          if (scanner.isScanning) {
            scanner
              .stop()
              .catch(() => {})
              .finally(() => {
                try {
                  scanner.clear();
                } catch {
                  // ignore
                }
              });
          } else {
            try {
              scanner.clear();
            } catch {
              // ignore
            }
          }
        } catch {
          // Never throw during cleanup
        }
      }
    };
  }, [startScanner]);

  return (
    <div className="relative mx-auto rounded-3xl overflow-hidden border-2 border-[#4b2d1c] bg-black max-w-[340px] aspect-square flex items-center justify-center shadow-2xl">
      <div id="qr-reader-container" className="w-full h-full" />

      {started && !paused && (
        <div className="pointer-events-none absolute inset-x-6 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_12px_#f59e0b] animate-scan-beam" />
      )}

      {!started && !cameraError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-[#150e09]">
          <Camera className="h-10 w-10 text-amber-500 animate-pulse mb-3" />
          <span className="text-xs font-bold text-amber-300">Requesting Camera Access...</span>
          <span className="text-[11px] text-zinc-500 mt-1">Please grant camera permissions</span>
        </div>
      )}

      {cameraError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-[#170e09]">
          <AlertCircle className="h-8 w-8 text-rose-500 mb-2" />
          <span className="text-xs font-bold text-white mb-1">Camera Unavailable</span>
          <span className="text-[11px] text-rose-300/80 mb-3 max-w-xs">{cameraError}</span>
          <button
            onClick={startScanner}
            className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Retry Camera</span>
          </button>
        </div>
      )}
    </div>
  );
}

