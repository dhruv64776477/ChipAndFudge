'use client';

import { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { ITicket } from '@/types/ticket';
import { PlusCircle, Search, RefreshCw, Eye, ArrowLeft, Flame, CheckCircle2, IndianRupee } from 'lucide-react';
import QRCode from 'qrcode';

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<ITicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN' | 'CLOSED'>('ALL');
  const [selectedTicket, setSelectedTicket] = useState<ITicket | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);

  const fetchTickets = useCallback(async () => {
    try {
      const q = new URLSearchParams();
      if (statusFilter !== 'ALL') q.set('status', statusFilter);
      if (search.trim()) q.set('search', search.trim());
      q.set('date', 'all');

      const res = await fetch(`/api/admin/tickets?${q.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleOpenQr = async (t: ITicket) => {
    setSelectedTicket(t);
    // Since qrTokenHash is in DB, the full URL requires the rawToken or customer lookup
    // For admin preview, link to public lookup
    const url = `${window.location.origin}/t/${t.ticketId}`;
    const dataUrl = await QRCode.toDataURL(url, {
      width: 280,
      margin: 2,
      color: { dark: '#1e130c', light: '#ffffff' },
    });
    setQrUrl(dataUrl);
  };

  return (
    <div className="min-h-screen bg-[#0d0704] text-[#fdfbf7] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 py-6 space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-amber-400 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Dashboard</span>
            </Link>
            <h1 className="text-xl font-black text-white">All Orders &amp; Tickets</h1>
          </div>

          <Link
            href="/admin/tickets/new"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md transition-all"
          >
            <PlusCircle className="h-4 w-4" />
            <span>New Ticket</span>
          </Link>
        </div>

        {/* Filter & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#170e08] border border-[#2e1c12] p-3 rounded-2xl">
          <div className="flex items-center gap-2">
            {(['ALL', 'OPEN', 'CLOSED'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  statusFilter === filter
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
              <input
                type="text"
                placeholder="Search ticket #, name, phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#20130b] border border-[#352014] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
              />
            </div>
            <button
              onClick={() => fetchTickets()}
              className="p-2 rounded-xl bg-[#20130b] border border-[#352014] text-zinc-400 hover:text-amber-300"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Ticket List */}
        {loading ? (
          <div className="p-12 text-center text-xs text-zinc-400 font-bold">Loading tickets...</div>
        ) : tickets.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-[#160d08] border border-[#2b170e] text-xs text-zinc-500">
            No tickets match your filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {tickets.map((t) => (
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

                  <div className="text-xs text-white font-bold mb-0.5">{t.name}</div>
                  <div className="text-[11px] font-mono text-zinc-400 mb-2">{t.mobNo}</div>

                  {t.items && t.items.length > 0 && (
                    <div className="text-[11px] text-zinc-300 truncate mb-2">
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
                    onClick={() => handleOpenQr(t)}
                    className="p-1.5 rounded-lg bg-[#25150d] hover:bg-[#321c11] text-zinc-300 hover:text-amber-300"
                    title="Inspect Ticket"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
