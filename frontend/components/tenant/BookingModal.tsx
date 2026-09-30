'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { contractApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { X, CheckCircle2, Loader2, Home, Calendar, Wallet, Sparkles, Check } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function BookingModal({
  room,
  onClose,
}: {
  room: any;
  onClose: () => void;
}) {
  const [duration, setDuration] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { accessToken } = useAuth();
  const router = useRouter();
  const toast = useToast();

  const handleCheckout = async () => {
    if (!accessToken) return;
    setError('');
    setLoading(true);
    try {
      // Untuk kontrakan, durasi yang dipilih adalah Tahun. Maka kalikan 12 untuk durationMonths.
      const isKontrakan = room.property?.type?.includes('KONTRAKAN');
      const durationToSend = isKontrakan ? duration * 12 : duration;

      const res = await contractApi.book({
        roomId: room.id,
        durationMonths: durationToSend,
        startDate: new Date().toISOString(),
      }, accessToken);
      
      // Sukses booking, res adalah invoice
      toast.success('Pemesanan kamar berhasil! Tagihan pertama telah dibuat.');
      router.push(`/invoices/${res.id}`);
    } catch (err: any) {
      setError(err.message || 'Gagal memproses booking. Silakan coba lagi.');
      toast.error(err.message || 'Gagal memproses booking.');
      setLoading(false);
    }
  };

  const isKontrakan = room.property?.type?.includes('KONTRAKAN');
  const billingCycle = room.property?.billingCycle || (isKontrakan ? 'YEARLY' : 'MONTHLY');
  
  // Kontrakan tidak memiliki deposit sesuai business process
  const deposit = isKontrakan ? 0 : (room.depositAmount || 0); 
  const totalAmount = room.price + deposit;

  // Sesuaikan opsi durasi berdasarkan tipe
  const durationOptions = isKontrakan ? [1, 2, 3] : [1, 3, 6, 12];
  const durationLabel = isKontrakan ? 'Tahun' : 'Bulan';

  let facilities: string[] = [];
  try {
    facilities = typeof room.facilities === 'string' 
      ? JSON.parse(room.facilities) 
      : (Array.isArray(room.facilities) ? room.facilities : []);
  } catch (e) {
    facilities = [];
  }

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh', width: '100%', maxWidth: '500px' }}>
        
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--bdr-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--txt-primary)', margin: 0 }}>
            Detail Sewa Kamar
          </h2>
          <button className="modal-close" onClick={onClose} style={{ position: 'relative', top: 0, right: 0, background: 'var(--bg-sunken)' }}><X size={18} /></button>
        </div>

        {/* Scrollable Content */}
        <div style={{ padding: '24px', overflowY: 'auto', background: '#f8fafc' }}>
          {error && (
            <div className="alert alert-danger" style={{ marginBottom: '20px' }}>
              {error}
            </div>
          )}

          <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid var(--bdr-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, var(--brand-100) 0%, var(--brand-50) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-600)' }}>
                <Home size={24} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: '18px', color: 'var(--txt-primary)', lineHeight: 1.2 }}>{isKontrakan ? 'Unit' : 'Kamar'} {room.roomNumber}</div>
                <div style={{ fontSize: '13px', color: 'var(--txt-secondary)', marginTop: '4px' }}>{room.property?.name}</div>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px', paddingTop: '16px', borderTop: '1px dashed var(--bdr-subtle)' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--txt-muted)', display: 'block', marginBottom: '6px' }}>Tipe</label>
                <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--txt-primary)' }}>{room.type}</div>
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--txt-muted)', display: 'block', marginBottom: '6px' }}>Harga / {isKontrakan ? 'Tahun' : 'Bulan'}</label>
                <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--brand-600)' }}>{formatCurrency(room.price)}</div>
              </div>
            </div>
          </div>

          {facilities.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--txt-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={16} color="var(--brand-500)" /> Fasilitas Tersedia
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {facilities.map((fac, idx) => (
                  <div key={idx} style={{ fontSize: '12px', fontWeight: 500, color: 'var(--txt-secondary)', background: '#fff', padding: '6px 12px', borderRadius: '20px', border: '1px solid var(--bdr-subtle)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Check size={14} color="var(--clr-success)" /> {fac}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 600, color: 'var(--txt-primary)', marginBottom: '12px' }}>
              <Calendar size={16} color="var(--brand-500)" /> Durasi Sewa
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: '10px' }}>
              {durationOptions.map(m => (
                <div 
                  key={m} 
                  onClick={() => !loading && setDuration(m)}
                  style={{
                    padding: '12px 8px',
                    textAlign: 'center',
                    borderRadius: '12px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    border: duration === m ? '2px solid var(--brand-500)' : '1px solid var(--bdr-subtle)',
                    background: duration === m ? 'var(--brand-50)' : '#fff',
                    color: duration === m ? 'var(--brand-700)' : 'var(--txt-primary)',
                    fontWeight: duration === m ? 800 : 600,
                    transition: 'all 0.2s ease',
                    boxShadow: duration === m ? '0 4px 12px rgba(2, 132, 199, 0.15)' : 'none',
                    opacity: loading ? 0.6 : 1
                  }}
                >
                  <div style={{ fontSize: '16px', marginBottom: '2px' }}>{m}</div>
                  <div style={{ fontSize: '12px', color: duration === m ? 'var(--brand-600)' : 'var(--txt-muted)' }}>{durationLabel}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ padding: '20px', border: '1px solid rgba(2, 132, 199, 0.15)', borderRadius: '16px', background: 'linear-gradient(to right, #f0f9ff, #e0f2fe)' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0369a1', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Wallet size={18} /> Rincian Tagihan Pertama
            </h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#0c4a6e', marginBottom: '12px' }}>
              <span style={{ fontWeight: 500 }}>Sewa {isKontrakan ? 'Tahun' : 'Bulan'} ke-1</span>
              <span style={{ fontWeight: 700 }}>{formatCurrency(room.price)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#0c4a6e', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px dashed rgba(3, 105, 161, 0.3)' }}>
              <span style={{ fontWeight: 500 }}>Deposit (Jaminan)</span>
              <span style={{ fontWeight: 700 }}>{formatCurrency(deposit)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 800, color: '#0369a1' }}>
              <span>Total Tagihan</span>
              <span>{formatCurrency(totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '20px 24px', borderTop: '1px solid var(--bdr-subtle)', background: '#fff', display: 'flex', gap: '12px' }}>
          <button className="btn btn--secondary" style={{ flex: 1, padding: '12px' }} onClick={onClose} disabled={loading}>Batal</button>
          <button className="btn btn--primary" style={{ flex: 2, padding: '12px' }} onClick={handleCheckout} disabled={loading}>
            {loading ? <Loader2 size={18} className="spin" /> : <CheckCircle2 size={18} />}
            <span style={{ marginLeft: '6px', fontSize: '15px' }}>{loading ? 'Memproses...' : 'Checkout Sekarang'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
