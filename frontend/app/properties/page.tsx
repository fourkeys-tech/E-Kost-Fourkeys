'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useAuth } from '@/contexts/AuthContext';
import { propertyApi } from '@/lib/api';
import { Property } from '@/types';
import { 
  Building2, Plus, MapPin, Search, ChevronRight,
  MoreVertical, Home, Users, CheckCircle2, X, Sparkles, AlertTriangle
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import LocationSelect from '@/components/properties/LocationSelect';
import { useToast } from '@/contexts/ToastContext';

// =============================================================================
// MODAL COMPONENT
// =============================================================================
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

function Modal({ open, onClose, title, subtitle, children, footer, size = 'md' }: ModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [open, onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;
  const maxW = size === 'sm' ? '400px' : size === 'lg' ? '720px' : '520px';

  return (
    <div
      ref={backdropRef}
      className="modal-backdrop"
      onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
      role="dialog" aria-modal="true"
    >
      <div className="modal" style={{ maxWidth: maxW }}>
        <div className="modal__header">
          <div>
            <h2 className="modal__title">{title}</h2>
            {subtitle && <p className="modal__subtitle">{subtitle}</p>}
          </div>
          <button className="modal__close" onClick={onClose} aria-label="Tutup">
            <X size={16} />
          </button>
        </div>
        <div className="modal__body">{children}</div>
        {footer && <div className="modal__footer">{footer}</div>}
      </div>
    </div>
  );
}

// =============================================================================
// PROPERTIES PAGE
// =============================================================================
export default function PropertiesPage() {
  const { user, loading: authLoading } = useRequireAuth({ allowedRoles: ['OWNER', 'ADMIN', 'SUPER_ADMIN'] });
  const { accessToken } = useAuth();
  const toast = useToast();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [limit] = useState(6);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Modal State
  const [activeModal, setActiveModal] = useState<'add' | null>(null);

  const fetchProperties = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const response = await propertyApi.list(accessToken, { page, limit, search });
      setProperties(response.data);
      setTotalPages(response.meta.totalPages);
      setTotalItems(response.meta.total);
    } catch (err) {
      console.error('Error fetching properties:', err);
    } finally {
      setLoading(false);
    }
  }, [accessToken, page, limit, search]);

  const handleCreateProperty = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!accessToken) return;
    
    const formData = new FormData(e.currentTarget);
    try {
      await propertyApi.create(formData, accessToken);
      toast.success('Properti berhasil ditambahkan');
      setActiveModal(null);
      fetchProperties();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menambahkan properti');
    }
  };

  useEffect(() => {
    if (!user) return;
    const timer = setTimeout(() => fetchProperties(), 300);
    return () => clearTimeout(timer);
  }, [user, fetchProperties]);

  if (authLoading || loading) return (
    <div className="page-loader">
      <div className="spinner" />
      <p style={{ fontSize: '13px', color: 'var(--txt-muted)' }}>Memuat properti...</p>
    </div>
  );
  if (!user) return null;

  // Gunakan data dari backend (yang sudah disaring di server)
  const filtered = properties;

  const totalRooms = properties.reduce((acc, p) => acc + (p._count?.rooms || 0), 0);
  const totalOccupied = properties.reduce((acc, p) => acc + (p.roomStats?.occupied || 0), 0);
  const occupancyRate = totalRooms > 0 ? Math.round((totalOccupied / totalRooms) * 100) : 0;

  return (
    <>
      {/* ── Add Property Modal ── */}
      <Modal
        open={activeModal === 'add'}
        onClose={() => setActiveModal(null)}
        title="Tambah Properti Baru"
        subtitle="Masukkan detail dasar properti kost atau kontrakan Anda."
        size="md"
        footer={
          <>
            <button className="btn btn--secondary" onClick={() => setActiveModal(null)}>Batal</button>
            <button type="submit" form="add-property-form" className="btn btn--primary">Simpan Properti <ChevronRight size={14} /></button>
          </>
        }
      >
        <form id="add-property-form" onSubmit={handleCreateProperty} className="stack-md">
          <div className="form-group">
            <label className="form-label">Nama Properti</label>
            <input type="text" name="name" className="form-input" placeholder="Misal: Kost Melati Indah" required />
          </div>
          <div className="form-group">
            <label className="form-label">Tipe Properti</label>
            <select name="type" className="form-input" required>
              <option value="KOST">Kost</option>
              <option value="KONTRAKAN_PETAK">Kontrakan Petak / Pintu</option>
              <option value="KONTRAKAN_RUMAH">Kontrakan Rumah Utuh</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Siklus Penagihan</label>
            <select name="billingCycle" className="form-input" required>
              <option value="MONTHLY">Bulanan (Umum untuk Kost)</option>
              <option value="YEARLY">Tahunan (Umum untuk Kontrakan)</option>
            </select>
          </div>
          
          <LocationSelect />

          <div className="form-group">
            <label className="form-label">Detail Alamat (Jalan, RT/RW, No)</label>
            <textarea name="address" className="form-textarea" placeholder="Cth: Jl. Melati No. 12, RT 01/RW 02..." required />
          </div>
          <div className="grid grid-cols-2" style={{ gap: '16px' }}>
             <div className="form-group">
              <label className="form-label">Denda Keterlambatan (%)</label>
              <input type="number" name="lateFeePct" className="form-input" placeholder="2.5" defaultValue="2.0" step="0.1" />
            </div>
            <div className="form-group">
              <label className="form-label">Batas Maksimal Denda (%)</label>
              <input type="number" name="maxLateFee" className="form-input" placeholder="10.0" defaultValue="10.0" step="0.1" />
            </div>
          </div>
          <div className="alert alert--info" style={{ background: 'var(--brand-50)', borderColor: 'var(--brand-100)', color: 'var(--brand-600)' }}>
             <Sparkles size={16} />
             <span>Foto dan daftar fasilitas dapat Anda lengkapi nanti di halaman detail properti.</span>
          </div>
        </form>
      </Modal>

      <AppLayout title="Manajemen Properti" subtitle="Kelola kost dan kontrakan Anda">
        <div className="section">
          
          {/* ── Hero Banner ── */}
          <div className="hero-banner">
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
              <div>
                <div className="hero-banner__chip"><Building2 size={12} />Portofolio Properti</div>
                <h2 style={{ fontSize: 'clamp(20px, 4vw, 24px)', fontWeight: 800, color: '#fff', margin: '8px 0 6px', letterSpacing: '-0.3px' }}>
                  Ringkasan Aset Anda
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13.5px', marginBottom: '16px', maxWidth: '400px' }}>
                  Pantau ketersediaan kamar dan performa masing-masing properti dalam satu layar.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  <span className="hero-banner__pill"><Home size={13} />{properties.length} Properti</span>
                  <span className="hero-banner__pill"><CheckCircle2 size={13} />{occupancyRate}% Terisi</span>
                  <span className="hero-banner__pill"><Users size={13} />{totalOccupied} Penyewa</span>
                </div>
              </div>
              <div style={{ alignSelf: 'flex-end' }}>
                 <button className="btn btn--lg" style={{ background: '#fff', color: 'var(--brand-600)' }} onClick={() => setActiveModal('add')}>
                   <Plus size={16} /> Tambah Properti Baru
                 </button>
              </div>
            </div>
          </div>

          {/* ── Search & Filter ── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
             <div style={{ position: 'relative', width: '100%', maxWidth: '380px' }}>
               <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--txt-muted)' }} />
               <input 
                 type="text" 
                 className="form-input" 
                 style={{ paddingLeft: '38px', borderRadius: 'var(--r-full)', background: 'var(--bg-surface)' }}
                 placeholder="Cari properti berdasarkan nama atau alamat..."
                 value={search}
                 onChange={e => { setSearch(e.target.value); setPage(1); }}
               />
             </div>
             {/* Optional filters can go here */}
          </div>

          {/* ── Properties Grid ── */}
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--bg-surface)', border: '1px dashed var(--bdr-strong)', borderRadius: 'var(--r-xl)' }}>
               <div style={{ width: '64px', height: '64px', background: 'var(--bg-sunken)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--txt-muted)' }}>
                 <Building2 size={28} />
               </div>
               <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--txt-primary)', marginBottom: '8px' }}>
                 {search ? 'Properti Tidak Ditemukan' : 'Belum Ada Properti'}
               </h3>
               <p style={{ fontSize: '13px', color: 'var(--txt-secondary)', maxWidth: '300px', margin: '0 auto 20px' }}>
                 {search ? 'Coba gunakan kata kunci pencarian yang berbeda.' : 'Mulai kelola bisnis Anda dengan menambahkan properti pertama.'}
               </p>
               {!search && (
                 <button className="btn btn--primary" onClick={() => setActiveModal('add')}>
                   <Plus size={15} /> Tambah Sekarang
                 </button>
               )}
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
              {filtered.map(prop => {
                const total = prop._count?.rooms || 0;
                const occ = prop.roomStats?.occupied || 0;
                const emp = prop.roomStats?.empty || 0;
                const mnt = prop.roomStats?.maintenance || 0;
                
                return (
                  <Link key={prop.id} href={`/properties/${prop.id}`} className="card card--interactive" style={{ padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    {/* Image / Cover */}
                    <div style={{ height: '140px', background: 'var(--bg-sunken)', position: 'relative' }}>
                      {prop.photos.length > 0 ? (
                        <img src={prop.photos[0]} alt={prop.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, var(--brand-100), var(--brand-50))' }}>
                          <Building2 size={32} style={{ color: 'var(--brand-500)', opacity: 0.5 }} />
                        </div>
                      )}
                      <span className={`badge badge--${prop.isActive ? 'success' : 'neutral'}`} style={{ position: 'absolute', top: '12px', right: '12px', backdropFilter: 'blur(4px)', background: prop.isActive ? 'rgba(16, 185, 129, 0.85)' : 'var(--bg-sunken)', color: prop.isActive ? '#fff' : 'inherit' }}>
                        {prop.isActive ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </div>

                    {/* Content */}
                    <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                        <div>
                          <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--txt-primary)', marginBottom: '4px', lineHeight: 1.3 }}>{prop.name}</h3>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', color: 'var(--txt-muted)', fontSize: '12px', lineHeight: 1.4 }}>
                            <MapPin size={13} style={{ flexShrink: 0, marginTop: '2px' }} />
                            <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {prop.district && prop.regency ? `${prop.address}, ${prop.district}, ${prop.regency}, ${prop.province}` : prop.address}
                            </span>
                          </div>
                        </div>
                        <button className="icon-btn" style={{ flexShrink: 0 }} aria-label="Opsi">
                          <MoreVertical size={16} />
                        </button>
                      </div>
                      
                      {/* Facilities pills */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', margin: '14px 0', maxHeight: '44px', overflow: 'hidden' }}>
                        {prop.facilities.slice(0, 3).map(f => (
                          <span key={f} style={{ fontSize: '10.5px', padding: '2px 8px', borderRadius: '4px', background: 'var(--bg-sunken)', color: 'var(--txt-secondary)', fontWeight: 600 }}>{f}</span>
                        ))}
                        {prop.facilities.length > 3 && (
                          <span style={{ fontSize: '10.5px', padding: '2px 8px', borderRadius: '4px', background: 'var(--bg-sunken)', color: 'var(--txt-secondary)', fontWeight: 600 }}>+{prop.facilities.length - 3} lagi</span>
                        )}
                      </div>

                      {/* Room Stats */}
                      <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--bdr-subtle)' }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--txt-muted)', marginBottom: '8px' }}>
                          Status Kamar ({total} Total)
                        </div>
                        <div className="progress-track" style={{ height: '6px', marginBottom: '8px', display: 'flex', borderRadius: '3px', overflow: 'hidden', background: 'var(--bg-sunken)' }}>
                          <div style={{ width: total ? `${(occ/total)*100}%` : '0', background: 'var(--clr-info)' }} title={`Terisi: ${occ}`} />
                          <div style={{ width: total ? `${(emp/total)*100}%` : '0', background: 'var(--clr-success)' }} title={`Kosong: ${emp}`} />
                          <div style={{ width: total ? `${(mnt/total)*100}%` : '0', background: 'var(--clr-warning)' }} title={`Perbaikan: ${mnt}`} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', fontWeight: 600 }}>
                          <span style={{ color: 'var(--txt-secondary)' }}><span style={{ color: 'var(--clr-info)' }}>●</span> {occ} Terisi</span>
                          <span style={{ color: 'var(--txt-secondary)' }}><span style={{ color: 'var(--clr-success)' }}>●</span> {emp} Kosong</span>
                          {mnt > 0 && <span style={{ color: 'var(--txt-secondary)' }}><span style={{ color: 'var(--clr-warning)' }}>●</span> {mnt} Rusak</span>}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
              </div>

              {/* ── Pagination Controls ── */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '32px' }}>
                  <button 
                    className="btn btn--secondary" 
                    disabled={page === 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                  >
                    Sebelumnya
                  </button>
                  <span style={{ fontSize: '14px', color: 'var(--txt-secondary)', fontWeight: 600 }}>
                    Halaman {page} dari {totalPages}
                  </span>
                  <button 
                    className="btn btn--secondary" 
                    disabled={page === totalPages}
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  >
                    Selanjutnya
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </AppLayout>
    </>
  );
}
