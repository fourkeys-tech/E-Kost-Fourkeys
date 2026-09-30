'use client';

import { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { PageLoader } from '@/components/ui/Loading';
import { User, Phone, Mail, Shield, Save, Loader2, Moon, Sun, Monitor, CheckCircle2 } from 'lucide-react';
import { applyTheme } from '@/components/layout/ThemeProvider';

export default function SettingsPage() {
  const { user, loading, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'appearance'>('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Form states
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [themePref, setThemePref] = useState(user?.themePreference || 'system');
  
  // Password states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  if (loading) return <PageLoader />;
  if (!user) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMsg('');
    
    setTimeout(() => {
      updateUser({ ...user, name, phone });
      setSuccessMsg('Profil berhasil diperbarui!');
      setIsSaving(false);
      setTimeout(() => setSuccessMsg(''), 3000);
    }, 1000);
  };

  const handleSaveTheme = async (pref: string) => {
    setThemePref(pref);
    applyTheme(pref);
    updateUser({ ...user, themePreference: pref });
  };

  const tabs = [
    { id: 'profile', label: 'Profil Akun', icon: User },
    { id: 'security', label: 'Keamanan & Sandi', icon: Shield },
    { id: 'appearance', label: 'Tampilan (Tema)', icon: Monitor },
  ] as const;

  return (
    <AppLayout 
      title="Pengaturan" 
      subtitle="Kelola profil, keamanan, dan preferensi tampilan Anda"
    >
      <div className="section" style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        {successMsg && (
          <div style={{ marginBottom: '20px', padding: '16px', background: 'var(--brand-50)', border: '1px solid var(--brand-100)', borderRadius: 'var(--r-md)', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--brand-700)', fontWeight: 600 }}>
            <CheckCircle2 size={18} /> {successMsg}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 260px) 1fr', gap: '30px', alignItems: 'start' }}>
          
          {/* Sidebar Tabs */}
          <div className="card" style={{ padding: '8px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {tabs.map(tab => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
                      borderRadius: 'var(--r-sm)', background: isActive ? 'var(--brand-50)' : 'transparent',
                      color: isActive ? 'var(--brand-600)' : 'var(--txt-secondary)',
                      fontWeight: isActive ? 700 : 500, border: 'none', cursor: 'pointer',
                      textAlign: 'left', transition: 'all 0.2s', width: '100%',
                      boxShadow: isActive ? 'inset 3px 0 0 var(--brand-600)' : 'none'
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'var(--bg-sunken)';
                        e.currentTarget.style.color = 'var(--txt-primary)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--txt-secondary)';
                      }
                    }}
                  >
                    <tab.icon size={18} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content Pane */}
          <div className="card" style={{ padding: '32px' }}>
            
            {activeTab === 'profile' && (
              <div className="stack-lg">
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--txt-primary)', marginBottom: '4px' }}>Informasi Pribadi</h3>
                  <p style={{ fontSize: '13px', color: 'var(--txt-muted)' }}>Perbarui detail profil pribadi dan kontak Anda.</p>
                </div>
                
                <form onSubmit={handleSaveProfile} className="stack-md" style={{ maxWidth: '400px' }}>
                  <div className="form-group">
                    <label className="form-label">Alamat Email <span style={{ color: 'var(--txt-muted)', fontWeight: 400 }}>(Tidak dapat diubah)</span></label>
                    <div style={{ position: 'relative' }}>
                      <Mail size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--txt-muted)' }} />
                      <input type="email" value={user.email} disabled className="form-input" style={{ paddingLeft: '40px', background: 'var(--bg-sunken)', color: 'var(--txt-muted)', cursor: 'not-allowed' }} />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="name" className="form-label">Nama Lengkap</label>
                    <div style={{ position: 'relative' }}>
                      <User size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--brand-500)' }} />
                      <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required className="form-input" style={{ paddingLeft: '40px' }} />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="phone" className="form-label">Nomor WhatsApp</label>
                    <div style={{ position: 'relative' }}>
                      <Phone size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--brand-500)' }} />
                      <input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="form-input" style={{ paddingLeft: '40px' }} />
                    </div>
                  </div>

                  <div style={{ marginTop: '10px' }}>
                    <button type="submit" disabled={isSaving} className="btn btn--primary">
                      {isSaving ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
                      Simpan Perubahan
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="stack-lg">
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--txt-primary)', marginBottom: '4px' }}>Keamanan & Sandi</h3>
                  <p style={{ fontSize: '13px', color: 'var(--txt-muted)' }}>Perbarui kata sandi Anda untuk menjaga keamanan akun.</p>
                </div>
                
                <form className="stack-md" onSubmit={(e) => e.preventDefault()} style={{ maxWidth: '400px' }}>
                  <div className="form-group">
                    <label htmlFor="current" className="form-label">Kata Sandi Saat Ini</label>
                    <input id="current" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="form-input" />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="new" className="form-label">Kata Sandi Baru</label>
                    <input id="new" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="form-input" />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="confirm" className="form-label">Konfirmasi Kata Sandi Baru</label>
                    <input id="confirm" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="form-input" />
                  </div>

                  <div style={{ marginTop: '10px' }}>
                    <button type="button" className="btn btn--primary">
                      <Shield size={16} /> Perbarui Kata Sandi
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="stack-lg">
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--txt-primary)', marginBottom: '4px' }}>Tema Antarmuka</h3>
                  <p style={{ fontSize: '13px', color: 'var(--txt-muted)' }}>Sesuaikan tampilan KostPay agar lebih nyaman di mata Anda.</p>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px', marginTop: '10px' }}>
                  {[
                    { id: 'light', label: 'Terang', Icon: Sun, c: '#F97316', bg: '#FFF7ED', bdr: '#FFEDD5' },
                    { id: 'dark', label: 'Gelap', Icon: Moon, c: '#3B82F6', bg: '#EFF6FF', bdr: '#DBEAFE' },
                    { id: 'system', label: 'Otomatis', Icon: Monitor, c: '#6366F1', bg: '#EEF2FF', bdr: '#E0E7FF' },
                  ].map(theme => (
                    <div 
                      key={theme.id}
                      onClick={() => handleSaveTheme(theme.id)}
                      style={{
                        padding: '24px 16px', borderRadius: 'var(--r-md)',
                        border: `2px solid ${themePref === theme.id ? 'var(--brand-500)' : 'var(--bdr-subtle)'}`,
                        background: themePref === theme.id ? 'var(--brand-50)' : 'var(--bg-surface)',
                        cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px',
                        transition: 'all 0.2s', textAlign: 'center',
                        boxShadow: themePref === theme.id ? 'var(--shd-md)' : 'none'
                      }}
                    >
                      <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: theme.bg, border: `1px solid ${theme.bdr}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <theme.Icon size={24} color={theme.c} />
                      </div>
                      <span style={{ fontWeight: 600, fontSize: '14px', color: themePref === theme.id ? 'var(--brand-700)' : 'var(--txt-secondary)' }}>
                        {theme.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
