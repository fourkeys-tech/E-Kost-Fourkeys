'use client';

import { useEffect, useState, useCallback } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useAuth } from '@/contexts/AuthContext';
import { paymentApi } from '@/lib/api';
import { Payment } from '@/types';
import { formatCurrency, formatDate, formatPeriod } from '@/lib/utils';
import { Search, CheckCircle, XCircle, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Link from 'next/link';

export default function VerifyPaymentsPage() {
  const { user, loading: authLoading } = useRequireAuth({ allowedRoles: ['OWNER', 'ADMIN', 'SUPER_ADMIN'] });
  const { accessToken } = useAuth();
  const toast = useToast();
  
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [verifyModal, setVerifyModal] = useState<{isOpen: boolean, paymentId: string, action: 'approve' | 'reject'} | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchPendingPayments = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const res = await paymentApi.list(accessToken, { status: 'WAITING_VERIFICATION' });
      setPayments(res || []);
    } catch (err) {
      console.error('Error fetching payments:', err);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (!user) return;
    fetchPendingPayments();
  }, [user, fetchPendingPayments]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handleVerifyConfirm = async (rejectReason?: string) => {
    if (!verifyModal) return;
    const { paymentId, action } = verifyModal;
    setProcessingId(paymentId);
    try {
      await paymentApi.verify(paymentId, { action, rejectReason }, accessToken!);
      toast.success(`Pembayaran berhasil di${action === 'approve' ? 'terima' : 'tolak'}.`);
      fetchPendingPayments();
      setVerifyModal(null);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Gagal memverifikasi');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredPayments = payments.filter((p: any) => 
    p.contract?.tenant?.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.contract?.room?.roomNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const paginatedPayments = filteredPayments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (authLoading || loading) return (
    <div className="page-loader">
      <div className="spinner" />
      <p style={{ fontSize: '13px', color: 'var(--txt-muted)' }}>Memuat antrean verifikasi...</p>
    </div>
  );
  if (!user) return null;

  return (
    <AppLayout title="Verifikasi Pembayaran" subtitle="Tinjau dan setujui bukti transfer manual dari penyewa">
      <div className="page-container stack-lg">
        <div className="card" style={{ padding: '20px', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div className="search-bar" style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-sunken)', border: '1px solid var(--bdr-strong)', borderRadius: 'var(--r-md)', padding: '8px 12px', flex: '1 1 250px', maxWidth: '400px' }}>
            <Search size={16} color="var(--txt-muted)" style={{ marginRight: '8px' }} />
            <input 
              type="text" 
              placeholder="Cari nama penghuni atau kamar..." 
              style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '14px' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--txt-secondary)' }}>
            Menunggu: <span style={{ color: 'var(--brand-600)' }}>{payments.length}</span> Transaksi
          </div>
        </div>

        {filteredPayments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--bg-surface)', border: '1px dashed var(--bdr-strong)', borderRadius: 'var(--r-xl)' }}>
            <div style={{ width: '64px', height: '64px', background: 'var(--bg-sunken)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--txt-muted)' }}>
              <CheckCircle size={28} color="var(--clr-success)" />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--txt-primary)', marginBottom: '8px' }}>
              Semua Pembayaran Telah Diperiksa!
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--txt-secondary)', maxWidth: '300px', margin: '0 auto' }}>
              Tidak ada bukti transfer yang menunggu verifikasi Anda saat ini.
            </p>
          </div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-sunken)', borderBottom: '1px solid var(--bdr-subtle)' }}>
                    <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: 600, color: 'var(--txt-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Waktu Upload</th>
                    <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: 600, color: 'var(--txt-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Penghuni & Kamar</th>
                    <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: 600, color: 'var(--txt-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Untuk Tagihan</th>
                    <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: 600, color: 'var(--txt-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Nominal Transfer</th>
                    <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: 600, color: 'var(--txt-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center' }}>Aksi Verifikasi</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPayments.map((p: any) => (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--bdr-subtle)', background: 'transparent' }}>
                      <td style={{ padding: '20px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--txt-primary)', fontSize: '14px' }}>
                          {formatDate(p.createdAt)}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--txt-secondary)', marginTop: '4px' }}>
                          {new Date(p.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                        </div>
                      </td>
                      <td style={{ padding: '20px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--txt-primary)', fontSize: '15px' }}>
                          {p.contract?.tenant?.user?.name}
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--txt-secondary)', marginTop: '4px' }}>
                          Kamar {p.contract?.room?.roomNumber} • {p.contract?.room?.property?.name}
                        </div>
                      </td>
                      <td style={{ padding: '20px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--txt-primary)', fontSize: '14px' }}>
                          Alokasi Otomatis
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--txt-secondary)', marginTop: '6px' }}>
                          Tagihan Terlama / Deposit
                        </div>
                      </td>
                      <td style={{ padding: '20px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--txt-primary)', fontSize: '15px', letterSpacing: '-0.5px' }}>
                          {formatCurrency(p.amount)}
                        </div>
                        {p.proofUrl && (
                          <div style={{ marginTop: '8px' }}>
                            <a href={p.proofUrl.startsWith('http') ? p.proofUrl : `http://localhost:5000${p.proofUrl}`} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--txt-secondary)', textDecoration: 'underline', fontWeight: 500 }}>
                              <ImageIcon size={14} /> Buka Gambar Bukti
                            </a>
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '20px' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button 
                            className="btn btn--primary" 
                            style={{ padding: '6px 12px', fontSize: '13px' }} 
                            onClick={() => setVerifyModal({ isOpen: true, paymentId: p.id, action: 'approve' })}
                            disabled={processingId === p.id}
                          >
                            {processingId === p.id ? <Loader2 size={14} className="spin" /> : <CheckCircle size={14} />} Terima
                          </button>
                          <button 
                            className="btn" 
                            style={{ padding: '6px 12px', fontSize: '13px', background: '#fff0f0', color: 'var(--clr-danger)', border: '1px solid #ffcccc' }} 
                            onClick={() => setVerifyModal({ isOpen: true, paymentId: p.id, action: 'reject' })}
                            disabled={processingId === p.id}
                          >
                            <XCircle size={14} /> Tolak
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderTop: '1px solid var(--bdr-subtle)', background: '#fafafa' }}>
                <div style={{ fontSize: '13px', color: 'var(--txt-secondary)' }}>
                  Menampilkan <span style={{ fontWeight: 600, color: 'var(--txt-primary)' }}>{(currentPage - 1) * itemsPerPage + 1}</span> - <span style={{ fontWeight: 600, color: 'var(--txt-primary)' }}>{Math.min(currentPage * itemsPerPage, filteredPayments.length)}</span> dari <span style={{ fontWeight: 600, color: 'var(--txt-primary)' }}>{filteredPayments.length}</span> antrean
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
        .badge { padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
        .badge-pending { background: var(--brand-100); color: var(--brand-700); }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}} />

      <ConfirmDialog
        isOpen={verifyModal?.isOpen || false}
        type={verifyModal?.action === 'approve' ? 'success' : 'danger'}
        title={verifyModal?.action === 'approve' ? 'Terima Pembayaran?' : 'Tolak Pembayaran?'}
        message={verifyModal?.action === 'approve' 
          ? 'Tagihan akan ditandai Lunas. Apakah Anda yakin?' 
          : 'Penyewa harus mengunggah ulang bukti pembayaran. Silakan berikan alasan penolakan:'}
        confirmText={verifyModal?.action === 'approve' ? 'Ya, Terima' : 'Ya, Tolak'}
        onConfirm={handleVerifyConfirm}
        onCancel={() => setVerifyModal(null)}
        isLoading={processingId !== null}
        showInput={verifyModal?.action === 'reject'}
        inputPlaceholder="Contoh: Bukti transfer buram"
      />
    </AppLayout>
  );
}
