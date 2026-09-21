'use client';

import { use, useEffect, useState, useCallback } from 'react';
import { Utensils, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface OrderItem {
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface TicketData {
  ticketId: string;
  name: string;
  mobNo: string;
  status: 'OPEN' | 'CLOSED';
  createdAt: string;
  closedAt: string | null;
  qrDataUrl: string;
  orderItems?: OrderItem[];
  grandTotal?: number;
}

export default function CustomerTicketPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [celebrated, setCelebrated] = useState(false);

  const fetchTicket = useCallback(async () => {
    try {
      const res = await fetch(`/api/tickets/${token}`);
      const contentType = res.headers.get('content-type');
      const text = await res.text();
      let data: TicketData | null = null;
      if (contentType?.includes('application/json') && text) {
        try {
          data = JSON.parse(text);
        } catch {
          // ignore
        }
      }

      if (!res.ok || !data) {
        throw new Error('404 Ticket Not Found');
      }

      if (data.status === 'CLOSED' && !celebrated) {
        setCelebrated(true);
        try {
          confetti({
            particleCount: 60,
            spread: 55,
            origin: { y: 0.6 },
            colors: ['#f59e0b', '#d97706', '#10b981'],
          });
        } catch {
          // ignore
        }
      }

      setTicket(data);
      setError(null);
    } catch {
      if (!ticket) {
        setError('Ticket Not Found');
      }
    } finally {
      setLoading(false);
    }
  }, [token, celebrated, ticket]);

  useEffect(() => {
    fetchTicket();
  }, []);

  return (
    <div className="min-h-screen bg-[#0e0805] text-[#fcf8f3] flex flex-col items-center justify-center p-4 sm:p-6 selection:bg-amber-500 selection:text-black">
      {loading && (
        <div className="flex flex-col items-center justify-center p-12 bg-[#1b0f09] border border-[#3b2316] rounded-3xl shadow-2xl">
          <div className="h-10 w-10 rounded-full border-3 border-amber-500/20 border-t-amber-500 animate-spin mb-4" />
          <p className="text-amber-400 font-bold text-xs uppercase tracking-wider">
            Loading your ticket...
          </p>
        </div>
      )}

      {error && !loading && (
        <div className="bg-[#1f0f0c] border border-rose-900/50 rounded-3xl p-8 text-center shadow-xl max-w-sm w-full space-y-4">
          <AlertCircle className="h-12 w-12 text-rose-500 mx-auto" />
          <div>
            <h1 className="text-xl font-black text-white uppercase">404 Ticket Not Found</h1>
            <p className="text-xs text-rose-300/80 mt-1">
              Please check your link or contact the stall counter.
            </p>
          </div>
        </div>
      )}

      {ticket && !loading && (
        <div className="max-w-sm w-full rounded-3xl border border-[#442617] bg-gradient-to-b from-[#22140d] via-[#1a0f09] to-[#120b07] shadow-2xl p-6 sm:p-8 text-center space-y-5">
          {/* Header */}
          <div className="space-y-1">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 mb-2">
              <Utensils className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-black tracking-tight text-white uppercase">
              The Chip &amp; Fudge
            </h1>
            <p className="text-xs font-bold text-zinc-400 pt-0.5 uppercase tracking-wider">
              Ticket: <span className="text-amber-400 font-mono font-black">{ticket.ticketId}</span>
            </p>
          </div>

          {/* Customer Details */}
          <div className="py-2 border-y border-[#321c12] space-y-1 text-center">
            <span className="text-[11px] uppercase font-bold text-zinc-500 tracking-wider block">
              Customer
            </span>
            <span className="text-lg font-black text-white block">{ticket.name}</span>
          </div>

          {/* Order Items Breakdown */}
          {ticket.orderItems && ticket.orderItems.length > 0 && (
            <div className="rounded-2xl bg-[#180e08] border border-[#321c12] p-4 text-left space-y-3">
              <div className="text-[11px] uppercase font-bold text-amber-400 tracking-wider">
                Order Items
              </div>
              <div className="space-y-2">
                {ticket.orderItems.map((item, idx) => (
                  <div key={idx} className="space-y-0.5 border-b border-[#2a170d] pb-2 last:border-0 last:pb-0">
                    <div className="text-sm font-bold text-white">{item.name}</div>
                    <div className="text-xs text-zinc-400 flex items-center justify-between font-mono">
                      <span>
                        ₹{item.unitPrice} × {item.quantity}
                      </span>
                      <span className="font-bold text-amber-300">₹{item.total}</span>
                    </div>
                  </div>
                ))}
              </div>

              {ticket.grandTotal !== undefined && (
                <div className="pt-2 border-t border-[#392013] flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-zinc-300 tracking-wider">
                    Grand Total
                  </span>
                  <span className="text-lg font-black text-amber-400">
                    ₹{ticket.grandTotal}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Status Badge */}
          <div>
            {ticket.status === 'OPEN' ? (
              <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="w-4 h-4" />
                <span>Status: OPEN</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-zinc-800 text-zinc-300 border border-zinc-700">
                <XCircle className="w-4 h-4" />
                <span>Status: CLOSED</span>
              </div>
            )}
          </div>

          {/* QR Code Section */}
          <div className="space-y-2 pt-1">
            <div className="bg-white p-3 rounded-2xl inline-block shadow-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={ticket.qrDataUrl}
                alt="Ticket QR Code"
                className="w-48 h-48 mx-auto rounded-lg"
              />
            </div>
            <p className="text-[11px] text-zinc-400 font-medium">
              {ticket.status === 'OPEN'
                ? 'Show this QR code at the stall to redeem your order.'
                : 'Ticket redeemed. Thank you for visiting The Chip & Fudge!'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
