'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { startRegistration } from '@simplewebauthn/browser';
import {
  Fingerprint,
  Lock,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';

export default function AdminSetupPage() {
  const router = useRouter();
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch('/api/admin/auth/session')
      .then((r) => r.json())
      .then((data) => {
        setIsConfigured(data.isConfigured);
        if (data.isAuthenticated) {
          router.push('/admin');
        }
      })
      .catch((e) => console.error('Session check error:', e));
  }, [router]);

  const handleRegisterPasskey = async () => {
    setLoading(true);
    setError(null);

    try {
      const optRes = await fetch('/api/admin/auth/register/options', {
        method: 'POST',
      });

      if (!optRes.ok) {
        const data = await optRes.json();
        throw new Error(data.error || 'Failed to generate passkey options');
      }

      const options = await optRes.json();
      const regResponse = await startRegistration({ optionsJSON: options });

      const verifyRes = await fetch('/api/admin/auth/register/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regResponse),
      });

      if (!verifyRes.ok) {
        const data = await verifyRes.json();
        throw new Error(data.error || 'Verification of passkey failed');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/admin');
      }, 1500);
    } catch (err: unknown) {
      console.error('Registration error:', err);
      const msg = err instanceof Error ? err.message : 'Passkey registration cancelled.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0e0805] text-[#fcf8f3] flex flex-col">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 py-12">
        <div className="w-full max-w-lg">
          <div className="rounded-3xl border border-[#3b2316] bg-gradient-to-b from-[#21130c] via-[#1a0f09] to-[#120b07] p-8 sm:p-10 shadow-2xl shadow-black/80">
            {/* Header Icon */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center shadow-lg shadow-amber-950/60">
                  <Fingerprint className="h-8 w-8 text-[#1a0f08]" />
                </div>
                <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-emerald-500 border-2 border-[#1a0f09] flex items-center justify-center">
                  <Lock className="h-3 w-3 text-white" />
                </div>
              </div>
            </div>

            <div className="text-center mb-6">
              <span className="text-[11px] uppercase tracking-widest font-extrabold text-amber-400">
                Security Enrolment
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-white mt-1 mb-2">
                Register Master Device
              </h1>
              <p className="text-xs sm:text-sm text-[#bca795] leading-relaxed">
                Protect <span className="text-amber-400 font-semibold">The Chip &amp; Fudge</span> stall operations. Only ONE master device will be authorized.
              </p>
            </div>

            {isConfigured === true ? (
              <div className="rounded-2xl bg-[#2a170f] border border-amber-500/30 p-6 text-center">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-amber-500/20 text-amber-400 mx-auto mb-3">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-white mb-1">Master Device Already Registered</h3>
                <p className="text-xs text-[#c9b5a4] mb-6">
                  Only the registered master device is authorized to create tickets and scan QR codes.
                </p>
                <Link
                  href="/admin/login"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 text-white text-xs font-bold hover:from-amber-500 hover:to-amber-600 shadow-md transition-all cursor-pointer"
                >
                  <span>Go to Login</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {error && (
                  <div className="flex items-start gap-2.5 rounded-2xl bg-rose-950/50 border border-rose-800/60 p-4 text-xs text-rose-300">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
                    <span>{error}</span>
                  </div>
                )}

                {success && (
                  <div className="flex items-center gap-2.5 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 p-4 text-xs text-emerald-300">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                    <span>Master device registered! Redirecting to dashboard...</span>
                  </div>
                )}

                {/* Primary WebAuthn Button */}
                <button
                  onClick={handleRegisterPasskey}
                  disabled={loading || success}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl font-bold text-sm bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-[#140b07] hover:brightness-110 shadow-lg shadow-amber-950/60 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Fingerprint className="h-5 w-5" />
                  <span>{loading ? 'Processing...' : 'Register Biometric Passkey'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
