'use client';

import { PublicTicketResponse } from '@/types/ticket';
import TicketStatus from './TicketStatus';
import { Cookie, Clock, Utensils, RefreshCw, Share2, IndianRupee } from 'lucide-react';
import { useState } from 'react';

interface TicketCardProps {
  ticket: PublicTicketResponse;
  onRefresh?: () => void;
  refreshing?: boolean;
}

export default function TicketCard({ ticket, onRefresh, refreshing }: TicketCardProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `The Chip & Fudge - Ticket ${ticket.ticketId}`,
          text: `Order ticket for ${ticket.name}`,
          url,
        });
      } catch {
        // cancelled
      }
    } else {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatTime = (dateStr: string) => {
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
    <div className="relative overflow-hidden rounded-3xl border border-[#42291b] bg-gradient-to-b from-[#22140d] via-[#1a0f09] to-[#120b07] shadow-2xl shadow-black/80 max-w-md w-full">
      {/* Decorative top ribbon */}
      <div className="h-2 w-full bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600" />

      {/* Header section */}
      <div className="p-6 pb-5 text-center border-b border-[#2e1c12]">
        <div className="inline-flex items-center justify-center p-2 rounded-2xl bg-[#2b1910] border border-[#48291a] mb-3">
          <Cookie className="h-7 w-7 text-amber-400" />
        </div>

        <div className="text-xs uppercase font-extrabold tracking-widest text-amber-400 mb-0.5">
          THE CHIP &amp; FUDGE
        </div>
        <div className="text-sm font-semibold text-[#bda897] mb-3">
          Artisan Snacks &amp; Desserts
        </div>

        <h1 className="text-3xl font-black tracking-tight text-white mb-2">
          Ticket #{ticket.ticketId}
        </h1>

        <div className="text-sm text-[#e6d8cd] mb-5">
          Customer: <strong className="text-white text-base">{ticket.name}</strong>
        </div>

        {/* Status Component */}
        <TicketStatus status={ticket.status} closedAt={ticket.closedAt} />
      </div>

      {/* Order Items section */}
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between text-xs text-[#b8a394] border-b border-[#2a170f] pb-3">
          <span className="font-semibold text-zinc-400">Order Placed:</span>
          <span className="flex items-center gap-1 font-bold text-white">
            <Clock className="h-3.5 w-3.5 text-amber-500" />
            {formatTime(ticket.createdAt)}
          </span>
        </div>

        {ticket.orderItems && ticket.orderItems.length > 0 && (
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400 mb-3 flex items-center gap-1.5">
              <Utensils className="h-3.5 w-3.5" />
              <span>Order Details</span>
            </div>
            <div className="space-y-2">
              {ticket.orderItems.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#25150d] border border-[#392114] text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                    <span className="text-[#f4eae0] font-medium">{item.name}</span>
                    <span className="text-zinc-500">×{item.quantity}</span>
                  </div>
                  <div className="flex items-center gap-1 font-bold text-amber-300">
                    <IndianRupee className="h-3 w-3" />
                    {item.total}
                  </div>
                </div>
              ))}

              {/* Grand Total */}
              {ticket.grandTotal !== undefined && (
                <div className="flex items-center justify-between px-2.5 pt-2 border-t border-[#2e1a11] mt-1">
                  <span className="text-xs font-black text-zinc-300 uppercase tracking-wider">
                    Grand Total
                  </span>
                  <span className="flex items-center gap-1 font-black text-sm text-amber-400">
                    <IndianRupee className="h-3.5 w-3.5" />
                    {ticket.grandTotal}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="p-4 bg-[#140b07] border-t border-[#2e1a11] flex items-center justify-between gap-3">
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="flex items-center justify-center gap-2 flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold bg-[#24150e] border border-[#3d2417] text-amber-300 hover:bg-[#2d1b12] hover:border-amber-500/40 transition-all disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Checking...' : 'Refresh Status'}</span>
          </button>
        )}

        <button
          onClick={handleShare}
          className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold bg-amber-600/20 border border-amber-500/40 text-amber-300 hover:bg-amber-600/30 transition-all cursor-pointer"
        >
          <Share2 className="h-3.5 w-3.5" />
          <span>{copied ? 'Copied Link!' : 'Share'}</span>
        </button>
      </div>
    </div>
  );
}
