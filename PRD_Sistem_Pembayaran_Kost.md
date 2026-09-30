# Product Requirements Document (PRD)
# Sistem Informasi Pembayaran Kontrakan / Kost-Kostan

| Atribut | Detail |
|---|---|
| Nama Produk | KostPay — Sistem Informasi Pembayaran Kost & Kontrakan |
| Versi Dokumen | 1.0 |
| Tanggal | 6 Agustus 2026 |
| Status | Draft untuk Review |
| Pemilik Dokumen | Product Manager |

---

## 1. Ringkasan Eksekutif

KostPay adalah sistem informasi berbasis web yang membantu pemilik kost/kontrakan mengelola unit hunian, penyewa, tagihan, dan pembayaran secara digital. Sistem menggantikan pencatatan manual (buku/Excel/WhatsApp) dengan platform terpusat yang otomatis menghasilkan tagihan bulanan, melacak status pembayaran, mengirim pengingat, dan menyediakan laporan keuangan.

Frontend dibangun dengan **Next.js** (App Router) untuk pengalaman yang cepat dan SEO-friendly pada landing page publik, sementara backend menggunakan **Express.js** sebagai REST API yang menangani logika bisnis, autentikasi, dan integrasi payment gateway. Desain UI/UX mengutamakan tampilan modern, bersih, dan profesional dengan dukungan penuh **dark mode & light mode**.

---

## 2. Latar Belakang & Masalah

Pemilik kost/kontrakan skala kecil-menengah umumnya masih:
- Mencatat pembayaran secara manual di buku atau spreadsheet, rawan human error dan kehilangan data.
- Mengingatkan penyewa yang telat bayar lewat chat pribadi, tidak konsisten dan sulit dilacak.
- Tidak punya laporan keuangan otomatis (pemasukan bulanan, tunggakan, okupansi kamar).
- Penyewa tidak punya bukti pembayaran digital atau riwayat tagihan yang mudah diakses.

**Peluang:** Membangun sistem yang mendigitalisasi seluruh siklus penagihan—dari pembuatan tagihan otomatis, pembayaran online, konfirmasi, hingga pelaporan—sehingga mengurangi beban administratif pemilik dan meningkatkan transparansi bagi penyewa.

---

## 3. Tujuan Produk

1. Mengotomatisasi pembuatan tagihan bulanan berdasarkan siklus sewa tiap kamar/unit.
2. Menyediakan kanal pembayaran fleksibel: transfer manual (upload bukti) dan pembayaran online otomatis via **Midtrans** (VA, e-wallet, QRIS), dengan konfirmasi otomatis/manual sesuai metode.
3. Memberi visibilitas real-time atas status pembayaran, tunggakan, dan okupansi kamar.
4. Mengirim pengingat otomatis (email/WhatsApp) sebelum dan sesudah jatuh tempo.
5. Menyediakan laporan keuangan sederhana yang bisa diunduh (PDF/Excel).
6. Menghadirkan pengalaman pengguna yang profesional, responsif, dan nyaman digunakan siang/malam (dark & light mode).

### Success Metrics (KPI)
| Metrik | Target |
|---|---|
| Adopsi: jumlah pemilik kost aktif bulanan | Baseline + 20% per kuartal (pasca-launch) |
| Waktu pembuatan tagihan bulanan | < 1 menit (otomatis, dari manual ~30 menit) |
| Tingkat keterlambatan bayar | Turun ≥ 15% dalam 3 bulan pertama pemakaian |
| Tiket dukungan terkait rekonsiliasi pembayaran | Turun ≥ 30% |
| Waktu muat halaman (LCP) | < 2.5 detik |

---

## 4. Ruang Lingkup

### 4.1 In-Scope (Versi 1.0)
- Manajemen properti, kamar/unit, dan tipe kamar.
- Manajemen data penyewa & kontrak sewa (mulai, durasi, harga, deposit).
- Generate tagihan otomatis (bulanan/berdasarkan siklus sewa).
- Pembayaran dengan **2 metode**: (1) **Manual** — transfer bank lalu unggah bukti transfer; (2) **Midtrans** — pembayaran online otomatis (VA, e-wallet, QRIS, kartu kredit sesuai channel yang diaktifkan di akun Midtrans).
- Verifikasi pembayaran: **otomatis** untuk transaksi via Midtrans (melalui webhook), **manual** oleh admin/pemilik untuk transfer manual.
- Notifikasi email & WhatsApp (pengingat jatuh tempo, konfirmasi bayar).
- Dashboard pemilik: ringkasan pendapatan, okupansi, tunggakan.
- Dashboard penyewa: riwayat tagihan, status pembayaran, unggah bukti bayar.
- Laporan keuangan (export PDF/Excel).
- Manajemen role & multi-properti (1 pemilik bisa kelola beberapa kost).
- Mode tampilan Dark & Light dengan preferensi tersimpan per pengguna.

### 4.2 Out of Scope (Versi 1.0 — dipertimbangkan untuk fase berikutnya)
- Aplikasi mobile native (iOS/Android) — versi 1.0 fokus web responsif.
- Marketplace pencarian kost publik.
- Modul akuntansi penuh (pajak, buku besar).
- Chat real-time antar pemilik-penyewa.
- Integrasi smart lock / IoT.

---

## 5. Target Pengguna & Peran (Roles)

| Role | Deskripsi | Akses Utama |
|---|---|---|
| **Super Admin** (Pemilik Platform) | Mengelola seluruh tenant/pemilik kost yang mendaftar | Manajemen akun pemilik, monitoring sistem |
| **Owner (Pemilik Kost)** | Pemilik satu atau beberapa properti kost/kontrakan | Kelola properti, kamar, penyewa, tagihan, laporan |
| **Admin/Pengelola** | Staf yang diberi akses oleh Owner untuk operasional harian | Kelola tagihan, verifikasi pembayaran, kelola penyewa |
| **Penyewa (Tenant)** | Penghuni kost/kontrakan | Lihat tagihan, bayar online, unggah bukti bayar, riwayat |

---

## 6. Kebutuhan Fungsional (User Stories)

### 6.1 Manajemen Properti & Kamar
- Sebagai **Owner**, saya dapat menambahkan properti baru (nama, alamat, foto, fasilitas).
- Sebagai **Owner**, saya dapat menambahkan kamar/unit dengan tipe, harga sewa, status (kosong/terisi/maintenance).
- Sebagai **Owner**, saya dapat melihat denah/daftar kamar dalam bentuk grid dengan indikator warna status.

### 6.2 Manajemen Penyewa & Kontrak
- Sebagai **Admin**, saya dapat mendaftarkan penyewa baru dan menautkannya ke kamar tertentu.
- Sebagai **Admin**, saya dapat mencatat detail kontrak: tanggal mulai, durasi, nominal sewa, deposit, tanggal jatuh tempo tiap bulan.
- Sebagai **Admin**, saya dapat memperbarui atau mengakhiri kontrak (check-out) dan otomatis mengubah status kamar menjadi kosong.

### 6.3 Tagihan & Pembayaran
- Sistem **otomatis** membuat tagihan (invoice) H-7 sebelum tanggal jatuh tempo setiap bulan.
- Sebagai **Penyewa**, saya dapat melihat tagihan aktif beserta rincian (sewa, denda telat, biaya tambahan).
- Sebagai **Penyewa**, saya dapat memilih metode pembayaran saat membayar tagihan:
  - **Manual** — transfer ke rekening yang ditentukan Owner, lalu unggah bukti transfer (foto/screenshot) melalui aplikasi.
  - **Midtrans** — klik "Bayar Sekarang", diarahkan ke halaman Midtrans Snap untuk membayar via VA/e-wallet/QRIS/kartu, status ter-update otomatis setelah pembayaran berhasil.
- Sebagai **Admin**, saya dapat memverifikasi pembayaran **manual** (approve/reject dengan catatan) melalui daftar "Menunggu Verifikasi".
- Sistem otomatis menandai tagihan **lunas** saat pembayaran **Midtrans** berhasil (via webhook `payment_notification`), tanpa perlu verifikasi manual.
- Sistem otomatis menghitung **denda keterlambatan** sesuai aturan yang dikonfigurasi Owner, berlaku untuk kedua metode pembayaran.

### 6.4 Notifikasi
- Sistem mengirim reminder H-3 dan H-1 sebelum jatuh tempo (email + WhatsApp, opsional).
- Sistem mengirim notifikasi saat tagihan baru terbit dan saat pembayaran terverifikasi.
- Sistem mengirim notifikasi ke Owner saat ada pembayaran manual menunggu verifikasi.

### 6.5 Dashboard & Laporan
- Sebagai **Owner**, saya dapat melihat ringkasan: total pendapatan bulan berjalan, jumlah tunggakan, tingkat okupansi.
- Sebagai **Owner**, saya dapat mengunduh laporan keuangan bulanan (PDF/Excel) per properti atau gabungan.
- Sebagai **Owner**, saya dapat melihat grafik tren pendapatan 6–12 bulan terakhir.

### 6.6 Pengaturan Akun & Tampilan
- Sebagai **Pengguna**, saya dapat beralih antara mode terang dan gelap; preferensi tersimpan otomatis.
- Sebagai **Pengguna**, saya dapat mengelola profil, ubah password, dan preferensi notifikasi.

---

## 7. Arsitektur Sistem & Tech Stack

### 7.1 Diagram Arsitektur (Deskriptif)

```
┌────────────────────┐         ┌─────────────────────┐        ┌───────────────────┐
│   Next.js (Web)     │  HTTPS  │   Express.js (API)   │  ORM   │   PostgreSQL DB    │
│  - App Router        │ ──────▶ │  - REST API           │ ─────▶ │  - Tenants          │
│  - SSR/ISR untuk     │ ◀────── │  - Auth (JWT)         │ ◀───── │  - Properti/Kamar   │
│    landing & SEO     │         │  - Business Logic     │        │  - Penyewa/Kontrak  │
│  - CSR untuk         │         │  - Cron Jobs          │        │  - Tagihan/Payment  │
│    dashboard         │         │    (generate tagihan, │        └───────────────────┘
│  - Dark/Light theme  │         │     reminder)         │
└────────────────────┘         └──────────┬───────────┘
                                            │
                          ┌─────────────────┼─────────────────┐
                          ▼                 ▼                 ▼
                ┌──────────────┐  ┌────────────────┐  ┌──────────────┐
                │ Midtrans     │  │ Notification    │  │ File Storage │
                │ (Payment     │  │ Service          │  │ (S3/Cloud    │
                │  Gateway:    │  │ (Email: Resend/  │  │  Storage)    │
                │  VA/e-wallet/│  │  WA: Fonnte/     │  │  bukti bayar,│
                │  QRIS)       │  │  WA Business API)│  │  foto kamar  │
                └──────────────┘  └────────────────┘  └──────────────┘
```
> Catatan: selain jalur Midtrans di atas, tersedia jalur **pembayaran manual** — penyewa mengunggah bukti transfer langsung ke *File Storage*, tanpa melalui Midtrans, lalu menunggu verifikasi Admin/Owner.

### 7.2 Tech Stack

| Layer | Teknologi | Keterangan |
|---|---|---|
| Frontend | **Next.js 15 (App Router)** + TypeScript | SSR untuk halaman publik, CSR untuk dashboard |
| Styling | Tailwind CSS + shadcn/ui | Mendukung theming dark/light via CSS variables |
| State Management | React Query (TanStack Query) + Zustand | Data fetching/cache & state UI ringan |
| Backend | **Express.js** + TypeScript | REST API, middleware modular |
| Autentikasi | JWT (access + refresh token), bcrypt untuk hash password | Role-based access control (RBAC) |
| Database | PostgreSQL | Relasional, cocok untuk data transaksi keuangan |
| ORM | Prisma | Migrasi & type-safety schema |
| Payment Gateway | **Midtrans** (Snap API) | VA, e-wallet, QRIS, webhook otomatis untuk update status pembayaran |
| Pembayaran Manual | Upload bukti transfer (form + file storage) | Alur fallback tanpa biaya gateway, diverifikasi manual oleh Admin/Owner |
| Notifikasi | Resend/Nodemailer (email), Fonnte/WA Business API (WhatsApp) | Reminder & konfirmasi |
| File Storage | AWS S3 / Cloudflare R2 | Bukti transfer, foto kamar/properti |
| Job Scheduler | node-cron / BullMQ + Redis | Generate tagihan otomatis, reminder terjadwal |
| Hosting | Vercel (frontend), Railway/Render/VPS (backend + worker) | Deployment terpisah FE/BE |
| Monitoring | Sentry (error tracking), Vercel Analytics | Observability |

---

## 8. Skema Database (Ringkasan Entitas)

| Entitas | Field Kunci |
|---|---|
| `users` | id, name, email, password_hash, role, theme_preference |
| `properties` | id, owner_id, name, address, facilities, photos |
| `rooms` | id, property_id, room_number, type, price, status |
| `tenants` | id, user_id, room_id, phone, id_card_number |
| `contracts` | id, tenant_id, room_id, start_date, duration_months, rent_amount, deposit, due_day |
| `invoices` | id, contract_id, period, amount, late_fee, status, due_date |
| `payments` | id, invoice_id, method, amount, proof_url, verified_by, verified_at, status |
| `notifications` | id, user_id, type, channel, message, sent_at, status |

**Relasi utama:** `properties` 1—N `rooms`; `rooms` 1—N `contracts`; `contracts` 1—N `invoices`; `invoices` 1—N `payments`.

---

## 9. Ringkasan API (Express REST)

| Method | Endpoint | Deskripsi |
|---|---|---|
| POST | `/api/auth/login` | Login pengguna, mengembalikan JWT |
| POST | `/api/auth/register` | Registrasi Owner baru |
| GET | `/api/properties` | List properti milik Owner |
| POST | `/api/properties` | Tambah properti baru |
| GET | `/api/rooms?propertyId=` | List kamar dalam properti |
| POST | `/api/tenants` | Daftarkan penyewa baru |
| POST | `/api/contracts` | Buat kontrak sewa |
| GET | `/api/invoices?status=` | List tagihan (filter status) |
| POST | `/api/invoices/generate` | Trigger manual generate tagihan (biasanya via cron) |
| POST | `/api/payments` | Ajukan pembayaran — body menentukan metode: `manual` (upload bukti) atau `midtrans` (generate Snap token) |
| POST | `/api/payments/webhook` | Webhook notifikasi dari **Midtrans** untuk update status pembayaran otomatis |
| PATCH | `/api/payments/:id/verify` | Verifikasi pembayaran **manual** oleh Admin (approve/reject) — tidak berlaku untuk transaksi Midtrans |
| GET | `/api/reports/summary` | Ringkasan dashboard (pendapatan, okupansi, tunggakan) |
| GET | `/api/reports/export` | Export laporan PDF/Excel |

Semua endpoint (kecuali auth & webhook) dilindungi middleware JWT + RBAC per role.

---

## 10. Panduan UI/UX Design (Dark Mode & Light Mode)

### 10.1 Prinsip Desain
- **Clean & professional**: whitespace cukup, hierarki visual jelas, hindari elemen dekoratif berlebihan.
- **Konsisten**: gunakan design system (komponen reusable) berbasis shadcn/ui + Tailwind.
- **Aksesibel**: kontras warna memenuhi WCAG AA, ukuran font minimal 14px untuk body text.
- **Responsif**: mobile-first, dashboard tetap nyaman diakses dari HP (banyak penyewa akan bayar via HP).

### 10.2 Sistem Tema (Dark/Light)
Implementasi menggunakan CSS variables + `next-themes`, agar transisi tema instan tanpa flicker (FOUC).

**Palet Warna — Light Mode**
| Token | Nilai | Fungsi |
|---|---|---|
| `--background` | `#FFFFFF` | Latar utama |
| `--surface` | `#F7F8FA` | Kartu, panel |
| `--foreground` | `#0F172A` | Teks utama |
| `--muted` | `#64748B` | Teks sekunder |
| `--primary` | `#2563EB` | Aksi utama (tombol, link) |
| `--success` | `#16A34A` | Status lunas |
| `--warning` | `#D97706` | Status mendekati jatuh tempo |
| `--danger` | `#DC2626` | Status telat/tunggakan |
| `--border` | `#E2E8F0` | Garis pembatas |

**Palet Warna — Dark Mode**
| Token | Nilai | Fungsi |
|---|---|---|
| `--background` | `#0B0F17` | Latar utama |
| `--surface` | `#141A24` | Kartu, panel |
| `--foreground` | `#E2E8F0` | Teks utama |
| `--muted` | `#94A3B8` | Teks sekunder |
| `--primary` | `#3B82F6` | Aksi utama |
| `--success` | `#22C55E` | Status lunas |
| `--warning` | `#F59E0B` | Status mendekati jatuh tempo |
| `--danger` | `#EF4444` | Status telat/tunggakan |
| `--border` | `#1E293B` | Garis pembatas |

### 10.3 Tipografi
- Font utama: **Inter** atau **Plus Jakarta Sans** (readable, modern, mendukung angka tabular untuk nominal uang).
- Skala: Heading (24/20/18px, semi-bold), Body (14/16px, regular), Caption (12px, medium).
- Angka nominal (Rp) menggunakan `font-variant-numeric: tabular-nums` agar rapi di tabel.

### 10.4 Komponen Kunci
- **Status badge** berwarna (hijau=lunas, kuning=jatuh tempo dekat, merah=telat) — konsisten di semua mode tema.
- **Card ringkasan dashboard** dengan angka besar + trend indicator (naik/turun dari bulan lalu).
- **Tabel tagihan** dengan sticky header, filter status, dan pagination.
- **Toggle tema** (icon matahari/bulan) di header, mudah dijangkau di mobile & desktop.
- **Empty state & loading skeleton** untuk setiap halaman data agar terasa profesional, bukan blank/patah.

### 10.5 Halaman Utama yang Perlu Didesain
1. Landing page (marketing, SEO-friendly, SSR).
2. Login/Register.
3. Dashboard Owner (ringkasan properti, grafik pendapatan).
4. Manajemen Kamar (grid visual status kamar).
5. Manajemen Penyewa & Kontrak.
6. Daftar & Detail Tagihan.
7. Halaman Pembayaran (Penyewa) — pilihan metode: form upload bukti transfer (manual) atau tombol "Bayar dengan Midtrans" (redirect ke Snap).
8. Laporan & Export.
9. Pengaturan Akun & Preferensi Tema.

---

## 11. Kebutuhan Non-Fungsional

| Kategori | Kebutuhan |
|---|---|
| **Keamanan** | HTTPS wajib, password di-hash (bcrypt), JWT dengan refresh token rotation, rate limiting pada endpoint auth & payment, validasi input di semua endpoint (Zod/Joi) |
| **Performa** | LCP < 2.5s, API response < 300ms untuk operasi baca umum |
| **Skalabilitas** | Arsitektur multi-tenant (1 database, isolasi data per owner_id), siap horizontal scaling backend |
| **Ketersediaan** | Uptime target 99.5%, backup database harian |
| **Kepatuhan Data** | Data pembayaran & pribadi penyewa dienkripsi at-rest, kebijakan retensi bukti transfer minimal 1 tahun |
| **Auditability** | Log setiap perubahan status pembayaran (siapa, kapan, aksi apa) |
| **Aksesibilitas** | Kontras warna WCAG AA di kedua mode tema, navigasi keyboard untuk form utama |

---

## 12. Alur Pengguna Utama (User Flow)

**Alur Pembayaran Penyewa:**
1. Penyewa login → melihat notifikasi tagihan baru.
2. Buka halaman "Tagihan Saya" → pilih tagihan aktif.
3. Pilih metode bayar: (a) **Midtrans** → redirect/pop-up Snap → pembayaran via VA/e-wallet/QRIS → webhook update status otomatis menjadi "lunas"; atau (b) **Manual** → unggah bukti transfer → status "menunggu verifikasi".
4. Admin/Owner menerima notifikasi → verifikasi bukti → status berubah "lunas" → notifikasi ke penyewa.

**Alur Generate Tagihan Otomatis:**
1. Cron job berjalan harian, mengecek kontrak aktif dengan tanggal jatuh tempo H-7.
2. Sistem membuat invoice baru berdasarkan `rent_amount` kontrak.
3. Notifikasi tagihan baru terkirim ke penyewa (email/WA).
4. Reminder otomatis terkirim H-3 dan H-1 sebelum jatuh tempo; jika lewat jatuh tempo, sistem menghitung denda dan mengubah status jadi "telat".

---

## 13. Roadmap & Milestone (Estimasi)

| Fase | Cakupan | Estimasi Durasi |
|---|---|---|
| Fase 1 — Fondasi | Setup Next.js + Express, autentikasi, desain sistem (dark/light), skema DB | 2–3 minggu |
| Fase 2 — Manajemen Properti & Penyewa | CRUD properti, kamar, penyewa, kontrak | 2 minggu |
| Fase 3 — Tagihan & Pembayaran | Generate invoice otomatis, integrasi payment gateway, verifikasi manual | 3 minggu |
| Fase 4 — Notifikasi & Laporan | Email/WA reminder, dashboard, export laporan | 2 minggu |
| Fase 5 — QA, Polish UI, Deployment | Testing menyeluruh, refinement dark/light mode, deployment produksi | 1–2 minggu |

Total estimasi: **±10–12 minggu** untuk MVP siap produksi (1 tim kecil: 1 FE, 1 BE, 1 designer paruh waktu).

---

## 14. Risiko & Asumsi

| Risiko/Asumsi | Mitigasi |
|---|---|
| Ketergantungan pada **Midtrans** sebagai satu-satunya payment gateway (downtime/gangguan) | Opsi **pembayaran manual** selalu tersedia sebagai fallback, tidak bergantung pada Midtrans |
| Owner tidak konsisten input data kamar/kontrak | Onboarding wizard & validasi data wajib saat setup awal |
| Biaya integrasi WhatsApp Business API | Mulai dengan email + WA via provider murah (Fonnte), evaluasi upgrade ke WA Business API resmi di fase lanjut |
| Data keuangan sensitif | Enkripsi data, audit log, akses berbasis role ketat |

---

## 15. Lampiran

- **Definisi Status Tagihan:** `Belum Terbit`, `Aktif`, `Menunggu Verifikasi`, `Lunas`, `Telat`, `Dibatalkan`.
- **Aturan Denda (contoh default, dapat dikonfigurasi Owner):** 2% dari nominal sewa per minggu keterlambatan, maksimal 10%.
- **Channel Notifikasi:** Email (wajib), WhatsApp (opsional, perlu nomor terverifikasi).

---

*Dokumen ini adalah draft awal dan akan diperbarui seiring hasil diskusi stakeholder, riset pengguna, dan validasi teknis lebih lanjut.*
