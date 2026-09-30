'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useAuth } from '@/contexts/AuthContext';
import { invoiceApi, roomApi, reportApi, paymentApi } from '@/lib/api';
import { DashboardSummary, Invoice } from '@/types';
import BookingModal from '@/components/tenant/BookingModal';
import PaymentModal from '@/components/tenant/PaymentModal';
import { formatCurrency, formatPeriod, formatDate } from '@/lib/utils';
import {
  Wallet, AlertTriangle, Clock, TrendingUp, TrendingDown, Users,
  Building2, BarChart3, CheckCircle2, ArrowUpRight, Sparkles, MapPin,
  Home, X, FileText, Eye, ChevronRight, Search, Calendar
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';

// =============================================================================
// MODAL COMPONENT — Professional, Accessible
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
      role="dialog" aria-modal="true" aria-labelledby="modal-title"
    >
      <div className="modal" style={{ maxWidth: maxW }}>
        <div className="modal__header">
          <div>
            <h2 className="modal__title" id="modal-title">{title}</h2>
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
// STAT CARD — Clickable, with "Lihat Detail" hint
// =============================================================================
interface StatCardProps {
  label: string; value: string; sub: string; subPositive?: boolean;
  barGradient: string; iconBg: string; iconColor: string; icon: React.ReactNode;
  onClick?: () => void;
}

function StatCard({ label, value, sub, subPositive = true, barGradient, iconBg, iconColor, icon, onClick }: StatCardProps) {
  return (
    <div
      className="stat-card"
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter') onClick(); } : undefined}
    >
      <div className="stat-card__bar" style={{ background: barGradient }} />
      <div className="stat-card__body">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="stat-card__label">{label}</div>
            <div className="stat-card__value">{value}</div>
            <div className="stat-card__sub" style={{ color: subPositive ? 'var(--clr-success)' : 'var(--clr-danger)' }}>
              {subPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              <span>{sub}</span>
            </div>
          </div>
          <div className="stat-card__icon" style={{ background: iconBg }}>{icon}</div>
        </div>
        {onClick && (
          <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--bdr-subtle)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11.5px', fontWeight: 600, color: iconColor }}>
            <Eye size={11} /> Lihat Detail
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// OCCUPANCY DONUT
// =============================================================================
function OccupancyDonut({ occupied, empty, maintenance }: { occupied: number; empty: number; maintenance: number }) {
  const data = [
    { name: 'Terisi', value: occupied || 0.001, color: '#6366F1' },
    { name: 'Kosong', value: empty || 0.001, color: '#10B981' },
    { name: 'Maintenance', value: maintenance || 0.001, color: '#F59E0B' },
  ];
  const total = occupied + empty + maintenance;
  const pct = total > 0 ? Math.round((occupied / total) * 100) : 0;
  return (
    <div style={{ position: 'relative', width: '140px', height: '140px', flexShrink: 0, margin: '0 auto' }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={48} outerRadius={64} paddingAngle={3} dataKey="value" startAngle={90} endAngle={-270}>
            {data.map((e, i) => <Cell key={i} fill={e.color} />)}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: '24px', fontWeight: 800, color: 'var(--txt-primary)', lineHeight: 1 }}>{pct}%</span>
        <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--txt-muted)', marginTop: '3px' }}>Hunian</span>
      </div>
    </div>
  );
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase();
}

// =============================================================================
// MAIN DASHBOARD PAGE
// =============================================================================
export default function DashboardPage() {
  const { user, loading: authLoading } = useRequireAuth();
  const { accessToken } = useAuth();
  
  // Owner/Admin states
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [period, setPeriod] = useState<'1M' | '3M' | '6M'>('6M');
  const [activeModal, setActiveModal] = useState<'pendapatan' | 'tunggakan' | 'penyewa' | null>(null);
  
  // Tenant states
  const [tenantInvoices, setTenantInvoices] = useState<Invoice[]>([]);
  const [overdueInvoices, setOverdueInvoices] = useState<Invoice[]>([]);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [exploreRooms, setExploreRooms] = useState<any[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [hasFetchedInvoices, setHasFetchedInvoices] = useState(false);
  
  // Marketplace Filters
  const [locationSearch, setLocationSearch] = useState("");
  const [debouncedLocationSearch, setDebouncedLocationSearch] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [minPriceInput, setMinPriceInput] = useState("");
  const [maxPriceInput, setMaxPriceInput] = useState("");
  const [appliedMinPrice, setAppliedMinPrice] = useState<number | undefined>();
  const [appliedMaxPrice, setAppliedMaxPrice] = useState<number | undefined>();
  const [category, setCategory] = useState(""); 
  const [sortOrder, setSortOrder] = useState(""); 
  
  const [loading, setLoading] = useState(true);
  const closeModal = useCallback(() => setActiveModal(null), []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedLocationSearch(locationSearch), 500);
    return () => clearTimeout(timer);
  }, [locationSearch]);

  // Initial fetch for Invoices (Tenant) or Summary (Owner)
  useEffect(() => {
    if (!user || !accessToken) return;
    
    if (user.role === 'TENANT') {
      if (!hasFetchedInvoices) {
        invoiceApi.list(accessToken, { limit: 100 }).then(res => {
          const sorted = (res.data || []).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setTenantInvoices(sorted);
          setHasFetchedInvoices(true);
          if (sorted.length > 0) setLoading(false);
        }).catch(err => {
          console.error(err);
          setHasFetchedInvoices(true);
          setLoading(false);
        });
      }
      return;
    }
    
    // For Owner/Admin (Dynamic)
    reportApi.summary(accessToken, { timeRange: 'THIS_MONTH' })
      .then(res => {
        setSummary(res);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch dashboard summary:', err);
        setLoading(false);
      });

    invoiceApi.list(accessToken, { status: 'OVERDUE' })
      .then(res => setOverdueInvoices(res.data || []))
      .catch(console.error);

    paymentApi.list(accessToken)
      .then(res => setRecentPayments((res as any).data || res || []))
      .catch(console.error);
  }, [user, accessToken, hasFetchedInvoices]);

  // Fetch Rooms for Tenant Marketplace
  useEffect(() => {
    if (user?.role !== 'TENANT' || !hasFetchedInvoices || tenantInvoices.length > 0 || !accessToken) return;
    
    setLoading(true);
    roomApi.list(accessToken, {
      status: 'EMPTY',
      location: debouncedLocationSearch || undefined,
      minPrice: appliedMinPrice, 
      maxPrice: appliedMaxPrice,
      category: category || undefined,
      sort: sortOrder || undefined
    }).then(rooms => {
      setExploreRooms(rooms || []);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [user, hasFetchedInvoices, tenantInvoices.length, accessToken, debouncedLocationSearch, appliedMinPrice, appliedMaxPrice, category, sortOrder]);

  if (authLoading || loading) return (
    <div className="page-loader">
      <div className="spinner" />
      <p style={{ fontSize: '13px', color: 'var(--txt-muted)' }}>Memuat data...</p>
    </div>
  );
  if (!user) return null;

  // ── Tenant view ────────────────────────────────────────────────────────────
  if (user.role === 'TENANT') {
    if (tenantInvoices.length === 0) {
      return (
        <AppLayout title="Eksplorasi Properti" subtitle="Temukan kost atau kontrakan idaman Anda">
          {/* Responsive CSS */}
          <style>{`
            .explore-layout {
              display: flex;
              gap: 32px;
              align-items: flex-start;
            }
            .explore-main { flex: 1 1 0; min-width: 0; }
            .explore-sidebar {
              flex: 0 0 300px;
              width: 300px;
              display: flex;
              flex-direction: column;
              gap: 32px;
              position: sticky;
              top: 80px;
            }
            .room-card {
              cursor: pointer;
              position: relative;
              overflow: hidden;
              border: 1px solid var(--bdr-subtle);
              border-radius: 8px;
              background: #fff;
              transition: transform 0.2s, box-shadow 0.2s;
              box-shadow: 0 2px 8px rgba(0,0,0,0.06);
              aspect-ratio: 4/3;
            }
            .room-card:hover {
              transform: translateY(-5px);
              box-shadow: 0 12px 28px rgba(0,0,0,0.12);
            }
            .room-card img {
              width: 100%; height: 100%; object-fit: cover;
              transition: transform 0.4s;
            }
            .room-card:hover img { transform: scale(1.04); }
            .explore-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 20px;
            }
            @media (max-width: 1200px) {
              .explore-grid { grid-template-columns: repeat(2, 1fr); }
            }
            @media (max-width: 900px) {
              .explore-layout { flex-direction: column-reverse; }
              .explore-sidebar { flex: none; width: 100%; position: static; flex-direction: row; flex-wrap: wrap; gap: 16px; }
              .explore-sidebar .sidebar-panel { flex: 1 1 280px; }
              .explore-grid { grid-template-columns: repeat(2, 1fr); gap: 14px; }
            }
            @media (max-width: 600px) {
              .explore-grid { grid-template-columns: 1fr; gap: 12px; }
              .room-card { aspect-ratio: 16/9; }
              .explore-sidebar { flex-direction: column; }
            }
          `}</style>

          <div className="section">
          <div className="explore-layout">
            {/* ── KIRI: Hasil Pencarian ── */}
            <div className="explore-main">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--bdr-subtle)', flexWrap: 'wrap', gap: '10px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 400, color: 'var(--txt-secondary)', margin: 0 }}>
                  <Search size={15} style={{ display: 'inline', marginRight: '6px', color: '#0284c7', verticalAlign: 'middle' }} />
                  <span style={{ fontWeight: 700, color: 'var(--txt-primary)', fontSize: '17px' }}>{exploreRooms.length}</span> properti ditemukan
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--txt-secondary)' }}>Urutkan:</span>
                  <select className="form-input" style={{ width: 'auto', padding: '7px 28px 7px 12px', fontSize: '13px', borderRadius: '6px', background: '#f8fafc', border: '1px solid var(--bdr-subtle)' }} value={sortOrder} onChange={e => setSortOrder(e.target.value)}>
                    <option value="">Relevansi</option>
                    <option value="price_asc">Harga Terendah</option>
                    <option value="price_desc">Harga Tertinggi</option>
                  </select>
                </div>
              </div>

              {exploreRooms.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 24px', background: '#f8fafc', borderRadius: '12px', border: '2px dashed var(--bdr-default)' }}>
                  <div style={{ width: '72px', height: '72px', background: 'var(--brand-50)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                    <Search size={36} color="var(--brand-500)" />
                  </div>
                  <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--txt-primary)', marginBottom: '10px' }}>Properti Tidak Ditemukan</h3>
                  <p style={{ color: 'var(--txt-secondary)', fontSize: '14px', maxWidth: '400px', margin: '0 auto 28px', lineHeight: 1.6 }}>
                    Coba ubah filter lokasi, tipe properti, atau rentang harga.
                  </p>
                  <button className="btn btn--primary" style={{ background: '#0284c7' }}
                    onClick={() => {
                      setSearch(""); setDebouncedSearch("");
                      setMinPriceInput(""); setMaxPriceInput("");
                      setAppliedMinPrice(undefined); setAppliedMaxPrice(undefined);
                      setCategory("");
                    }}
                  >Reset Semua Filter</button>
                </div>
              ) : (
                <div className="explore-grid">
                  {exploreRooms.map(room => {
                    const propType = room.property?.type === 'KONTRAKAN_RUMAH' ? 'Kontrakan Rumah' : room.property?.type === 'KONTRAKAN_PETAK' ? 'Kontrakan Petak' : 'Kost';
                    return (
                      <div key={room.id} className="room-card" onClick={() => setSelectedRoom(room)}>
                        {/* Background Image */}
                        {room.photos && room.photos.length > 0 ? (
                          <img src={room.photos[0].startsWith('http') ? room.photos[0] : `http://localhost:5000${room.photos[0]}`} alt={`Kamar ${room.roomNumber}`} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)', color: 'var(--txt-disabled)' }}><Building2 size={52} opacity={0.4} /></div>
                        )}

                        {/* Dark Gradient Overlay */}
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.1) 55%, transparent 100%)' }} />

                        {/* Top Badges Row */}
                        <div style={{ position: 'absolute', top: '12px', left: '12px', right: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <span style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', color: '#fff', padding: '4px 10px', fontSize: '11px', fontWeight: 600, borderRadius: '4px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Untuk Disewa</span>
                          <span style={{ background: propType === 'Kost' ? '#7c3aed' : '#0891b2', color: '#fff', padding: '4px 10px', fontSize: '11px', fontWeight: 700, borderRadius: '4px', letterSpacing: '0.3px' }}>{propType}</span>
                        </div>

                        {/* Bottom Info */}
                        <div style={{ position: 'absolute', bottom: '16px', left: '16px', right: '16px' }}>
                          <div style={{ background: '#0284c7', color: '#fff', padding: '5px 10px', display: 'inline-block', fontSize: '15px', fontWeight: 800, borderRadius: '4px', marginBottom: '8px', boxShadow: '0 2px 8px rgba(2,132,199,0.4)' }}>
                            {formatCurrency(room.price)} <span style={{ fontSize: '11px', fontWeight: 500, opacity: 0.85 }}>/bln</span>
                          </div>
                          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#fff', marginBottom: '4px', lineHeight: 1.25, textShadow: '0 1px 4px rgba(0,0,0,0.6)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {room.property?.name || 'Kost Eksklusif'} — No. {room.roomNumber}
                          </h3>
                          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)', margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <MapPin size={11} />
                            {[room.property?.district, room.property?.regency].filter(Boolean).join(', ') || room.property?.address || 'Lokasi tidak tersedia'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── KANAN: Sidebar Filter ── */}
            <div className="explore-sidebar">
              {/* Filter Box */}
              <div className="sidebar-panel" style={{ background: '#fff', border: '1px solid var(--bdr-subtle)', borderRadius: '10px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--txt-primary)', marginBottom: '20px', paddingBottom: '14px', borderBottom: '1px solid var(--bdr-subtle)' }}>🔍 Cari Properti</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--txt-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>Lokasi</label>
                    <input type="text" className="form-input" style={{ width: '100%' }} placeholder="Cari kota, kecamatan..." value={locationSearch} onChange={e => setLocationSearch(e.target.value)} />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--txt-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>Tipe Properti</label>
                    <select className="form-input" style={{ width: '100%' }} value={category} onChange={e => setCategory(e.target.value)}>
                      <option value="Semua">Semua Tipe</option>
                      <option value="KOST">🛏️ Kost</option>
                      <option value="KONTRAKAN_PETAK">🏠 Kontrakan Petak</option>
                      <option value="KONTRAKAN_RUMAH">🏡 Kontrakan Rumah</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--txt-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>Rentang Harga</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input type="text" className="form-input" placeholder="Min" style={{ width: '100%', fontSize: '13px' }} value={minPriceInput} onChange={e => setMinPriceInput(e.target.value)} />
                      <span style={{ color: 'var(--txt-muted)', flexShrink: 0 }}>—</span>
                      <input type="text" className="form-input" placeholder="Max" style={{ width: '100%', fontSize: '13px' }} value={maxPriceInput} onChange={e => setMaxPriceInput(e.target.value)} />
                    </div>
                    {(minPriceInput || maxPriceInput) && (
                      <div style={{ fontSize: '11px', color: 'var(--txt-muted)', marginTop: '6px', textAlign: 'right' }}>
                        {minPriceInput && formatCurrency(parseInt(minPriceInput.replace(/\D/g, '')))}{maxPriceInput ? ` – ${formatCurrency(parseInt(maxPriceInput.replace(/\D/g, '')))}` : '+'}
                      </div>
                    )}
                  </div>
                  <button className="btn" style={{ background: '#0284c7', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 700, padding: '12px', width: '100%', fontSize: '14px', marginTop: '4px' }} onClick={() => {
                    setAppliedMinPrice(minPriceInput ? parseInt(minPriceInput.replace(/\D/g, '')) : undefined);
                    setAppliedMaxPrice(maxPriceInput ? parseInt(maxPriceInput.replace(/\D/g, '')) : undefined);
                  }}>Cari Sekarang</button>
                  <button style={{ background: 'transparent', border: '1px solid var(--bdr-subtle)', borderRadius: '6px', fontWeight: 500, padding: '10px', width: '100%', fontSize: '13px', color: 'var(--txt-secondary)', cursor: 'pointer' }} onClick={() => {
                    setSearch(""); setDebouncedSearch(""); setMinPriceInput(""); setMaxPriceInput("");
                    setAppliedMinPrice(undefined); setAppliedMaxPrice(undefined); setCategory(""); setLocationSearch("");
                  }}>Reset Filter</button>
                </div>
              </div>

              {/* Featured Properties */}
              {exploreRooms.length > 0 && (
                <div className="sidebar-panel" style={{ background: '#fff', border: '1px solid var(--bdr-subtle)', borderRadius: '10px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--txt-primary)', marginBottom: '20px', paddingBottom: '14px', borderBottom: '1px solid var(--bdr-subtle)' }}>⭐ Properti Unggulan</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {exploreRooms.slice(0, 4).map(room => (
                      <div key={room.id} style={{ display: 'flex', gap: '12px', cursor: 'pointer', alignItems: 'center', padding: '8px', borderRadius: '8px', transition: 'background 0.15s' }}
                        onClick={() => setSelectedRoom(room)}
                        onMouseEnter={e => (e.currentTarget.style.background = '#f0f9ff')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <div style={{ width: '80px', height: '60px', borderRadius: '6px', overflow: 'hidden', flexShrink: 0, background: '#e2e8f0' }}>
                          {room.photos?.[0] ? (
                            <img src={room.photos[0].startsWith('http') ? room.photos[0] : `http://localhost:5000${room.photos[0]}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                          ) : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Building2 size={24} opacity={0.35} /></div>}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#0369a1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{room.property?.name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--txt-secondary)', marginBottom: '5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{room.property?.regency || room.property?.address}</div>
                          <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff', background: '#0284c7', padding: '2px 8px', borderRadius: '4px', display: 'inline-block' }}>{formatCurrency(room.price)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          </div>
          {selectedRoom && <BookingModal room={selectedRoom} onClose={() => setSelectedRoom(null)} />}
        </AppLayout>
      );
    }

    const activeInvoices = tenantInvoices.filter(i => ['ACTIVE', 'OVERDUE', 'PENDING'].includes(i.status));
    const paidInvoices = tenantInvoices.filter(i => i.status === 'PAID');
    const waitingInvoices = tenantInvoices.filter(i => i.status === 'WAITING_VERIFICATION');
    
    const totalPaid = paidInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const latestInvoice = tenantInvoices[0] as any;
    const roomInfo = latestInvoice?.contract?.room;
    
    // Calculate Next Invoice Period
    let nextInvoicePeriod: { label: string; dueDate: Date, contractId: string, amount: number } | null = null;
    if (activeInvoices.length === 0 && waitingInvoices.length === 0 && latestInvoice?.contract?.isActive) {
      const contract = latestInvoice.contract;
      const [y, m] = latestInvoice.period.split('-');
      let year = parseInt(y);
      let month = parseInt(m) + 1;
      if (month > 12) { month = 1; year += 1; }
      
      const nextDueDate = new Date(year, month - 1, contract.dueDay);
      if (!contract.endDate || nextDueDate <= new Date(contract.endDate)) {
        nextInvoicePeriod = {
          label: `${year}-${String(month).padStart(2, '0')}`,
          dueDate: nextDueDate,
          contractId: contract.id,
          amount: contract.rentAmount
        };
      }
    }
    
    return (
      <AppLayout title="Beranda" subtitle={`Selamat datang, ${user.name}`}>
        <div className="section stack-lg">
          
          {/* Welcome Banner */}
          <div className="hero-banner" style={{ marginBottom: '0', background: 'linear-gradient(135deg, var(--brand-600) 0%, #7c3aed 100%)', padding: '32px 40px', borderRadius: '16px', color: '#fff', boxShadow: 'var(--shd-lg)' }}>
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, marginBottom: '16px' }}>
                  <Sparkles size={14} /> Beranda Penyewa
                </div>
                <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px', letterSpacing: '-0.5px' }}>
                  Halo, {user.name.split(' ')[0]}! 👋
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '15px', maxWidth: '500px', lineHeight: 1.5 }}>
                  Berikut adalah ringkasan sewa kamar Anda di {roomInfo?.property?.name || 'Kost'}. Jangan lupa periksa tagihan Anda bulan ini!
                </p>
              </div>
              
              <div className="hidden md:flex" style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', padding: '20px 24px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ background: 'rgba(255,255,255,0.2)', padding: '12px', borderRadius: '12px' }}>
                  <Home size={32} color="#fff" />
                </div>
                <div>
                  <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>Kamar Saat Ini</div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#fff', marginBottom: '2px' }}>
                    {roomInfo ? `Kamar ${roomInfo.roomNumber}` : '-'}
                  </div>
                  {roomInfo?.property && (
                    <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={12} opacity={0.8} />
                      {[roomInfo.property.district, roomInfo.property.regency].filter(Boolean).join(', ') || roomInfo.property.address || 'Lokasi tidak tersedia'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px', marginTop: '24px' }}>
            
            {/* Left Column: Tagihan Selanjutnya & Histori */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Tagihan Selanjutnya */}
              <div className="card" style={{ padding: '0', overflow: 'hidden', border: '1px solid var(--bdr-subtle)' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--bdr-subtle)', background: 'var(--bg-sunken)' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--txt-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Calendar size={18} color="var(--brand-500)" />
                    Tagihan Terkini
                  </h3>
                </div>
                
                {activeInvoices.length > 0 ? (
                  <div style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                      <div>
                        <div style={{ fontSize: '14px', color: 'var(--txt-secondary)', marginBottom: '4px' }}>Total Tagihan</div>
                        <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--clr-danger)', letterSpacing: '-1px' }}>
                          {formatCurrency(activeInvoices[0].totalAmount)}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '14px', color: 'var(--txt-secondary)', marginBottom: '4px' }}>Jatuh Tempo</div>
                        <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--txt-primary)' }}>
                          {formatDate(activeInvoices[0].dueDate)}
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ background: 'var(--clr-danger-bg)', borderLeft: '4px solid var(--clr-danger)', padding: '16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                      <AlertTriangle size={24} color="var(--clr-danger)" style={{ flexShrink: 0 }} />
                      <p style={{ fontSize: '14px', color: 'var(--clr-danger)', margin: 0, fontWeight: 500 }}>
                        Segera lakukan pembayaran sebelum jatuh tempo untuk menghindari denda keterlambatan!
                      </p>
                    </div>
                    
                    <button onClick={() => setIsPaymentModalOpen(true)} className="btn btn--primary btn--lg" style={{ width: '100%', justifyContent: 'center' }}>
                      Bayar Sekarang <ArrowUpRight size={18} />
                    </button>
                  </div>
                ) : waitingInvoices.length > 0 ? (
                  <div style={{ padding: '40px 24px', textAlign: 'center' }}>
                    <div style={{ width: '64px', height: '64px', background: 'var(--clr-warning-bg)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                      <Clock size={32} color="var(--clr-warning)" />
                    </div>
                    <h4 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--txt-primary)', marginBottom: '8px' }}>Menunggu Verifikasi</h4>
                    <p style={{ color: 'var(--txt-secondary)', fontSize: '14px', maxWidth: '400px', margin: '0 auto' }}>Pembayaran Anda untuk bulan ini sedang diverifikasi oleh admin. Terima kasih telah membayar tepat waktu!</p>
                  </div>
                ) : nextInvoicePeriod ? (
                  <div style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                      <div>
                        <div style={{ fontSize: '14px', color: 'var(--txt-secondary)', marginBottom: '4px' }}>Tagihan Berikutnya</div>
                        <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--txt-primary)', letterSpacing: '-1px' }}>
                          {formatCurrency(nextInvoicePeriod.amount)}
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--txt-muted)', marginTop: '4px' }}>
                          Periode {formatPeriod(nextInvoicePeriod.label)}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '14px', color: 'var(--txt-secondary)', marginBottom: '4px' }}>Jatuh Tempo</div>
                        <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--txt-primary)' }}>
                          {formatDate(nextInvoicePeriod.dueDate)}
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ background: 'var(--clr-success-bg)', borderLeft: '4px solid var(--clr-success)', padding: '16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                      <CheckCircle2 size={24} color="var(--clr-success)" style={{ flexShrink: 0 }} />
                      <p style={{ fontSize: '14px', color: 'var(--clr-success)', margin: 0, fontWeight: 500 }}>
                        Semua tagihan bulan ini sudah lunas! Anda bisa membayar tagihan bulan berikutnya lebih awal jika Anda mau.
                      </p>
                    </div>
                    
                    <button 
                      onClick={() => setIsPaymentModalOpen(true)}
                      className="btn btn--outline btn--lg" style={{ width: '100%', justifyContent: 'center' }}>
                      Bayar Lebih Awal <ArrowUpRight size={18} />
                    </button>
                  </div>
                ) : (
                  <div style={{ padding: '40px 24px', textAlign: 'center' }}>
                    <div style={{ width: '64px', height: '64px', background: 'var(--clr-success-bg)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                      <CheckCircle2 size={32} color="var(--clr-success)" />
                    </div>
                    <h4 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--txt-primary)', marginBottom: '8px' }}>Semua Tagihan Lunas</h4>
                    <p style={{ color: 'var(--txt-secondary)', fontSize: '14px', maxWidth: '400px', margin: '0 auto' }}>Anda tidak memiliki tagihan aktif bulan ini. Anda bisa bernafas lega!</p>
                  </div>
                )}
              </div>

              {/* Histori Pembayaran */}
              <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--bdr-subtle)' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--bdr-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--txt-primary)' }}>Histori Pembayaran</h3>
                  <Link href="/invoices" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--brand-600)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    Lihat Semua
                  </Link>
                </div>
                
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-sunken)', borderBottom: '1px solid var(--bdr-subtle)' }}>
                        <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 600, color: 'var(--txt-secondary)', textTransform: 'uppercase' }}>Periode</th>
                        <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 600, color: 'var(--txt-secondary)', textTransform: 'uppercase' }}>Nominal</th>
                        <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 600, color: 'var(--txt-secondary)', textTransform: 'uppercase' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tenantInvoices.length === 0 && (
                        <tr>
                          <td colSpan={3} style={{ padding: '24px', textAlign: 'center', color: 'var(--txt-muted)' }}>Belum ada transaksi</td>
                        </tr>
                      )}
                      {tenantInvoices.slice(0, 3).map((inv: any) => (
                        <tr key={inv.id} style={{ borderBottom: '1px solid var(--bdr-subtle)', transition: 'background 0.2s' }}>
                          <td style={{ padding: '16px 24px' }}>
                            <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--txt-primary)' }}>Periode {formatPeriod(inv.period)}</div>
                            <div style={{ fontSize: '12px', color: 'var(--txt-muted)', marginTop: '4px' }}>Jatuh tempo: {formatDate(inv.dueDate)}</div>
                          </td>
                          <td style={{ padding: '16px 24px', fontWeight: 700, fontSize: '14px', color: 'var(--txt-primary)' }}>
                            {formatCurrency(inv.totalAmount)}
                          </td>
                          <td style={{ padding: '16px 24px' }}>
                            <span className={`badge badge--${inv.status === 'PAID' ? 'success' : inv.status === 'ACTIVE' ? 'primary' : inv.status === 'OVERDUE' ? 'danger' : 'warning'}`}>
                              {inv.status === 'PAID' ? 'Lunas' : inv.status === 'WAITING_VERIFICATION' ? 'Menunggu' : inv.status === 'OVERDUE' ? 'Terlambat' : 'Belum Dibayar'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right Column: Info Kost & Summary */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              <div className="card" style={{ padding: '24px', border: '1px solid var(--bdr-subtle)' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--txt-primary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '24px' }}>Informasi Kontrak</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '48px', height: '48px', background: 'var(--brand-50)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Building2 size={24} color="var(--brand-600)" />
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: 'var(--txt-secondary)' }}>Properti</div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--txt-primary)' }}>{roomInfo?.property?.name || '-'}</div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '48px', height: '48px', background: 'var(--brand-50)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Calendar size={24} color="var(--brand-600)" />
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: 'var(--txt-secondary)' }}>Mulai Sewa</div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--txt-primary)' }}>{latestInvoice?.contract?.startDate ? formatDate(latestInvoice.contract.startDate) : '-'}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '48px', height: '48px', background: 'var(--brand-50)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Clock size={24} color="var(--brand-600)" />
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: 'var(--txt-secondary)' }}>Durasi Sewa</div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--txt-primary)' }}>{latestInvoice?.contract?.durationMonths || 0} Bulan</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card" style={{ padding: '24px', border: '1px solid var(--bdr-subtle)', background: 'var(--bg-sunken)' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--txt-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                  Total Pengeluaran Anda
                </div>
                <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--txt-primary)', letterSpacing: '-1px' }}>
                  {formatCurrency(totalPaid)}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--txt-muted)', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Wallet size={16} /> Keseluruhan nominal yang telah dilunasi
                </div>
              </div>

            </div>
          </div>
          {isPaymentModalOpen && <PaymentModal open={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} invoices={tenantInvoices} accessToken={accessToken!} />}
        </div>
      </AppLayout>
    );
  }

  // ── Owner / Admin data ─────────────────────────────────────────────────────
  const revenueData = summary?.revenueChart || [];
  const total = (summary?.occupied || 0) + (summary?.empty || 0) + (summary?.maintenance || 0);
  const avgRevenue = Math.round(revenueData.reduce((a, r) => a + r.revenue, 0) / Math.max(revenueData.length, 1));

  const avatarColors: Record<string, string> = {
    success: 'linear-gradient(135deg,#10B981,#059669)',
    warning: 'linear-gradient(135deg,#F59E0B,#D97706)',
    danger:  'linear-gradient(135deg,#EF4444,#DC2626)',
  };

  const occupancyRows = [
    { label: 'Terisi',      value: summary?.occupied    || 0, color: '#6366F1', bar: 'linear-gradient(90deg,#6366F1,#8B5CF6)' },
    { label: 'Kosong',      value: summary?.empty       || 0, color: '#10B981', bar: 'linear-gradient(90deg,#10B981,#059669)' },
    { label: 'Maintenance', value: summary?.maintenance || 0, color: '#F59E0B', bar: 'linear-gradient(90deg,#F59E0B,#D97706)' },
  ];

  // Shared modal footer helper
  const ModalBtns = ({ closeLabel, actionLabel, actionHref }: { closeLabel?: string; actionLabel: string; actionHref: string }) => (
    <>
      <button className="btn btn--secondary btn--sm" onClick={closeModal}>{closeLabel ?? 'Tutup'}</button>
      <Link href={actionHref} className="btn btn--primary btn--sm" onClick={closeModal}>
        {actionLabel} <ArrowUpRight size={14} />
      </Link>
    </>
  );

  return (
    <>
      {/* ================================================================
          MODALS
          ================================================================ */}

      {/* Pendapatan */}
      <Modal
        open={activeModal === 'pendapatan'}
        onClose={closeModal}
        title="Detail Pendapatan"
        subtitle="Rincian pendapatan bulan ini"
        footer={<ModalBtns actionLabel="Lihat Laporan" actionHref="/reports" />}
      >
        <div className="stack-md">
          <div style={{ padding: '16px', borderRadius: 'var(--r-md)', background: 'var(--brand-50)', border: '1px solid var(--brand-100)' }}>
            <div style={{ fontSize: '11px', color: 'var(--brand-600)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '4px' }}>Total Bulan Ini</div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--brand-600)', fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(summary?.currentMonthRevenue || 0)}</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {[
              { label: 'Kamar Terisi', value: `${summary?.occupied || 0} kamar` },
              { label: 'Rata-rata/Kamar', value: formatCurrency(Math.round((summary?.currentMonthRevenue || 0) / Math.max(summary?.occupied || 1, 1))) },
              { label: 'Tagihan Lunas', value: String((summary?.occupied || 0) - (summary?.overdueCount || 0)) },
              { label: 'Target Bln Depan', value: formatCurrency(Math.round((summary?.currentMonthRevenue || 0) * 1.05)) },
            ].map(row => (
              <div key={row.label} style={{ padding: '12px', borderRadius: 'var(--r-md)', background: 'var(--bg-sunken)', border: '1px solid var(--bdr-subtle)' }}>
                <div style={{ fontSize: '11px', color: 'var(--txt-muted)', marginBottom: '4px', fontWeight: 600 }}>{row.label}</div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--txt-primary)', fontVariantNumeric: 'tabular-nums' }}>{row.value}</div>
              </div>
            ))}
          </div>
          <div style={{ height: '160px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 4, right: 0, left: -22, bottom: 0 }}>
                <defs>
                  <linearGradient id="m-g" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--bdr-subtle)" />
                <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fill: 'var(--txt-muted)', fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--txt-muted)', fontSize: 10 }} tickFormatter={v => `${v/1000000}M`} />
                <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--bdr-subtle)', borderRadius: '8px', fontSize: '12px' }} formatter={(v: any) => [formatCurrency(v), 'Pendapatan']} />
                <Area type="monotone" dataKey="revenue" stroke="#6366F1" strokeWidth={2} fill="url(#m-g)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Modal>

      {/* Tunggakan */}
      <Modal
        open={activeModal === 'tunggakan'}
        onClose={closeModal}
        title="Detail Tunggakan"
        subtitle="Tagihan yang belum dibayar"
        size="sm"
        footer={<ModalBtns actionLabel="Kelola Tagihan" actionHref="/invoices" />}
      >
        <div className="stack-md">
          <div style={{ padding: '14px', borderRadius: 'var(--r-md)', background: 'var(--clr-danger-bg)', border: '1px solid var(--clr-danger)' }}>
            <div style={{ fontSize: '11px', color: 'var(--clr-danger)', fontWeight: 700, marginBottom: '4px' }}>Total Tunggakan</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--clr-danger)', fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(summary?.totalOverdue || 0)}</div>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--txt-secondary)', lineHeight: 1.6 }}>
            <strong>{summary?.overdueCount || 0} tagihan</strong> melewati batas pembayaran.
          </p>
          {overdueInvoices.slice(0, 5).map((inv: any, i: number) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', borderRadius: 'var(--r-md)', background: 'var(--bg-sunken)', border: '1px solid var(--bdr-subtle)' }}>
              <div className="avatar avatar--sm" style={{ background: avatarColors.danger }}>{initials(inv.contract?.tenant?.user?.name || 'T G')}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--txt-primary)' }}>{inv.contract?.tenant?.user?.name || 'Tenant'}</div>
                <div style={{ fontSize: '11px', color: 'var(--txt-muted)' }}>{inv.contract?.room?.roomNumber ? `Kamar ${inv.contract.room.roomNumber}` : '-'}</div>
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--clr-danger)', fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(inv.totalAmount)}</div>
            </div>
          ))}
        </div>
      </Modal>

      {/* Penyewa */}
      <Modal
        open={activeModal === 'penyewa'}
        onClose={closeModal}
        title="Rincian Penyewa"
        subtitle="Status kamar saat ini"
        size="sm"
        footer={<ModalBtns actionLabel="Kelola Penyewa" actionHref="/tenants" />}
      >
        <div className="stack-md">
          {occupancyRows.map(r => (
            <div key={r.label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: r.color, flexShrink: 0 }} />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--txt-secondary)' }}>{r.label}</span>
                </div>
                <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--txt-primary)' }}>
                  {r.value} <span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--txt-muted)' }}>kamar</span>
                </span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: total > 0 ? `${(r.value / total) * 100}%` : '0%', background: r.bar }} />
              </div>
            </div>
          ))}
        </div>
      </Modal>

      {/* ================================================================
          MAIN LAYOUT
          ================================================================ */}
      <AppLayout
        title="Dashboard"
        subtitle={new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
      >
        <div className="section">

          {/* ── Hero Banner ─────────────────────────────────────────── */}
          <div className="hero-banner">
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div className="hero-banner__chip"><Sparkles size={11} />Ringkasan Bisnis</div>
              <h2 style={{ fontSize: 'clamp(20px, 4vw, 26px)', fontWeight: 800, color: '#fff', margin: '8px 0 6px', letterSpacing: '-0.3px' }}>
                Selamat datang, {user.name.split(' ')[0]}! 👋
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.68)', fontSize: '13.5px', marginBottom: '16px' }}>
                Berikut ringkasan properti kost Anda hari ini.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                <span className="hero-banner__pill"><Wallet size={13} />{formatCurrency(summary?.currentMonthRevenue || 0)}</span>
                <span className="hero-banner__pill"><Home size={13} />{summary?.occupancyRate || 0}% Terisi</span>
                <span className="hero-banner__pill"><Users size={13} />{summary?.occupied || 0} Penyewa</span>
              </div>
            </div>
          </div>

          {/* ── Stat Cards ──────────────────────────────────────────── */}
          <div className="stat-grid">
            <StatCard label="Pendapatan Bulan Ini" value={formatCurrency(summary?.currentMonthRevenue || 0)} sub="+5.7% dari bulan lalu" subPositive barGradient="linear-gradient(90deg,#6366F1,#8B5CF6)" iconBg="rgba(99,102,241,0.1)" iconColor="#6366F1" icon={<Wallet size={20} color="#6366F1" />} onClick={() => setActiveModal('pendapatan')} />
            <StatCard label="Total Tunggakan" value={formatCurrency(summary?.totalOverdue || 0)} sub={`${summary?.overdueCount || 0} tagihan terlambat`} subPositive={false} barGradient="linear-gradient(90deg,#EF4444,#F97316)" iconBg="rgba(239,68,68,0.1)" iconColor="#EF4444" icon={<AlertTriangle size={20} color="#EF4444" />} onClick={() => setActiveModal('tunggakan')} />
            <StatCard label="Total Penyewa" value={String(summary?.occupied || 0)} sub="+1 penyewa baru bulan ini" subPositive barGradient="linear-gradient(90deg,#10B981,#059669)" iconBg="rgba(16,185,129,0.1)" iconColor="#10B981" icon={<Users size={20} color="#10B981" />} onClick={() => setActiveModal('penyewa')} />
            <StatCard label="Menunggu Verifikasi" value={String(summary?.waitingVerification || 0)} sub="Butuh tindakan segera" subPositive={false} barGradient="linear-gradient(90deg,#F59E0B,#D97706)" iconBg="rgba(245,158,11,0.1)" iconColor="#F59E0B" icon={<Clock size={20} color="#F59E0B" />} />
          </div>

          {/* ── Chart Row ─────────────────────────────────────────────── */}
          <div className="chart-grid">
            {/* Revenue Chart */}
            <div className="card" style={{ padding: 0, display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid var(--bdr-subtle)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--txt-primary)' }}>Tren Pendapatan</div>
                  <div style={{ fontSize: '12px', color: 'var(--txt-muted)', marginTop: '2px' }}>Pantau arus pemasukan bulanan</div>
                </div>
                <div className="period-tabs">
                  {(['1M','3M','6M'] as const).map(p => (
                    <button key={p} className={`period-tab${period === p ? ' period-tab--active' : ''}`} onClick={() => setPeriod(p)}>{p}</button>
                  ))}
                </div>
              </div>
              <div style={{ padding: '16px 20px 0', display: 'flex', gap: '28px', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--txt-muted)', fontWeight: 600, marginBottom: '2px' }}>Bulan Ini</div>
                  <div style={{ fontSize: '22px', fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: 'var(--txt-primary)' }}>{formatCurrency(summary?.currentMonthRevenue || 0)}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontSize: '12px', fontWeight: 600, color: 'var(--clr-success)' }}><TrendingUp size={13} />+5.7%</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--txt-muted)', fontWeight: 600, marginBottom: '2px' }}>Rata-rata/Bulan</div>
                  <div style={{ fontSize: '22px', fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: 'var(--txt-primary)' }}>{formatCurrency(avgRevenue)}</div>
                </div>
              </div>
              <div style={{ padding: '12px 8px 16px 0', flex: 1 }}>
                <div style={{ height: '200px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueData} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                      <defs>
                        <linearGradient id="dash-g" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366F1" stopOpacity={0.22} />
                          <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--bdr-subtle)" />
                      <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fill: 'var(--txt-muted)', fontSize: 11 }} dy={8} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--txt-muted)', fontSize: 11 }} tickFormatter={v => `${v/1000000}M`} />
                      <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--bdr-subtle)', borderRadius: '10px', fontSize: '12px', boxShadow: 'var(--shd-md)' }} formatter={(v: any) => [formatCurrency(v), 'Pendapatan']} />
                      <Area type="monotone" dataKey="revenue" stroke="#6366F1" strokeWidth={2.5} fill="url(#dash-g)" dot={false} activeDot={{ r: 5, fill: '#6366F1', strokeWidth: 2, stroke: 'var(--bg-surface)' }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Occupancy */}
            <div className="card" style={{ padding: 0, display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid var(--bdr-subtle)' }}>
                <div style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--txt-primary)' }}>Tingkat Hunian</div>
                <div style={{ fontSize: '12px', color: 'var(--txt-muted)', marginTop: '2px' }}>Status kamar saat ini</div>
              </div>
              <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <OccupancyDonut occupied={summary?.occupied || 0} empty={summary?.empty || 0} maintenance={summary?.maintenance || 0} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {occupancyRows.map(r => (
                    <div key={r.label}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: r.color }} />
                          <span style={{ fontSize: '12.5px', fontWeight: 500, color: 'var(--txt-secondary)' }}>{r.label}</span>
                        </div>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--txt-primary)' }}>
                          {r.value} <span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--txt-muted)' }}>kamar</span>
                        </span>
                      </div>
                      <div className="progress-track">
                        <div className="progress-fill" style={{ width: total > 0 ? `${(r.value/total)*100}%` : '0%', background: r.bar }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Bottom Row ────────────────────────────────────────────── */}
          <div className="bottom-grid">
            {/* Activity */}
            <div className="card" style={{ padding: 0 }}>
              <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid var(--bdr-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--txt-primary)' }}>Aktivitas Terbaru</div>
                  <div style={{ fontSize: '12px', color: 'var(--txt-muted)', marginTop: '2px' }}>5 transaksi terakhir</div>
                </div>
                <Link href="/payments" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12.5px', fontWeight: 600, color: '#6366F1', textDecoration: 'none' }}>
                  Semua <ChevronRight size={14} />
                </Link>
              </div>
              <div style={{ padding: '4px 20px' }}>
                {recentPayments.slice(0, 5).map((p: any, i: number) => {
                  const type = p.status === 'VERIFIED' ? 'success' : p.status === 'WAITING_VERIFICATION' || p.status === 'PENDING' ? 'warning' : 'danger';
                  const statusText = p.status === 'VERIFIED' ? 'Lunas' : p.status === 'WAITING_VERIFICATION' ? 'Menunggu' : p.status === 'REJECTED' ? 'Ditolak' : p.status;
                  const name = p.contract?.tenant?.user?.name || 'Penyewa';
                  const room = p.contract?.room?.roomNumber ? `Kamar ${p.contract.room.roomNumber}` : '-';
                  
                  return (
                  <div key={i} className="activity-row">
                    <div className="avatar avatar--sm" style={{ width: '36px', height: '36px', fontSize: '12px', background: avatarColors[type] }}>
                      {initials(name)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--txt-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
                      <div style={{ fontSize: '11.5px', color: 'var(--txt-muted)' }}>{room} &middot; {formatDate(p.createdAt)}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0, marginRight: '10px' }}>
                      <div style={{ fontSize: '13.5px', fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: 'var(--txt-primary)' }}>{formatCurrency(p.amount)}</div>
                    </div>
                    <span className={`badge badge--${type}`}>
                      {statusText}
                    </span>
                  </div>
                )})}
              </div>
            </div>

            {/* Right column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Quick Actions */}
              <div className="card" style={{ padding: 0 }}>
                <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid var(--bdr-subtle)' }}>
                  <div style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--txt-primary)' }}>Aksi Cepat</div>
                </div>
                <div style={{ padding: '14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {([
                    { href: '/tenants',         Icon: Users,       label: 'Tambah Penyewa',  bg: 'rgba(99,102,241,0.1)',  c: '#6366F1', badge: 0 },
                    { href: '/payments/verify', Icon: CheckCircle2,label: 'Verifikasi Bayar',bg: 'rgba(245,158,11,0.1)', c: '#F59E0B', badge: summary?.waitingVerification || 0 },
                    { href: '/properties',      Icon: Building2,   label: 'Properti',        bg: 'rgba(16,185,129,0.1)', c: '#10B981', badge: 0 },
                    { href: '/reports',         Icon: BarChart3,   label: 'Laporan',         bg: 'rgba(168,85,247,0.1)', c: '#A855F7', badge: 0 },
                  ]).map(({ href, Icon, label, bg, c, badge }) => (
                    <Link key={href} href={href} className="quick-card">
                      <div className="quick-card__icon" style={{ background: bg }}>
                        <Icon size={19} color={c} />
                      </div>
                      <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--txt-primary)', lineHeight: 1.4 }}>{label}</div>
                      {badge > 0 && (
                        <span className="badge-dot" style={{ position: 'absolute', top: '10px', right: '10px' }}>{badge}</span>
                      )}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Payment Status */}
              <div className="card" style={{ padding: '16px 20px' }}>
                <div style={{ fontSize: '11.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--txt-muted)', marginBottom: '14px' }}>Status Pembayaran</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[
                    { label: 'Lunas',    count: (summary?.occupied || 0) - (summary?.overdueCount || 0), type: 'success' },
                    { label: 'Menunggu', count: summary?.waitingVerification || 0, type: 'warning' },
                    { label: 'Terlambat',count: summary?.overdueCount || 0, type: 'danger' },
                  ].map(r => (
                    <div key={r.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--txt-secondary)' }}>{r.label}</span>
                      <span className={`badge badge--${r.type}`}>{r.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </AppLayout>
    </>
  );
}
