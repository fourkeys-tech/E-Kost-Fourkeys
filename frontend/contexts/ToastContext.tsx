'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { X, CheckCircle2, AlertCircle, Info, Sparkles } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  progress: number;
}

interface ToastContextData {
  success: (msg: string) => void;
  error: (msg: string) => void;
  info: (msg: string) => void;
}

const ToastContext = createContext<ToastContextData | undefined>(undefined);

const TOAST_DURATION = 3500;

const TOAST_CONFIG = {
  success: {
    icon: CheckCircle2,
    label: 'Berhasil',
    accent: 'var(--clr-success)',
    bg: 'var(--clr-success-bg)',
    gradient: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(16,185,129,0.02) 100%)',
    border: 'rgba(16,185,129,0.25)',
    progress: 'var(--clr-success)',
  },
  error: {
    icon: AlertCircle,
    label: 'Gagal',
    accent: 'var(--clr-danger)',
    bg: 'var(--clr-danger-bg)',
    gradient: 'linear-gradient(135deg, rgba(239,68,68,0.08) 0%, rgba(239,68,68,0.02) 100%)',
    border: 'rgba(239,68,68,0.25)',
    progress: 'var(--clr-danger)',
  },
  info: {
    icon: Info,
    label: 'Info',
    accent: 'var(--clr-info)',
    bg: 'var(--clr-info-bg)',
    gradient: 'linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(59,130,246,0.02) 100%)',
    border: 'rgba(59,130,246,0.25)',
    progress: 'var(--clr-info)',
  },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message, progress: 100 }]);

    // Animate progress bar
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / TOAST_DURATION) * 100);
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, progress: remaining } : t))
      );
      if (remaining === 0) clearInterval(interval);
    }, 50);

    setTimeout(() => {
      clearInterval(interval);
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, TOAST_DURATION);
  }, []);

  const success = useCallback((msg: string) => addToast('success', msg), [addToast]);
  const error = useCallback((msg: string) => addToast('error', msg), [addToast]);
  const info = useCallback((msg: string) => addToast('info', msg), [addToast]);

  const removeToast = (id: string) =>
    setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ success, error, info }}>
      {children}

      <style>{`
        @keyframes toast-in {
          from { transform: translateX(110%) scale(0.92); opacity: 0; }
          to   { transform: translateX(0)   scale(1);    opacity: 1; }
        }
        @keyframes toast-out {
          from { transform: translateX(0)   scale(1);    opacity: 1; max-height: 100px; margin-bottom: 10px; }
          to   { transform: translateX(110%) scale(0.92); opacity: 0; max-height: 0; margin-bottom: 0; }
        }
        .toast-item {
          animation: toast-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>

      {/* Toast Container — Top Right */}
      <div
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          pointerEvents: 'none',
          width: '340px',
        }}
      >
        {toasts.map((toast) => {
          const cfg = TOAST_CONFIG[toast.type];
          const Icon = cfg.icon;
          return (
            <div
              key={toast.id}
              className="toast-item"
              style={{
                pointerEvents: 'auto',
                background: 'var(--bg-surface)',
                backgroundImage: cfg.gradient,
                border: `1px solid ${cfg.border}`,
                borderRadius: '14px',
                boxShadow: 'var(--shd-lg)',
                overflow: 'hidden',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
              }}
            >
              {/* Main content */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '14px 16px 12px',
                }}
              >
                {/* Icon circle */}
                <div
                  style={{
                    flexShrink: 0,
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: cfg.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: '1px',
                  }}
                >
                  <Icon size={18} color={cfg.accent} strokeWidth={2.5} />
                </div>

                {/* Text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: cfg.accent,
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      marginBottom: '3px',
                    }}
                  >
                    {cfg.label}
                  </div>
                  <div
                    style={{
                      fontSize: '13.5px',
                      fontWeight: 500,
                      color: 'var(--txt-primary)',
                      lineHeight: 1.45,
                      wordBreak: 'break-word',
                    }}
                  >
                    {toast.message}
                  </div>
                </div>

                {/* Close button */}
                <button
                  onClick={() => removeToast(toast.id)}
                  style={{
                    flexShrink: 0,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--txt-muted)',
                    padding: '2px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background 0.15s, color 0.15s',
                    marginTop: '1px',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--bg-sunken)';
                    e.currentTarget.style.color = 'var(--txt-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'none';
                    e.currentTarget.style.color = 'var(--txt-muted)';
                  }}
                >
                  <X size={15} />
                </button>
              </div>

              {/* Progress bar */}
              <div
                style={{
                  height: '3px',
                  background: 'var(--bg-sunken)',
                  margin: '0 16px 10px',
                  borderRadius: '999px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${toast.progress}%`,
                    background: `linear-gradient(90deg, ${cfg.progress}, ${cfg.accent})`,
                    borderRadius: '999px',
                    transition: 'width 0.1s linear',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
}
