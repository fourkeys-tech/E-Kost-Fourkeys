import dotenv from 'dotenv';
dotenv.config();
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Memulai proses seeding database...');

  // Bersihkan data lama
  await prisma.payment.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.tenant.deleteMany();
  await prisma.room.deleteMany();
  await prisma.propertyAdmin.deleteMany();
  await prisma.property.deleteMany();
  await prisma.user.deleteMany();

  console.log('Data lama berhasil dihapus.');

  // ==========================================
  // 1. Buat Pengguna (Users)
  // ==========================================
  const defaultPassword = await bcrypt.hash('Password123!', 12);

  const owner = await prisma.user.create({
    data: {
      name: 'Bapak Kost (Owner)',
      email: 'owner@kostpay.id',
      passwordHash: defaultPassword,
      role: 'OWNER',
      phone: '081234567890',
    }
  });

  const admin = await prisma.user.create({
    data: {
      name: 'Mas Admin',
      email: 'admin@kostpay.id',
      passwordHash: defaultPassword,
      role: 'ADMIN',
      phone: '081298765432',
    }
  });

  const tenantUser1 = await prisma.user.create({
    data: {
      name: 'Andi Penyewa',
      email: 'andi@kostpay.id',
      passwordHash: defaultPassword,
      role: 'TENANT',
      phone: '085611112222',
    }
  });

  const tenantUser2 = await prisma.user.create({
    data: {
      name: 'Budi Penghuni',
      email: 'budi@kostpay.id',
      passwordHash: defaultPassword,
      role: 'TENANT',
      phone: '085633334444',
    }
  });

  console.log('✅ Users berhasil dibuat.');

  // ==========================================
  // 2. Buat Properti (Master Data)
  // ==========================================
  const property = await prisma.property.create({
    data: {
      ownerId: owner.id,
      name: 'Kost Eksklusif Melati',
      address: 'Jl. Melati Putih No. 12, Kebayoran Baru, Jakarta Selatan',
      description: 'Kost nyaman, aman, dan bersih di pusat kota. Dekat dengan stasiun MRT dan pusat perbelanjaan.',
      facilities: JSON.stringify(['WiFi 50Mbps', 'Dapur Bersama', 'Parkir Motor & Mobil', 'Keamanan 24 Jam', 'CCTV', 'Ruang Santai']),
      photos: JSON.stringify(['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=800&auto=format&fit=crop']),
      lateFeePct: 2.0,
      maxLateFee: 10.0,
      isActive: true,
    }
  });

  // Hubungkan Admin ke Properti
  await prisma.propertyAdmin.create({
    data: {
      propertyId: property.id,
      userId: admin.id
    }
  });

  const propertyMawar = await prisma.property.create({
    data: {
      ownerId: owner.id,
      name: 'Kontrakan Mawar Residence',
      address: 'Jl. Mawar Raya No. 42, Jakarta Selatan',
      description: 'Kontrakan 2 lantai, cocok untuk keluarga kecil. Akses mobil masuk dan bebas banjir.',
      facilities: JSON.stringify(['WiFi 20Mbps', 'Parkir Mobil', 'Dapur Pribadi', 'Kamar Mandi Dalam']),
      photos: JSON.stringify([]),
      lateFeePct: 2.0,
      maxLateFee: 10.0,
      isActive: true,
    }
  });

  console.log('✅ Properti berhasil dibuat.');

  // ==========================================
  // 3. Buat Kamar (Rooms)
  // ==========================================
  const standardFacilities = JSON.stringify(['Kasur Single', 'Lemari', 'Kipas Angin', 'Kamar Mandi Luar']);
  const vipFacilities = JSON.stringify(['Kasur Double', 'Lemari Besar', 'AC', 'Kamar Mandi Dalam', 'Meja Kerja', 'Water Heater']);

  const room101 = await prisma.room.create({
    data: {
      propertyId: property.id, roomNumber: '101', type: 'VIP', price: 2500000, floor: 1, status: 'OCCUPIED',
      facilities: vipFacilities,
      description: 'Kamar luas dengan pencahayaan alami yang sangat baik.'
    }
  });

  const room102 = await prisma.room.create({
    data: {
      propertyId: property.id, roomNumber: '102', type: 'VIP', price: 2500000, floor: 1, status: 'OCCUPIED',
      facilities: vipFacilities,
    }
  });

  await prisma.room.create({
    data: {
      propertyId: property.id, roomNumber: '201', type: 'Standard', price: 1500000, floor: 2, status: 'EMPTY',
      facilities: standardFacilities,
    }
  });

  await prisma.room.create({
    data: {
      propertyId: property.id, roomNumber: '202', type: 'Standard', price: 1500000, floor: 2, status: 'MAINTENANCE',
      facilities: standardFacilities,
      description: 'Sedang ada perbaikan AC dan pengecatan ulang.'
    }
  });

  // Kamar untuk Kontrakan Mawar Residence
  const mawarFacilities = JSON.stringify(['Kasur King', 'Lemari', 'AC', 'Kamar Mandi Dalam', 'Dapur Kecil', 'Ruang Tamu Mini']);
  await prisma.room.create({
    data: {
      propertyId: propertyMawar.id, roomNumber: 'A1', type: 'Paviliun', price: 3500000, floor: 1, status: 'EMPTY',
      facilities: mawarFacilities,
      description: 'Cocok untuk keluarga kecil.'
    }
  });

  await prisma.room.create({
    data: {
      propertyId: propertyMawar.id, roomNumber: 'A2', type: 'Paviliun', price: 3500000, floor: 1, status: 'EMPTY',
      facilities: mawarFacilities,
    }
  });

  console.log('✅ Kamar berhasil dibuat.');

  // ==========================================
  // 4. Buat Profil Penyewa (Tenants)
  // ==========================================
  const tenantProfile1 = await prisma.tenant.create({
    data: {
      userId: tenantUser1.id,
      phone: tenantUser1.phone,
      idCardNumber: '3171234567890001',
      emergencyContact: '081199998888 (Ayah)',
    }
  });

  const tenantProfile2 = await prisma.tenant.create({
    data: {
      userId: tenantUser2.id,
      phone: tenantUser2.phone,
      idCardNumber: '3179876543210002',
      emergencyContact: '081177776666 (Ibu)',
    }
  });

  console.log('✅ Profil Penyewa berhasil dibuat.');

  // ==========================================
  // 5. Buat Kontrak & Tagihan (Contracts & Invoices)
  // ==========================================
  const today = new Date();
  
  // Kontrak Andi (Berjalan normal, Tagihan sudah dibayar bulan ini)
  const contractAndi = await prisma.contract.create({
    data: {
      tenantId: tenantProfile1.id,
      roomId: room101.id,
      startDate: new Date(today.getFullYear(), today.getMonth() - 2, 5), // Mulai 2 bulan lalu
      durationMonths: 6,
      rentAmount: room101.price,
      deposit: 1000000,
      dueDay: 5,
      notes: 'Penyewa membawa hewan peliharaan kecil (kucing).',
      isActive: true,
    }
  });

  // Tagihan bulan lalu (LUNAS)
  const invoiceAndiLastMonth = await prisma.invoice.create({
    data: {
      contractId: contractAndi.id,
      period: `${today.getFullYear()}-${String(today.getMonth()).padStart(2, '0')}`,
      amount: contractAndi.rentAmount,
      totalAmount: contractAndi.rentAmount,
      paidAmount: contractAndi.rentAmount,
      status: 'PAID',
      dueDate: new Date(today.getFullYear(), today.getMonth() - 1, 5),
      paidAt: new Date(today.getFullYear(), today.getMonth() - 1, 4),
    }
  });

  const paymentAndi = await prisma.payment.create({
    data: {
      contractId: contractAndi.id,
      method: 'MIDTRANS',
      amount: contractAndi.rentAmount,
      status: 'VERIFIED',
      verifiedAt: new Date(today.getFullYear(), today.getMonth() - 1, 4),
    }
  });

  await prisma.paymentAllocation.create({
    data: {
      paymentId: paymentAndi.id,
      invoiceId: invoiceAndiLastMonth.id,
      amount: contractAndi.rentAmount,
    }
  });

  // Kontrak Budi (Baru mulai, Tagihan bulan ini tertunggak / Overdue)
  const contractBudi = await prisma.contract.create({
    data: {
      tenantId: tenantProfile2.id,
      roomId: room102.id,
      startDate: new Date(today.getFullYear(), today.getMonth(), 1), // Mulai awal bulan ini
      durationMonths: 12,
      rentAmount: room102.price,
      deposit: 2000000,
      dueDay: 1,
      isActive: true,
    }
  });

  // Tagihan Budi (TENGGAT WAKTU/OVERDUE karena tanggal 1 sudah lewat)
  await prisma.invoice.create({
    data: {
      contractId: contractBudi.id,
      period: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`,
      amount: contractBudi.rentAmount,
      lateFee: 50000, // Kena denda 50rb
      totalAmount: contractBudi.rentAmount + 50000,
      status: 'OVERDUE',
      dueDate: new Date(today.getFullYear(), today.getMonth(), 1),
      notes: 'Telat membayar bulan pertama.',
    }
  });

  console.log('✅ Kontrak dan Tagihan simulasi berhasil dibuat.');
  console.log('🎉 Seeding Database Selesai!\n');
  console.log('=== Kredensial Login ===');
  console.log('Owner  : owner@kostpay.id / Password123!');
  console.log('Admin  : admin@kostpay.id / Password123!');
  console.log('Tenant : andi@kostpay.id  / Password123!');
}

main()
  .catch((e) => {
    console.error('❌ Gagal melakukan seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
