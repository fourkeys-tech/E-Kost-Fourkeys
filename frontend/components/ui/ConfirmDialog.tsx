'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, Trash2, X, CheckCircle2, HelpCircle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  type?: 'danger' | 'success' | 'warning' | 'info';
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  showInput?: boolean;
  inputPlaceholder?: string;
  onConfirm: (inputValue?: string) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function ConfirmDialog({
  isOpen,
  type = 'danger',
  title,
  message,
  confirmText = 'Ya, Konfirmasi',
  cancelText = 'Batal',
  showInput = false,
  inputPlaceholder = 'Masukkan alasan...',
  onConfirm,
  onCancel,
  isLoading = false,
}: ConfirmDialogProps) {
  const [inputValue, setInputValue] = React.useState('');

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onCancel();
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <>
      <style>{`
        @keyframes confirm-overlay-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes confirm-dialog-in {
          from { opacity: 0; transform: scale(0.88) translateY(12px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .confirm-overlay {
          animation: confirm-overlay-in 0.2s ease forwards;
        }
        .confirm-dialog {
          animation: confirm-dialog-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>

      {/* Overlay */}
      <div
        className="confirm-overlay"
        onClick={onCancel}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
        }}
      >
        {/* Dialog */}
        <div
          className="confirm-dialog"
          onClick={(e) => e.stopPropagation()}
          style={{
            background: 'var(--bg-elevated)',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '400px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Close Button */}
          <button
            onClick={onCancel}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              border: 'none',
              background: 'var(--bg-sunken)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--txt-secondary)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bdr-default)';
              e.currentTarget.style.color = 'var(--txt-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--bg-sunken)';
              e.currentTarget.style.color = 'var(--txt-secondary)';
            }}
          >
            <X size={18} />
          </button>

          <div style={{ padding: '32px 24px 24px' }}>
            {/* Icon */}
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: type === 'danger' ? 'var(--clr-danger-bg)' : type === 'success' ? '#e6f8f0' : 'var(--brand-50)',
                border: `2px solid ${type === 'danger' ? 'rgba(239,68,68,0.2)' : type === 'success' ? '#bcead5' : 'var(--brand-200)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px',
              }}
            >
              {type === 'danger' && <Trash2 size={24} color="var(--clr-danger)" strokeWidth={2} />}
              {type === 'success' && <CheckCircle2 size={24} color="var(--clr-success)" strokeWidth={2} />}
              {type === 'warning' && <AlertTriangle size={24} color="#eab308" strokeWidth={2} />}
              {type === 'info' && <HelpCircle size={24} color="var(--brand-600)" strokeWidth={2} />}
            </div>

            {/* Title */}
            <h3
              style={{
                fontSize: '18px',
                fontWeight: 800,
                color: 'var(--txt-primary)',
                letterSpacing: '-0.3px',
                marginBottom: '8px',
                lineHeight: 1.3,
              }}
            >
              {title}
            </h3>

            {/* Message */}
            <p
              style={{
                fontSize: '14px',
                color: 'var(--txt-secondary)',
                lineHeight: 1.6,
                marginBottom: showInput ? '16px' : '28px',
              }}
            >
              {message}
            </p>

            {/* Input Field (Optional) */}
            {showInput && (
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={inputPlaceholder}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: '1px solid var(--bdr-strong)',
                  background: 'var(--bg-sunken)',
                  fontSize: '14px',
                  color: 'var(--txt-primary)',
                  marginBottom: '28px',
                  outline: 'none',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--brand-400)';
                  e.currentTarget.style.boxShadow = '0 0 0 3px var(--brand-100)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--bdr-strong)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            )}

            {/* Warning Box (Only for danger) */}
            {type === 'danger' && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  background: 'var(--clr-danger-bg)',
                  border: '1px solid rgba(239,68,68,0.15)',
                  marginBottom: '24px',
                }}
              >
                <AlertTriangle size={14} color="var(--clr-danger)" strokeWidth={2.5} />
                <span
                  style={{
                    fontSize: '12px',
                    color: 'var(--clr-danger)',
                    fontWeight: 600,
                  }}
                >
                  Tindakan ini tidak dapat dibatalkan
                </span>
              </div>
            )}

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                className="btn"
                onClick={onCancel}
                disabled={isLoading}
                style={{
                  flex: 1,
                  padding: '11px 16px',
                  borderRadius: '10px',
                  border: '1px solid var(--bdr-default)',
                  background: 'var(--bg-sunken)',
                  color: 'var(--txt-secondary)',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  justifyContent: 'center',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--bdr-subtle)';
                  e.currentTarget.style.color = 'var(--txt-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--bg-sunken)';
                  e.currentTarget.style.color = 'var(--txt-secondary)';
                }}
              >
                {cancelText}
              </button>

              <button
                className="btn"
                onClick={() => {
                  onConfirm(showInput ? inputValue : undefined);
                  if (!isLoading) setInputValue('');
                }}
                disabled={isLoading}
                style={{
                  flex: 1,
                  padding: '11px 16px',
                  borderRadius: '10px',
                  border: 'none',
                  background: isLoading 
                    ? (type === 'danger' ? 'rgba(239,68,68,0.6)' : type === 'success' ? 'rgba(16,185,129,0.6)' : 'var(--brand-300)')
                    : (type === 'danger' ? 'linear-gradient(135deg, #ef4444, #dc2626)' : type === 'success' ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, var(--brand-500), var(--brand-600))'),
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  boxShadow: isLoading 
                    ? 'none' 
                    : `0 4px 14px ${type === 'danger' ? 'rgba(239,68,68,0.35)' : type === 'success' ? 'rgba(16,185,129,0.35)' : 'rgba(79,70,229,0.35)'}`,
                  transition: 'all 0.15s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '7px',
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = `0 6px 20px ${type === 'danger' ? 'rgba(239,68,68,0.45)' : type === 'success' ? 'rgba(16,185,129,0.45)' : 'rgba(79,70,229,0.45)'}`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = `0 4px 14px ${type === 'danger' ? 'rgba(239,68,68,0.35)' : type === 'success' ? 'rgba(16,185,129,0.35)' : 'rgba(79,70,229,0.35)'}`;
                  }
                }}
              >
                {isLoading ? (
                  <>
                    <div
                      style={{
                        width: '15px',
                        height: '15px',
                        border: '2px solid rgba(255,255,255,0.35)',
                        borderTopColor: '#fff',
                        borderRadius: '50%',
                        animation: 'spin 0.7s linear infinite',
                      }}
                    />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    {type === 'danger' && <Trash2 size={15} strokeWidth={2.5} />}
                    {type === 'success' && <CheckCircle2 size={15} strokeWidth={2.5} />}
                    {type === 'info' && <CheckCircle2 size={15} strokeWidth={2.5} />}
                    {confirmText}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
