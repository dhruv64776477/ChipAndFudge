import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'The Chip & Fudge | Artisan Brownie Bowls & QR Ticket Hub',
  description:
    'Live QR ticket management and real-time order tracking for The Chip & Fudge dessert stall.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${plusJakartaSans.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-[#120b07] text-[#fcf8f3]" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
