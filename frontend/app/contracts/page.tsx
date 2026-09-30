'use client';

import { useEffect, useState, useCallback } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useAuth } from '@/contexts/AuthContext';
import { contractApi, propertyApi } from '@/lib/api';
import { Contract, Property } from '@/types';
import { FileSignature, Search, Calendar, LogOut, CheckCircle2, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import Swal from 'sweetalert2';

export default function ContractsPage() {
  const { user, loading: authLoading } = useRequireAuth({ allowedRoles: ['OWNER', 'ADMIN', 'SUPER_ADMIN'] });
  const { accessToken } = useAuth();
  
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchData = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const params: any = {};
      if (selectedPropertyId) params.propertyId = selectedPropertyId;
      if (statusFilter === 'ACTIVE') params.isActive = true;
      if (statusFilter === 'INACTIVE') params.isActive = false;

      const [contractsRes, propsRes] = await Promise.all([
        contractApi.list(accessToken, params),
        propertyApi.list(accessToken, { limit: 100 })
      ]);
      setContracts(contractsRes || []);
      setProperties(propsRes.data || []);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, [accessToken, selectedPropertyId, statusFilter]);

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user, fetchData]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedPropertyId, statusFilter, searchQuery]);

  const handleCheckout = async (contract: Contract) => {
    const result = await Swal.fire({
      title: 'Akhiri Kontrak (Check-out)?',
      text: `Anda yakin ingin mengakhiri kontrak penyewaan ${(contract as any).tenant?.user?.name} di Kamar ${(contract as any).room?.roomNumber}? Status kamar akan kembali menjadi KOSONG.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: 'var(--clr-warning)',
      cancelButtonColor: 'var(--txt-muted)',
      confirmButtonText: 'Ya, Akhiri Kontrak',
      cancelButtonText: 'Batal',
      customClass: { popup: 'rounded-xl' }
    });
    
    if (result.isConfirmed) {
      try {
        await contractApi.checkout(contract.id, accessToken!);
        Swal.fire({
          title: 'Check-out Berhasil!',
          text: 'Kontrak telah diakhiri dan kamar kini kosong.',
          icon: 'success',
          confirmButtonColor: 'var(--brand-600)',
          customClass: { popup: 'rounded-xl' }
        });
        fetchData();
      } catch (err: any) {
        console.error(err);
        Swal.fire({
          title: 'Gagal',
          text: err.message || 'Gagal memproses check-out.',
          icon: 'error',
          confirmButtonColor: 'var(--clr-danger)',
          customClass: { popup: 'rounded-xl' }
        });
      }
    }
  };

  const filteredContracts = contracts.filter(c => 
    (c as any).tenant?.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (c as any).room?.roomNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredContracts.length / itemsPerPage);
  const paginatedContracts = filteredContracts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (authLoading || loading) return (
    <div className="page-loader">
      <div className="spinner" />
      <p style={{ fontSize: '13px', color: 'var(--txt-muted)' }}>Memuat kontrak...</p>
    </div>
  );
  if (!user) return null;

  return (
    <AppLayout title="Riwayat & Manajemen Kontrak" subtitle="Kelola seluruh perjanjian sewa penghuni Anda">
      <div className="page-container stack-lg">
        {/* Header & Filters Section */}
        <div className="card" style={{ padding: '20px', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', marginBottom: '24px' }}>
          <div className="search-bar" style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-sunken)', border: '1px solid var(--bdr-strong)', borderRadius: 'var(--r-md)', padding: '8px 12px', flex: '1 1 250px' }}>
            <Search size={16} color="var(--txt-muted)" style={{ marginRight: '8px' }} />
            <input 
              type="text" 
              placeholder="Cari nama penghuni atau no. kamar..." 
              style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '14px' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <select 
              className="form-input" 
              style={{ minWidth: '180px' }}
              value={selectedPropertyId}
              onChange={(e) => setSelectedPropertyId(e.target.value)}
            >
              <option value="">Semua Properti</option>
              {properties.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            <select 
              className="form-input" 
              style={{ minWidth: '150px' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
            >
              <option value="ALL">Semua Status</option>
              <option value="ACTIVE">Aktif (Sedang Sewa)</option>
              <option value="INACTIVE">Non-Aktif (Selesai)</option>
            </select>
          </div>
        </div>

        {/* List Section */}
        {filteredContracts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--bg-surface)', border: '1px dashed var(--bdr-strong)', borderRadius: 'var(--r-xl)' }}>
            <div style={{ width: '64px', height: '64px', background: 'var(--bg-sunken)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--txt-muted)' }}>
              <FileSignature size={28} />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--txt-primary)', marginBottom: '8px' }}>
              Tidak Ada Data Kontrak
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--txt-secondary)', maxWidth: '300px', margin: '0 auto' }}>
              Kriteria pencarian tidak ditemukan, atau Anda belum memiliki kontrak penyewaan sama sekali.
            </p>
          </div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-sunken)', borderBottom: '1px solid var(--bdr-subtle)' }}>
                    <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: 600, color: 'var(--txt-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Penghuni & Kamar</th>
                    <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: 600, color: 'var(--txt-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Periode Sewa</th>
                    <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: 600, color: 'var(--txt-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Finansial</th>
                    <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: 600, color: 'var(--txt-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</th>
                    <th style={{ padding: '16px 20px', fontSize: '12px', fontWeight: 600, color: 'var(--txt-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedContracts.map((contract: any) => (
                    <tr key={contract.id} style={{ borderBottom: '1px solid var(--bdr-subtle)', transition: 'background 0.2s', background: contract.isActive ? 'transparent' : 'var(--bg-sunken)' }}>
                      <td style={{ padding: '20px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--txt-primary)', fontSize: '15px' }}>{contract.tenant?.user?.name}</div>
                        <div style={{ fontSize: '13px', color: 'var(--txt-secondary)', marginTop: '4px' }}>
                          <span style={{ fontWeight: 600, color: 'var(--brand-600)' }}>Kamar {contract.room?.roomNumber}</span> • {contract.room?.property?.name}
                        </div>
                      </td>
                      <td style={{ padding: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--txt-primary)' }}>
                          <Calendar size={14} color="var(--txt-muted)" /> {formatDate(contract.startDate)}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--txt-secondary)', marginTop: '6px', paddingLeft: '20px' }}>
                          s/d {formatDate(contract.endDate)} ({contract.durationMonths} bln)
                        </div>
                      </td>
                      <td style={{ padding: '20px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--txt-primary)', fontSize: '14px' }}>
                          {formatCurrency(contract.rentAmount)} <span style={{ fontSize: '11px', color: 'var(--txt-muted)', fontWeight: 400 }}>/ bln</span>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--txt-secondary)', marginTop: '4px' }}>
                          Dep: {formatCurrency(contract.deposit)} • Tgl {contract.dueDay}
                        </div>
                      </td>
                      <td style={{ padding: '20px' }}>
                        {contract.isActive ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--clr-success)', fontSize: '13px', fontWeight: 600, background: '#e6f8f0', padding: '6px 10px', borderRadius: '20px', display: 'inline-flex' }}>
                            <CheckCircle2 size={16} /> Aktif
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--txt-muted)', fontSize: '13px', fontWeight: 600, background: 'var(--bdr-strong)', padding: '6px 10px', borderRadius: '20px', display: 'inline-flex' }}>
                            <AlertCircle size={16} /> Selesai
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '20px', textAlign: 'right' }}>
                        {contract.isActive ? (
                          <button 
                            className="btn" 
                            style={{ padding: '8px 12px', fontSize: '13px', background: '#fff0f0', color: 'var(--clr-danger)', border: '1px solid #ffcccc' }} 
                            onClick={() => handleCheckout(contract)}
                          >
                            <LogOut size={14} /> Checkout
                          </button>
                        ) : (
                          <span style={{ fontSize: '12px', color: 'var(--txt-muted)' }}>-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderTop: '1px solid var(--bdr-subtle)', background: '#fafafa' }}>
                <div style={{ fontSize: '13px', color: 'var(--txt-secondary)' }}>
                  Menampilkan <span style={{ fontWeight: 600, color: 'var(--txt-primary)' }}>{(currentPage - 1) * itemsPerPage + 1}</span> - <span style={{ fontWeight: 600, color: 'var(--txt-primary)' }}>{Math.min(currentPage * itemsPerPage, filteredContracts.length)}</span> dari <span style={{ fontWeight: 600, color: 'var(--txt-primary)' }}>{filteredContracts.length}</span> kontrak
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    className="btn" 
                    style={{ padding: '6px 12px', fontSize: '13px', background: currentPage === 1 ? 'var(--bdr-subtle)' : '#fff', opacity: currentPage === 1 ? 0.5 : 1 }}
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  >
                    Sebelumnya
                  </button>
                  <button 
                    className="btn" 
                    style={{ padding: '6px 12px', fontSize: '13px', background: currentPage === totalPages ? 'var(--bdr-subtle)' : '#fff', opacity: currentPage === totalPages ? 0.5 : 1 }}
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  >
                    Selanjutnya
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
