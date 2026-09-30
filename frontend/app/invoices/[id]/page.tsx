'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useAuth } from '@/contexts/AuthContext';
import { invoiceApi, paymentApi } from '@/lib/api';
import { Invoice } from '@/types';
import { formatCurrency, formatPeriod, formatDate } from '@/lib/utils';
import { ArrowLeft, FileText, Upload, CreditCard, CheckCircle2, AlertCircle, Loader2, Check, X } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { user, loading: authLoading } = useRequireAuth();
  const { accessToken } = useAuth();
  const toast = useToast();
  
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Payment states
  const [paymentMethod, setPaymentMethod] = useState<'MANUAL' | 'MIDTRANS' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const fetchInvoice = async () => {
    if (!accessToken) return;
    try {
      const data = await invoiceApi.get(resolvedParams.id, accessToken);
      setInvoice(data);
    } catch (err) {
      console.error(err);
      toast.error('Gagal memuat detail tagihan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchInvoice();
  }, [user, resolvedParams.id, accessToken]);

  const handlePayManual = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file || !invoice || !accessToken) return;
    setIsSubmitting(true);
    
    const form = e.target as HTMLFormElement;
    const amountInput = form.elements.namedItem('amount') as HTMLInputElement;
    
    const formData = new FormData();
    formData.append('invoiceId', invoice.id);
    formData.append('amount', amountInput.value);
    formData.append('method', 'MANUAL');
    formData.append('proof', file); // Harus sama dengan multer di backend: upload.single('proof')

    try {
      await paymentApi.submit(formData, accessToken);
      toast.success('Bukti transfer berhasil diunggah! Menunggu verifikasi pemilik kost.');
      fetchInvoice();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Gagal mengunggah bukti');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePayMidtrans = async () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      toast.info('Integrasi Midtrans sedang dalam pengembangan');
    }, 1000);
  };



  if (loading || !invoice) return (
    <AppLayout title="Detail Tagihan">
      <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 20px', color: 'var(--brand-600)' }}>
        <Loader2 size={32} className="spin" />
      </div>
    </AppLayout>
  );

  const canPay = invoice.status === 'ACTIVE' || invoice.status === 'OVERDUE' || invoice.status === 'PARTIAL' || invoice.status === 'PENDING';
  const isOwner = user?.role === 'OWNER' || user?.role === 'ADMIN';
  const lastPayment = invoice.allocations?.[0]?.payment || (invoice as any).contract?.payments?.[0]; // Payment terbaru via allocation

  const isTenant = user?.role === 'TENANT';

  return (
    <AppLayout 
      title={`Detail Tagihan: ${formatPeriod(invoice.period)}`} 
      subtitle={`ID: ${invoice.id}`}
    >
      <div className="page-container stack-lg">
        <div style={{ marginBottom: '16px' }}>
          <Link href={isTenant ? '/dashboard' : '/invoices'} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--txt-secondary)', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>
            <ArrowLeft size={16} /> Kembali ke Daftar
          </Link>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'flex-start' }}>
          {/* Kiri: Info Invoice */}
          <div className="card" style={{ flex: '1 1 600px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--bdr-subtle)', paddingBottom: '20px', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--txt-primary)', letterSpacing: '-0.5px' }}>Tagihan Sewa</h2>
                <p style={{ color: 'var(--txt-secondary)', fontSize: '14px' }}>{invoice.contract?.room?.property?.name}</p>
              </div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, padding: '6px 12px', borderRadius: '20px',
                background: invoice.status === 'PAID' ? '#e6f8f0' : invoice.status === 'OVERDUE' ? '#fff0f0' : invoice.status === 'WAITING_VERIFICATION' ? 'var(--brand-50)' : 'var(--bg-sunken)',
                color: invoice.status === 'PAID' ? 'var(--clr-success)' : invoice.status === 'OVERDUE' ? 'var(--clr-danger)' : invoice.status === 'WAITING_VERIFICATION' ? 'var(--brand-600)' : 'var(--txt-primary)'
              }}>
                {invoice.status === 'PAID' ? 'LUNAS' : invoice.status === 'WAITING_VERIFICATION' ? 'MENUNGGU VERIFIKASI' : invoice.status === 'OVERDUE' ? 'TERLAMBAT' : 'BELUM BAYAR'}
              </div>
            </div>

            <div className="grid grid-cols-2" style={{ gap: '24px', marginBottom: '32px' }}>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--txt-muted)', marginBottom: '4px' }}>Ditagihkan Kepada:</div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--txt-primary)' }}>{invoice.contract?.tenant?.user.name}</div>
                <div style={{ fontSize: '13px', color: 'var(--txt-secondary)' }}>Kamar {invoice.contract?.room?.roomNumber}</div>
                <div style={{ fontSize: '13px', color: 'var(--txt-secondary)' }}>{invoice.contract?.tenant?.user.email}</div>
              </div>
              <div>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--txt-muted)', marginBottom: '4px' }}>Periode:</div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--txt-primary)' }}>{formatPeriod(invoice.period)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--txt-muted)', marginBottom: '4px' }}>Jatuh Tempo:</div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: invoice.status === 'OVERDUE' ? 'var(--clr-danger)' : 'var(--txt-primary)' }}>
                    {formatDate(invoice.dueDate)}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ border: '1px solid var(--bdr-subtle)', borderRadius: 'var(--r-md)', overflow: 'hidden', marginBottom: '24px' }}>
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead style={{ background: 'var(--bg-sunken)' }}>
                  <tr>
                    <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: 'var(--txt-secondary)' }}>Deskripsi</th>
                    <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: 'var(--txt-secondary)', textAlign: 'right' }}>Jumlah</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid var(--bdr-subtle)' }}>
                    <td style={{ padding: '16px', fontSize: '14px', color: 'var(--txt-primary)' }}>Biaya Sewa Pokok</td>
                    <td style={{ padding: '16px', fontSize: '14px', color: 'var(--txt-primary)', textAlign: 'right', fontWeight: 600 }}>{formatCurrency(invoice.amount)}</td>
                  </tr>
                  {(invoice.totalAmount - invoice.amount - invoice.lateFee) > 0 && (
                    <tr style={{ borderBottom: '1px solid var(--bdr-subtle)' }}>
                      <td style={{ padding: '16px', fontSize: '14px', color: 'var(--txt-primary)' }}>Deposit (Uang Jaminan)</td>
                      <td style={{ padding: '16px', fontSize: '14px', color: 'var(--txt-primary)', textAlign: 'right', fontWeight: 600 }}>{formatCurrency(invoice.totalAmount - invoice.amount - invoice.lateFee)}</td>
                    </tr>
                  )}
                  {invoice.lateFee > 0 && (
                    <tr style={{ borderBottom: '1px solid var(--bdr-subtle)' }}>
                      <td style={{ padding: '16px', fontSize: '14px', color: 'var(--clr-danger)' }}>Denda Keterlambatan</td>
                      <td style={{ padding: '16px', fontSize: '14px', color: 'var(--clr-danger)', textAlign: 'right', fontWeight: 600 }}>{formatCurrency(invoice.lateFee)}</td>
                    </tr>
                  )}
                  {invoice.paidAmount > 0 && invoice.status !== 'PAID' && (
                    <tr style={{ borderBottom: '1px solid var(--brand-200)', background: 'var(--brand-50)' }}>
                      <td style={{ padding: '16px', fontSize: '14px', color: 'var(--brand-700)', fontWeight: 600 }}>Telah Dibayar (Dicicil)</td>
                      <td style={{ padding: '16px', fontSize: '14px', color: 'var(--brand-700)', textAlign: 'right', fontWeight: 700 }}>- {formatCurrency(invoice.paidAmount)}</td>
                    </tr>
                  )}
                </tbody>
                <tfoot style={{ background: 'var(--bg-sunken)' }}>
                  <tr>
                    <td style={{ padding: '16px', fontSize: '16px', fontWeight: 800, color: 'var(--txt-primary)' }}>Total Sisa Tagihan</td>
                    <td style={{ padding: '16px', fontSize: '18px', fontWeight: 800, color: 'var(--brand-600)', textAlign: 'right', letterSpacing: '-0.5px' }}>{formatCurrency(invoice.totalAmount - invoice.paidAmount)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Kanan: Aksi / Status Pembayaran */}
          <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {isTenant ? (
              <div className="card" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px' }}>Pembayaran</h3>
                
                {!canPay ? (
                  <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <FileText size={48} style={{ color: 'var(--txt-muted)', opacity: 0.5, margin: '0 auto 16px' }} />
                    <p style={{ fontSize: '13px', color: 'var(--txt-secondary)' }}>
                      {invoice.status === 'WAITING_VERIFICATION' 
                        ? 'Pembayaran sedang dalam proses verifikasi oleh pengelola.'
                        : 'Tagihan ini tidak memerlukan tindakan pembayaran saat ini (Lunas).'}
                    </p>
                  </div>
                ) : (
                  <div>
                    {/* NOMINAL CARD */}
                    <div style={{ padding: '16px 20px', background: 'linear-gradient(135deg, var(--brand-600) 0%, #7c3aed 100%)', borderRadius: '12px', color: '#fff', marginBottom: '24px', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)' }}>
                      <div style={{ fontSize: '12px', opacity: 0.85, fontWeight: 500, marginBottom: '4px' }}>Nominal yang Harus Dibayar</div>
                      <div style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.5px' }}>{formatCurrency(invoice.totalAmount - invoice.paidAmount)}</div>
                    </div>

                    <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px' }}>Pilih Metode Pembayaran:</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('MANUAL')}
                        style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '12px', borderRadius: '8px',
                          border: `2px solid ${paymentMethod === 'MANUAL' ? 'var(--brand-600)' : 'var(--bdr-strong)'}`,
                          background: paymentMethod === 'MANUAL' ? 'var(--brand-50)' : 'transparent',
                          color: paymentMethod === 'MANUAL' ? 'var(--brand-600)' : 'var(--txt-primary)',
                          transition: 'all 0.2s', cursor: 'pointer'
                        }}
                      >
                        <Upload size={20} />
                        <span style={{ fontSize: '12px', fontWeight: 600, textAlign: 'center' }}>Transfer<br/>Manual</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('MIDTRANS')}
                        style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '12px', borderRadius: '8px',
                          border: `2px solid ${paymentMethod === 'MIDTRANS' ? 'var(--brand-600)' : 'var(--bdr-strong)'}`,
                          background: paymentMethod === 'MIDTRANS' ? 'var(--brand-50)' : 'transparent',
                          color: paymentMethod === 'MIDTRANS' ? 'var(--brand-600)' : 'var(--txt-primary)',
                          transition: 'all 0.2s', cursor: 'pointer'
                        }}
                      >
                        <CreditCard size={20} />
                        <span style={{ fontSize: '12px', fontWeight: 600, textAlign: 'center' }}>Bayar<br/>Online</span>
                      </button>
                    </div>

                    {paymentMethod === 'MANUAL' && (
                      <form onSubmit={handlePayManual} style={{ animation: 'fadeIn 0.3s ease' }}>
                        <div style={{ padding: '12px', background: 'var(--bg-sunken)', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
                          <div style={{ fontWeight: 600, marginBottom: '4px' }}>Transfer ke Rekening:</div>
                          <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--brand-600)', letterSpacing: '1px', marginBottom: '2px' }}>BCA - 1234567890</div>
                          <div style={{ color: 'var(--txt-muted)' }}>a.n. Budi Santoso (KostPay)</div>
                        </div>
                        
                        {/* Hidden Amount Input */}
                        <input type="hidden" name="amount" value={invoice.totalAmount - invoice.paidAmount} />

                        <div className="form-group" style={{ marginBottom: '16px' }}>
                          <label className="form-label">Upload Bukti Transfer</label>
                          <input 
                            type="file" 
                            accept="image/*"
                            required
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                            style={{ display: 'block', width: '100%', fontSize: '13px', padding: '8px', border: '1px solid var(--bdr-strong)', borderRadius: 'var(--r-md)' }}
                          />
                        </div>
                        <button type="submit" className="btn btn--primary" style={{ width: '100%', padding: '12px', justifyContent: 'center' }} disabled={!file || isSubmitting}>
                          {isSubmitting ? <Loader2 size={16} className="spin" /> : 'Kirim Bukti Pembayaran'}
                        </button>
                      </form>
                    )}

                    {paymentMethod === 'MIDTRANS' && (
                      <div style={{ animation: 'fadeIn 0.3s ease' }}>
                        <div style={{ padding: '12px', background: 'var(--bg-sunken)', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', color: 'var(--txt-secondary)' }}>
                          Anda akan diarahkan ke halaman pembayaran aman. Mendukung VA, GoPay, OVO, QRIS, dll.
                        </div>
                        <button onClick={handlePayMidtrans} className="btn btn--primary" style={{ width: '100%', padding: '12px', justifyContent: 'center' }} disabled={isSubmitting}>
                          {isSubmitting ? <Loader2 size={16} className="spin" /> : 'Lanjutkan ke Pembayaran'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              // Tampilan Pemilik Kost
              <div className="card" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px' }}>Status Pembayaran</h3>
                
                {invoice.status === 'WAITING_VERIFICATION' && lastPayment && ['PENDING', 'WAITING_VERIFICATION'].includes(lastPayment.status) ? (
                  <div style={{ border: '1px solid var(--brand-200)', background: 'var(--brand-50)', borderRadius: '8px', padding: '16px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--brand-600)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <AlertCircle size={16} /> Menunggu Verifikasi
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--txt-secondary)', marginBottom: '16px' }}>
                      Penyewa telah mengunggah bukti transfer. Pembayaran ini menunggu verifikasi Anda di menu Verifikasi Pembayaran.
                    </p>
                    {lastPayment.proofUrl && (
                      <a href={lastPayment.proofUrl.startsWith('http') ? lastPayment.proofUrl : `http://localhost:5000${lastPayment.proofUrl}`} target="_blank" rel="noreferrer" style={{ display: 'block', fontSize: '13px', color: 'var(--brand-600)', fontWeight: 600, marginBottom: '0', textDecoration: 'underline' }}>
                        Lihat Gambar Bukti Transfer
                      </a>
                    )}
                  </div>
                ) : invoice.status === 'PAID' ? (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '16px', background: '#e6f8f0', borderRadius: '8px', border: '1px solid #bcead5' }}>
                    <CheckCircle2 size={24} color="var(--clr-success)" />
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--txt-primary)' }}>Sudah Lunas</div>
                      <div style={{ fontSize: '13px', color: 'var(--txt-secondary)' }}>Tagihan ini telah dibayar dan diverifikasi.</div>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '30px 20px', background: 'var(--bg-sunken)', borderRadius: '8px', border: '1px dashed var(--bdr-strong)' }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--txt-primary)', marginBottom: '4px' }}>Belum Dibayar</div>
                    <div style={{ fontSize: '12px', color: 'var(--txt-secondary)' }}>Penyewa belum melakukan pembayaran untuk tagihan ini.</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
      `}} />
    </AppLayout>
  );
}
