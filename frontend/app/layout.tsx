import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import ThemeProvider from '@/components/layout/ThemeProvider';

import { ToastProvider } from '@/contexts/ToastContext';

export const metadata: Metadata = {
  title: 'KostPay — Sistem Informasi Pembayaran Kost & Kontrakan',
  description: 'Platform digital untuk mengelola kost dan kontrakan: tagihan otomatis, pembayaran online, laporan keuangan, dan notifikasi real-time.',
  keywords: 'kost, kontrakan, pembayaran kost, sewa kamar, manajemen kost',
};

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href="/css/flux-1.css" />
        <link rel="stylesheet" href="/css/flux-2.css" />
      </head>
      <body>
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
