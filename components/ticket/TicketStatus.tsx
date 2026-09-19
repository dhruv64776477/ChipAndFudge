'use client';

import { TicketStatus as StatusType } from '@/types/ticket';
import { Flame, CheckCircle2 } from 'lucide-react';

interface TicketStatusProps {
  status: StatusType;
  closedAt?: string | null;
}

export default function TicketStatus({ status, closedAt }: TicketStatusProps) {
  if (status === 'OPEN') {
    return (
      <div className="flex flex-col items-center">
        <div className="relative flex items-center justify-center mb-3">
          <div className="absolute h-16 w-16 rounded-full bg-amber-500/20 animate-ping" />
          <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 shadow-lg shadow-amber-950/60">
            <Flame className="h-6 w-6 text-[#1a0f08] animate-pulse" />
          </div>
        </div>
        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full text-sm font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 tracking-wide">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>🟢 OPEN</span>
        </div>
        <p className="text-xs text-[#d1beaf] mt-2.5 max-w-xs text-center font-medium">
          Please show this ticket at the stall when called.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-rose-600 to-rose-400 shadow-lg shadow-rose-950/60 mb-3">
        <CheckCircle2 className="h-7 w-7 text-white" />
      </div>
      <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full text-sm font-black bg-rose-500/20 text-rose-300 border border-rose-500/40 tracking-wide">
        <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
        <span>🔴 CLOSED</span>
      </div>
      <p className="text-xs text-rose-300/80 mt-2.5 font-bold">
        Ticket already used
      </p>
      {closedAt && (
        <span className="text-[11px] text-zinc-400 mt-1">
          Served at {new Date(closedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      )}
    </div>
  );
}
