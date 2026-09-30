'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useAuth } from '@/contexts/AuthContext';
import { propertyApi, roomApi, tenantApi } from '@/lib/api';
import { Property, Room, Tenant } from '@/types';
import { 
  Building2, ArrowLeft, MapPin, CheckCircle2, 
  Home, Users, Settings, Edit, Plus, Info, 
  CreditCard, Calendar, FileText, AlertTriangle, ChevronRight, Copy, X
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import Swal from 'sweetalert2';
import LocationSelect from '@/components/properties/LocationSelect';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useToast } from '@/contexts/ToastContext';

// Interactive Toggle Component
function ToggleSwitch({ initial = true }: { initial?: boolean }) {
  const [on, setOn] = useState(initial);
  return (
    <div 
      onClick={() => setOn(!on)}
      style={{ 
        position: 'relative', width: '40px', height: '22px', 
        background: on ? 'var(--brand-500)' : 'var(--bg-sunken)', 
        borderRadius: '20px', cursor: 'pointer', transition: 'background 0.3s' 
      }}
    >
      <div style={{ 
        position: 'absolute', top: '3px', left: on ? '21px' : '3px', 
        width: '16px', height: '16px', background: '#fff', 
        borderRadius: '50%', transition: 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }} />
    </div>
  );
}

export default function PropertyDetailPage() {
  const { user, loading: authLoading } = useRequireAuth({ allowedRoles: ['OWNER', 'ADMIN', 'SUPER_ADMIN'] });
  const { accessToken } = useAuth();
  const toast = useToast();
  const params = useParams();
  const router = useRouter();
  
  const [property, setProperty] = useState<Property | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'rooms' | 'tenants' | 'settings'>('overview');

  // Modal states
  const [isEditPropertyOpen, setIsEditPropertyOpen] = useState(false);
  const [isEditLateFeeOpen, setIsEditLateFeeOpen] = useState(false);
  const [editFacilities, setEditFacilities] = useState<string[]>([]);
  const [editPhotos, setEditPhotos] = useState<string[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  
  // Delete confirm state
  const [deleteRoomId, setDeleteRoomId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Room Modal States
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [editRoomData, setEditRoomData] = useState<Room | null>(null);
  const [editRoomFacilities, setEditRoomFacilities] = useState<string[]>([]);
  const [editRoomPhotos, setEditRoomPhotos] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;
    
    const fetchProperty = async () => {
      if (!accessToken) return;
      try {
        const data = await propertyApi.get(params.id as string, accessToken);
        if (data) {
          setProperty({
            ...data,
            facilities: Array.isArray(data.facilities) ? data.facilities : JSON.parse(data.facilities || '[]'),
            photos: Array.isArray(data.photos) ? data.photos : JSON.parse(data.photos || '[]')
          });
          setRooms(data.rooms || []);
          
          const tenantsData = await tenantApi.list(accessToken, params.id as string);
          setTenants(tenantsData || []);
        }
      } catch (err: any) {
        if (err.message?.includes('tidak ditemukan') || err.message?.includes('404')) {
          alert('Properti tidak ditemukan (Mungkin Anda menggunakan URL lama/mock). Kembali ke daftar properti.');
          router.push('/properties');
        } else {
          console.error('Error fetching property:', err);
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchProperty();
  }, [user, accessToken, params.id, router]);

  const handleSaveRoom = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!accessToken || !property) return;
    const formData = new FormData(e.currentTarget);
    const data = {
      propertyId: property.id,
      roomNumber: formData.get('roomNumber') as string,
      type: formData.get('type') as string,
      price: parseFloat(formData.get('price') as string),
      floor: parseInt(formData.get('floor') as string) || 1,
      description: formData.get('description') as string,
      status: formData.get('status') as string,
      category: formData.get('category') as string,
      facilities: editRoomFacilities.filter(f => f.trim() !== ''),
      photos: editRoomPhotos.filter(p => p.trim() !== ''),
      depositAmount: parseFloat(formData.get('depositAmount') as string) || 0
    };

    try {
      if (editRoomData) {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/rooms/${editRoomData.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify(data)
        });
      } else {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/rooms`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify(data)
        });
      }
      
      const updatedProperty = await propertyApi.get(property.id, accessToken);
      setRooms(updatedProperty.rooms || []);
      setIsRoomModalOpen(false);
      toast.success(editRoomData ? `Data Kamar ${data.roomNumber} berhasil diperbarui.` : `Kamar ${data.roomNumber} berhasil ditambahkan ke properti.`);
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan data kamar. Periksa kembali isian Anda.');
    }
  };

  const handleDeleteRoom = (roomId: string) => {
    setDeleteRoomId(roomId);
  };

  const confirmDeleteRoom = async () => {
    if (!deleteRoomId || !accessToken) return;
    setIsDeleting(true);
    try {
      await roomApi.delete(deleteRoomId, accessToken);
      setRooms(rooms.filter(r => r.id !== deleteRoomId));
      toast.success('Kamar berhasil dihapus secara permanen dari sistem.');
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus kamar. Pastikan tidak ada penyewa aktif.');
    } finally {
      setIsDeleting(false);
      setDeleteRoomId(null);
    }
  };

  if (authLoading || loading) return (
    <div className="page-loader">
      <div className="spinner" />
      <p style={{ fontSize: '13px', color: 'var(--txt-muted)' }}>Memuat detail properti...</p>
    </div>
  );
  if (!user || !property) return null;

  const totalRooms = rooms.length;
  const occupiedRooms = rooms.filter(r => r.status === 'OCCUPIED').length;
  const emptyRooms = rooms.filter(r => r.status === 'EMPTY').length;
  const maintenanceRooms = rooms.filter(r => r.status === 'MAINTENANCE').length;
  const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;
  const potentialRevenue = rooms.reduce((acc, r) => acc + r.price, 0);
  const isKontrakan = property.type === 'KONTRAKAN';

  return (
    <AppLayout 
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => router.back()} className="icon-btn" aria-label="Kembali" style={{ background: 'var(--bg-surface)' }}>
            <ArrowLeft size={18} />
          </button>
          <span>Detail Properti</span>
        </div>
      }
      subtitle="Pusat kontrol dan informasi properti Anda"
    >
      <div className="section" style={{ paddingBottom: 0 }}>
        {/* ── Hero Info ── */}
        <div className="hero-banner" style={{ background: 'linear-gradient(135deg, var(--brand-700), var(--brand-500))' }}>
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <h2 style={{ fontSize: 'clamp(20px, 4vw, 24px)', fontWeight: 800, color: '#fff', letterSpacing: '-0.3px', margin: 0 }}>
                  {property.name}
                </h2>
                <span className={`badge badge--${property.isActive ? 'success' : 'neutral'}`} style={{ border: 'none', background: property.isActive ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.2)', color: '#fff' }}>
                  {property.isActive ? 'Beroperasi' : 'Nonaktif'}
                </span>
                <span className="badge" style={{ border: 'none', background: 'rgba(59, 130, 246, 0.2)', color: '#60A5FA', fontWeight: 600 }}>
                  {property.type === 'KONTRAKAN_RUMAH' ? 'Kontrakan Rumah' : property.type === 'KONTRAKAN_PETAK' ? 'Kontrakan Petak' : 'Kost'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.8)', fontSize: '13.5px', marginBottom: '16px' }}>
                <MapPin size={14} />
                <span>{property.district && property.regency ? `${property.address}, ${property.district}, ${property.regency}, ${property.province}` : property.address}</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                <span className="hero-banner__pill" style={{ background: 'rgba(255,255,255,0.1)' }}><Home size={13} /> {totalRooms} {isKontrakan ? 'Unit' : 'Kamar'} Total</span>
                <span className="hero-banner__pill" style={{ background: 'rgba(255,255,255,0.1)' }}><CheckCircle2 size={13} /> {occupancyRate}% Terisi</span>
                <span className="hero-banner__pill" style={{ background: 'rgba(255,255,255,0.1)' }}><CreditCard size={13} /> {formatCurrency(potentialRevenue)} / bln (Maksimal)</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Tabs Navigation ── */}
        <div style={{ display: 'flex', gap: '24px', borderBottom: '1px solid var(--bdr-subtle)', marginTop: '24px' }}>
          {[
            { id: 'overview', label: 'Overview', icon: Info },
            { id: 'rooms', label: `Daftar ${isKontrakan ? 'Unit' : 'Kamar'}`, icon: Home },
            { id: 'tenants', label: 'Penyewa Aktif', icon: Users },
            { id: 'settings', label: 'Pengaturan', icon: Settings },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 0',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: isActive ? 'var(--brand-600)' : 'var(--txt-secondary)',
                  fontWeight: isActive ? 700 : 500, fontSize: '14px',
                  borderBottom: isActive ? '3px solid var(--brand-500)' : '3px solid transparent',
                  transition: 'all 0.2s'
                }}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="section" style={{ paddingTop: '24px' }}>
        {/* =========================================================
            TAB: OVERVIEW
            ========================================================= */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'flex-start' }}>
            
            {/* Kiri: Informasi Utama (Lebar: ~65%) */}
            <div style={{ flex: '2 1 600px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="card" style={{ padding: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--txt-primary)', marginBottom: '8px' }}>Tentang Properti</h3>
                    <p style={{ color: 'var(--txt-secondary)', fontSize: '14px', lineHeight: 1.6, maxWidth: '90%' }}>
                      {property.description || 'Deskripsi belum ditambahkan.'}
                    </p>
                  </div>
                  <button onClick={() => {
                    setEditPhotos([...property.photos]);
                    setEditFacilities([...property.facilities]);
                    setIsEditPropertyOpen(true);
                  }} className="btn" style={{ background: 'var(--bg-sunken)', color: 'var(--txt-primary)', border: '1px solid var(--bdr-strong)', fontSize: '13px', padding: '8px 16px' }}>
                    <Edit size={14} /> Edit
                  </button>
                </div>

                <div style={{ height: '1px', background: 'var(--bdr-subtle)', margin: '24px 0' }} />

                <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px', color: 'var(--txt-primary)' }}>Fasilitas Unggulan</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {property.facilities.map((f, i) => (
                    <div key={i} style={{ 
                      display: 'flex', alignItems: 'center', gap: '6px', 
                      background: '#fff', border: '1px solid var(--bdr-strong)', 
                      padding: '8px 16px', borderRadius: '100px', 
                      boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', cursor: 'default' 
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--brand-400)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.1)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--bdr-strong)'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                      <CheckCircle2 size={14} style={{ color: 'var(--brand-500)' }} />
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--txt-secondary)' }}>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Foto Galeri (Preview) */}
              <div className="card" style={{ padding: '24px' }}>
                <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px', color: 'var(--txt-primary)' }}>Galeri Foto</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px', height: '240px' }}>
                   <div style={{ background: property.photos[0] ? `url(${property.photos[0]}) center/cover` : 'var(--bg-sunken)', borderRadius: 'var(--r-md)' }} />
                   
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                     <div style={{ flex: 1, background: property.photos[1] ? `url(${property.photos[1]}) center/cover` : 'var(--bg-sunken)', borderRadius: 'var(--r-md)' }} />
                     <div style={{ flex: 1, background: property.photos[2] ? `url(${property.photos[2]}) center/cover` : 'var(--bg-sunken)', borderRadius: 'var(--r-md)' }} />
                   </div>
                   
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                     <div style={{ flex: 1, background: property.photos[3] ? `url(${property.photos[3]}) center/cover` : 'var(--bg-sunken)', borderRadius: 'var(--r-md)' }} />
                     <div style={{ flex: 1, background: property.photos[4] ? `url(${property.photos[4]}) center/cover` : 'var(--bg-sunken)', borderRadius: 'var(--r-md)', position: 'relative', overflow: 'hidden' }}>
                       {property.photos.length > 5 && (
                         <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>
                           +{property.photos.length - 5} Foto
                         </div>
                       )}
                     </div>
                   </div>
                </div>
              </div>
            </div>

            {/* Kanan: Statistik & Aturan (Lebar: ~35%) */}
            <div style={{ flex: '1 1 350px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="card" style={{ padding: '28px' }}>
                 <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                   <Home size={18} style={{ color: 'var(--brand-500)' }} /> Okupansi Kamar
                 </h3>
                 
                 {/* Visual Progress Bar */}
                 <div style={{ height: '10px', display: 'flex', borderRadius: '10px', overflow: 'hidden', background: 'var(--bg-sunken)', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)', marginBottom: '24px' }}>
                    <div style={{ width: totalRooms ? `${(occupiedRooms/totalRooms)*100}%` : '0', background: 'var(--clr-info)', transition: 'width 1.5s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                    <div style={{ width: totalRooms ? `${(emptyRooms/totalRooms)*100}%` : '0', background: 'var(--clr-success)', transition: 'width 1.5s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                    <div style={{ width: totalRooms ? `${(maintenanceRooms/totalRooms)*100}%` : '0', background: 'var(--clr-warning)', transition: 'width 1.5s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                 </div>

                 <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderRadius: 'var(--r-md)', background: 'var(--bg-surface)', border: '1px solid var(--bdr-subtle)' }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                       <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--clr-info)', boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.15)' }} />
                       <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--txt-secondary)' }}>Terisi</span>
                     </div>
                     <span style={{ fontWeight: 800, fontSize: '16px', color: 'var(--txt-primary)' }}>{occupiedRooms}</span>
                   </div>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderRadius: 'var(--r-md)', background: 'var(--bg-surface)', border: '1px solid var(--bdr-subtle)' }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                       <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--clr-success)', boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.15)' }} />
                       <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--txt-secondary)' }}>Kosong</span>
                     </div>
                     <span style={{ fontWeight: 800, fontSize: '16px', color: 'var(--txt-primary)' }}>{emptyRooms}</span>
                   </div>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderRadius: 'var(--r-md)', background: 'var(--bg-surface)', border: '1px solid var(--bdr-subtle)' }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                       <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--clr-warning)', boxShadow: '0 0 0 3px rgba(245, 158, 11, 0.15)' }} />
                       <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--txt-secondary)' }}>Perbaikan</span>
                     </div>
                     <span style={{ fontWeight: 800, fontSize: '16px', color: 'var(--txt-primary)' }}>{maintenanceRooms}</span>
                   </div>
                 </div>
              </div>

              <div style={{ background: 'linear-gradient(to right, rgba(99, 102, 241, 0.05), rgba(99, 102, 241, 0.1))', border: '1px solid var(--brand-200)', borderRadius: 'var(--r-lg)', padding: '24px' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                   <div style={{ background: 'var(--brand-500)', color: '#fff', padding: '8px', borderRadius: '12px', boxShadow: '0 4px 10px rgba(99,102,241,0.3)' }}>
                     <FileText size={18} />
                   </div>
                   <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--brand-700)' }}>Aturan Keterlambatan</h3>
                 </div>
                 <p style={{ fontSize: '13px', color: 'var(--brand-700)', lineHeight: 1.6, opacity: 0.9 }}>
                   Penyewa akan dikenakan denda sebesar <strong style={{ color: 'var(--brand-800)' }}>{property.lateFeePct}%</strong> dari nominal tagihan untuk setiap periode keterlambatan, hingga batas maksimal <strong style={{ color: 'var(--brand-800)' }}>{property.maxLateFee}%</strong>.
                 </p>
                 <button onClick={() => setIsEditLateFeeOpen(true)} style={{ marginTop: '16px', background: 'transparent', border: 'none', color: 'var(--brand-600)', fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                   Ubah Aturan <ChevronRight size={14} />
                 </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            TAB: ROOMS
            ========================================================= */}
        {activeTab === 'rooms' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Kelola {isKontrakan ? 'Unit' : 'Kamar'} ({totalRooms})</h3>
              <button className="btn btn--primary" onClick={() => {
                setEditRoomData(null);
                setEditRoomFacilities([]);
                setEditRoomPhotos([]);
                setIsRoomModalOpen(true);
              }}>
                <Plus size={14} /> Tambah {isKontrakan ? 'Unit' : 'Kamar'} Baru
              </button>
            </div>

            {rooms.length === 0 ? (
               <div style={{ textAlign: 'center', padding: '60px 20px', border: '1px dashed var(--bdr-strong)', borderRadius: 'var(--r-lg)' }}>
                 <p style={{ color: 'var(--txt-muted)', marginBottom: '16px' }}>Belum ada kamar di properti ini.</p>
                 <button className="btn btn--primary" onClick={() => {
                   setEditRoomData(null);
                   setEditRoomFacilities([]);
                   setEditRoomPhotos([]);
                   setIsRoomModalOpen(true);
                 }}><Plus size={14} /> Buat Kamar Pertama</button>
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
                          <Home size={48} opacity={0.5} />
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
                        <button className="btn" style={{ flex: 1, padding: '8px', fontSize: '13px', background: 'var(--bg-surface)', border: '1px solid var(--bdr-strong)', borderRadius: '8px' }} onClick={() => {
                          setEditRoomData(room);
                          setEditRoomFacilities([...room.facilities]);
                          setEditRoomPhotos(typeof room.photos === 'string' ? JSON.parse(room.photos) : [...(room.photos || [])]);
                          setIsRoomModalOpen(true);
                        }}>
                          <Edit size={14} /> Edit
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
          </div>
        )}

        {/* =========================================================
            TAB: TENANTS
            ========================================================= */}
        {activeTab === 'tenants' && (
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Daftar Penyewa</h3>
              <Link href="/tenants" className="btn btn--primary" style={{ textDecoration: 'none' }}>Kelola Semua Penyewa</Link>
            </div>

            {tenants.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', background: 'var(--bg-surface)', border: '1px dashed var(--bdr-strong)', borderRadius: 'var(--r-xl)' }}>
                <Users size={32} style={{ color: 'var(--txt-muted)', margin: '0 auto 12px', opacity: 0.5 }} />
                <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '6px' }}>Belum Ada Penyewa</h4>
                <p style={{ color: 'var(--txt-secondary)', fontSize: '13px', maxWidth: '300px', margin: '0 auto' }}>Properti ini belum memiliki penyewa aktif.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                {tenants.map((tenant: any) => {
                  const activeContract = tenant.contracts?.find((c: any) => c.isActive && c.room?.propertyId === property.id);
                  return (
                    <div key={tenant.id} className="card card--interactive" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--brand-100)', color: 'var(--brand-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 700 }}>
                          {tenant.user?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--txt-primary)' }}>{tenant.user?.name}</div>
                          <div style={{ fontSize: '12px', color: 'var(--txt-secondary)' }}>{tenant.user?.email}</div>
                        </div>
                      </div>

                      <div style={{ fontSize: '13px', color: 'var(--txt-secondary)', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div>HP: {tenant.phone || '-'}</div>
                        <div>KTP: {tenant.idCardNumber || '-'}</div>
                      </div>

                      {activeContract && (
                        <div style={{ padding: '10px', background: '#f0f9ff', borderRadius: 'var(--r-md)', marginTop: 'auto' }}>
                          <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--brand-600)', textTransform: 'uppercase' }}>Kamar Aktif</div>
                          <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--txt-primary)' }}>Kamar {activeContract.room?.roomNumber}</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* =========================================================
            TAB: SETTINGS
            ========================================================= */}
        {activeTab === 'settings' && (
          <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: '24px' }}>
             {/* General Settings */}
             <div className="card card--interactive">
               <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                 <Settings size={18} style={{ color: 'var(--txt-muted)' }}/> Pengaturan Umum
               </h3>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <div>
                     <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '2px' }}>Kirim Tagihan Otomatis</div>
                     <div style={{ fontSize: '12px', color: 'var(--txt-muted)' }}>Sistem akan membuat tagihan H-7 jatuh tempo</div>
                   </div>
                   <ToggleSwitch initial={true} />
                 </div>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <div>
                     <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '2px' }}>Pemberitahuan WhatsApp</div>
                     <div style={{ fontSize: '12px', color: 'var(--txt-muted)' }}>Kirim pengingat tagihan via WA ke penyewa</div>
                   </div>
                   <ToggleSwitch initial={true} />
                 </div>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <div>
                     <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '2px' }}>Penerimaan Otomatis</div>
                     <div style={{ fontSize: '12px', color: 'var(--txt-muted)' }}>Terima pembayaran midtrans tanpa verifikasi manual</div>
                   </div>
                   <ToggleSwitch initial={false} />
                 </div>
               </div>
             </div>

            <div className="card card--interactive" style={{ borderColor: 'var(--clr-danger)', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.05)' }}>
               <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--clr-danger)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                 <AlertTriangle size={18} /> Zona Berbahaya
               </h3>
               <p style={{ color: 'var(--txt-secondary)', fontSize: '13px', marginBottom: '24px', lineHeight: 1.5 }}>
                 Aksi di bawah ini bersifat permanen dan tidak dapat dibatalkan. Pastikan Anda telah menyelesaikan semua tagihan yang tertunda.
               </p>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                 <button className="btn" style={{ background: 'var(--bg-sunken)', color: 'var(--txt-primary)', border: '1px solid var(--bdr-strong)', justifyContent: 'space-between', padding: '12px 16px' }} onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--clr-warning)'} onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--bdr-strong)'}>
                   <span style={{ fontWeight: 600 }}>Nonaktifkan Properti Sementara</span>
                   <ChevronRight size={16} style={{ color: 'var(--txt-muted)' }} />
                 </button>
                 <button className="btn" style={{ background: 'var(--clr-danger)', color: '#fff', border: 'none', justifyContent: 'space-between', padding: '12px 16px', boxShadow: '0 4px 10px rgba(239,68,68,0.2)' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                   <span style={{ fontWeight: 600 }}>Hapus Properti Permanen</span>
                   <AlertTriangle size={16} style={{ opacity: 0.8 }} />
                 </button>
               </div>
            </div>
          </div>
        )}
      </div>

      {/* MODALS */}
      {isEditPropertyOpen && (
        <div className="modal-overlay" onClick={() => setIsEditPropertyOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const name = formData.get('name') as string;
              const address = formData.get('address') as string;
              const provinceId = formData.get('provinceId') as string;
              const province = formData.get('province') as string;
              const regencyId = formData.get('regencyId') as string;
              const regency = formData.get('regency') as string;
              const districtId = formData.get('districtId') as string;
              const district = formData.get('district') as string;
              const villageId = formData.get('villageId') as string;
              const village = formData.get('village') as string;
              const type = formData.get('type') as string;
              const billingCycle = formData.get('billingCycle') as string;
              const description = formData.get('description') as string;
              const facilities = editFacilities.filter(f => f.trim() !== '');
              const photos = editPhotos.filter(p => p.trim() !== '');
              
              try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/properties/${property.id}`, {
                  method: 'PATCH',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                  },
                  body: JSON.stringify({ 
                    name, 
                    type,
                    billingCycle,
                    address,
                    provinceId, province,
                    regencyId, regency,
                    districtId, district,
                    villageId, village,
                    description, 
                    facilities,
                    photos 
                  })
                });
                if (res.ok) {
                  const updated = await res.json();
                  setProperty(prev => prev ? { ...prev, ...updated } : null);
                  setIsEditPropertyOpen(false);
                  Swal.fire({
                    title: 'Berhasil!',
                    text: 'Data properti berhasil diperbarui.',
                    icon: 'success',
                    confirmButtonColor: 'var(--brand-600)',
                    customClass: { popup: 'rounded-xl' }
                  });
                } else {
                  const errData = await res.json().catch(() => null);
                  Swal.fire({
                    title: 'Gagal',
                    text: errData?.error || 'Gagal menyimpan perubahan properti.',
                    icon: 'error',
                    confirmButtonColor: 'var(--clr-danger)',
                    customClass: { popup: 'rounded-xl' }
                  });
                }
              } catch (err) {
                console.error(err);
                Swal.fire({
                  title: 'Error',
                  text: 'Terjadi kesalahan server.',
                  icon: 'error',
                  confirmButtonColor: 'var(--clr-danger)',
                  customClass: { popup: 'rounded-xl' }
                });
              }
            }}>
              <div className="modal-header">
                <h2>Edit Properti & Galeri</h2>
                <button type="button" className="icon-btn" onClick={() => setIsEditPropertyOpen(false)}>×</button>
              </div>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Nama Properti</label>
                  <input name="name" type="text" className="form-input" defaultValue={property.name} required />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Tipe Properti</label>
                  <select name="type" className="form-input" defaultValue={property.type || 'KOST'} required>
                    <option value="KOST">Kost</option>
                    <option value="KONTRAKAN_PETAK">Kontrakan Petak / Pintu</option>
                    <option value="KONTRAKAN_RUMAH">Kontrakan Rumah Utuh</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Siklus Penagihan</label>
                  <select name="billingCycle" className="form-input" defaultValue={property.billingCycle || 'MONTHLY'} required>
                    <option value="MONTHLY">Bulanan (Umum untuk Kost)</option>
                    <option value="YEARLY">Tahunan (Umum untuk Kontrakan)</option>
                  </select>
                </div>

                <LocationSelect 
                  initialProvinceId={property.provinceId || ''}
                  initialRegencyId={property.regencyId || ''}
                  initialDistrictId={property.districtId || ''}
                  initialVillageId={property.villageId || ''}
                />

                <div className="form-group">
                  <label className="form-label">Detail Alamat (Jalan, RT/RW, No)</label>
                  <textarea name="address" className="form-textarea" rows={2} defaultValue={property.address || ''} required />
                </div>

                <div className="form-group">
                  <label className="form-label">Deskripsi</label>
                  <textarea name="description" className="form-input" rows={3} defaultValue={property.description || ''} />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Fasilitas</span>
                    <span style={{ color: 'var(--brand-600)', fontSize: '13px', cursor: 'pointer' }} 
                          onClick={() => setEditFacilities([...editFacilities, ''])}>
                      + Tambah Fasilitas
                    </span>
                  </label>
                  {editFacilities.map((facility, i) => (
                    <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                      <input type="text" className="form-input" value={facility} 
                             onChange={(e) => {
                               const newFacs = [...editFacilities];
                               newFacs[i] = e.target.value;
                               setEditFacilities(newFacs);
                             }} 
                             style={{ flex: 1 }} placeholder="Contoh: WiFi 50Mbps" required />
                      <button type="button" className="icon-btn" style={{ color: 'var(--clr-danger)' }} 
                              onClick={() => {
                                setEditFacilities(editFacilities.filter((_, idx) => idx !== i));
                              }}>
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  {editFacilities.length === 0 && <p style={{ fontSize: '13px', color: 'var(--txt-muted)', textAlign: 'center', padding: '8px' }}>Belum ada fasilitas.</p>}
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Galeri Foto (URL)</span>
                    <span style={{ color: 'var(--brand-600)', fontSize: '13px', cursor: 'pointer' }} 
                          onClick={() => setEditPhotos([...editPhotos, ''])}>
                      + Tambah URL Foto
                    </span>
                  </label>
                  {editPhotos.map((photo, i) => (
                     <div key={i} style={{ display: 'flex', gap: '12px', marginBottom: '8px', alignItems: 'center' }}>
                        {photo ? (
                          <div style={{ width: '48px', height: '48px', borderRadius: 'var(--r-sm)', background: `url(${photo}) center/cover`, flexShrink: 0 }} />
                        ) : (
                          <div style={{ width: '48px', height: '48px', borderRadius: 'var(--r-sm)', background: 'var(--bg-sunken)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--txt-muted)', fontSize: '10px', flexShrink: 0 }}>No Image</div>
                        )}
                        <input type="text" className="form-input" value={photo} 
                               onChange={(e) => {
                                 const newPhotos = [...editPhotos];
                                 newPhotos[i] = e.target.value;
                                 setEditPhotos(newPhotos);
                               }} 
                               style={{ flex: 1 }} placeholder="https://..." />
                        <button type="button" className="icon-btn" style={{ color: 'var(--clr-danger)' }} 
                                onClick={() => {
                                  setEditPhotos(editPhotos.filter((_, idx) => idx !== i));
                                }}>
                          <X size={14} />
                        </button>
                     </div>
                  ))}
                  {editPhotos.length === 0 && <p style={{ fontSize: '13px', color: 'var(--txt-muted)', textAlign: 'center', padding: '12px' }}>Belum ada foto.</p>}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn--secondary" onClick={() => setIsEditPropertyOpen(false)}>Batal</button>
                <button type="submit" className="btn btn--primary">Simpan Perubahan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditLateFeeOpen && (
        <div className="modal-overlay" onClick={() => setIsEditLateFeeOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const lateFeePct = parseFloat(formData.get('lateFeePct') as string);
              const maxLateFee = parseFloat(formData.get('maxLateFee') as string);
              
              try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/properties/${property.id}`, {
                  method: 'PATCH',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                  },
                  body: JSON.stringify({ lateFeePct, maxLateFee })
                });
                if (res.ok) {
                  const updated = await res.json();
                  setProperty(prev => prev ? { ...prev, ...updated } : null);
                  setIsEditLateFeeOpen(false);
                  Swal.fire({
                    title: 'Berhasil!',
                    text: 'Aturan denda berhasil diperbarui.',
                    icon: 'success',
                    confirmButtonColor: 'var(--brand-600)',
                    customClass: { popup: 'rounded-xl' }
                  });
                } else {
                  Swal.fire({
                    title: 'Gagal',
                    text: 'Gagal menyimpan aturan denda.',
                    icon: 'error',
                    confirmButtonColor: 'var(--clr-danger)',
                    customClass: { popup: 'rounded-xl' }
                  });
                }
              } catch (err) {
                console.error(err);
                Swal.fire({
                  title: 'Error',
                  text: 'Terjadi kesalahan server.',
                  icon: 'error',
                  confirmButtonColor: 'var(--clr-danger)',
                  customClass: { popup: 'rounded-xl' }
                });
              }
            }}>
              <div className="modal-header">
                <h2>Ubah Aturan Denda</h2>
                <button type="button" className="icon-btn" onClick={() => setIsEditLateFeeOpen(false)}>×</button>
              </div>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Persentase Denda (%) per periode</label>
                  <input name="lateFeePct" type="number" className="form-input" defaultValue={property.lateFeePct} step="0.1" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Batas Maksimal Denda (%)</label>
                  <input name="maxLateFee" type="number" className="form-input" defaultValue={property.maxLateFee} step="0.1" required />
                  <span style={{ fontSize: '12px', color: 'var(--txt-muted)', marginTop: '4px' }}>Denda akan berhenti bertambah jika sudah mencapai batas ini.</span>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn--secondary" onClick={() => setIsEditLateFeeOpen(false)}>Batal</button>
                <button type="submit" className="btn btn--primary">Simpan Aturan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isRoomModalOpen && (
        <div className="modal-overlay" onClick={() => setIsRoomModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <form onSubmit={handleSaveRoom}>
              <div className="modal-header">
                <h2>{editRoomData ? 'Edit Kamar' : 'Tambah Kamar Baru'}</h2>
                <button type="button" className="icon-btn" onClick={() => setIsRoomModalOpen(false)}>×</button>
              </div>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                    <label className="form-label">Harga ({isKontrakan ? 'Per Tahun' : 'Per Bulan'})</label>
                    <input name="price" type="number" className="form-input" defaultValue={editRoomData?.price || ''} placeholder="1500000" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Uang Jaminan (Deposit)</label>
                    <input name="depositAmount" type="number" className="form-input" defaultValue={editRoomData?.depositAmount || 0} required />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Lantai</label>
                  <input name="floor" type="number" className="form-input" defaultValue={editRoomData?.floor || 1} min="1" required />
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

      <ConfirmDialog
        isOpen={!!deleteRoomId}
        title="Hapus Kamar?"
        message="Data kamar yang dihapus tidak dapat dikembalikan."
        onConfirm={confirmDeleteRoom}
        onCancel={() => setDeleteRoomId(null)}
        isLoading={isDeleting}
      />
    </AppLayout>
  );
}
