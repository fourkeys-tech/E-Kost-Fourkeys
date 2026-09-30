import dotenv from "dotenv";
dotenv.config();
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Menambahkan 10 kamar kosong (Kost & Kontrakan)...");

  let owner = await prisma.user.findFirst({ where: { role: "OWNER" } });
  if (!owner) {
    const defaultPassword = await bcrypt.hash("Password123!", 12);
    owner = await prisma.user.create({
      data: {
        name: "Bapak Kost (Owner)",
        email: "owner@kostpay.id",
        passwordHash: defaultPassword,
        role: "OWNER",
        phone: "081234567890",
      }
    });
  }

  // --- PROPERTI 1: KOST ---
  const propKost1 = await prisma.property.create({
    data: {
      ownerId: owner.id,
      name: "Kost Griya Asri Sleman",
      address: "Jl. Kaliurang KM 12 No. 5",
      province: "Daerah Istimewa Yogyakarta", provinceId: "34",
      regency: "Kabupaten Sleman", regencyId: "3404",
      district: "Ngaglik", districtId: "3404060",
      village: "Sardonoharjo", villageId: "3404060006",
      description: "Kost nyaman dekat UGM dan UNY. WiFi cepat, bebas banjir, keamanan 24 jam.",
      facilities: JSON.stringify(["WiFi 50Mbps", "Parkir Motor", "CCTV", "Keamanan 24 Jam", "Dapur Bersama"]),
      photos: JSON.stringify(["https://images.unsplash.com/photo-1555854877-bab0e564b8d5?q=80&w=800&auto=format&fit=crop"]),
      type: "KOST", lateFeePct: 2.0, maxLateFee: 10.0, isActive: true,
    }
  });

  await prisma.room.create({ data: { propertyId: propKost1.id, roomNumber: "101", type: "Standard", price: 750000, floor: 1, status: "EMPTY", facilities: JSON.stringify(["Kasur Single", "Lemari", "Meja Belajar", "Kipas Angin", "Kamar Mandi Luar"]), description: "Kamar menghadap taman, sejuk dan tenang.", photos: JSON.stringify(["https://images.unsplash.com/photo-1631049307264-da0ec9d70304?q=80&w=800&auto=format&fit=crop"]) } });
  await prisma.room.create({ data: { propertyId: propKost1.id, roomNumber: "102", type: "VIP", price: 1200000, floor: 1, status: "EMPTY", facilities: JSON.stringify(["Kasur Double", "Lemari Besar", "AC", "Kamar Mandi Dalam", "Water Heater", "Meja Kerja"]), description: "Kamar VIP ber-AC dengan kamar mandi dalam.", photos: JSON.stringify(["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=800&auto=format&fit=crop"]) } });
  await prisma.room.create({ data: { propertyId: propKost1.id, roomNumber: "201", type: "Standard", price: 750000, floor: 2, status: "EMPTY", facilities: JSON.stringify(["Kasur Single", "Lemari", "Kipas Angin", "Kamar Mandi Luar"]), description: "Kamar lantai 2, view jalan utama." } });
  await prisma.room.create({ data: { propertyId: propKost1.id, roomNumber: "202", type: "VIP", price: 1200000, floor: 2, status: "EMPTY", facilities: JSON.stringify(["Kasur Double", "Lemari Besar", "AC", "Kamar Mandi Dalam", "Water Heater"]), description: "Kamar VIP lantai 2, termasuk listrik dan air." } });
  console.log("4 kamar KOST ditambahkan - Kost Griya Asri Sleman (Sleman, DIY)");

  // --- PROPERTI 2: KONTRAKAN PETAK ---
  const propKontrakan1 = await prisma.property.create({
    data: {
      ownerId: owner.id,
      name: "Kontrakan Petak Maju Jaya",
      address: "Jl. Raya Ciledug Gang Anggrek No. 7",
      province: "Banten", provinceId: "36",
      regency: "Kota Tangerang", regencyId: "3671",
      district: "Ciledug", districtId: "3671010",
      village: "Parung Serab", villageId: "3671010001",
      description: "Kontrakan petak baru renovasi. Strategis, dekat pasar dan akses tol.",
      facilities: JSON.stringify(["Listrik PLN", "Air PAM", "Parkir Motor", "Jalan Aspal"]),
      photos: JSON.stringify(["https://images.unsplash.com/photo-1580587771525-78b9dba3b914?q=80&w=800&auto=format&fit=crop"]),
      type: "KONTRAKAN_PETAK", lateFeePct: 2.0, maxLateFee: 10.0, isActive: true,
    }
  });

  await prisma.room.create({ data: { propertyId: propKontrakan1.id, roomNumber: "B1", type: "Petak", price: 1800000, floor: 1, status: "EMPTY", facilities: JSON.stringify(["1 Kamar Tidur", "Ruang Tamu", "Dapur", "Kamar Mandi", "Teras"]), description: "Unit pojok dengan teras luas dan udara segar.", photos: JSON.stringify(["https://images.unsplash.com/photo-1484154218962-a197022b5858?q=80&w=800&auto=format&fit=crop"]) } });
  await prisma.room.create({ data: { propertyId: propKontrakan1.id, roomNumber: "B2", type: "Petak", price: 1800000, floor: 1, status: "EMPTY", facilities: JSON.stringify(["1 Kamar Tidur", "Ruang Tamu", "Dapur", "Kamar Mandi"]), description: "Unit tengah, baru dicat ulang. Siap huni." } });
  await prisma.room.create({ data: { propertyId: propKontrakan1.id, roomNumber: "B3", type: "Petak Plus", price: 2200000, floor: 1, status: "EMPTY", facilities: JSON.stringify(["2 Kamar Tidur", "Ruang Tamu", "Dapur", "Kamar Mandi", "Gudang Kecil"]), description: "Unit Plus dengan 2 kamar tidur, cocok pasangan muda.", photos: JSON.stringify(["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=800&auto=format&fit=crop"]) } });
  console.log("3 unit KONTRAKAN PETAK ditambahkan - Ciledug, Tangerang");

  // --- PROPERTI 3: KONTRAKAN RUMAH ---
  const propRumah = await prisma.property.create({
    data: {
      ownerId: owner.id,
      name: "Kontrakan Rumah Bandung Indah",
      address: "Jl. Dipatiukur No. 34, Coblong",
      province: "Jawa Barat", provinceId: "32",
      regency: "Kota Bandung", regencyId: "3273",
      district: "Coblong", districtId: "3273030",
      village: "Lebakgede", villageId: "3273030006",
      description: "Rumah utuh 2 lantai di Bandung. Dekat ITB dan pusat kota.",
      facilities: JSON.stringify(["WiFi 100Mbps", "Garasi Mobil", "Halaman", "Dapur Lengkap", "Ruang Keluarga", "AC 3 Unit"]),
      photos: JSON.stringify(["https://images.unsplash.com/photo-1568605114967-8130f3a36994?q=80&w=800&auto=format&fit=crop"]),
      type: "KONTRAKAN_RUMAH", lateFeePct: 2.0, maxLateFee: 10.0, isActive: true,
    }
  });

  await prisma.room.create({ data: { propertyId: propRumah.id, roomNumber: "Rumah Utuh", type: "Rumah 2 Lantai", price: 8500000, floor: 1, status: "EMPTY", facilities: JSON.stringify(["3 Kamar Tidur", "Ruang Tamu", "Ruang Keluarga", "Dapur", "2 Kamar Mandi", "Garasi", "Halaman", "AC", "Water Heater"]), description: "Rumah 2 lantai, 3 kamar tidur. Harga termasuk air dan listrik token.", photos: JSON.stringify(["https://images.unsplash.com/photo-1568605114967-8130f3a36994?q=80&w=800&auto=format&fit=crop"]) } });
  console.log("1 KONTRAKAN RUMAH ditambahkan - Coblong, Bandung");

  // --- PROPERTI 4: KOST (2 kamar tambahan) ---
  const propKost2 = await prisma.property.create({
    data: {
      ownerId: owner.id,
      name: "Kost Mahasiswa Depok",
      address: "Jl. Margonda Raya Gang Mawar No. 22",
      province: "Jawa Barat", provinceId: "32",
      regency: "Kota Depok", regencyId: "3276",
      district: "Beji", districtId: "3276010",
      village: "Kemiri Muka", villageId: "3276010003",
      description: "Kost dekat Universitas Indonesia dan stasiun Depok. Harga terjangkau.",
      facilities: JSON.stringify(["WiFi 30Mbps", "Parkir Motor", "Dapur Bersama", "Mesin Cuci", "CCTV"]),
      photos: JSON.stringify(["https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?q=80&w=800&auto=format&fit=crop"]),
      type: "KOST", lateFeePct: 2.0, maxLateFee: 10.0, isActive: true,
    }
  });

  await prisma.room.create({ data: { propertyId: propKost2.id, roomNumber: "A1", type: "Standard", price: 850000, floor: 1, status: "EMPTY", facilities: JSON.stringify(["Kasur Single", "Lemari", "Meja Belajar", "Kipas Angin", "Kamar Mandi Luar"]), description: "Kamar terang dan bersih, termasuk tagihan air.", photos: JSON.stringify(["https://images.unsplash.com/photo-1599619351208-3e6c839d6828?q=80&w=800&auto=format&fit=crop"]) } });
  await prisma.room.create({ data: { propertyId: propKost2.id, roomNumber: "A2", type: "AC", price: 1100000, floor: 1, status: "EMPTY", facilities: JSON.stringify(["Kasur Single", "Lemari", "AC", "Meja Belajar", "Kamar Mandi Luar"]), description: "Kamar ber-AC, cocok untuk belajar intensif." } });
  console.log("2 kamar KOST ditambahkan - Kost Mahasiswa Depok (Depok, Jabar)");

  console.log("\nSelesai! 10 kamar/unit kosong berhasil ditambahkan:");
  console.log("  KOST Sleman       : 4 kamar (Rp750rb - Rp1.2jt/bulan)");
  console.log("  KONTRAKAN PETAK   : 3 unit  (Rp1.8jt - Rp2.2jt/bulan)");
  console.log("  KONTRAKAN RUMAH   : 1 rumah (Rp8.5jt/bulan)");
  console.log("  KOST Depok        : 2 kamar (Rp850rb - Rp1.1jt/bulan)");
}

main()
  .catch((e) => {
    console.error("Gagal:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
