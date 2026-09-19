'use client';

import { CheckCircle2, AlertCircle, Clock, Phone, User, Check, Flame } from 'lucide-react';

export interface TicketResultData {
  ticketId: string;
  name: string;
  mobNo: string;
  status: 'OPEN' | 'CLOSED';
  items?: string[];
  closedAt?: string | null;
  rawToken: string;
}

interface TicketResultProps {
  data: TicketResultData;
  onCloseTicket: (rawToken: string) => Promise<void>;
  closing?: boolean;
  closedSuccess?: boolean;
}

export default function TicketResult({
  data,
  onCloseTicket,
  closing,
  closedSuccess,
}: TicketResultProps) {
  const formatTime = (dateStr?: string | null) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  // State: Closed successfully right now
  if (closedSuccess) {
    return (
      <div className="rounded-3xl border border-emerald-500/40 bg-gradient-to-b from-[#142b1f] to-[#0e1c15] p-6 shadow-2xl text-center space-y-4">
        <div className="h-12 w-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
          <CheckCircle2 className="h-7 w-7" />
        </div>

        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-400">
            Order Complete
          </span>
          <h2 className="text-xl font-black text-white mt-0.5">Ticket Closed Successfully</h2>
        </div>

        <div className="rounded-2xl bg-black/40 border border-emerald-500/20 p-4 text-left space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-zinc-400">Ticket ID:</span>
            <span className="font-bold text-white">#{data.ticketId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Customer:</span>
            <span className="font-bold text-white">{data.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Status:</span>
            <span className="font-extrabold text-emerald-400">CLOSED</span>
          </div>
        </div>
      </div>
    );
  }

  // State: Was already closed before scanning
  if (data.status === 'CLOSED') {
    return (
      <div className="rounded-3xl border border-rose-500/40 bg-gradient-to-b from-[#26120e] to-[#170a08] p-6 shadow-2xl text-center space-y-4">
        <div className="h-12 w-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
          <AlertCircle className="h-7 w-7" />
        </div>

        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-rose-400">
            Already Fused
          </span>
          <h2 className="text-xl font-black text-white mt-0.5">Ticket Already Closed</h2>
        </div>

        <div className="rounded-2xl bg-black/40 border border-rose-500/20 p-4 text-left space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-zinc-400">Customer:</span>
            <span className="font-bold text-white">{data.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Mobile:</span>
            <span className="font-mono text-white">{data.mobNo}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Status:</span>
            <span className="font-extrabold text-rose-400">CLOSED</span>
          </div>
          {data.closedAt && (
            <div className="flex justify-between">
              <span className="text-zinc-400">Closed at:</span>
              <span className="font-bold text-zinc-300">{formatTime(data.closedAt)}</span>
            </div>
          )}
        </div>

        <p className="text-[11px] text-zinc-400 italic">
          This ticket has already been fulfilled and cannot be reopened.
        </p>
      </div>
    );
  }

  // State: OPEN -> Show Customer, Mobile, Status, and [ CLOSE TICKET ] button (Section 15)
  return (
    <div className="rounded-3xl border border-amber-500/40 bg-gradient-to-b from-[#26150c] to-[#170d07] p-6 shadow-2xl text-center space-y-4">
      <div className="h-12 w-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
        <Flame className="h-7 w-7 animate-pulse" />
      </div>

      <div>
        <span className="text-[11px] font-extrabold uppercase tracking-widest text-amber-400">
          Ticket #{data.ticketId}
        </span>
        <h2 className="text-xl font-black text-white mt-0.5">Ticket Found</h2>
      </div>

      <div className="rounded-2xl bg-[#190e08] border border-[#3b2114] p-4 text-left space-y-2.5 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-zinc-400 flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-amber-500" />
            <span>Customer:</span>
          </span>
          <span className="font-bold text-white text-sm">{data.name}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-zinc-400 flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5 text-amber-500" />
            <span>Mobile:</span>
          </span>
          <span className="font-mono font-bold text-white">{data.mobNo}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-zinc-400">Status:</span>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            OPEN
          </span>
        </div>

        {data.items && data.items.length > 0 && (
          <div className="pt-2 border-t border-[#2e190f] text-[11px] text-zinc-300">
            <span className="text-zinc-400">Items:</span> {data.items.join(', ')}
          </div>
        )}
      </div>

      <button
        onClick={() => onCloseTicket(data.rawToken)}
        disabled={closing}
        className="w-full py-3.5 px-6 rounded-2xl font-black text-sm uppercase tracking-wider bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:brightness-110 text-white shadow-xl shadow-emerald-950/60 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
      >
        <Check className="h-4 w-4" />
        <span>{closing ? 'Fulfilling...' : 'CLOSE TICKET'}</span>
      </button>
    </div>
  );
}
