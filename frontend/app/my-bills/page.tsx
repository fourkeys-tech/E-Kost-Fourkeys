'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { Invoice } from '@/types';
import { PageLoader, EmptyState, SkeletonTable } from '@/components/ui/Loading';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatCurrency, formatPeriod, formatDate } from '@/lib/utils';
import { FileText, Eye, AlertCircle } from 'lucide-react';

export default function MyBillsPage() {
  const { user, loading: authLoading } = useRequireAuth({ allowedRoles: ['TENANT'] });
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    // Mock data for tenant bills
    setTimeout(() => {
      setInvoices([
        {
          id: '10',
          contractId: 'c10',
          period: '2026-08',
          amount: 1500000,
          lateFee: 0,
          totalAmount: 1500000,
          status: 'ACTIVE',
          dueDate: new Date(2026, 7, 5).toISOString(),
          createdAt: new Date().toISOString(),
          contract: {
            id: 'c10',
            tenantId: 't1',
            roomId: 'r1',
            startDate: '',
            durationMonths: 12,
            rentAmount: 1500000,
            deposit: 0,
            dueDay: 5,
            room: {
              id: 'r1',
              propertyId: 'p1',
              roomNumber: '101',
              type: 'Standard',
              price: 1500000,
              facilities: [],
              photos: [],
              status: 'OCCUPIED',
              property: { id: 'p1', name: 'Kost Melati Indah', address: 'Jl. Melati No 15', ownerId: '', facilities: [], photos: [], lateFeePct: 0, maxLateFee: 0 }
            }
          }
        },
        {
          id: '11',
          contractId: 'c10',
          period: '2026-07',
          amount: 1500000,
          lateFee: 0,
          totalAmount: 1500000,
          status: 'PAID',
          dueDate: new Date(2026, 6, 5).toISOString(),
          paidAt: new Date(2026, 6, 4).toISOString(),
          createdAt: new Date().toISOString(),
          contract: {
            id: 'c10',
            tenantId: 't1',
            roomId: 'r1',
            startDate: '',
            durationMonths: 12,
            rentAmount: 1500000,
            deposit: 0,
            dueDay: 5,
            room: {
              id: 'r1',
              propertyId: 'p1',
              roomNumber: '101',
              type: 'Standard',
              price: 1500000,
              facilities: [],
              photos: [],
              status: 'OCCUPIED',
              property: { id: 'p1', name: 'Kost Melati Indah', address: 'Jl. Melati No 15', ownerId: '', facilities: [], photos: [], lateFeePct: 0, maxLateFee: 0 }
            }
          }
        }
      ]);
      setLoading(false);
    }, 800);
  }, [user]);

  if (authLoading) return <PageLoader />;

  // Separate active/overdue bills from paid bills
  const activeBills = invoices.filter(inv => ['ACTIVE', 'OVERDUE', 'WAITING_VERIFICATION'].includes(inv.status));
  const historyBills = invoices.filter(inv => ['PAID', 'CANCELLED'].includes(inv.status));

  return (
    <AppLayout 
      title="Tagihan Saya" 
      subtitle="Kelola dan bayar tagihan kost bulanan Anda"
    >
      <h3 className="text-lg font-bold text-[var(--foreground)] mb-4">Tagihan Berjalan</h3>
      
      {loading ? (
        <SkeletonTable rows={2} />
      ) : activeBills.length === 0 ? (
        <div className="card mb-8">
          <EmptyState 
            icon={<FileText className="w-12 h-12" />}
            title="Tidak ada tagihan aktif"
            description="Semua tagihan Anda saat ini sudah lunas."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {activeBills.map(inv => (
            <div key={inv.id} className="card flex flex-col h-full border-l-4 border-l-[var(--warning)]">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-bold text-lg text-[var(--foreground)]">{formatPeriod(inv.period)}</h4>
                  <p className="text-sm text-[var(--muted)]">{inv.contract?.room?.property?.name} • Kamar {inv.contract?.room?.roomNumber}</p>
                </div>
                <StatusBadge status={inv.status} type="invoice" />
              </div>
              
              <div className="mb-6 flex-1">
                <p className="text-[var(--muted)] text-sm mb-1">Jatuh Tempo</p>
                <p className={`font-semibold ${inv.status === 'OVERDUE' ? 'text-[var(--danger)]' : 'text-[var(--foreground)]'}`}>
                  {formatDate(inv.dueDate)}
                </p>
                
                <div className="mt-4 pt-4 border-t border-[var(--border)]">
                  <p className="text-[var(--muted)] text-sm mb-1">Total Tagihan</p>
                  <p className="text-2xl font-bold text-[var(--foreground)] tabular">{formatCurrency(inv.totalAmount)}</p>
                  {inv.lateFee > 0 && (
                    <div className="flex items-center gap-1 mt-1 text-[var(--danger)] text-xs font-medium">
                      <AlertCircle className="w-3 h-3" /> Termasuk denda {formatCurrency(inv.lateFee)}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-auto">
                {inv.status === 'WAITING_VERIFICATION' ? (
                  <button disabled className="btn btn-secondary w-full cursor-not-allowed">
                    Menunggu Verifikasi Pembayaran
                  </button>
                ) : (
                  <Link href={`/invoices/${inv.id}`} className="btn btn--primary w-full">
                    Bayar Sekarang
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <h3 className="text-lg font-bold text-[var(--foreground)] mb-4">Riwayat Pembayaran</h3>
      {loading ? (
        <SkeletonTable rows={3} />
      ) : historyBills.length === 0 ? (
        <div className="card">
          <p className="text-[var(--muted)] text-center py-4">Belum ada riwayat pembayaran.</p>
        </div>
      ) : (
        <div className="table-container overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Periode</th>
                <th>Tanggal Bayar</th>
                <th>Total</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {historyBills.map((inv) => (
                <tr key={inv.id}>
                  <td>
                    <span className="font-semibold text-[var(--foreground)]">{formatPeriod(inv.period)}</span>
                  </td>
                  <td>
                    <span className="text-sm">
                      {inv.paidAt ? formatDate(inv.paidAt) : '-'}
                    </span>
                  </td>
                  <td>
                    <span className="font-semibold text-[var(--foreground)] tabular">{formatCurrency(inv.totalAmount)}</span>
                  </td>
                  <td>
                    <StatusBadge status={inv.status} type="invoice" />
                  </td>
                  <td>
                    <Link href={`/invoices/${inv.id}`} className="btn btn-ghost btn-sm">
                      <Eye className="w-4 h-4" /> Detail
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppLayout>
  );
}
