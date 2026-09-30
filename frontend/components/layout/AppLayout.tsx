'use client';

import { useState, useEffect, useCallback } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

interface AppLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export default function AppLayout({ children, title, subtitle, actions }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Close sidebar on route change / resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Prevent body scroll when mobile sidebar open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const openSidebar  = useCallback(() => setSidebarOpen(true), []);

  if (!isMounted) return null;

  return (
    <div className="app-shell">
      {/* ── Sidebar overlay (mobile) ───────────────────────────── */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay sidebar-overlay--visible"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar ───────────────────────────────────────────── */}
      <aside
        className={`sidebar${sidebarOpen ? ' sidebar--open' : ''}`}
        aria-label="Navigation sidebar"
      >
        <Sidebar onClose={closeSidebar} isMobile={sidebarOpen} />
      </aside>

      {/* ── Main area ─────────────────────────────────────────── */}
      <div className="main-area">
        <Header
          title={title}
          subtitle={subtitle}
          actions={actions}
          onMenuClick={openSidebar}
        />
        <main className="page-body" id="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}
