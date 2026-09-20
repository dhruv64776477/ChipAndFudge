"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  LogOut,
  MessageSquareText,
  QrCode,
  ShieldAlert,
  Wifi,
  WifiOff,
} from "lucide-react";

type WhatsAppStatus =
  | "needs_authentication"
  | "connecting"
  | "connected"
  | "disconnected"
  | "logged_out";

export default function AdminWhatsAppPage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [status, setStatus] = useState<WhatsAppStatus>("needs_authentication");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadStatus() {
    try {
      const res = await fetch("/api/admin/whatsapp/status", {
        cache: "no-store",
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Unable to load WhatsApp status");
      }

      setStatus(data.status);
      setQrCode(data.qrCode || null);
    } catch (err) {
      console.error("Status fetch error:", err);
      setError(
        err instanceof Error ? err.message : "Unable to load WhatsApp status",
      );
    }
  }

  useEffect(() => {
    async function verifyAccess() {
      try {
        const res = await fetch("/api/admin/auth/session", {
          cache: "no-store",
        });
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

      await loadStatus();
    }

    void verifyAccess();
  }, [router]);

  async function handleConnect() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/whatsapp/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Unable to connect WhatsApp");
      }

      setStatus(data.status);
      setQrCode(data.qrCode || null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to connect WhatsApp",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/whatsapp/logout", { method: "POST" });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Unable to log out WhatsApp");
      }

      setStatus(data.status);
      setQrCode(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to log out WhatsApp",
      );
    } finally {
      setLoading(false);
    }
  }

  const statusLabel = {
    needs_authentication: "NEEDS_AUTHENTICATION",
    connecting: "CONNECTING",
    connected: "CONNECTED",
    disconnected: "DISCONNECTED",
    logged_out: "LOGGED_OUT",
  }[status];

  const statusIcon = {
    needs_authentication: <ShieldAlert className="h-4 w-4" />,
    connecting: <Loader2 className="h-4 w-4 animate-spin" />,
    connected: <CheckCircle2 className="h-4 w-4" />,
    disconnected: <WifiOff className="h-4 w-4" />,
    logged_out: <AlertTriangle className="h-4 w-4" />,
  }[status];

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#0d0704] text-[#fdfbf7] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0704] text-[#fdfbf7] flex flex-col p-4 sm:p-8">
      <div className="max-w-3xl mx-auto w-full">
        <div className="rounded-3xl border border-[#3b2316] bg-gradient-to-b from-[#20130b] to-[#120b07] p-6 sm:p-8 shadow-2xl shadow-black/60">
          <div className="flex items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-amber-400">
                <MessageSquareText className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] font-extrabold text-amber-400">
                  WhatsApp
                </p>
                <h1 className="text-xl sm:text-2xl font-black text-white">
                  Connection Status
                </h1>
              </div>
            </div>

            {status === "connected" && (
              <button
                type="button"
                onClick={handleLogout}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900/60 px-3 py-2 text-xs font-bold text-zinc-300 hover:text-white hover:border-zinc-500 transition-colors cursor-pointer disabled:opacity-50"
              >
                <LogOut className="h-3.5 w-3.5" />
                Logout
              </button>
            )}
          </div>

          <div className="rounded-2xl border border-[#442617] bg-[#190e08] p-4 mb-6">
            <div className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
              <span className="text-amber-400">{statusIcon}</span>
              <span>WhatsApp Status: {statusLabel}</span>
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-2xl border border-rose-800/60 bg-rose-950/40 p-3 text-xs text-rose-300">
              {error}
            </div>
          )}

          {status === "needs_authentication" && qrCode && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-4 inline-flex shadow-xl">
                <img
                  src={qrCode}
                  alt="WhatsApp QR code"
                  className="w-64 h-64 rounded-xl"
                />
              </div>
              <p className="text-sm text-zinc-300">
                Scan this QR code with WhatsApp to connect.
              </p>
            </div>
          )}

          {status === "logged_out" && (
            <div className="space-y-4">
              <p className="text-sm text-zinc-300">
                WhatsApp authentication required. Connect again to continue
                sending ticket updates.
              </p>
              <button
                type="button"
                onClick={handleConnect}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 px-5 py-3 text-sm font-black uppercase tracking-wider text-[#140b07] shadow-lg shadow-amber-950/60 transition-all hover:brightness-110 disabled:opacity-50 cursor-pointer"
              >
                <QrCode className="h-4 w-4" />
                {loading ? "Connecting..." : "Connect WhatsApp"}
              </button>
            </div>
          )}

          {status === "connecting" && (
            <div className="flex items-center gap-2 text-sm text-zinc-300">
              <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
              Waiting for WhatsApp to finish connecting...
            </div>
          )}

          {status === "connected" && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-emerald-300">
                <Wifi className="h-4 w-4" />
                WhatsApp is connected and ready to send tickets.
              </div>
            </div>
          )}

          {status === "disconnected" && (
            <div className="space-y-4">
              <p className="text-sm text-zinc-300">
                The connection is disconnected. Try reconnecting.
              </p>
              <button
                type="button"
                onClick={handleConnect}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 px-5 py-3 text-sm font-black uppercase tracking-wider text-[#140b07] shadow-lg shadow-amber-950/60 transition-all hover:brightness-110 disabled:opacity-50 cursor-pointer"
              >
                <Wifi className="h-4 w-4" />
                {loading ? "Connecting..." : "Reconnect WhatsApp"}
              </button>
            </div>
          )}

          {status === "needs_authentication" && !qrCode && (
            <div className="space-y-4">
              <p className="text-sm text-zinc-300">
                No active WhatsApp session was found. Generate a new QR code to
                authenticate.
              </p>
              <button
                type="button"
                onClick={handleConnect}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 px-5 py-3 text-sm font-black uppercase tracking-wider text-[#140b07] shadow-lg shadow-amber-950/60 transition-all hover:brightness-110 disabled:opacity-50 cursor-pointer"
              >
                <QrCode className="h-4 w-4" />
                {loading ? "Generating QR..." : "Generate QR"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
