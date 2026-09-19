'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { startAuthentication } from '@simplewebauthn/browser';
import { Fingerprint, Lock, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function AdminLoginPage() {
  const router = useRouter();
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/auth/session')
      .then((r) => r.json())
      .then((data) => {
        setIsConfigured(data.isConfigured);
        if (data.isAuthenticated) {
          router.push('/admin');
        }
      })
      .catch((e) => console.error('Status error:', e));
  }, [router]);

  const handlePasskeyLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      const optRes = await fetch('/api/admin/auth/login/generate-options', {
        method: 'POST',
      });

      if (!optRes.ok) {
        const data = await optRes.json();
        throw new Error(data.error || 'Failed to start passkey login');
      }

      const options = await optRes.json();
      const authResponse = await startAuthentication({ optionsJSON: options });

      const verifyRes = await fetch('/api/admin/auth/login/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authResponse),
      });

      if (!verifyRes.ok) {
        const data = await verifyRes.json();
        throw new Error(data.error || 'Authentication assertion failed');
      }

      router.push('/admin');
    } catch (err: unknown) {
      console.error('Login error:', err);
      const msg = err instanceof Error ? err.message : 'Passkey login failed.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0e0805] text-[#fcf8f3] flex flex-col">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 py-12">
        <div className="w-full max-w-md">
          <div className="rounded-3xl border border-[#3b2316] bg-gradient-to-b from-[#21130c] via-[#1a0f09] to-[#120b07] p-8 sm:p-10 shadow-2xl shadow-black/80">
            {/* Header Icon */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center shadow-lg shadow-amber-950/60">
                  <Fingerprint className="h-8 w-8 text-[#1a0f08]" />
                </div>
                <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-amber-500 border-2 border-[#1a0f09] flex items-center justify-center">
                  <Lock className="h-3 w-3 text-[#1a0f08]" />
                </div>
              </div>
            </div>

            <div className="text-center mb-8">
              <span className="text-[11px] uppercase tracking-widest font-extrabold text-amber-400">
                Stall Staff Portal
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-white mt-1 mb-2">
                Passkey Sign In
              </h1>
              <p className="text-xs sm:text-sm text-[#bca795] leading-relaxed">
                Authenticate with your registered device biometric sensor.
              </p>
            </div>

            {isConfigured === false ? (
              <div className="rounded-2xl bg-[#2a170f] border border-amber-500/30 p-6 text-center">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-amber-500/20 text-amber-400 mx-auto mb-3">
                  <Sparkles className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-white mb-1">First-Time Setup Needed</h3>
                <p className="text-xs text-[#c9b5a4] mb-5">
                  No master passkey device has been enrolled yet. Please register your device first.
                </p>
                <Link
                  href="/admin/setup"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 text-white text-xs font-bold hover:from-amber-500 hover:to-amber-600 shadow-md transition-all cursor-pointer"
                >
                  <span>Go to First-Time Setup</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {error && (
                  <div className="flex items-start gap-2.5 rounded-2xl bg-rose-950/50 border border-rose-800/60 p-4 text-xs text-rose-300">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  onClick={handlePasskeyLogin}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl font-bold text-sm bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-[#140b07] hover:brightness-110 shadow-lg shadow-amber-950/60 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Fingerprint className="h-5 w-5" />
                  <span>{loading ? 'Verifying Sensor...' : 'Sign In with Passkey'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
