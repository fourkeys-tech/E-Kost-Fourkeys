'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Building2, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { ThemeToggle } from '@/components/layout/ThemeProvider';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Gagal masuk. Periksa email dan password Anda.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg-base)' }}>
      {/* ── Left panel (form) ── */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: 'clamp(1.5rem, 5vw, 4rem)',
        maxWidth: '520px',
        width: '100%',
        margin: '0 auto',
      }}>
        {/* Top bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{ width: '2rem', height: '2rem', background: 'var(--brand-500)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 style={{ width: '1.125rem', height: '1.125rem', color: '#fff' }} />
            </div>
            <span style={{ fontWeight: 800, fontSize: '1.0625rem', color: 'var(--txt-primary)', letterSpacing: '-0.025em' }}>KostPay</span>
          </Link>
          <ThemeToggle />
        </div>

        <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: '0.5rem' }}>
          Masuk ke Akun
        </h1>
        <p style={{ color: 'var(--txt-muted)', marginBottom: '2rem', fontSize: '0.9375rem' }}>
          Belum punya akun?{' '}
          <Link href="/register" style={{ color: 'var(--brand-600)', fontWeight: 600 }}>Daftar gratis</Link>
        </p>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '1.25rem' }}>
            <AlertCircle style={{ width: '1.125rem', height: '1.125rem', flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
          <div className="form-group">
            <label htmlFor="email" className="form-label">Alamat Email</label>
            <input
              id="email"
              type="email"
              required
              className="form-input"
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label htmlFor="password" className="form-label">Password</label>
              <button type="button" style={{ fontSize: '0.8125rem', color: 'var(--brand-600)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
                Lupa password?
              </button>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPwd ? 'text' : 'password'}
                required
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                autoComplete="current-password"
                style={{ paddingRight: '2.75rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPwd(v => !v)}
                style={{
                  position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: 'var(--txt-muted)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center',
                }}
                aria-label={showPwd ? 'Sembunyikan password' : 'Tampilkan password'}
              >
                {showPwd ? <EyeOff style={{ width: '1.125rem' }} /> : <Eye style={{ width: '1.125rem' }} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn--primary btn--lg"
            disabled={isLoading}
            style={{ width: '100%', marginTop: '0.5rem' }}
          >
            {isLoading ? <Loader2 style={{ width: '1.125rem', height: '1.125rem', animation: 'spin 0.75s linear infinite' }} /> : null}
            {isLoading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>

        {/* Demo accounts */}
        <div style={{
          marginTop: '2rem',
          padding: '1rem 1.125rem',
          background: 'var(--bg-sunken)',
          border: '1px solid var(--bdr-default)',
          borderRadius: 'var(--r-md)',
        }}>
          <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--txt-primary)', marginBottom: '0.625rem' }}>
            🔑 Akun Demo untuk Coba
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            {[
              { role: 'Owner', email: 'owner@kostpay.id', pwd: 'Password123!' },
              { role: 'Admin', email: 'admin@kostpay.id', pwd: 'Password123!' },
              { role: 'Penyewa', email: 'andi@kostpay.id', pwd: 'Password123!' },
            ].map((acc) => (
              <button
                key={acc.role}
                type="button"
                onClick={() => { setEmail(acc.email); setPassword(acc.pwd); }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.5rem 0.75rem', background: 'var(--bg-surface)',
                  border: '1px solid var(--bdr-default)', borderRadius: 'var(--r-sm)',
                  cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s ease',
                  fontSize: '0.8125rem',
                }}
              >
                <span style={{ fontWeight: 600, color: 'var(--txt-primary)' }}>{acc.role}</span>
                <span style={{ color: 'var(--txt-muted)', fontFamily: 'monospace', fontSize: '0.75rem' }}>{acc.email}</span>
              </button>
            ))}
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--txt-muted)', marginTop: '0.5rem' }}>Klik baris akun untuk auto-fill form</p>
        </div>
      </div>

      {/* ── Right panel (branding) ── */}
      <div style={{
        flex: 1,
        background: 'linear-gradient(135deg, #1D4ED8 0%, #4F46E5 50%, #7C3AED 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem',
        position: 'relative',
        overflow: 'hidden',
      }}
        className="hidden lg:flex"
      >
        {/* Background pattern */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.06) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.06) 0%, transparent 50%)',
        }} />
        <div style={{ maxWidth: '400px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{ width: '5rem', height: '5rem', background: 'rgba(255,255,255,0.15)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem' }}>
            <Building2 style={{ width: '2.5rem', height: '2.5rem', color: '#fff' }} />
          </div>
          <h2 style={{ fontSize: '1.875rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.025em', lineHeight: 1.2, marginBottom: '1rem' }}>
            Sistem Pembayaran Kost Modern
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, fontSize: '1.0625rem' }}>
            Kelola tagihan, verifikasi pembayaran, dan dapatkan laporan keuangan secara real-time.
          </p>
          <div style={{ marginTop: '2.5rem', display: 'flex', flexDirection: 'column', gap: '0.875rem', textAlign: 'left' }}>
            {['Tagihan otomatis H-7 sebelum jatuh tempo', 'Notifikasi WhatsApp & Email ke penyewa', 'Dashboard analitik pendapatan real-time'].map((text, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'rgba(255,255,255,0.9)', fontSize: '0.9375rem' }}>
                <div style={{ width: '1.375rem', height: '1.375rem', background: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.5 5L4 7.5L8.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                {text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
