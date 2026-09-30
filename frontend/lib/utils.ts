import { InvoiceStatus, PaymentStatus, RoomStatus } from '@/types';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | Date | undefined | null): string {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);
}

export function formatPeriod(period: string): string {
  const [year, month] = period.split('-');
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];
  return `${months[parseInt(month) - 1]} ${year}`;
}

export function invoiceStatusLabel(status: InvoiceStatus): { label: string; color: string } {
  const map: Record<InvoiceStatus, { label: string; color: string }> = {
    PENDING: { label: 'Belum Terbit', color: 'badge-muted' },
    ACTIVE: { label: 'Aktif', color: 'badge-primary' },
    WAITING_VERIFICATION: { label: 'Menunggu Verifikasi', color: 'badge-warning' },
    PAID: { label: 'Lunas', color: 'badge-success' },
    PARTIAL: { label: 'Sebagian', color: 'badge-warning' },
    OVERDUE: { label: 'Telat', color: 'badge-danger' },
    CANCELLED: { label: 'Dibatalkan', color: 'badge-muted' },
  };
  return map[status] || { label: status, color: 'badge-muted' };
}

export function paymentStatusLabel(status: PaymentStatus): { label: string; color: string } {
  const map: Record<PaymentStatus, { label: string; color: string }> = {
    PENDING: { label: 'Menunggu', color: 'badge-muted' },
    WAITING_VERIFICATION: { label: 'Menunggu Verifikasi', color: 'badge-warning' },
    VERIFIED: { label: 'Terverifikasi', color: 'badge-success' },
    REJECTED: { label: 'Ditolak', color: 'badge-danger' },
    EXPIRED: { label: 'Kadaluarsa', color: 'badge-muted' },
  };
  return map[status] || { label: status, color: 'badge-muted' };
}

export function roomStatusLabel(status: RoomStatus): { label: string; color: string } {
  const map: Record<RoomStatus, { label: string; color: string }> = {
    EMPTY: { label: 'Kosong', color: 'badge-success' },
    OCCUPIED: { label: 'Terisi', color: 'badge-primary' },
    MAINTENANCE: { label: 'Maintenance', color: 'badge-warning' },
  };
  return map[status] || { label: status, color: 'badge-muted' };
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

export function daysUntilDue(dueDate: string): number {
  const now = new Date();
  const due = new Date(dueDate);
  return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}
