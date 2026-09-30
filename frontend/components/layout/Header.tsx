'use client';

import { useState, useRef, useEffect } from 'react';
import { ThemeToggle } from './ThemeProvider';
import { useAuth } from '@/contexts/AuthContext';
import { getInitials, formatDate } from '@/lib/utils';
import { reportApi } from '@/lib/api';
import { Menu, Bell, Search, LogOut, Settings, User, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onMenuClick?: () => void;
  actions?: React.ReactNode;
}

export default function Header({ title, subtitle, onMenuClick, actions }: HeaderProps) {
  const { user, accessToken, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const dropRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Fetch notifications
  useEffect(() => {
    if (!user || !accessToken) return;
    reportApi.notifications(accessToken)
      .then((res: any) => setNotifications(res.data || res || []))
      .catch(console.error);
  }, [user, accessToken]);

  const handleReadAll = async () => {
    if (!accessToken) return;
    try {
      await reportApi.readAllNotifications(accessToken);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const roleLabel =
    user?.role === 'OWNER'       ? 'Pemilik Kost'
    : user?.role === 'ADMIN'     ? 'Admin'
    : user?.role === 'SUPER_ADMIN' ? 'Super Admin'
    : 'Penyewa';

  return (
    <header className="topbar">
      {/* Left */}
      <div className="topbar__left">
        {/* Hamburger (mobile) */}
        <button
          className="icon-btn lg:hidden"
          onClick={onMenuClick}
          aria-label="Open menu"
          style={{ border: '1px solid var(--bdr-subtle)' }}
        >
          <Menu size={18} />
        </button>

        {/* Title block */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{
            fontSize: '15px',
            fontWeight: 700,
            color: 'var(--txt-primary)',
            letterSpacing: '-0.2px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>{title}</h1>
          {subtitle && (
            <p style={{ fontSize: '11px', color: 'var(--txt-muted)', marginTop: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right */}
      <div className="topbar__right">
        {/* Actions slot */}
        {actions && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {actions}
          </div>
        )}

        {/* Search (hidden on xs) */}
        <button className="topbar-btn" aria-label="Search" style={{ display: 'none' }} id="header-search-btn">
          <Search size={16} />
        </button>

        {/* Notification */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button 
            className="topbar-btn" 
            aria-label="Notifications" 
            style={{ position: 'relative' }}
            onClick={() => setNotifOpen(v => !v)}
          >
            <Bell size={16} />
            {notifications.filter(n => !n.isRead).length > 0 && (
              <span className="notif-dot" style={{ position: 'absolute', top: '6px', right: '6px', width: '6px', height: '6px', background: 'var(--clr-danger)', borderRadius: '50%' }} />
            )}
          </button>

          {/* Notif Dropdown */}
          {notifOpen && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              width: '320px',
              maxHeight: '400px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--bdr-subtle)',
              borderRadius: 'var(--r-lg)',
              boxShadow: 'var(--shd-lg)',
              display: 'flex',
              flexDirection: 'column',
              zIndex: 100,
              animation: 'modal-in 0.18s ease',
            }}>
              <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--bdr-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--txt-primary)' }}>Notifikasi</div>
                {notifications.some(n => !n.isRead) && (
                  <button onClick={handleReadAll} style={{ fontSize: '11px', fontWeight: 600, color: 'var(--brand-600)', background: 'none', border: 'none', cursor: 'pointer' }}>
                    Tandai semua dibaca
                  </button>
                )}
              </div>
              <div style={{ overflowY: 'auto', flex: 1, padding: '4px 0' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--txt-muted)', fontSize: '13px' }}>
                    Belum ada notifikasi
                  </div>
                ) : (
                  notifications.map(notif => (
                    <div key={notif.id} style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid var(--bdr-subtle)',
                      background: notif.isRead ? 'transparent' : 'var(--brand-50)',
                      transition: 'background 0.2s',
                    }}>
                      <div style={{ fontSize: '12.5px', fontWeight: notif.isRead ? 500 : 600, color: 'var(--txt-primary)', lineHeight: 1.4 }}>
                        {notif.message}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--txt-muted)', marginTop: '4px' }}>
                        {formatDate(notif.createdAt)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Theme toggle */}
        <ThemeToggle />

        {/* Separator */}
        <div style={{ width: '1px', height: '24px', background: 'var(--bdr-subtle)', margin: '0 4px' }} />

        {/* User dropdown */}
        {user && (
          <div style={{ position: 'relative' }} ref={dropRef}>
            <button
              onClick={() => setDropdownOpen(v => !v)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '5px 10px 5px 5px',
                borderRadius: 'var(--r-md)',
                border: '1px solid var(--bdr-subtle)',
                background: 'var(--bg-surface)',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              className="hover:bg-sunken"
            >
              <div className="avatar avatar--sm" style={{ width: '28px', height: '28px', fontSize: '10px' }}>
                {getInitials(user.name)}
              </div>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--txt-primary)', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.name.split(' ')[0]}
              </span>
              <ChevronRight size={13} style={{ color: 'var(--txt-muted)', transform: dropdownOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s', marginLeft: '-2px' }} />
            </button>

            {/* Dropdown */}
            {dropdownOpen && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                minWidth: '200px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--bdr-subtle)',
                borderRadius: 'var(--r-lg)',
                boxShadow: 'var(--shd-lg)',
                overflow: 'hidden',
                zIndex: 100,
                animation: 'modal-in 0.18s ease',
              }}>
                {/* User info */}
                <div style={{ padding: '12px 14px 10px', borderBottom: '1px solid var(--bdr-subtle)' }}>
                  <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--txt-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--txt-muted)', marginTop: '1px' }}>{roleLabel}</div>
                </div>

                {/* Menu items */}
                <div style={{ padding: '6px' }}>
                  <Link
                    href="/settings"
                    onClick={() => setDropdownOpen(false)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '8px 10px', borderRadius: 'var(--r-md)',
                      fontSize: '13px', fontWeight: 500, color: 'var(--txt-secondary)',
                      transition: 'background 0.1s',
                    }}
                    className="dropdown-item"
                  >
                    <Settings size={14} />
                    Pengaturan
                  </Link>
                  <Link
                    href="/profile"
                    onClick={() => setDropdownOpen(false)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '8px 10px', borderRadius: 'var(--r-md)',
                      fontSize: '13px', fontWeight: 500, color: 'var(--txt-secondary)',
                      transition: 'background 0.1s',
                    }}
                    className="dropdown-item"
                  >
                    <User size={14} />
                    Profil Saya
                  </Link>
                  <div style={{ height: '1px', background: 'var(--bdr-subtle)', margin: '6px 0' }} />
                  <button
                    onClick={() => { setDropdownOpen(false); logout(); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '8px 10px', borderRadius: 'var(--r-md)',
                      fontSize: '13px', fontWeight: 500,
                      color: 'var(--clr-danger)',
                      background: 'transparent', border: 'none',
                      width: '100%', cursor: 'pointer',
                      transition: 'background 0.1s',
                    }}
                    className="dropdown-item-danger"
                  >
                    <LogOut size={14} />
                    Keluar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
