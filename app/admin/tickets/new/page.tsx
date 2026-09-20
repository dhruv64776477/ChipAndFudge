'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  User,
  Phone,
  PlusCircle,
  Copy,
  Check,
  CheckCircle2,
  QrCode,
  Minus,
  Plus,
  IndianRupee,
  MessageCircle,
  AlertCircle,
} from 'lucide-react';
import { playTicketCreatedChime } from '@/lib/audio';
import { MENU_ITEMS } from '@/lib/menu/items';
import type { OrderItem } from '@/types/ticket';

interface QuantityMap {
  [itemName: string]: number;
}

interface CreatedTicketResult {
  ticket: {
    ticketId: string;
    name: string;
    mobNo: string;
    status: string;
    orderItems: OrderItem[];
    grandTotal: number;
  };
  customerUrl: string;
  qrDataUrl: string;
  whatsapp?: { sent: boolean; error?: string };
}

export default function NewTicketPage() {
  const [name, setName] = useState('');
  const [mobNo, setMobNo] = useState('');
  const [quantities, setQuantities] = useState<QuantityMap>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdResult, setCreatedResult] = useState<CreatedTicketResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(true);

  // Compute display total client-side (display only — server always recalculates)
  const clientTotal = MENU_ITEMS.reduce((sum, item) => {
    const qty = quantities[item.name] ?? 0;
    return sum + item.sellingPrice * qty;
  }, 0);

  const selectedItems = MENU_ITEMS.filter((item) => (quantities[item.name] ?? 0) > 0);

  const setQty = (itemName: string, delta: number) => {
    setQuantities((prev) => {
      const current = prev[itemName] ?? 0;
      const next = Math.max(0, Math.min(99, current + delta));
      if (next === 0) {
        const updated = { ...prev };
        delete updated[itemName];
        return updated;
      }
      return { ...prev, [itemName]: next };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !mobNo.trim()) {
      setError('Customer name and mobile number are required.');
      return;
    }
    if (selectedItems.length === 0) {
      setError('Please select at least one menu item.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const orderItems = selectedItems.map((item) => ({
        name: item.name,
        quantity: quantities[item.name],
      }));

      const res = await fetch('/api/admin/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          mobNo: mobNo.trim(),
          orderItems,
        }),
      });

      const contentType = res.headers.get('content-type');
      const text = await res.text();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let data: any = null;

      if (contentType?.includes('application/json') && text) {
        try {
          data = JSON.parse(text);
        } catch (parseErr) {
          console.error('Failed to parse response JSON:', parseErr, 'Raw text:', text);
        }
      }

      if (!res.ok) {
        console.error(`Ticket creation failed with HTTP ${res.status}:`, text);
        throw new Error(
          data?.error || `Server error (${res.status}): ${text || 'Empty response'}`
        );
      }

      if (!data || !data.ticket) {
        throw new Error('Server returned successful status but missing ticket payload');
      }

      playTicketCreatedChime();
      setCreatedResult({
        ticket: data.ticket,
        customerUrl: data.url || data.customerUrl,
        qrDataUrl: data.qrDataUrl,
        whatsapp: data.whatsapp,
      });
    } catch (err: unknown) {
      console.error('Create ticket error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyLink = () => {
    if (createdResult) {
      navigator.clipboard.writeText(createdResult.customerUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCreateAnother = () => {
    setCreatedResult(null);
    setName('');
    setMobNo('');
    setQuantities({});
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#0d0704] text-[#fdfbf7] flex flex-col justify-between p-4 sm:p-8 selection:bg-amber-500 selection:text-black">
      {/* Top Bar */}
      <div className="max-w-lg w-full mx-auto flex items-center justify-between pt-2">
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

      <main className="max-w-lg w-full mx-auto my-auto py-6">
        {!createdResult ? (
          /* ─── Ticket Creation Form ─── */
          <div className="space-y-4">
            {/* Customer Details Card */}
            <div className="rounded-3xl border border-[#3b2316] bg-gradient-to-b from-[#20120b] to-[#140b07] p-6 shadow-2xl space-y-4">
              <div className="text-center space-y-1">
                <h1 className="text-2xl font-black uppercase text-white tracking-tight">
                  Create Ticket
                </h1>
                <p className="text-xs text-zinc-400 font-medium">
                  Enter customer details and select items
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Customer Name */}
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1.5 uppercase tracking-wider">
                    Customer Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dhruv"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#27160e] border border-[#3e2316] text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-amber-500 font-medium"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Mobile Number */}
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1.5 uppercase tracking-wider">
                    Mobile Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9876543210"
                      value={mobNo}
                      onChange={(e) => setMobNo(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#27160e] border border-[#3e2316] text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                </div>
              </form>
            </div>

            {/* Menu Selector Card */}
            <div className="rounded-3xl border border-[#3b2316] bg-gradient-to-b from-[#1d1009] to-[#140b07] p-6 shadow-2xl space-y-3">
              <div className="text-xs font-black uppercase tracking-wider text-amber-400 mb-4">
                Select Items
              </div>

              {MENU_ITEMS.map((item) => {
                const qty = quantities[item.name] ?? 0;
                const lineTotal = item.sellingPrice * qty;
                return (
                  <div
                    key={item.name}
                    className={`rounded-2xl border p-4 transition-all ${
                      qty > 0
                        ? 'border-amber-500/50 bg-amber-500/5'
                        : 'border-[#3b2316] bg-[#1a0e07]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm text-white truncate">{item.name}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-sm font-black text-amber-400">
                            ₹{item.sellingPrice}
                          </span>
                          {item.originalPrice && (
                            <span className="text-xs text-zinc-500 line-through">
                              ₹{item.originalPrice}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {qty > 0 && (
                          <span className="text-xs font-bold text-amber-300 w-12 text-right">
                            ₹{lineTotal}
                          </span>
                        )}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setQty(item.name, -1)}
                            disabled={qty === 0}
                            className="h-8 w-8 rounded-xl bg-[#2d1810] border border-[#4a2718] text-zinc-300 hover:text-white hover:border-amber-500/50 flex items-center justify-center transition-all disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span
                            className={`w-7 text-center text-sm font-black ${
                              qty > 0 ? 'text-amber-400' : 'text-zinc-600'
                            }`}
                          >
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => setQty(item.name, 1)}
                            disabled={qty >= 99}
                            className="h-8 w-8 rounded-xl bg-[#2d1810] border border-[#4a2718] text-zinc-300 hover:text-white hover:border-amber-500/50 flex items-center justify-center transition-all disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Grand Total */}
              {clientTotal > 0 && (
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/8 p-4 flex items-center justify-between mt-2">
                  <span className="text-sm font-black text-zinc-300 uppercase tracking-wider">
                    Total
                  </span>
                  <span className="flex items-center gap-1 text-xl font-black text-amber-400">
                    <IndianRupee className="w-4 h-4" />
                    {clientTotal}
                  </span>
                </div>
              )}
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={submitting || selectedItems.length === 0 || !name.trim() || !mobNo.trim()}
              className="w-full py-3.5 px-6 rounded-2xl font-black text-sm uppercase tracking-wider bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-[#140b07] hover:brightness-110 shadow-lg shadow-amber-950/60 transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <PlusCircle className="w-5 h-5" />
              <span>{submitting ? 'Creating Ticket...' : 'Create Ticket'}</span>
            </button>
          </div>
        ) : (
          /* ─── Ticket Created Display ─── */
          <div className="rounded-3xl border border-[#442617] bg-gradient-to-b from-[#22130b] to-[#120a06] p-6 sm:p-8 shadow-2xl text-center space-y-5">
            <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-3 py-1 rounded-full">
              <CheckCircle2 className="w-4 h-4" />
              <span>Ticket Created</span>
            </div>

            <div>
              <p className="text-xs uppercase font-extrabold tracking-widest text-zinc-400">
                Customer
              </p>
              <h2 className="text-xl font-black text-white">{createdResult.ticket.name}</h2>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">{createdResult.ticket.mobNo}</p>
            </div>

            <div className="p-3 rounded-2xl bg-[#190e08] border border-[#321c11]">
              <p className="text-[11px] uppercase font-bold text-zinc-500 tracking-wider">
                Ticket ID
              </p>
              <p className="text-2xl font-black tracking-wider text-amber-400 font-mono mt-0.5">
                {createdResult.ticket.ticketId}
              </p>
              <div className="mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                STATUS: {createdResult.ticket.status}
              </div>
            </div>

            {/* Order Summary */}
            {createdResult.ticket.orderItems && createdResult.ticket.orderItems.length > 0 && (
              <div className="rounded-2xl bg-[#190e08] border border-[#321c11] p-4 text-left space-y-2">
                <div className="text-[11px] uppercase font-bold text-amber-400 tracking-wider mb-3">
                  Order Summary
                </div>
                {createdResult.ticket.orderItems.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span className="text-zinc-300 font-medium">
                      {item.name} × {item.quantity}
                    </span>
                    <span className="font-bold text-white">₹{item.total}</span>
                  </div>
                ))}
                <div className="border-t border-[#321c11] pt-2 mt-2 flex items-center justify-between">
                  <span className="text-xs font-black text-zinc-300 uppercase tracking-wider">
                    Grand Total
                  </span>
                  <span className="text-base font-black text-amber-400">
                    ₹{createdResult.ticket.grandTotal}
                  </span>
                </div>
              </div>
            )}

            {/* WhatsApp Status */}
            {createdResult.whatsapp && (
              <div
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border ${
                  createdResult.whatsapp.sent
                    ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-400'
                    : 'bg-zinc-900/50 border-zinc-800/40 text-zinc-400'
                }`}
              >
                <MessageCircle className="w-4 h-4 shrink-0" />
                <span>
                  {createdResult.whatsapp.sent
                    ? 'WhatsApp message sent to customer'
                    : `WhatsApp not sent${createdResult.whatsapp.error ? ` — ${createdResult.whatsapp.error}` : ''}`}
                </span>
              </div>
            )}

            {/* QR Section */}
            {showQr && (
              <div className="bg-white p-3 rounded-2xl inline-block shadow-xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={createdResult.qrDataUrl}
                  alt="Customer QR Code"
                  className="w-52 h-52 mx-auto rounded-lg"
                />
              </div>
            )}

            {/* Actions */}
            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full py-3 px-4 rounded-xl bg-[#28170e] hover:bg-[#341e12] border border-[#44281a] text-amber-300 font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied Customer Link!' : 'Copy Customer Link'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowQr(!showQr)}
                className="w-full py-2.5 px-4 rounded-xl bg-[#1d100a] hover:bg-[#25150d] border border-[#321b10] text-zinc-400 hover:text-white text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <QrCode className="w-4 h-4" />
                <span>{showQr ? 'Hide QR' : 'Show QR'}</span>
              </button>

              <button
                type="button"
                onClick={handleCreateAnother}
                className="w-full py-3 px-4 rounded-2xl font-black text-xs uppercase tracking-wider bg-gradient-to-r from-amber-500 to-amber-600 text-[#140b07] hover:brightness-110 shadow-md transition-all cursor-pointer mt-4"
              >
                Create Another Ticket
              </button>
            </div>
          </div>
        )}
      </main>

      <footer className="max-w-lg w-full mx-auto text-center pb-2">
        <p className="text-[11px] text-zinc-600">The Chip &amp; Fudge Ticket Engine</p>
      </footer>
    </div>
  );
}
