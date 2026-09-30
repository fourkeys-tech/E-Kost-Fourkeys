# KostPay — Sistem Informasi Pembayaran Kost & Kontrakan

KostPay adalah sistem informasi berbasis web yang membantu pemilik kost/kontrakan mengelola unit hunian, penyewa, tagihan, dan pembayaran secara digital.

## 🚀 Fitur Utama

- **Tagihan Otomatis**: Generate tagihan H-7 sebelum jatuh tempo.
- **Pembayaran Fleksibel**: Mendukung transfer manual (upload bukti) dan integrasi Midtrans.
- **Notifikasi**: Reminder otomatis via Email dan WhatsApp.
- **Dashboard & Laporan**: Pantau okupansi, tunggakan, dan export laporan keuangan.
- **Multi-Properti**: Kelola banyak kost/kontrakan dalam satu akun.
- **Modern UI**: Mendukung Dark Mode dan Light Mode yang responsif.

## 🛠️ Tech Stack

### Frontend
- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- Recharts (untuk grafik)
- Lucide React (untuk ikon)

### Backend
- Express.js
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT Authentication

## 📦 Panduan Instalasi Lokal

### Prasyarat
- Node.js v20+
- PostgreSQL yang sedang berjalan

### 1. Setup Backend

```bash
cd backend
npm install

# Buat file .env (lihat .env.example atau gunakan default dari instalasi)
# Pastikan DATABASE_URL sesuai dengan database PostgreSQL lokal Anda

# Setup database dan jalankan seed data
npm run db:push
npm run db:seed

# Jalankan server development
npm run dev
```

### 2. Setup Frontend

```bash
cd frontend
npm install

# Jalankan server development
npm run dev
```

### 3. Akun Demo

Aplikasi dapat diakses di `http://localhost:3000`. Gunakan akun demo berikut untuk mencoba sistem:

- **Super Admin**: superadmin@kostpay.id / Admin123!
- **Owner**: owner@kostpay.id / Owner123!
- **Admin**: admin@kostpay.id / Admin123!
- **Tenant 1**: tenant1@kostpay.id / Tenant123!
- **Tenant 2**: tenant2@kostpay.id / Tenant123!

## 📄 Struktur Direktori

- `/backend`: Kode sumber Express API, script Prisma, dan cron jobs.
- `/frontend`: Kode sumber Next.js, komponen UI, dan hooks.
- `PRD_Sistem_Pembayaran_Kost.md`: Dokumen Product Requirements.
