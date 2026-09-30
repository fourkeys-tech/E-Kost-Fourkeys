'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useAuth } from '@/contexts/AuthContext';
import { invoiceApi, propertyApi } from '@/lib/api';
import { Invoice, Property } from '@/types';
import { formatCurrency, formatPeriod, formatDate } from '@/lib/utils';
import { FileText, Search, RefreshCw, Eye, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import Swal from 'sweetalert2';

export default function InvoicesPage() {
  const { user, loading: authLoading } = useRequireAuth({ allowedRoles: ['OWNER', 'ADMIN', 'SUPER_ADMIN', 'TENANT'] });
  const { accessToken } = useAuth();
  
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'UNPAID' | 'PAID'>('UNPAID');
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const isTenant = user?.role === 'TENANT';

  const fetchData = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const params: any = {};
      if (selectedPropertyId) params.propertyId = selectedPropertyId;
      if (statusFilter) params.status = statusFilter;
      params.limit = 100; // Fetch all for now, paginasi di front-end atau bisa disesuaikan backend

      const res = await invoiceApi.list(accessToken, params);
      setInvoices(res.data || []);

      if (!isTenant) {
        const propsRes = await propertyApi.list(accessToken, { limit: 100 });
        setProperties(propsRes.data || []);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, [accessToken, selectedPropertyId, statusFilter, isTenant]);

  useEffect(() => {
    if (!user) return;
    if (user.role === 'TENANT' && !statusFilter) {
      setStatusFilter('PAID');
    }
    fetchData();
  }, [user, fetchData]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedPropertyId, statusFilter, searchQuery]);

  const handleGenerateInvoices = async () => {
    const result = await Swal.fire({
      title: 'Generate Tagihan?',
      text: 'Sistem akan otomatis mengecek seluruh kontrak aktif dan membuat tagihan untuk bulan ini (jika belum ada).',
      icon: 'info',
      showCancelButton: true,
      confirmButtonColor: 'var(--brand-600)',
      cancelButtonColor: 'var(--txt-muted)',
      confirmButtonText: 'Ya, Generate Sekarang',
      cancelButtonText: 'Batal',
      customClass: { popup: 'rounded-xl' }
    });

    if (result.isConfirmed) {
      setIsGenerating(true);
      try {
        await invoiceApi.generate(accessToken!);
        Swal.fire({
          title: 'Berhasil!',
          text: 'Proses generate tagihan telah selesai.',
          icon: 'success',
          confirmButtonColor: 'var(--brand-600)',
          customClass: { popup: 'rounded-xl' }
        });
        fetchData();
      } catch (err: any) {
        console.error(err);
        Swal.fire({
          title: 'Gagal',
          text: err.message || 'Gagal generate tagihan.',
          icon: 'error',
          confirmButtonColor: 'var(--clr-danger)',
          customClass: { popup: 'rounded-xl' }
        });
      } finally {
        setIsGenerating(false);
      }
    }
  };

  const filteredInvoices = invoices.filter(inv => 
    (inv as any).contract?.tenant?.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (inv as any).contract?.room?.roomNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const paginatedInvoices = filteredInvoices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'PAID':
        return <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--clr-success)', fontSize: '12px', fontWeight: 600, background: '#e6f8f0', padding: '4px 8px', borderRadius: '20px' }}><CheckCircle2 size={14} /> Lunas</div>;
      case 'WAITING_VERIFICATION':
        return <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--brand-600)', fontSize: '12px', fontWeight: 600, background: 'var(--brand-50)', padding: '4px 8px', borderRadius: '20px' }}><Clock size={14} /> Cek Bukti</div>;
      case 'PARTIAL':
        return <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#B45309', fontSize: '12px', fontWeight: 600, background: '#FEF3C7', padding: '4px 8px', borderRadius: '20px' }}><Clock size={14} /> Dicicil</div>;
      case 'OVERDUE':
        return <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--clr-danger)', fontSize: '12px', fontWeight: 600, background: '#fff0f0', padding: '4px 8px', borderRadius: '20px' }}><AlertCircle size={14} /> Terlambat</div>;
      case 'ACTIVE':
      case 'PENDING':
        return <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--txt-primary)', fontSize: '12px', fontWeight: 600, background: 'var(--bg-sunken)', padding: '4px 8px', borderRadius: '20px' }}><Clock size={14} /> Belum Bayar</div>;
      case 'CANCELLED':
        return <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--txt-muted)', fontSize: '12px', fontWeight: 600, background: 'var(--bdr-strong)', padding: '4px 8px', borderRadius: '20px' }}>Dibatalkan</div>;
      default:
        return <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--txt-muted)', fontSize: '12px', fontWeight: 600, background: 'var(--bdr-strong)', padding: '4px 8px', borderRadius: '20px' }}>{status}</div>;
    }
  };

  if (authLoading || loading) return (
    <div className="page-loader">
      <div className="spinner" />
      <p style={{ fontSize: '13px', color: 'var(--txt-muted)' }}>Memuat tagihan...</p>
    </div>
  );
  if (!user) return null;



  return (
    <AppLayout title={isTenant ? "Tagihan Saya" : "Manajemen Tagihan"} subtitle={isTenant ? "Daftar seluruh riwayat tagihan Anda" : "Kelola pembayaran biaya sewa dan denda keterlambatan"}>
      <div className="page-container stack-lg">
        {/* Header & Filters Section */}
        <div className="card" style={{ padding: '20px', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', flex: 1 }}>
            <div className="search-bar" style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-sunken)', border: '1px solid var(--bdr-strong)', borderRadius: 'var(--r-md)', padding: '8px 12px', flex: '1 1 200px', maxWidth: '300px' }}>
              <Search size={16} color="var(--txt-muted)" style={{ marginRight: '8px' }} />
              <input 
                type="text" 
                placeholder="Cari penghuni / kamar..." 
                style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '14px' }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            
            {!isTenant && (
              <select 
                className="form-input" 
                style={{ minWidth: '160px' }}
                value={selectedPropertyId}
                onChange={(e) => setSelectedPropertyId(e.target.value)}
              >
                <option value="">Semua Properti</option>
                {properties.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            )}

            <select 
              className="form-input" 
              style={{ minWidth: '150px' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Semua Status</option>
              <option value="ACTIVE">Belum Bayar</option>
              <option value="PARTIAL">Dicicil (Sebagian)</option>
              <option value="WAITING_VERIFICATION">Cek Bukti Transfer</option>
              <option value="PAID">Lunas</option>
              <option value="OVERDUE">Terlambat</option>
            </select>
          </div>
          
          {!isTenant && (
            <button className="btn btn--primary" onClick={handleGenerateInvoices} disabled={isGenerating}>
              <RefreshCw size={16} className={isGenerating ? 'spin' : ''} />
              {isGenerating ? 'Memproses...' : 'Generate Tagihan Otomatis'}
            </button>
          )}
        </div>

        {/* List Section */}
        {filteredInvoices.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--bg-surface)', border: '1px dashed var(--bdr-strong)', borderRadius: 'var(--r-xl)' }}>
            <div style={{ width: '64px', height: '64px', background: 'var(--bg-sunken)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--txt-muted)' }}>
              <FileText size={28} />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--txt-primary)', marginBottom: '8px' }}>
              Tidak Ada Data Tagihan
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--txt-secondary)', maxWidth: '300px', margin: '0 auto' }}>
              Belum ada tagihan yang dibuat untuk bulan ini atau sesuai kriteria pencarian Anda.
            </p>
          </div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-sunken)', borderBottom: '1px solid var(--bdr-subtle)' }}>
                    <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: 600, color: 'var(--txt-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Periode & Jatuh Tempo</th>
                    <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: 600, color: 'var(--txt-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Penghuni & Kamar</th>
                    <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: 600, color: 'var(--txt-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Nominal</th>
                    <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: 600, color: 'var(--txt-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</th>
                    <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: 600, color: 'var(--txt-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedInvoices.map((inv: any) => (
                    <tr key={inv.id} style={{ borderBottom: '1px solid var(--bdr-subtle)', transition: 'background 0.2s', background: inv.status === 'PAID' ? 'transparent' : 'var(--bg-surface)' }}>
                      <td style={{ padding: '20px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--txt-primary)', fontSize: '15px' }}>{formatPeriod(inv.period)}</div>
                        <div style={{ fontSize: '12px', color: 'var(--txt-secondary)', marginTop: '4px' }}>
                          Tenggat: <span style={{ color: inv.status === 'OVERDUE' ? 'var(--clr-danger)' : 'inherit', fontWeight: inv.status === 'OVERDUE' ? 600 : 400 }}>{formatDate(inv.dueDate)}</span>
                        </div>
                      </td>
                      <td style={{ padding: '20px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--txt-primary)', fontSize: '14px' }}>{inv.contract?.tenant?.user?.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--txt-secondary)', marginTop: '4px' }}>
                          Kamar {inv.contract?.room?.roomNumber} • {inv.contract?.room?.property?.name}
                        </div>
                      </td>
                      <td style={{ padding: '20px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--txt-primary)', fontSize: '15px', letterSpacing: '-0.5px' }}>
                          {formatCurrency(inv.totalAmount)}
                        </div>
                        {inv.paidAmount > 0 && inv.status !== 'PAID' && (
                          <div style={{ fontSize: '11px', color: 'var(--brand-600)', marginTop: '2px', fontWeight: 600 }}>
                            Telah dibayar: {formatCurrency(inv.paidAmount)}
                          </div>
                        )}
                        {inv.lateFee > 0 && (
                          <div style={{ fontSize: '11px', color: 'var(--clr-danger)', marginTop: '2px', fontWeight: 600 }}>
                            + Denda {formatCurrency(inv.lateFee)}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '20px' }}>
                        {getStatusBadge(inv.status)}
                      </td>
                      <td style={{ padding: '20px', textAlign: 'right' }}>
                        <Link href={`/invoices/${inv.id}`} className="btn btn--secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                          <Eye size={14} /> Detail
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderTop: '1px solid var(--bdr-subtle)', background: '#fafafa' }}>
                <div style={{ fontSize: '13px', color: 'var(--txt-secondary)' }}>
                  Menampilkan <span style={{ fontWeight: 600, color: 'var(--txt-primary)' }}>{(currentPage - 1) * itemsPerPage + 1}</span> - <span style={{ fontWeight: 600, color: 'var(--txt-primary)' }}>{Math.min(currentPage * itemsPerPage, filteredInvoices.length)}</span> dari <span style={{ fontWeight: 600, color: 'var(--txt-primary)' }}>{filteredInvoices.length}</span> tagihan
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    className="btn" 
                    style={{ padding: '6px 12px', fontSize: '13px', background: currentPage === 1 ? 'var(--bdr-subtle)' : '#fff', opacity: currentPage === 1 ? 0.5 : 1 }}
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  >
                    Sebelumnya
                  </button>
                  <button 
                    className="btn" 
                    style={{ padding: '6px 12px', fontSize: '13px', background: currentPage === totalPages ? 'var(--bdr-subtle)' : '#fff', opacity: currentPage === totalPages ? 0.5 : 1 }}
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  >
                    Selanjutnya
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}} />
    </AppLayout>
  );
}
