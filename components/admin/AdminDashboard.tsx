'use client';

import Link from 'next/link';
import { ScanLine, PlusCircle, Cookie, RefreshCw, Eye, CheckCircle2, Flame, IndianRupee } from 'lucide-react';
import { ITicket } from '@/types/ticket';

interface DashboardStats {
  totalToday: number;
  openQueue: number;
  closedCount: number;
  revenueToday: number;
}

interface AdminDashboardProps {
  stats: DashboardStats;
  tickets: ITicket[];
  loading: boolean;
  onRefresh: () => void;
  onOpenQrModal: (ticket: ITicket) => void;
}

export default function AdminDashboard({
  stats,
  tickets,
  loading,
  onRefresh,
  onOpenQrModal,
}: AdminDashboardProps) {
  return (
    <div className="space-y-6 max-w-5xl mx-auto w-full">
      {/* Section 14 ASCII-styled Header Card */}
      <div className="rounded-3xl border border-[#3d2417] bg-gradient-to-b from-[#22130b] to-[#140b07] p-6 sm:p-8 shadow-2xl text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Cookie className="h-6 w-6 text-amber-500" />
          <span className="text-xs uppercase font-black tracking-widest text-amber-400">
            THE CHIP &amp; FUDGE
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-6">
          ADMIN PANEL
        </h1>

        {/* Today's Tickets Counter Grid (Section 14) */}
        <div className="max-w-md mx-auto rounded-2xl bg-[#1a0f09] border border-[#3b2114] p-5 mb-8 shadow-inner">
          <div className="text-xs uppercase font-extrabold text-zinc-400 mb-4 tracking-wider">
            Today&apos;s Tickets
          </div>
          <div className="grid grid-cols-3 divide-x divide-[#301b10] text-center">
            <div>
              <div className="text-xs font-bold text-zinc-400 uppercase mb-1">Total</div>
              <div className="text-3xl sm:text-4xl font-black text-white">{stats.totalToday}</div>
            </div>
            <div>
              <div className="text-xs font-bold text-amber-400 uppercase mb-1">Open</div>
              <div className="text-3xl sm:text-4xl font-black text-amber-400">{stats.openQueue}</div>
            </div>
            <div>
              <div className="text-xs font-bold text-emerald-400 uppercase mb-1">Closed</div>
              <div className="text-3xl sm:text-4xl font-black text-emerald-400">{stats.closedCount}</div>
            </div>
          </div>
        </div>

        {/* Action Buttons (Section 14) */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-md mx-auto">
          <Link
            href="/admin/scanner"
            className="w-full flex items-center justify-center gap-2.5 py-4 px-6 rounded-2xl font-black text-sm uppercase tracking-wider bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-[#140b07] hover:brightness-110 shadow-xl shadow-amber-950/60 transition-all cursor-pointer"
          >
            <ScanLine className="h-5 w-5" />
            <span>SCAN TICKET</span>
          </Link>

          <Link
            href="/admin/tickets/new"
            className="w-full flex items-center justify-center gap-2.5 py-4 px-6 rounded-2xl font-black text-sm uppercase tracking-wider bg-[#28170e] hover:bg-[#361f13] border border-[#48291a] text-amber-300 shadow-lg transition-all cursor-pointer"
          >
            <PlusCircle className="h-5 w-5" />
            <span>CREATE TICKET</span>
          </Link>
        </div>
      </div>

      {/* Recent Orders List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-base font-extrabold text-white">Live Orders Stream</h2>
          <button
            onClick={onRefresh}
            className="p-1.5 rounded-xl bg-[#20120b] border border-[#351e12] text-zinc-400 hover:text-amber-300 transition-colors cursor-pointer"
            title="Refresh Orders"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-zinc-500 font-bold">
            Syncing orders...
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-[#160d08] border border-[#2b170e] text-xs text-zinc-500">
            No tickets created yet today. Click [ CREATE TICKET ] to begin.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {tickets.slice(0, 12).map((t) => (
              <div
                key={t._id || t.ticketId}
                className="rounded-2xl border p-4 bg-[#1b100a] border-[#382014] flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-sm font-black text-white">
                      #{t.ticketId}
                    </span>
                    {t.status === 'OPEN' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        <Flame className="h-3 w-3 animate-pulse" />
                        OPEN
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        <CheckCircle2 className="h-3 w-3" />
                        CLOSED
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-white font-bold mb-1">{t.name}</div>
                  <div className="text-[11px] font-mono text-zinc-400 mb-2">{t.mobNo}</div>

                  {t.items && t.items.length > 0 && (
                    <div className="text-[11px] text-zinc-300 mb-2 truncate">
                      {t.items.join(', ')}
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-[#2e190f] flex items-center justify-between">
                  <div className="text-xs font-black text-amber-400 flex items-center">
                    <IndianRupee className="h-3 w-3" />
                    {t.amount || 199}
                  </div>
                  <button
                    onClick={() => onOpenQrModal(t)}
                    className="p-1.5 rounded-lg bg-[#25150d] hover:bg-[#321c11] text-zinc-300 hover:text-amber-300 transition-colors cursor-pointer"
                    title="View QR Code"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
