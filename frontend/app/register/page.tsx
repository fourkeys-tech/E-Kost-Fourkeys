'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Building2, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { ThemeToggle } from '@/components/layout/ThemeProvider';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'TENANT',
    idCardNumber: '',
    emergencyContact: '',
  });
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await register(formData);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Gagal mendaftar. Pastikan data valid.');
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
          Daftar Akun Baru
        </h1>
        <p style={{ color: 'var(--txt-muted)', marginBottom: '2rem', fontSize: '0.9375rem' }}>
          Sudah punya akun?{' '}
          <Link href="/login" style={{ color: 'var(--brand-600)', fontWeight: 600 }}>Masuk di sini</Link>
        </p>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '1.25rem' }}>
            <AlertCircle style={{ width: '1.125rem', height: '1.125rem', flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
          <div style={{ display: 'flex', background: 'var(--bg-sunken)', padding: '0.25rem', borderRadius: '0.5rem', marginBottom: '0.5rem' }}>
            <button 
              type="button"
              style={{
                flex: 1, padding: '0.5rem', fontSize: '0.875rem', fontWeight: 600, borderRadius: '0.375rem', border: 'none', cursor: 'pointer', transition: 'all 0.2s ease',
                background: formData.role === 'TENANT' ? 'var(--bg-surface)' : 'transparent',
                color: formData.role === 'TENANT' ? 'var(--txt-primary)' : 'var(--txt-muted)',
                boxShadow: formData.role === 'TENANT' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
              onClick={() => setFormData({...formData, role: 'TENANT'})}
            >
              Penyewa
            </button>
            <button 
              type="button"
              style={{
                flex: 1, padding: '0.5rem', fontSize: '0.875rem', fontWeight: 600, borderRadius: '0.375rem', border: 'none', cursor: 'pointer', transition: 'all 0.2s ease',
                background: formData.role === 'OWNER' ? 'var(--bg-surface)' : 'transparent',
                color: formData.role === 'OWNER' ? 'var(--txt-primary)' : 'var(--txt-muted)',
                boxShadow: formData.role === 'OWNER' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
              onClick={() => setFormData({...formData, role: 'OWNER'})}
            >
              Pemilik Kost
            </button>
          </div>

          <div className="form-group">
            <label htmlFor="name" className="form-label">Nama Lengkap</label>
            <input
              id="name"
              type="text"
              required
              className="form-input"
              placeholder="Budi Santoso"
              value={formData.name}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label">Alamat Email</label>
            <input
              id="email"
              type="email"
              required
              className="form-input"
              placeholder="nama@email.com"
              value={formData.email}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone" className="form-label">Nomor WhatsApp {formData.role === 'OWNER' && '(Opsional)'}</label>
            <input
              id="phone"
              type="tel"
              className="form-input"
              placeholder="0812xxxx"
              value={formData.phone}
              onChange={handleChange}
              disabled={isLoading}
              required={formData.role === 'TENANT'}
            />
          </div>

          {formData.role === 'TENANT' && (
            <>
              <div className="form-group">
                <label htmlFor="idCardNumber" className="form-label">Nomor KTP (NIK)</label>
                <input
                  id="idCardNumber"
                  type="text"
                  required
                  className="form-input"
                  placeholder="3171xxxxxxxxxxxx"
                  value={formData.idCardNumber}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>
              <div className="form-group">
                <label htmlFor="emergencyContact" className="form-label">Kontak Darurat</label>
                <input
                  id="emergencyContact"
                  type="text"
                  required
                  className="form-input"
                  placeholder="0812xxxx (Ayah/Ibu)"
                  value={formData.emergencyContact}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label htmlFor="password" className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPwd ? 'text' : 'password'}
                required
                minLength={8}
                className="form-input"
                placeholder="Minimal 8 karakter"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
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
            {isLoading ? 'Memproses...' : 'Daftar Sekarang'}
          </button>
        </form>
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
            Sistem Manajemen Kost Modern
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, fontSize: '1.0625rem' }}>
            Gabung bersama ribuan pengguna lainnya yang telah mendigitalisasi pengelolaan kost mereka.
          </p>
          <div style={{ marginTop: '2.5rem', display: 'flex', flexDirection: 'column', gap: '0.875rem', textAlign: 'left' }}>
            {['Manajemen tagihan otomatis', 'Terima pembayaran dengan mudah', 'Dashboard analitik real-time'].map((text, i) => (
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
