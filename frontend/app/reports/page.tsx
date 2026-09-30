'use client';

import { useEffect, useState, useCallback } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useAuth } from '@/contexts/AuthContext';
import { reportApi, propertyApi, invoiceApi } from '@/lib/api';
import { DashboardSummary, Property, Invoice } from '@/types';
import { PageLoader, SkeletonTable } from '@/components/ui/Loading';
import { formatCurrency, formatPeriod, formatDate } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, AlertTriangle, Home, FileText, Download, Building } from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';

const TIME_RANGES = [
  { id: 'THIS_MONTH', label: 'Bulan Ini' },
  { id: 'LAST_MONTH', label: 'Bulan Lalu' },
  { id: 'THIS_YEAR', label: 'Tahun Ini' },
];

export default function ReportsPage() {
  const { user, loading: authLoading } = useRequireAuth({ allowedRoles: ['OWNER', 'ADMIN', 'SUPER_ADMIN'] });
  const { accessToken } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  
  // Filters
  const [timeRange, setTimeRange] = useState<string>('THIS_MONTH');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  
  // Pagination for table
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const fetchData = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const [summaryRes, propsRes, invoicesRes] = await Promise.all([
        reportApi.summary(accessToken, { propertyId: selectedPropertyId, timeRange }),
        propertyApi.list(accessToken, { limit: 100 }),
        invoiceApi.list(accessToken, { 
          propertyId: selectedPropertyId, 
          status: 'PAID', // Hanya tampilkan yang lunas di laporan ini
          limit: 100 
        })
      ]);
      setSummary(summaryRes);
      setProperties(propsRes.data || []);
      
      // Sort invoices by paidAt or dueDate desc
      const sortedInvoices = (invoicesRes.data || []).sort((a: any, b: any) => {
        const dateA = new Date(a.paidAt || a.createdAt).getTime();
        const dateB = new Date(b.paidAt || b.createdAt).getTime();
        return dateB - dateA;
      });
      setRecentInvoices(sortedInvoices);
      
    } catch (err) {
      console.error('Error fetching report data:', err);
    } finally {
      setLoading(false);
    }
  }, [accessToken, timeRange, selectedPropertyId]);

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user, fetchData]);

  useEffect(() => {
    setCurrentPage(1);
  }, [timeRange, selectedPropertyId]);

  const handleExport = async () => {
    try {
      // Mock Export API logic - in real app, we use reportApi.exportExcel
      alert(`Mengekspor laporan (Waktu: ${TIME_RANGES.find(t => t.id === timeRange)?.label})...\nFitur Ekspor Excel ini sedang dalam pengembangan.`);
    } catch (err) {
      console.error(err);
    }
  };

  const getChartLabel = (period: string) => {
    // period is like '2026-08'
    const parts = period.split('-');
    const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1);
    return date.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: '#fff', border: '1px solid var(--bdr-strong)', padding: '12px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <p style={{ fontWeight: 600, margin: '0 0 8px', color: 'var(--txt-primary)' }}>{getChartLabel(label)}</p>
          <p style={{ color: 'var(--brand-600)', margin: 0, fontWeight: 700 }}>
            {formatCurrency(payload[0].value)}
          </p>
          <p style={{ color: 'var(--txt-secondary)', margin: '4px 0 0', fontSize: '12px' }}>
            {payload[0].payload.count} Tagihan Lunas
          </p>
        </div>
      );
    }
    return null;
  };

  if (authLoading) return <PageLoader />;
  if (!user) return null;

  const totalPages = Math.ceil(recentInvoices.length / itemsPerPage);
  const paginatedInvoices = recentInvoices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <AppLayout title="Laporan Keuangan & Performa" subtitle="Analisis pendapatan dan statistik properti Anda">
      <div className="page-container stack-lg">
        
        {/* Filters Bar */}
        <div className="card" style={{ padding: '16px 24px', display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {TIME_RANGES.map(range => (
              <button
                key={range.id}
                onClick={() => setTimeRange(range.id)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: timeRange === range.id ? 'var(--brand-600)' : 'var(--bg-sunken)',
                  color: timeRange === range.id ? '#fff' : 'var(--txt-secondary)',
                  boxShadow: timeRange === range.id ? '0 4px 12px rgba(45, 140, 255, 0.2)' : 'none'
                }}
              >
                {range.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-sunken)', padding: '0 12px', borderRadius: '8px', border: '1px solid var(--bdr-strong)' }}>
              <Building size={16} color="var(--txt-muted)" />
              <select 
                value={selectedPropertyId}
                onChange={(e) => setSelectedPropertyId(e.target.value)}
                style={{ border: 'none', background: 'transparent', padding: '10px 8px', outline: 'none', fontSize: '14px', fontWeight: 500, color: 'var(--txt-primary)' }}
              >
                <option value="">Semua Properti</option>
                {properties.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            
            <button className="btn btn--secondary" onClick={handleExport} style={{ padding: '10px 16px' }}>
              <Download size={16} /> Ekspor Laporan
            </button>
          </div>
        </div>

        {loading && !summary ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
            <p style={{ color: 'var(--txt-muted)' }}>Menganalisis data...</p>
          </div>
        ) : summary && (
          <>
            {/* Scorecards */}
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              <div className="card" style={{ padding: '24px', borderTop: '4px solid var(--clr-success)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--txt-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Pendapatan {TIME_RANGES.find(t => t.id === timeRange)?.label}
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--txt-primary)', marginTop: '8px', letterSpacing: '-1px' }}>
                      {formatCurrency(summary.currentMonthRevenue)}
                    </div>
                  </div>
                  <div style={{ background: '#e6f8f0', padding: '12px', borderRadius: '12px' }}>
                    <TrendingUp size={24} color="var(--clr-success)" />
                  </div>
                </div>
              </div>

              <div className="card" style={{ padding: '24px', borderTop: '4px solid var(--clr-danger)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--txt-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Tunggakan Terbuka (Global)
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--txt-primary)', marginTop: '8px', letterSpacing: '-1px' }}>
                      {formatCurrency(summary.totalOverdue)}
                    </div>
                  </div>
                  <div style={{ background: '#fff0f0', padding: '12px', borderRadius: '12px' }}>
                    <AlertTriangle size={24} color="var(--clr-danger)" />
                  </div>
                </div>
              </div>

              <div className="card" style={{ padding: '24px', borderTop: '4px solid var(--brand-500)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--txt-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Okupansi Kamar
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--txt-primary)', marginTop: '8px', letterSpacing: '-1px' }}>
                      {summary.occupancyRate}%
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--txt-secondary)', marginTop: '4px' }}>
                      {summary.occupied} terisi dari total {summary.totalRooms} kamar
                    </div>
                  </div>
                  <div style={{ background: 'var(--brand-50)', padding: '12px', borderRadius: '12px' }}>
                    <Home size={24} color="var(--brand-600)" />
                  </div>
                </div>
              </div>
            </div>

            {/* Chart Section */}
            <div className="card" style={{ padding: '24px' }}>
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--txt-primary)' }}>Tren Pendapatan</h3>
                <p style={{ fontSize: '13px', color: 'var(--txt-secondary)' }}>
                  Visualisasi uang masuk berdasarkan tagihan yang telah lunas ({timeRange === 'THIS_YEAR' ? '12 Bulan Terakhir' : '6 Bulan Terakhir'}).
                </p>
              </div>
              
              <div style={{ width: '100%', height: '350px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={summary.revenueChart} margin={{ top: 10, right: 10, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--bdr-subtle)" />
                    <XAxis 
                      dataKey="period" 
                      tickFormatter={getChartLabel}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'var(--txt-secondary)', fontSize: 12, fontWeight: 500 }}
                      dy={10}
                    />
                    <YAxis 
                      tickFormatter={(value) => `Rp ${value / 1000000}Jt`}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'var(--txt-secondary)', fontSize: 12, fontWeight: 500 }}
                      dx={-10}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--bg-sunken)' }} />
                    <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                      {summary.revenueChart.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.revenue > 0 ? 'var(--brand-500)' : 'var(--bdr-strong)'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Transactions Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden', marginTop: '24px' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--bdr-subtle)', background: 'var(--bg-surface)' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--txt-primary)' }}>Transaksi Lunas Terbaru</h3>
                <p style={{ fontSize: '13px', color: 'var(--txt-secondary)' }}>Uang masuk terbaru dari pembayaran penyewa</p>
              </div>
              
              {recentInvoices.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center' }}>
                  <FileText size={32} color="var(--txt-muted)" style={{ margin: '0 auto 12px' }} />
                  <p style={{ color: 'var(--txt-secondary)', fontSize: '14px' }}>Belum ada transaksi lunas di periode ini.</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-sunken)', borderBottom: '1px solid var(--bdr-subtle)' }}>
                        <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: 600, color: 'var(--txt-secondary)', textTransform: 'uppercase' }}>Tanggal Bayar</th>
                        <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: 600, color: 'var(--txt-secondary)', textTransform: 'uppercase' }}>Penghuni & Kamar</th>
                        <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: 600, color: 'var(--txt-secondary)', textTransform: 'uppercase' }}>Periode Tagihan</th>
                        <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: 600, color: 'var(--txt-secondary)', textTransform: 'uppercase', textAlign: 'right' }}>Nominal Lunas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedInvoices.map((inv: any) => (
                        <tr key={inv.id} style={{ borderBottom: '1px solid var(--bdr-subtle)', background: 'transparent' }}>
                          <td style={{ padding: '16px 20px', fontWeight: 600, fontSize: '14px', color: 'var(--txt-primary)' }}>
                            {inv.paidAt ? formatDate(inv.paidAt) : formatDate(inv.createdAt)}
                          </td>
                          <td style={{ padding: '16px 20px' }}>
                            <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--txt-primary)' }}>{inv.contract?.tenant?.user?.name}</div>
                            <div style={{ fontSize: '12px', color: 'var(--txt-secondary)' }}>Kamar {inv.contract?.room?.roomNumber}</div>
                          </td>
                          <td style={{ padding: '16px 20px', fontSize: '14px' }}>
                            {formatPeriod(inv.period)}
                          </td>
                          <td style={{ padding: '16px 20px', fontWeight: 700, fontSize: '14px', color: 'var(--brand-600)', textAlign: 'right' }}>
                            {formatCurrency(inv.totalAmount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderTop: '1px solid var(--bdr-subtle)', background: '#fafafa' }}>
                  <div style={{ fontSize: '13px', color: 'var(--txt-secondary)' }}>
                    Menampilkan <span style={{ fontWeight: 600 }}>{(currentPage - 1) * itemsPerPage + 1}</span> - <span style={{ fontWeight: 600 }}>{Math.min(currentPage * itemsPerPage, recentInvoices.length)}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn" style={{ padding: '6px 12px', fontSize: '13px' }} disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Prev</button>
                    <button className="btn" style={{ padding: '6px 12px', fontSize: '13px' }} disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Next</button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
