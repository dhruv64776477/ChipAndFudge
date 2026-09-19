'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import {
  Cookie,
  Flame,
  Sparkles,
  QrCode,
  ShieldCheck,
  ArrowRight,
  Search,
  ScanLine,
  CheckCircle2,
  Lock,
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [tokenInput, setTokenInput] = useState('');

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = tokenInput.trim();
    if (!cleaned) return;

    if (cleaned.includes('/t/')) {
      const parts = cleaned.split('/t/');
      const token = parts[parts.length - 1].split('?')[0];
      router.push(`/t/${token}`);
    } else {
      router.push(`/t/${cleaned}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#0e0805] text-[#fcf8f3] flex flex-col selection:bg-amber-500 selection:text-black">
      <Navbar />

      <main className="flex-1 flex flex-col">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-b border-[#2d1b11]">
          {/* Ambient warm glows */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-10 right-10 w-72 h-72 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

          <div className="relative max-w-4xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold tracking-wide shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>Handcrafted Artisan Brownie Bowls</span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.08]">
              The Chip <span className="text-amber-500">&amp;</span> Fudge
            </h1>

            <p className="max-w-2xl mx-auto text-base sm:text-lg text-[#cdb7a6] leading-relaxed">
              Warm, molten brownie indulgence baked with Belgian chocolate, served with gourmet scoops and tracked live with cryptographic QR tickets.
            </p>

            {/* Live Order Tracker Input */}
            <div className="pt-4 max-w-md mx-auto">
              <form
                onSubmit={handleTrackSubmit}
                className="flex items-center gap-2 bg-[#1f120a] border border-[#442718] p-1.5 rounded-2xl shadow-2xl focus-within:border-amber-500 transition-colors"
              >
                <div className="pl-3 text-amber-500">
                  <Search className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  placeholder="Paste Ticket Token or URL..."
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  className="flex-1 bg-transparent py-2 px-2 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!tokenInput.trim()}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-[#140b07] font-bold text-xs transition-all disabled:opacity-50 flex items-center gap-1 shrink-0"
                >
                  <span>Track Bowl</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </form>
              <span className="text-[11px] text-zinc-500 block mt-2">
                Have a QR ticket slip? Point your camera at it or paste your token above.
              </span>
            </div>

            {/* Quick Staff Gateway */}
            <div className="pt-6 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-xs font-bold shadow-lg shadow-amber-950/60 transition-all hover:scale-105"
              >
                <Lock className="h-3.5 w-3.5" />
                <span>Stall Admin Panel</span>
              </Link>
              <Link
                href="/admin/scanner"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#23140c] hover:bg-[#301b10] border border-[#3e2417] text-amber-300 text-xs font-bold shadow-md transition-all hover:scale-105"
              >
                <ScanLine className="h-3.5 w-3.5 text-amber-400" />
                <span>Open QR Scanner</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Feature Highlights */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-3xl border border-[#352014] bg-gradient-to-b from-[#1b100a] to-[#120a06] p-6 shadow-xl space-y-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <QrCode className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white">Live QR Tickets</h3>
              <p className="text-xs text-[#b8a291] leading-relaxed">
                Every brownie bowl gets a high-resolution cryptographic QR code with real-time status updates from preparation to fulfillment.
              </p>
            </div>

            <div className="rounded-3xl border border-[#352014] bg-gradient-to-b from-[#1b100a] to-[#120a06] p-6 shadow-xl space-y-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white">Atomic Scanning</h3>
              <p className="text-xs text-[#b8a291] leading-relaxed">
                Stall camera scans QR codes to close orders atomically with zero risk of duplicate serving or race conditions.
              </p>
            </div>

            <div className="rounded-3xl border border-[#352014] bg-gradient-to-b from-[#1b100a] to-[#120a06] p-6 shadow-xl space-y-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white">FIDO2 Passkeys</h3>
              <p className="text-xs text-[#b8a291] leading-relaxed">
                Device-bound WebAuthn master credentials prevent unauthorized ticket creation or scanning. No passwords to leak.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#2d1b11] py-8 text-center text-xs text-[#806958]">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Cookie className="h-4 w-4 text-amber-500" />
            <span className="font-bold text-zinc-300">The Chip &amp; Fudge</span>
            <span>- Artisan Dessert Stall</span>
          </div>
          <div>
            Built with Next.js, Mongoose &amp; WebAuthn Passkeys
          </div>
        </div>
      </footer>
    </div>
  );
}
