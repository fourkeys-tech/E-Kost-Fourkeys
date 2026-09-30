'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { X, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { formatCurrency, formatPeriod, formatDate } from '@/lib/utils';
import { Invoice } from '@/types';
import { invoiceApi } from '@/lib/api';

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  invoices: Invoice[];
  accessToken: string;
}

export default function PaymentModal({ open, onClose, invoices, accessToken }: PaymentModalProps) {
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

  const activeInvoices = invoices.filter(i => ['ACTIVE', 'OVERDUE', 'PENDING', 'WAITING_VERIFICATION', 'PARTIAL'].includes(i.status));
  
  const futureInvoices: any[] = [];
  if (invoices.length > 0) {
    const sortedInvoices = [...invoices].sort((a, b) => new Date(b.period).getTime() - new Date(a.period).getTime());
    const latestInvoice = sortedInvoices[0] as any;
    if (latestInvoice?.contract?.isActive) {
      const contract = latestInvoice.contract;
      const [yStr, mStr] = latestInvoice.period.split('-');
      let currentY = parseInt(yStr);
      let currentM = parseInt(mStr);
      
      for (let i = 1; i <= 6; i++) {
        let nextM = currentM + i;
        let nextY = currentY;
        while (nextM > 12) {
          nextM -= 12;
          nextY += 1;
        }
        const nextDueDate = new Date(nextY, nextM - 1, contract.dueDay);
        if (contract.endDate && nextDueDate > new Date(contract.endDate)) break;
        
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
        futureInvoices.push({
          id: `future-${i}`,
          contractId: contract.id,
          period: `${nextY}-${String(nextM).padStart(2, '0')}`,
          label: `${monthNames[nextM - 1]} ${nextY}`,
          dueDate: nextDueDate,
          amount: contract.rentAmount
        });
      }
    }
  }

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

  return (
    <div
      ref={backdropRef}
      className="modal-backdrop"
      style={{
        position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
      }}
      onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
    >
      <div className="modal" style={{ background: '#f8fafc', borderRadius: '16px', width: '100%', maxWidth: '520px', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--bdr-subtle)', background: '#fff', borderRadius: '16px 16px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Belum Lunas</h2>
            <p style={{ fontSize: '13px', color: 'var(--txt-secondary)', margin: '4px 0 0 0' }}>Daftar tagihan yang perlu Anda bayar</p>
          </div>
          <button onClick={onClose} style={{ background: 'var(--bg-sunken)', border: 'none', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--txt-secondary)' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '24px', overflowY: 'auto' }}>
          {activeInvoices.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '14px', color: 'var(--txt-secondary)', marginBottom: '12px', fontWeight: 600 }}>Tagihan Saat Ini</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {activeInvoices.map((inv: any) => (
                  <Link href={`/invoices/${inv.id}`} key={inv.id} style={{ display: 'block', textDecoration: 'none' }}>
                    <div style={{ background: '#fff', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                      <div>
                        <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--txt-primary)' }}>{formatPeriod(inv.period)}</div>
                        <div style={{ fontSize: '12px', color: inv.status === 'OVERDUE' ? 'var(--clr-danger)' : 'var(--txt-secondary)', marginTop: '4px' }}>
                          Tanggal jatuh tempo {formatDate(inv.dueDate)}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--txt-primary)' }}>{formatCurrency(inv.totalAmount)}</div>
                          <div style={{ marginTop: '4px' }}>{getStatusBadge(inv.status)}</div>
                        </div>
                        <div style={{ color: 'var(--txt-muted)' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg></div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
          
          {futureInvoices.length > 0 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '14px', color: 'var(--txt-secondary)', margin: 0, fontWeight: 600 }}>Tagihan Berikutnya</h3>
              </div>
              
              {activeInvoices.length > 0 && (
                <div style={{ fontSize: '12px', color: '#B45309', background: '#FEF3C7', padding: '8px 12px', borderRadius: '6px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
                  <AlertCircle size={14} /> Lunasi tagihan saat ini terlebih dahulu untuk membayar tagihan berikutnya
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {futureInvoices.map((inv: any) => (
                  <div key={inv.id} onClick={async () => {
                    if (activeInvoices.length > 0) return;
                    try {
                      const res = await invoiceApi.payEarly(inv.contractId, accessToken, inv.period);
                      window.location.href = `/invoices/${(res as any).id}`;
                    } catch(err: any) {
                      alert(err.message || 'Gagal membuat tagihan');
                    }
                  }} style={{ background: '#fff', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', cursor: activeInvoices.length > 0 ? 'not-allowed' : 'pointer', transition: 'transform 0.1s', opacity: activeInvoices.length > 0 ? 0.6 : 1 }} onMouseDown={e => { if (activeInvoices.length === 0) e.currentTarget.style.transform = 'scale(0.98)' }} onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}>
                    <div>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--txt-primary)' }}>{inv.label}</div>
                      <div style={{ fontSize: '12px', color: 'var(--txt-secondary)', marginTop: '4px' }}>
                        Tanggal jatuh tempo {formatDate(inv.dueDate)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--txt-primary)' }}>{formatCurrency(inv.amount)}</div>
                      {activeInvoices.length === 0 && <div style={{ color: 'var(--txt-muted)' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg></div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeInvoices.length === 0 && futureInvoices.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--txt-muted)' }}>
              <CheckCircle2 size={48} style={{ margin: '0 auto 12px', color: 'var(--clr-success)', opacity: 0.5 }} />
              <p>Semua tagihan sudah lunas dan tidak ada tagihan berikutnya.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
