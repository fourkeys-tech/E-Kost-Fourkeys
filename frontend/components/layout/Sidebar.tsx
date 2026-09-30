'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getInitials } from '@/lib/utils';
import {
  LayoutDashboard, Building2, Users, FileText,
  CreditCard, BarChart3, Settings, LogOut,
  Home, X, DoorClosed, FileSignature
} from 'lucide-react';

const ownerLinks = [
  { href: '/dashboard',       label: 'Dashboard',       icon: LayoutDashboard, section: 'main' },
  { href: '/properties',      label: 'Properti',        icon: Building2,       section: 'main' },
  { href: '/rooms',           label: 'Kamar',           icon: DoorClosed,      section: 'main' },
  { href: '/tenants',         label: 'Penyewa',         icon: Users,           section: 'main' },
  { href: '/contracts',       label: 'Kontrak',         icon: FileSignature,   section: 'main' },
  { href: '/invoices',        label: 'Tagihan',         icon: FileText,        section: 'finance' },
  { href: '/payments/verify', label: 'Verifikasi Bayar',icon: CreditCard,      section: 'finance' },
  { href: '/reports',         label: 'Laporan',         icon: BarChart3,       section: 'finance' },
];

const adminLinks = [
  { href: '/dashboard',       label: 'Dashboard',       icon: LayoutDashboard, section: 'main' },
  { href: '/rooms',           label: 'Kamar',           icon: DoorClosed,      section: 'main' },
  { href: '/tenants',         label: 'Penyewa',         icon: Users,           section: 'main' },
  { href: '/contracts',       label: 'Kontrak',         icon: FileSignature,   section: 'main' },
  { href: '/invoices',        label: 'Tagihan',         icon: FileText,        section: 'finance' },
  { href: '/payments/verify', label: 'Verifikasi Bayar',icon: CreditCard,      section: 'finance' },
];

const tenantLinks = [
  { href: '/dashboard', label: 'Beranda',      icon: Home,     section: 'main' },
  { href: '/invoices',  label: 'Tagihan Saya', icon: FileText, section: 'main' },
];

interface SidebarProps {
  onClose?: () => void;
  isMobile?: boolean;
}

export default function Sidebar({ onClose, isMobile }: SidebarProps) {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  const links =
    user.role === 'OWNER' || user.role === 'SUPER_ADMIN' ? ownerLinks
    : user.role === 'ADMIN' ? adminLinks
    : tenantLinks;

  const mainLinks    = links.filter(l => l.section === 'main');
  const financeLinks = links.filter(l => l.section === 'finance');

  const roleLabel =
    user.role === 'OWNER'       ? 'Pemilik Kost'
    : user.role === 'ADMIN'     ? 'Admin'
    : user.role === 'SUPER_ADMIN' ? 'Super Admin'
    : 'Penyewa';

  const isActive = (href: string) =>
    pathname === href || (href !== '/dashboard' && pathname.startsWith(href));

  const NavLink = ({ href, label, icon: Icon }: { href: string; label: string; icon: React.ElementType }) => (
    <Link
      href={href}
      onClick={onClose}
      className={`sidebar-link${isActive(href) ? ' sidebar-link--active' : ''}`}
    >
      <Icon size={17} className="sidebar-link__icon" />
      <span style={{ flex: 1 }}>{label}</span>
    </Link>
  );

  return (
    <>
      {/* Logo */}
      <div className="sidebar-logo">
        <Link href="/dashboard" onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', flex: 1 }}>
          <div className="sidebar-logo__icon">
            <Building2 size={18} color="#fff" />
          </div>
          <div>
            <div className="sidebar-logo__name gradient-text">KostPay</div>
            <div className="sidebar-logo__sub">Manajemen Kost</div>
          </div>
        </Link>
        {isMobile && (
          <button className="icon-btn" onClick={onClose} aria-label="Tutup menu" style={{ marginLeft: 'auto' }}>
            <X size={18} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav" role="navigation" aria-label="Main navigation">
        {/* Main */}
        {mainLinks.length > 0 && (
          <div style={{ marginBottom: '8px' }}>
            <div className="sidebar-section">Menu Utama</div>
            {mainLinks.map(l => <NavLink key={l.href} {...l} />)}
          </div>
        )}

        {/* Finance */}
        {financeLinks.length > 0 && (
          <div>
            <div className="sidebar-section">Keuangan</div>
            {financeLinks.map(l => <NavLink key={l.href} {...l} />)}
          </div>
        )}

        {/* System */}
        <div style={{ marginTop: '8px', borderTop: '1px solid var(--bdr-subtle)', paddingTop: '8px' }}>
          <div className="sidebar-section">Sistem</div>
          <Link
            href="/settings"
            onClick={onClose}
            className={`sidebar-link${pathname.startsWith('/settings') ? ' sidebar-link--active' : ''}`}
          >
            <Settings size={17} className="sidebar-link__icon" />
            <span style={{ flex: 1 }}>Pengaturan</span>
          </Link>
        </div>
      </nav>

      {/* User footer */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="avatar avatar--sm" style={{ width: '34px', height: '34px', fontSize: '12px' }}>
            {getInitials(user.name)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--txt-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user.name}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--txt-muted)' }}>{roleLabel}</div>
          </div>
          <button
            onClick={() => { onClose?.(); logout(); }}
            className="icon-btn"
            aria-label="Log out"
            title="Keluar"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </>
  );
}
