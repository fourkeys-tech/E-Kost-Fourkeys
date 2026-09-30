'use client';

import { useEffect, useState, useCallback } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useAuth } from '@/contexts/AuthContext';
import { tenantApi, propertyApi, roomApi, contractApi } from '@/lib/api';
import { Tenant, Property, Room } from '@/types';
import { Users, Plus, Edit2, Search, Phone, Mail, FileText, UserPlus, Key } from 'lucide-react';
import Swal from 'sweetalert2';

export default function TenantsPage() {
  const { user, loading: authLoading } = useRequireAuth({ allowedRoles: ['OWNER', 'ADMIN', 'SUPER_ADMIN'] });
  const { accessToken } = useAuth();
  
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal Tenant
  const [isTenantModalOpen, setIsTenantModalOpen] = useState(false);
  const [editTenant, setEditTenant] = useState<Tenant | null>(null);

  // Modal Contract
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [selectedTenantForContract, setSelectedTenantForContract] = useState<Tenant | null>(null);
  const [contractPropertyId, setContractPropertyId] = useState<string>('');
  const [propertyRooms, setPropertyRooms] = useState<Room[]>([]);

  const fetchData = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const [tenantsRes, propsRes] = await Promise.all([
        tenantApi.list(accessToken),
        propertyApi.list(accessToken, { limit: 100 })
      ]);
      setTenants(tenantsRes || []);
      setProperties(propsRes.data || []);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user, fetchData]);

  const handleSaveTenant = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!accessToken) return;
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      idCardNumber: formData.get('idCardNumber') as string,
      emergencyContact: formData.get('emergencyContact') as string,
    };

    try {
      if (editTenant) {
        await tenantApi.update(editTenant.id, data, accessToken);
        Swal.fire({ title: 'Berhasil!', text: 'Data penyewa diperbarui.', icon: 'success', confirmButtonColor: 'var(--brand-600)', customClass: { popup: 'rounded-xl' } });
      } else {
        await tenantApi.create(data, accessToken);
        Swal.fire({ title: 'Berhasil!', text: 'Penyewa baru didaftarkan. Akun otomatis dibuatkan.', icon: 'success', confirmButtonColor: 'var(--brand-600)', customClass: { popup: 'rounded-xl' } });
      }
      setIsTenantModalOpen(false);
      fetchData();
    } catch (err: any) {
      console.error(err);
      Swal.fire({ title: 'Gagal', text: err.message || 'Gagal menyimpan data penyewa.', icon: 'error', confirmButtonColor: 'var(--clr-danger)', customClass: { popup: 'rounded-xl' } });
    }
  };

  const openContractModal = (tenant: Tenant) => {
    setSelectedTenantForContract(tenant);
    setContractPropertyId('');
    setPropertyRooms([]);
    setIsContractModalOpen(true);
  };

  const handlePropertyChangeForContract = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const pId = e.target.value;
    setContractPropertyId(pId);
    if (!pId || !accessToken) return;
    try {
      // Ambil kamar untuk properti ini
      const rooms = await roomApi.list(accessToken, pId);
      // Filter hanya yang kosong
      setPropertyRooms(rooms.filter(r => r.status === 'EMPTY'));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveContract = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!accessToken || !selectedTenantForContract) return;
    const formData = new FormData(e.currentTarget);
    
    const roomId = formData.get('roomId') as string;
    if (!roomId) {
      Swal.fire('Perhatian', 'Pilih kamar terlebih dahulu!', 'warning');
      return;
    }

    const data = {
      tenantId: selectedTenantForContract.id,
      roomId,
      startDate: formData.get('startDate') as string,
      durationMonths: parseInt(formData.get('durationMonths') as string),
      rentAmount: parseFloat(formData.get('rentAmount') as string),
      deposit: parseFloat(formData.get('deposit') as string) || 0,
      dueDay: parseInt(formData.get('dueDay') as string),
      notes: formData.get('notes') as string,
    };

    try {
      await contractApi.create(data, accessToken);
      Swal.fire({ title: 'Berhasil!', text: 'Kontrak penyewaan berhasil dibuat.', icon: 'success', confirmButtonColor: 'var(--brand-600)', customClass: { popup: 'rounded-xl' } });
      setIsContractModalOpen(false);
      fetchData(); // Refresh untuk melihat kontrak aktif di data penyewa
    } catch (err: any) {
      console.error(err);
      Swal.fire({ title: 'Gagal', text: err.message || 'Gagal membuat kontrak.', icon: 'error', confirmButtonColor: 'var(--clr-danger)', customClass: { popup: 'rounded-xl' } });
    }
  };

  // Filter tenants
  const filteredTenants = tenants.filter(t => 
    (t as any).user?.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (t as any).user?.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authLoading || loading) return (
    <div className="page-loader">
      <div className="spinner" />
      <p style={{ fontSize: '13px', color: 'var(--txt-muted)' }}>Memuat penyewa...</p>
    </div>
  );
  if (!user) return null;

  return (
    <AppLayout title="Daftar Penghuni / Penyewa" subtitle="Kelola seluruh penghuni dari semua properti Anda">
      <div className="page-container stack-lg">
        {/* Header Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
          <div className="search-bar" style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-surface)', border: '1px solid var(--bdr-strong)', borderRadius: 'var(--r-md)', padding: '8px 12px', minWidth: '300px' }}>
            <Search size={16} color="var(--txt-muted)" style={{ marginRight: '8px' }} />
            <input 
              type="text" 
              placeholder="Cari nama atau email penghuni..." 
              style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '14px' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="btn btn--primary" onClick={() => { setEditTenant(null); setIsTenantModalOpen(true); }}>
            <UserPlus size={16} /> Daftarkan Penghuni Baru
          </button>
        </div>

        {/* List Section */}
        {filteredTenants.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--bg-surface)', border: '1px dashed var(--bdr-strong)', borderRadius: 'var(--r-xl)' }}>
            <div style={{ width: '64px', height: '64px', background: 'var(--bg-sunken)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--txt-muted)' }}>
              <Users size={28} />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--txt-primary)', marginBottom: '8px' }}>
              Tidak Ada Penghuni
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--txt-secondary)', maxWidth: '300px', margin: '0 auto 20px' }}>
              Belum ada data penghuni. Silakan daftarkan penghuni baru.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
            {filteredTenants.map((tenant: any) => {
              const activeContract = tenant.contracts?.find((c: any) => c.isActive);

              return (
                <div key={tenant.id} className="card card--interactive" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--brand-100)', color: 'var(--brand-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 700 }}>
                        {tenant.user?.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--txt-primary)' }}>{tenant.user?.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--txt-secondary)' }}>{tenant.user?.email}</div>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px', fontSize: '13px', color: 'var(--txt-secondary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Phone size={14} color="var(--txt-muted)" /> {tenant.phone || '-'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileText size={14} color="var(--txt-muted)" /> KTP: {tenant.idCardNumber || '-'}
                    </div>
                  </div>

                  <div style={{ padding: '12px', background: activeContract ? '#f0f9ff' : 'var(--bg-sunken)', borderRadius: 'var(--r-md)', marginBottom: '20px' }}>
                    {activeContract ? (
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--brand-600)', textTransform: 'uppercase', marginBottom: '4px' }}>Kontrak Aktif</div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--txt-primary)' }}>Kamar {activeContract.room?.roomNumber}</div>
                        <div style={{ fontSize: '12px', color: 'var(--txt-secondary)' }}>{activeContract.room?.property?.name}</div>
                      </div>
                    ) : (
                      <div style={{ fontSize: '13px', color: 'var(--txt-muted)', textAlign: 'center', padding: '8px 0' }}>
                        Tidak ada kontrak aktif
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', borderTop: '1px solid var(--bdr-subtle)', paddingTop: '16px' }}>
                    <button className="btn" style={{ flex: 1, padding: '8px', fontSize: '13px', background: 'var(--bg-surface)', border: '1px solid var(--bdr-strong)' }} onClick={() => { setEditTenant(tenant); setIsTenantModalOpen(true); }}>
                      <Edit2 size={14} /> Edit Data
                    </button>
                    {!activeContract && (
                      <button className="btn btn--primary" style={{ flex: 1, padding: '8px', fontSize: '13px' }} onClick={() => openContractModal(tenant)}>
                        <Key size={14} /> Buat Kontrak
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Tambah/Edit Tenant */}
      {isTenantModalOpen && (
        <div className="modal-overlay" onClick={() => setIsTenantModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <form onSubmit={handleSaveTenant}>
              <div className="modal-header">
                <h2>{editTenant ? 'Edit Data Penghuni' : 'Daftarkan Penghuni Baru'}</h2>
                <button type="button" className="icon-btn" onClick={() => setIsTenantModalOpen(false)}>×</button>
              </div>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {!editTenant && (
                  <div style={{ fontSize: '13px', color: 'var(--txt-secondary)', padding: '12px', background: 'var(--brand-50)', borderRadius: '8px', marginBottom: '8px' }}>
                    Informasi akun (email & password) akan dibuatkan otomatis untuk penyewa baru.
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Nama Lengkap</label>
                  <input name="name" type="text" className="form-input" defaultValue={(editTenant as any)?.user?.name || ''} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input name="email" type="email" className="form-input" defaultValue={(editTenant as any)?.user?.email || ''} required disabled={!!editTenant} />
                  {editTenant && <span style={{ fontSize: '11px', color: 'var(--txt-muted)' }}>Email tidak dapat diubah setelah didaftarkan.</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Nomor HP</label>
                  <input name="phone" type="text" className="form-input" defaultValue={editTenant?.phone || ''} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Nomor KTP (Opsional)</label>
                  <input name="idCardNumber" type="text" className="form-input" defaultValue={editTenant?.idCardNumber || ''} />
                </div>
                <div className="form-group">
                  <label className="form-label">Kontak Darurat (Opsional)</label>
                  <input name="emergencyContact" type="text" className="form-input" defaultValue={editTenant?.emergencyContact || ''} placeholder="Nama - Nomor HP" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn--secondary" onClick={() => setIsTenantModalOpen(false)}>Batal</button>
                <button type="submit" className="btn btn--primary">Simpan Data</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Buat Kontrak */}
      {isContractModalOpen && selectedTenantForContract && (
        <div className="modal-overlay" onClick={() => setIsContractModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <form onSubmit={handleSaveContract}>
              <div className="modal-header">
                <h2>Buat Kontrak Penyewaan</h2>
                <button type="button" className="icon-btn" onClick={() => setIsContractModalOpen(false)}>×</button>
              </div>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--bg-sunken)', borderRadius: '8px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--brand-100)', color: 'var(--brand-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 700 }}>
                    {(selectedTenantForContract as any).user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700 }}>{(selectedTenantForContract as any).user?.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--txt-secondary)' }}>Didaftarkan ke Kamar:</div>
                  </div>
                </div>

                <div className="grid grid-cols-2" style={{ gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Pilih Properti</label>
                    <select className="form-input" value={contractPropertyId} onChange={handlePropertyChangeForContract} required>
                      <option value="" disabled>Pilih Properti...</option>
                      {properties.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Pilih Kamar Kosong</label>
                    <select name="roomId" className="form-input" required disabled={!contractPropertyId || propertyRooms.length === 0}>
                      <option value="" disabled>
                        {!contractPropertyId ? 'Pilih properti dulu' : propertyRooms.length === 0 ? 'Tidak ada kamar kosong' : 'Pilih Kamar...'}
                      </option>
                      {propertyRooms.map(r => (
                        <option key={r.id} value={r.id}>Kamar {r.roomNumber} - Rp {(r.price / 1000).toLocaleString()}k</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2" style={{ gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Tanggal Masuk (Mulai)</label>
                    <input name="startDate" type="date" className="form-input" defaultValue={new Date().toISOString().split('T')[0]} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Durasi Kontrak (Bulan)</label>
                    <input name="durationMonths" type="number" className="form-input" defaultValue={1} min={1} required />
                  </div>
                </div>

                <div className="grid grid-cols-2" style={{ gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Harga Sewa Kesepakatan (Rp)</label>
                    <input name="rentAmount" type="number" className="form-input" placeholder="Misal: 1500000" required />
                    <span style={{ fontSize: '11px', color: 'var(--txt-muted)' }}>Bisa berbeda dari harga asli kamar.</span>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Deposit Awal (Rp)</label>
                    <input name="deposit" type="number" className="form-input" defaultValue={0} min={0} />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Tanggal Jatuh Tempo Tagihan</label>
                  <input name="dueDay" type="number" className="form-input" defaultValue={1} min={1} max={28} required />
                  <span style={{ fontSize: '11px', color: 'var(--txt-muted)' }}>Tanggal berapa tagihan bulanan dikirimkan (1-28).</span>
                </div>

                <div className="form-group">
                  <label className="form-label">Catatan Tambahan (Opsional)</label>
                  <textarea name="notes" className="form-input" rows={2}></textarea>
                </div>

              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn--secondary" onClick={() => setIsContractModalOpen(false)}>Batal</button>
                <button type="submit" className="btn btn--primary">Buat Kontrak</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </AppLayout>
  );
}
