'use client';
import { LoadingSpinner } from './Loading';

export function StatusBadge({ status, type = 'invoice', className = '' }: {
  status: string;
  type?: 'invoice' | 'payment' | 'room';
  className?: string;
}) {
  const maps: Record<string, Record<string, { label: string; cls: string }>> = {
    invoice: {
      PENDING: { label: 'Belum Terbit', cls: 'badge-muted' },
      ACTIVE: { label: 'Aktif', cls: 'badge-primary' },
      WAITING_VERIFICATION: { label: 'Menunggu Verif.', cls: 'badge-warning' },
      PAID: { label: 'Lunas', cls: 'badge-success' },
      OVERDUE: { label: 'Terlambat', cls: 'badge-danger' },
      CANCELLED: { label: 'Dibatalkan', cls: 'badge-muted' },
    },
    payment: {
      PENDING: { label: 'Menunggu', cls: 'badge-muted' },
      WAITING_VERIFICATION: { label: 'Menunggu Verif.', cls: 'badge-warning' },
      VERIFIED: { label: 'Terverifikasi', cls: 'badge-success' },
      REJECTED: { label: 'Ditolak', cls: 'badge-danger' },
      EXPIRED: { label: 'Kedaluwarsa', cls: 'badge-muted' },
    },
    room: {
      EMPTY: { label: 'Kosong', cls: 'badge-success' },
      OCCUPIED: { label: 'Terisi', cls: 'badge-primary' },
      MAINTENANCE: { label: 'Perbaikan', cls: 'badge-warning' },
    },
  };

  const map = maps[type] || {};
  const item = map[status] || { label: status, cls: 'badge-muted' };

  return <span className={`badge ${item.cls} ${className}`}>{item.label}</span>;
}
