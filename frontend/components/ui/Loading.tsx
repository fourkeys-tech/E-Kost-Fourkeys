'use client';

export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const s = { sm: '1.125rem', md: '1.75rem', lg: '2.5rem' }[size];
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{
        width: s, height: s,
        border: '2.5px solid var(--border)',
        borderTopColor: 'var(--primary)',
        borderRadius: '50%',
        animation: 'spin 0.75s linear infinite',
      }} />
    </div>
  );
}

export function PageLoader() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--background)', gap: '1rem',
    }}>
      <div style={{
        width: '2.75rem', height: '2.75rem',
        border: '3px solid var(--border)',
        borderTopColor: 'var(--primary)',
        borderRadius: '50%',
        animation: 'spin 0.75s linear infinite',
      }} />
      <p style={{ color: 'var(--muted)', fontSize: '0.875rem', fontWeight: 500 }}>Memuat...</p>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="card animate-pulse">
      <div style={{ height: '1rem', background: 'var(--border)', borderRadius: '6px', width: '75%', marginBottom: '0.75rem' }} />
      <div style={{ height: '0.75rem', background: 'var(--border)', borderRadius: '6px', width: '50%', marginBottom: '0.5rem' }} />
      <div style={{ height: '0.75rem', background: 'var(--border)', borderRadius: '6px', width: '65%' }} />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="table-container animate-pulse">
      <div style={{ height: '3rem', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }} />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{
          display: 'flex', gap: '1rem', padding: '1rem 1.25rem',
          borderBottom: i < rows - 1 ? '1px solid var(--border)' : 'none',
        }}>
          <div style={{ height: '1rem', background: 'var(--border)', borderRadius: '6px', flex: 1 }} />
          <div style={{ height: '1rem', background: 'var(--border)', borderRadius: '6px', width: '6rem' }} />
          <div style={{ height: '1rem', background: 'var(--border)', borderRadius: '6px', width: '5rem' }} />
          <div style={{ height: '1rem', background: 'var(--border)', borderRadius: '6px', width: '4rem' }} />
        </div>
      ))}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '4rem 1.5rem', textAlign: 'center',
    }}>
      {icon && <div style={{ color: 'var(--muted)', marginBottom: '1rem', opacity: 0.4 }}>{icon}</div>}
      <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: '0.5rem' }}>{title}</h3>
      {description && <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '1.5rem', maxWidth: '28rem' }}>{description}</p>}
      {action}
    </div>
  );
}
