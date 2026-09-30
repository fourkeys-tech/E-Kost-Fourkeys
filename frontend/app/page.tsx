import Link from 'next/link';
import { Building2, CheckCircle2, ArrowRight, BarChart3, Bell, Shield } from 'lucide-react';
import { ThemeToggle } from '@/components/layout/ThemeProvider';

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)', display: 'flex', flexDirection: 'column' }}>
      {/* ── NAVIGATION ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(250, 251, 252, 0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
        height: '64px',
        display: 'flex', alignItems: 'center',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{ width: '2rem', height: '2rem', background: 'var(--primary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 style={{ width: '1.125rem', height: '1.125rem', color: '#fff' }} />
            </div>
            <span style={{ fontSize: '1.0625rem', fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.025em' }}>KostPay</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ThemeToggle />
            <Link href="/login" className="btn btn-ghost btn-sm" style={{ display: 'none' }}>
              Masuk
            </Link>
            <Link href="/login" className="btn btn--secondary btn--sm">Masuk</Link>
            <Link href="/register" className="btn btn--primary btn--sm">Daftar Gratis</Link>
          </div>
        </div>
      </header>

      <main style={{ flex: 1 }}>
        {/* ── HERO ── */}
        <section style={{
          padding: 'clamp(3rem, 8vw, 6rem) 1.5rem',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Gradient blob */}
          <div style={{
            position: 'absolute', top: '-80px', left: '50%',
            transform: 'translateX(-50%)',
            width: 'min(700px, 100vw)',
            height: '500px',
            background: 'radial-gradient(ellipse at center, rgba(37,99,235,0.12) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          <div style={{ maxWidth: '760px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              background: 'var(--primary-light)', color: 'var(--primary)',
              padding: '0.375rem 0.875rem', borderRadius: '999px',
              fontSize: '0.8125rem', fontWeight: 600,
              marginBottom: '1.5rem',
              border: '1px solid rgba(37,99,235,0.2)',
            }}>
              <span>🎉</span>
              <span>Platform Manajemen Properti Sewaan #1</span>
            </div>

            <h1 style={{
              fontSize: 'clamp(2rem, 6vw, 3.5rem)',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
              color: 'var(--foreground)',
              marginBottom: '1.25rem',
            }}>
              Kelola Kost & Kontrakan{' '}
              <span style={{
                background: 'linear-gradient(135deg, var(--primary), #7C3AED)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                Lebih Modern
              </span>
            </h1>

            <p style={{
              fontSize: 'clamp(1rem, 2vw, 1.1875rem)',
              color: 'var(--muted)',
              lineHeight: 1.7,
              marginBottom: '2.5rem',
              maxWidth: '560px',
              marginInline: 'auto',
            }}>
              Otomatisasi tagihan, terima pembayaran online, dan pantau bisnis properti Anda dari mana saja — semuanya dalam satu platform.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/register" className="btn btn--primary btn--lg">
                Mulai Gratis Sekarang <ArrowRight style={{ width: '1.125rem', height: '1.125rem' }} />
              </Link>
              <Link href="/login" className="btn btn--secondary btn--lg">
                Masuk ke Dashboard
              </Link>
            </div>

            <p style={{ marginTop: '1rem', fontSize: '0.8125rem', color: 'var(--muted)' }}>
              Tidak perlu kartu kredit · Gratis selamanya untuk 1 properti
            </p>
          </div>
        </section>

        {/* ── STATS BAND ── */}
        <section style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '2rem 1.5rem' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '2rem', textAlign: 'center' }}>
            {[
              { value: '2.500+', label: 'Properti Dikelola' },
              { value: 'Rp 12M+', label: 'Tagihan Diproses' },
              { value: '98%', label: 'Tingkat Kolektibilitas' },
              { value: '15.000+', label: 'Penyewa Aktif' },
            ].map((stat, i) => (
              <div key={i}>
                <p style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 800, color: 'var(--primary)', letterSpacing: '-0.025em' }}>{stat.value}</p>
                <p style={{ fontSize: '0.875rem', color: 'var(--muted)', marginTop: '0.25rem' }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section style={{ padding: 'clamp(3rem, 6vw, 5rem) 1.5rem' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 'clamp(2rem, 4vw, 3.5rem)' }}>
              <h2 style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2.25rem)', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: '0.875rem' }}>
                Semua yang Anda Butuhkan
              </h2>
              <p style={{ color: 'var(--muted)', maxWidth: '480px', margin: '0 auto', lineHeight: 1.7 }}>
                Dirancang khusus untuk pemilik kost dan kontrakan Indonesia.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
              {[
                {
                  icon: <FileTextIcon />,
                  color: 'var(--primary)',
                  bg: 'var(--primary-light)',
                  title: 'Tagihan Otomatis',
                  desc: 'Sistem generate tagihan H-7 sebelum jatuh tempo secara otomatis, lengkap dengan kalkulasi denda keterlambatan.',
                },
                {
                  icon: <CreditCardIcon />,
                  color: 'var(--success)',
                  bg: 'var(--success-light)',
                  title: 'Pembayaran Fleksibel',
                  desc: 'Terima transfer manual dengan verifikasi bukti foto, atau integrasikan dengan Midtrans (VA, GoPay, QRIS, dll).',
                },
                {
                  icon: <Bell style={{ width: '1.25rem', height: '1.25rem' }} />,
                  color: 'var(--warning)',
                  bg: 'var(--warning-light)',
                  title: 'Notifikasi Otomatis',
                  desc: 'Kirim pengingat tagihan via Email dan WhatsApp di H-3 dan H-1, sehingga keterlambatan berkurang drastis.',
                },
                {
                  icon: <BarChart3 style={{ width: '1.25rem', height: '1.25rem' }} />,
                  color: 'var(--primary)',
                  bg: 'var(--primary-light)',
                  title: 'Laporan Real-time',
                  desc: 'Dashboard analitik dengan grafik pendapatan, tingkat okupansi, dan tunggakan. Export ke Excel/PDF kapan saja.',
                },
                {
                  icon: <Building2 style={{ width: '1.25rem', height: '1.25rem' }} />,
                  color: 'var(--success)',
                  bg: 'var(--success-light)',
                  title: 'Multi-Properti',
                  desc: 'Kelola banyak kost dan kontrakan dalam satu akun. Tambahkan admin untuk membantu operasional harian.',
                },
                {
                  icon: <Shield style={{ width: '1.25rem', height: '1.25rem' }} />,
                  color: '#7C3AED',
                  bg: 'rgba(124,58,237,0.1)',
                  title: 'Aman & Terpercaya',
                  desc: 'Sistem keamanan JWT, enkripsi data, dan role-based access control (RBAC) untuk melindungi data bisnis Anda.',
                },
              ].map((f, i) => (
                <div key={i} className="card" style={{ transition: 'all 0.2s ease' }}>
                  <div style={{
                    width: '2.75rem', height: '2.75rem',
                    background: f.bg,
                    borderRadius: '10px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: f.color,
                    marginBottom: '1rem',
                    flexShrink: 0,
                  }}>
                    {f.icon}
                  </div>
                  <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--foreground)' }}>{f.title}</h3>
                  <p style={{ fontSize: '0.9rem', color: 'var(--muted)', lineHeight: 1.65 }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section style={{
          padding: 'clamp(3rem, 6vw, 5rem) 1.5rem',
          background: 'linear-gradient(135deg, var(--primary) 0%, #4F46E5 100%)',
          textAlign: 'center',
        }}>
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h2 style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2.25rem)', fontWeight: 800, color: '#fff', letterSpacing: '-0.025em', marginBottom: '1rem' }}>
              Mulai Kelola Properti Anda Hari Ini
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '2rem', lineHeight: 1.7, fontSize: '1.0625rem' }}>
              Bergabung dengan ribuan pemilik kost yang sudah menggunakan KostPay untuk mengotomatiskan bisnis mereka.
            </p>
            <div style={{ display: 'flex', gap: '0.875rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/register" className="btn btn-lg" style={{ background: '#fff', color: 'var(--primary)', border: 'none', fontWeight: 700 }}>
                Daftar Gratis <ArrowRight style={{ width: '1.125rem', height: '1.125rem' }} />
              </Link>
              <Link href="/login" className="btn btn-lg" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.3)' }}>
                Masuk ke Akun
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ── FOOTER ── */}
      <footer style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', padding: '2rem 1.5rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <Building2 style={{ width: '1.125rem', height: '1.125rem', color: 'var(--primary)' }} />
            <span style={{ fontWeight: 800, color: 'var(--foreground)', fontSize: '1rem' }}>KostPay</span>
          </div>
          <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>
            © {new Date().getFullYear()} KostPay. Hak cipta dilindungi.
          </p>
        </div>
      </footer>
    </div>
  );
}

// Mini icon helpers (inline to avoid import issues)
function FileTextIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
    </svg>
  );
}

function CreditCardIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
    </svg>
  );
}
