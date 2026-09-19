'use client';

import { useState } from 'react';
import Link from 'next/link';
import TicketScanner from '@/components/admin/TicketScanner';
import { playSuccessChime, playWarningBeep } from '@/lib/audio';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  KeyRound,
  Check,
} from 'lucide-react';

interface TicketPreview {
  ticketId: string;
  name: string;
  mobNo: string;
  status: 'OPEN' | 'CLOSED';
  closedAt: string | null;
  rawToken: string;
}

export default function AdminScannerPage() {
  const [scannedTicket, setScannedTicket] = useState<TicketPreview | null>(null);
  const [isAlreadyClosed, setIsAlreadyClosed] = useState(false);
  const [isJustClosed, setIsJustClosed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [closing, setClosing] = useState(false);
  const [manualToken, setManualToken] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleScan = async (token: string) => {
    if (loading || closing || scannedTicket) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/admin/tickets/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const contentType = res.headers.get('content-type');
      const text = await res.text();
      let data: any = null;
      if (contentType?.includes('application/json') && text) {
        try {
          data = JSON.parse(text);
        } catch {
          // ignore
        }
      }

      if (!res.ok) {
        playWarningBeep();
        setErrorMsg(data?.error || `Server error (${res.status}): ${text || 'Ticket not found'}`);
        return;
      }

      const ticket = data?.ticket;
      if (!ticket) {
        playWarningBeep();
        setErrorMsg('Invalid ticket details returned from server');
        return;
      }

      setScannedTicket({
        ticketId: ticket.ticketId,
        name: ticket.name,
        mobNo: ticket.mobNo,
        status: ticket.status,
        closedAt: ticket.closedAt,
        rawToken: token,
      });

      if (ticket.status === 'CLOSED' || data?.alreadyClosed) {
        setIsAlreadyClosed(true);
        playWarningBeep();
      } else {
        setIsAlreadyClosed(false);
      }
    } catch (err: unknown) {
      playWarningBeep();
      setErrorMsg(err instanceof Error ? err.message : 'Failed to retrieve ticket.');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseTicket = async () => {
    if (!scannedTicket || closing) return;
    setClosing(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/admin/tickets/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: scannedTicket.rawToken }),
      });

      const contentType = res.headers.get('content-type');
      const text = await res.text();
      let data: any = null;
      if (contentType?.includes('application/json') && text) {
        try {
          data = JSON.parse(text);
        } catch {
          // ignore
        }
      }

      if (!res.ok) {
        playWarningBeep();
        if (data?.alreadyClosed) {
          setIsAlreadyClosed(true);
        }
        setErrorMsg(data?.message || data?.error || `Error (${res.status}): ${text || 'Failed to close ticket'}`);
        return;
      }

      playSuccessChime();
      setIsJustClosed(true);
      if (data?.ticket) {
        setScannedTicket((prev) =>
          prev
            ? {
                ...prev,
                status: 'CLOSED',
                closedAt: data.ticket.closedAt,
              }
            : null
        );
      }
    } catch (err: unknown) {
      playWarningBeep();
      setErrorMsg(err instanceof Error ? err.message : 'Error closing ticket.');
    } finally {
      setClosing(false);
    }
  };

  const handleReset = () => {
    setScannedTicket(null);
    setIsAlreadyClosed(false);
    setIsJustClosed(false);
    setErrorMsg(null);
    setManualToken('');
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0704] text-[#fdfbf7] flex flex-col justify-between p-4 sm:p-8 selection:bg-amber-500 selection:text-black">
      {/* Top Header */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between pt-2">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-amber-400 transition-colors py-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Admin Home</span>
        </Link>
        <span className="text-[11px] uppercase tracking-widest font-black text-amber-500/80">
          The Chip &amp; Fudge
        </span>
      </div>

      <main className="max-w-md w-full mx-auto my-auto py-6">
        {/* State 1: Scanner Active */}
        {!scannedTicket && (
          <div className="rounded-3xl border border-[#3b2316] bg-gradient-to-b from-[#20120b] to-[#140b07] p-6 shadow-2xl space-y-5 text-center">
            <div>
              <h1 className="text-2xl font-black uppercase text-white tracking-tight">
                Scan Ticket
              </h1>
              <p className="text-xs text-zinc-400 font-medium mt-1">
                Point the camera at the customer&apos;s ticket QR
              </p>
            </div>

            <TicketScanner onScan={handleScan} paused={loading} />

            {loading && (
              <div className="p-2.5 text-center text-xs font-bold text-amber-400 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Checking ticket...</span>
              </div>
            )}

            {errorMsg && (
              <div className="p-3 rounded-2xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 font-bold">
                {errorMsg}
              </div>
            )}

            {/* Manual input fallback */}
            <div className="pt-3 border-t border-[#2e190f]">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (manualToken.trim()) handleScan(manualToken.trim());
                }}
                className="flex items-center gap-2"
              >
                <div className="relative flex-1">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Or enter Ticket ID / token..."
                    value={manualToken}
                    onChange={(e) => setManualToken(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#27160e] border border-[#3e2316] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!manualToken.trim() || loading}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-black text-xs font-black uppercase transition-all disabled:opacity-50 cursor-pointer"
                >
                  Verify
                </button>
              </form>
            </div>
          </div>
        )}

        {/* State 2: Ticket Found & OPEN (ready to close) */}
        {scannedTicket && !isJustClosed && !isAlreadyClosed && (
          <div className="rounded-3xl border border-[#3e2417] bg-gradient-to-b from-[#22130b] to-[#120a06] p-6 sm:p-8 shadow-2xl text-center space-y-5">
            <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-amber-400 bg-amber-950/40 border border-amber-800/60 px-3.5 py-1 rounded-full">
              <span>Ticket Found</span>
            </div>

            <div>
              <p className="text-xs uppercase font-extrabold tracking-widest text-zinc-400">
                Customer
              </p>
              <h2 className="text-2xl font-black text-white mt-0.5">{scannedTicket.name}</h2>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">{scannedTicket.mobNo}</p>
            </div>

            <div className="p-4 rounded-2xl bg-[#190e08] border border-[#321c11] space-y-1.5">
              <p className="text-[11px] uppercase font-bold text-zinc-500 tracking-wider">
                Ticket ID
              </p>
              <p className="text-2xl font-black tracking-wider text-amber-400 font-mono">
                {scannedTicket.ticketId}
              </p>
              <div className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 mt-1">
                STATUS: OPEN
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 font-bold">
                {errorMsg}
              </div>
            )}

            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={handleCloseTicket}
                disabled={closing}
                className="w-full py-4 px-6 rounded-2xl font-black text-sm uppercase tracking-wider bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-700 text-black hover:brightness-110 shadow-lg shadow-emerald-950/60 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Check className="w-5 h-5" />
                <span>{closing ? 'Closing Ticket...' : 'Close Ticket'}</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="w-full py-2.5 px-4 rounded-xl text-zinc-400 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel &amp; Scan Another
              </button>
            </div>
          </div>
        )}

        {/* State 3: Successfully Closed */}
        {scannedTicket && isJustClosed && (
          <div className="rounded-3xl border border-emerald-800/50 bg-gradient-to-b from-[#182618] via-[#121c12] to-[#0c140c] p-6 sm:p-8 shadow-2xl text-center space-y-5">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-2xl font-black uppercase text-emerald-400 tracking-tight">
                ✓ Ticket Closed
              </h2>
              <p className="text-lg font-bold text-white mt-1">{scannedTicket.name}</p>
              <p className="text-sm font-mono text-zinc-300 mt-0.5">{scannedTicket.ticketId}</p>
            </div>

            <p className="text-xs text-zinc-400 font-medium max-w-xs mx-auto">
              This ticket can no longer be used. The order has been fulfilled.
            </p>

            <button
              type="button"
              onClick={handleReset}
              className="w-full py-3.5 px-6 rounded-2xl font-black text-xs uppercase tracking-wider bg-gradient-to-r from-amber-500 to-amber-600 text-black hover:brightness-110 shadow-md transition-all cursor-pointer mt-4"
            >
              Scan Next Ticket
            </button>
          </div>
        )}

        {/* State 4: Already Closed */}
        {scannedTicket && isAlreadyClosed && !isJustClosed && (
          <div className="rounded-3xl border border-rose-900/50 bg-gradient-to-b from-[#271313] via-[#1c0c0c] to-[#120707] p-6 sm:p-8 shadow-2xl text-center space-y-5">
            <div className="w-14 h-14 mx-auto rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <XCircle className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-xl font-black uppercase text-rose-400 tracking-tight">
                Ticket Already Closed
              </h2>
              <p className="text-lg font-bold text-white mt-1">{scannedTicket.name}</p>
              <p className="text-sm font-mono text-zinc-300 mt-0.5">{scannedTicket.ticketId}</p>
            </div>

            <div className="p-3 rounded-2xl bg-[#1a0808] border border-[#3b1212] space-y-1">
              <div className="inline-flex items-center gap-1 text-xs font-black text-rose-400">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>STATUS: CLOSED</span>
              </div>
              {scannedTicket.closedAt && (
                <p className="text-xs text-zinc-400 font-medium">
                  Closed at: {formatTime(scannedTicket.closedAt)}
                </p>
              )}
            </div>

            <p className="text-xs text-zinc-400 font-medium">
              This ticket has already been used and cannot be re-opened.
            </p>

            <button
              type="button"
              onClick={handleReset}
              className="w-full py-3.5 px-6 rounded-2xl font-black text-xs uppercase tracking-wider bg-[#2a170f] hover:bg-[#382014] border border-[#48291a] text-amber-300 transition-all cursor-pointer mt-4"
            >
              Scan Next Ticket
            </button>
          </div>
        )}
      </main>

      <footer className="max-w-md w-full mx-auto text-center pb-2">
        <p className="text-[11px] text-zinc-600">The Chip &amp; Fudge Stall Scanner</p>
      </footer>
    </div>
  );
}
