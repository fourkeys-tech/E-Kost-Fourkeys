'use client';

import { useEffect, useState, useCallback } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useAuth } from '@/contexts/AuthContext';
import { propertyApi, roomApi, request } from '@/lib/api';
import { Property, Room } from '@/types';
import { DoorClosed, Plus, Edit2, Trash2, X, AlertTriangle, Building2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import Swal from 'sweetalert2';
import { useToast } from '@/contexts/ToastContext';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

export default function RoomsPage() {
  const { user, loading: authLoading } = useRequireAuth({ allowedRoles: ['OWNER', 'ADMIN', 'SUPER_ADMIN'] });
  const { accessToken } = useAuth();
  const toast = useToast();

  const [properties, setProperties] = useState<Property[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');

  // Modal states
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [editRoomData, setEditRoomData] = useState<Room | null>(null);
  const [editRoomFacilities, setEditRoomFacilities] = useState<string[]>([]);
  const [editRoomPhotos, setEditRoomPhotos] = useState<string[]>([]);
  const [modalPropertyId, setModalPropertyId] = useState<string>('');
  
  // Delete confirm state
  const [deleteRoomId, setDeleteRoomId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const [propsRes, roomsRes] = await Promise.all([
        propertyApi.list(accessToken, { limit: 100 }), // assume 100 is enough for owner properties
        roomApi.list(accessToken, selectedPropertyId ? { propertyId: selectedPropertyId } : undefined)
      ]);
      setProperties(propsRes.data || []);
      setRooms(roomsRes);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, [accessToken, selectedPropertyId]);

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user, fetchData]);

  const openAddModal = () => {
    setEditRoomData(null);
    setEditRoomFacilities([]);
    setEditRoomPhotos([]);
    setModalPropertyId(selectedPropertyId || (properties.length > 0 ? properties[0].id : ''));
    setIsRoomModalOpen(true);
  };

  const openEditModal = (room: Room) => {
    setEditRoomData(room);
    setEditRoomFacilities(room.facilities || []);
    setEditRoomPhotos(typeof room.photos === 'string' ? JSON.parse(room.photos) : room.photos || []);
    setModalPropertyId(room.propertyId);
    setIsRoomModalOpen(true);
  };

  const handleDeleteRoom = (id: string) => {
    setDeleteRoomId(id);
  };

  const confirmDeleteRoom = async () => {
    if (!deleteRoomId || !accessToken) return;
    setIsDeleting(true);
    try {
      await roomApi.delete(deleteRoomId, accessToken);
      toast.success('Kamar berhasil dihapus secara permanen dari sistem.');
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus kamar. Pastikan tidak ada penyewa aktif.');
    } finally {
      setIsDeleting(false);
      setDeleteRoomId(null);
    }
  };

  const handleSaveRoom = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!accessToken) return;
    const formData = new FormData(e.currentTarget);
    
    if (!modalPropertyId) {
      toast.error('Pilih properti terlebih dahulu!');
      return;
    }

    try {
      const payload = {
        propertyId: modalPropertyId,
        roomNumber: formData.get('roomNumber') as string,
        type: formData.get('type') as string,
        price: Number(formData.get('price')),
        floor: Number(formData.get('floor')),
        facilities: editRoomFacilities.filter(f => f.trim() !== ''),
        status: formData.get('status') as string,
        category: formData.get('category') as string,
        description: formData.get('description') as string,
        photos: editRoomPhotos.filter(p => p.trim() !== '')
      };

      if (editRoomData) {
        await request(`/api/rooms/${editRoomData.id}`, { method: 'PATCH', body: payload, token: accessToken });
        toast.success(`Data Kamar ${payload.roomNumber} berhasil diperbarui.`);
      } else {
        await request('/api/rooms', { method: 'POST', body: payload, token: accessToken });
        toast.success(`Kamar ${payload.roomNumber} berhasil ditambahkan ke properti.`);
      }
      setIsRoomModalOpen(false);
      fetchData();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Gagal menyimpan data kamar. Periksa kembali isian Anda.');
    }
  };

  if (authLoading || loading) return (
    <div className="page-loader">
      <div className="spinner" />
      <p style={{ fontSize: '13px', color: 'var(--txt-muted)' }}>Memuat kamar...</p>
    </div>
  );
  if (!user) return null;

  return (
    <AppLayout title="Daftar Kamar" subtitle="Kelola seluruh kamar dari semua properti Anda">
      <div className="page-container stack-lg">
        {/* Header Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--txt-primary)' }}>Filter Properti:</span>
            <select
              className="form-input"
              style={{ width: '250px' }}
              value={selectedPropertyId}
              onChange={(e) => setSelectedPropertyId(e.target.value)}
            >
              <option value="">Semua Properti</option>
              {properties.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <button className="btn btn--primary" onClick={openAddModal}>
            <Plus size={16} /> Tambah Kamar Baru
          </button>
        </div>

        {/* Room Grid */}
        {rooms.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--bg-surface)', border: '1px dashed var(--bdr-strong)', borderRadius: 'var(--r-xl)' }}>
            <div style={{ width: '64px', height: '64px', background: 'var(--bg-sunken)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--txt-muted)' }}>
              <DoorClosed size={28} />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--txt-primary)', marginBottom: '8px' }}>
              Belum Ada Kamar
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--txt-secondary)', maxWidth: '300px', margin: '0 auto 20px' }}>
              {selectedPropertyId ? 'Properti ini belum memiliki kamar.' : 'Anda belum menambahkan kamar apa pun.'}
            </p>
            <button className="btn btn--primary" onClick={openAddModal}>
              <Plus size={15} /> Tambah Kamar
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {rooms.map(room => (
              <div key={room.id} style={{ cursor: 'pointer', padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRadius: '16px', border: '1px solid var(--bdr-subtle)', background: '#fff', boxShadow: 'var(--shd-sm)', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shd-md)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shd-sm)'; }}>
                <div style={{ height: '180px', background: 'var(--bg-sunken)', position: 'relative' }}>
                  {room.photos && room.photos.length > 0 ? (
                    <img src={room.photos[0].startsWith('http') ? room.photos[0] : `http://localhost:5000${room.photos[0]}`} alt={`Kamar ${room.roomNumber}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--txt-disabled)', background: 'linear-gradient(135deg, var(--bg-sunken) 0%, #e2e8f0 100%)' }}>
                      <DoorClosed size={48} opacity={0.5} />
                    </div>
                  )}
                  
                  <div style={{ position: 'absolute', top: '12px', left: '12px', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(4px)', padding: '6px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <span style={{ color: 'var(--brand-600)', fontWeight: 800, fontSize: '13px', lineHeight: 1 }}>{room.category || 'Campur'}</span>
                  </div>

                  <span style={{ position: 'absolute', top: '12px', right: '12px', background: room.status === 'OCCUPIED' ? 'rgba(59, 130, 246, 0.95)' : room.status === 'EMPTY' ? 'rgba(16, 185, 129, 0.95)' : 'rgba(245, 158, 11, 0.95)', color: '#fff', padding: '6px 12px', borderRadius: '8px', fontWeight: 700, fontSize: '13px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    {room.status === 'OCCUPIED' ? 'Terisi' : room.status === 'EMPTY' ? 'Kosong' : 'Perbaikan'}
                  </span>
                </div>

                <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <div style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.5px', color: 'var(--txt-primary)', lineHeight: 1.2 }}>{room.roomNumber}</div>
                      <div style={{ fontSize: '13px', color: 'var(--txt-secondary)', marginTop: '4px', fontWeight: 500 }}>Tipe: {room.type} • Lt. {room.floor}</div>
                    </div>
                  </div>
                  
                  <div style={{ fontSize: '12px', color: 'var(--brand-600)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px', fontWeight: 600, background: 'var(--brand-50)', padding: '6px 10px', borderRadius: '6px', width: 'fit-content' }}>
                    <Building2 size={14} /> {(room as any).property?.name || 'Properti Tidak Diketahui'}
                  </div>

                  <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--txt-primary)', marginBottom: '16px' }}>
                    {formatCurrency(room.price)} <span style={{ fontSize: '12px', color: 'var(--txt-muted)', fontWeight: 500 }}>/ bln</span>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: 'auto', marginBottom: '16px' }}>
                    {room.facilities.slice(0, 3).map((f: string) => (
                      <span key={f} style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '4px', background: 'var(--bg-sunken)', color: 'var(--txt-secondary)', fontWeight: 600 }}>{f}</span>
                    ))}
                    {room.facilities.length > 3 && (
                      <span style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '4px', background: 'var(--bg-sunken)', color: 'var(--txt-secondary)', fontWeight: 600 }}>+{room.facilities.length - 3}</span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '12px', borderTop: '1px solid var(--bdr-subtle)', paddingTop: '16px' }}>
                    <button className="btn" style={{ flex: 1, padding: '8px', fontSize: '13px', background: 'var(--bg-surface)', border: '1px solid var(--bdr-strong)', borderRadius: '8px' }} onClick={() => openEditModal(room)}>
                      <Edit2 size={14} /> Edit
                    </button>
                    <button className="btn" style={{ flex: 1, padding: '8px', fontSize: '13px', background: '#fff0f0', color: 'var(--clr-danger)', border: '1px solid #ffcccc', borderRadius: '8px' }} onClick={() => handleDeleteRoom(room.id)}>
                      <X size={14} /> Hapus
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <ConfirmDialog
          isOpen={!!deleteRoomId}
          title="Hapus Kamar?"
          message="Data kamar yang dihapus tidak dapat dikembalikan."
          onConfirm={confirmDeleteRoom}
          onCancel={() => setDeleteRoomId(null)}
          isLoading={isDeleting}
        />
      </div>

      {isRoomModalOpen && (
        <div className="modal-overlay" onClick={() => setIsRoomModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <form onSubmit={handleSaveRoom}>
              <div className="modal-header">
                <h2>{editRoomData ? 'Edit Kamar' : 'Tambah Kamar Baru'}</h2>
                <button type="button" className="icon-btn" onClick={() => setIsRoomModalOpen(false)}>×</button>
              </div>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Properti Induk</label>
                  <select
                    className="form-input"
                    value={modalPropertyId}
                    onChange={(e) => setModalPropertyId(e.target.value)}
                    required
                    disabled={!!editRoomData} // Biasanya tidak boleh pindah properti setelah dibuat
                  >
                    <option value="" disabled>Pilih Properti...</option>
                    {properties.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2" style={{ gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Nomor Kamar</label>
                    <input name="roomNumber" type="text" className="form-input" defaultValue={editRoomData?.roomNumber || ''} placeholder="Contoh: 101" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tipe Kamar</label>
                    <input name="type" type="text" className="form-input" defaultValue={editRoomData?.type || ''} placeholder="Contoh: VIP" required />
                  </div>
                </div>

                <div className="grid grid-cols-2" style={{ gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Harga (Per Bulan)</label>
                    <input name="price" type="number" className="form-input" defaultValue={editRoomData?.price || ''} placeholder="1500000" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Lantai</label>
                    <input name="floor" type="number" className="form-input" defaultValue={editRoomData?.floor || 1} min="1" required />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Kategori Kamar</label>
                  <select name="category" className="form-input" defaultValue={editRoomData?.category || 'Campur'} required>
                    <option value="Putra">Putra</option>
                    <option value="Putri">Putri</option>
                    <option value="Campur">Campur</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select name="status" className="form-input" defaultValue={editRoomData?.status || 'EMPTY'}>
                    <option value="EMPTY">Kosong (Tersedia)</option>
                    <option value="OCCUPIED">Terisi</option>
                    <option value="MAINTENANCE">Dalam Perbaikan</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Deskripsi Tambahan</label>
                  <textarea name="description" className="form-input" rows={2} defaultValue={editRoomData?.description || ''} placeholder="Catatan tambahan kamar (opsional)" />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Foto Kamar (URL)</span>
                    <span style={{ color: 'var(--brand-600)', fontSize: '13px', cursor: 'pointer' }} 
                          onClick={() => setEditRoomPhotos([...editRoomPhotos, ''])}>
                      + Tambah URL Foto
                    </span>
                  </label>
                  {editRoomPhotos.map((photo, i) => (
                    <div key={i} style={{ display: 'flex', gap: '12px', marginBottom: '8px', alignItems: 'center' }}>
                       {photo ? (
                         <div style={{ width: '48px', height: '48px', borderRadius: 'var(--r-sm)', background: `url(${photo}) center/cover`, flexShrink: 0 }} />
                       ) : (
                         <div style={{ width: '48px', height: '48px', borderRadius: 'var(--r-sm)', background: 'var(--bg-sunken)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--txt-muted)', fontSize: '10px', flexShrink: 0 }}>No Image</div>
                       )}
                       <input type="text" className="form-input" value={photo} 
                              onChange={(e) => {
                                const newPhotos = [...editRoomPhotos];
                                newPhotos[i] = e.target.value;
                                setEditRoomPhotos(newPhotos);
                              }} 
                              style={{ flex: 1 }} placeholder="https://..." />
                       <button type="button" className="icon-btn" style={{ color: 'var(--clr-danger)' }} 
                               onClick={() => {
                                 setEditRoomPhotos(editRoomPhotos.filter((_, idx) => idx !== i));
                               }}>
                         <X size={14} />
                       </button>
                    </div>
                  ))}
                  {editRoomPhotos.length === 0 && <p style={{ fontSize: '13px', color: 'var(--txt-muted)', textAlign: 'center', padding: '12px' }}>Belum ada foto. Klik tambah.</p>}
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Fasilitas Kamar</span>
                    <span style={{ color: 'var(--brand-600)', fontSize: '13px', cursor: 'pointer' }}
                      onClick={() => setEditRoomFacilities([...editRoomFacilities, ''])}>
                      + Tambah Fasilitas
                    </span>
                  </label>
                  {editRoomFacilities.map((facility, i) => (
                    <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                      <input type="text" className="form-input" value={facility}
                        onChange={(e) => {
                          const newFacs = [...editRoomFacilities];
                          newFacs[i] = e.target.value;
                          setEditRoomFacilities(newFacs);
                        }}
                        style={{ flex: 1 }} placeholder="Contoh: Kasur Springbed" required />
                      <button type="button" className="icon-btn" style={{ color: 'var(--clr-danger)' }}
                        onClick={() => {
                          setEditRoomFacilities(editRoomFacilities.filter((_, idx) => idx !== i));
                        }}>
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  {editRoomFacilities.length === 0 && <p style={{ fontSize: '13px', color: 'var(--txt-muted)', textAlign: 'center', padding: '8px' }}>Belum ada fasilitas. Klik tambah.</p>}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn--secondary" onClick={() => setIsRoomModalOpen(false)}>Batal</button>
                <button type="submit" className="btn btn--primary">Simpan Kamar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
