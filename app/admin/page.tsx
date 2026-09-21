"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  PlusCircle,
  QrCode,
  LogOut,
  MessageSquareText,
  Utensils,
} from "lucide-react";

export default function AdminPage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    async function verifyAuth() {
      try {
        const res = await fetch("/api/admin/auth/session");
        const data = await res.json();
        if (!res.ok || !data.isAuthenticated) {
          router.replace("/admin/login");
          return;
        }
      } catch {
        router.replace("/admin/login");
        return;
      } finally {
        setCheckingAuth(false);
      }
    }
    verifyAuth();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    router.replace("/admin/login");
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#0d0704] text-[#fdfbf7] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0704] text-[#fdfbf7] flex flex-col justify-between p-6 sm:p-10 selection:bg-amber-500 selection:text-black">
      {/* Header */}
      <header className="max-w-md w-full mx-auto text-center pt-6 sm:pt-12">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl  mb-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/cf logo.png" alt="Logo" />
        </div>
        <p className="text-xs uppercase font-extrabold tracking-widest text-amber-500/90 mt-1">
          Admin Portal
        </p>
      </header>

      {/* Primary Actions: Only TWO tasks */}
      <main className="max-w-md w-full mx-auto my-auto space-y-5 py-8">
        {/* Task 1: Create Ticket */}
        <Link
          href="/admin/tickets/new"
          className="group block w-full p-6 rounded-3xl bg-gradient-to-b from-[#25150d] to-[#170c07] border border-[#442617] hover:border-amber-500/60 shadow-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.99] text-center"
        >
          <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:bg-amber-500 group-hover:text-black transition-colors">
            <PlusCircle className="w-6 h-6" />
          </div>
          <span className="block text-lg font-black uppercase tracking-wider text-white group-hover:text-amber-300 transition-colors">
            Create Ticket
          </span>
          <span className="block text-xs text-zinc-400 mt-1 font-medium">
            New customer brownie order &amp; QR
          </span>
        </Link>

        {/* Task 2: Scan & Close Ticket */}
        <Link
          href="/admin/scanner"
          className="group block w-full p-6 rounded-3xl bg-gradient-to-b from-[#25150d] to-[#170c07] border border-[#442617] hover:border-amber-500/60 shadow-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.99] text-center"
        >
          <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:bg-amber-500 group-hover:text-black transition-colors">
            <QrCode className="w-6 h-6" />
          </div>
          <span className="block text-lg font-black uppercase tracking-wider text-white group-hover:text-amber-300 transition-colors">
            Scan &amp; Close Ticket
          </span>
          <span className="block text-xs text-zinc-400 mt-1 font-medium">
            Camera QR scanner to close order
          </span>
        </Link>

      </main>

      {/* Footer / Logout */}
      <footer className="max-w-md w-full mx-auto text-center pb-4">
        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-300 transition-colors py-2 px-3 rounded-lg hover:bg-zinc-900/40 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Log out</span>
        </button>
      </footer>
    </div>
  );
}
