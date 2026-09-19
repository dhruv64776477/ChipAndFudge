'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { QrCode, PlusCircle, ScanLine, LogOut, Cookie, LayoutDashboard } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('/api/admin/auth/status')
      .then((r) => r.json())
      .then((data) => {
        setIsAdmin(data.isAuthenticated);
      })
      .catch(() => setIsAdmin(false));
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' });
      setIsAdmin(false);
      router.push('/admin/login');
    } catch (e) {
      console.error('Logout failed', e);
    }
  };

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/tickets/new', label: 'New Bowl', icon: PlusCircle },
    { href: '/admin/scanner', label: 'Scan & Close', icon: ScanLine },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#3b2316]/50 bg-[#140d08]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#f59e0b] to-[#b45309] shadow-md shadow-amber-950/40 group-hover:scale-105 transition-transform">
            <Cookie className="h-5 w-5 text-[#1a0f08]" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-lg tracking-tight text-[#fdf8f3] group-hover:text-amber-400 transition-colors">
              The Chip &amp; Fudge
            </span>
            <span className="text-[10px] uppercase font-semibold tracking-widest text-amber-500/90 -mt-1">
              Artisan Brownie Hub
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="flex items-center gap-1.5 sm:gap-2">
          {isAdmin && (
            <>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                        : 'text-zinc-300 hover:text-white hover:bg-[#251710]'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </Link>
                );
              })}

              <button
                onClick={handleLogout}
                title="Logout"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-rose-300 hover:bg-rose-950/30 transition-colors ml-1"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden md:inline">Logout</span>
              </button>
            </>
          )}

          {!isAdmin && pathname !== '/admin/login' && pathname !== '/admin/setup' && (
            <Link
              href="/admin"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-amber-600 to-amber-700 text-amber-50 hover:from-amber-500 hover:to-amber-600 shadow-sm shadow-amber-950 transition-all"
            >
              <QrCode className="h-3.5 w-3.5" />
              <span>Admin Portal</span>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
