# KOSTPAY — FEATURE & REQUIREMENTS ADDON

**Produk:** KostPay — Sistem Informasi Manajemen & Pembayaran Kost  
**Dokumen:** Feature & Requirements Addon  
**Basis:** PRD KostPay V1.0  
**Status:** Proposed Revision  
**Versi:** 1.0.0  
**Tujuan:** Menambahkan fitur dan aturan bisnis yang belum tercakup secara memadai pada PRD utama tanpa mengubah fitur inti yang sudah ada.

---

# 1. Tujuan Addon

Addon ini melengkapi PRD KostPay V1.0 dengan fitur, business rules, workflow, dan acceptance criteria yang diperlukan agar sistem lebih siap digunakan oleh pemilik kost/kontrakan skala kecil hingga menengah.

Fokus utama:

- memperjelas siklus bisnis kontrak dan tagihan;
- memperkuat pengelolaan pembayaran;
- menambahkan pengeluaran dan cashflow;
- menambahkan deposit;
- menambahkan utility/metering;
- menambahkan maintenance;
- menambahkan notification center;
- menambahkan audit log;
- memperjelas multi-tenancy dan data isolation;
- memperkuat security;
- menambahkan document management;
- memperjelas move-in/move-out;
- meningkatkan dashboard dan KPI;
- mempersiapkan payment gateway, WhatsApp, dan SaaS billing sebagai tahap lanjutan.

---

# 2. Prinsip Revisi

## 2.1 Tidak Mengubah Core Feature

Fitur berikut dari PRD utama tetap dipertahankan:

- Multi-property
- Manajemen kamar
- Manajemen tenant
- Kontrak
- Generate invoice
- Denda keterlambatan
- Verifikasi pembayaran
- Tenant dashboard
- Reporting
- RBAC
- Next.js
- Express.js
- Prisma
- PostgreSQL
- JWT
- Bcrypt
- Zod

Addon ini hanya memperluas kemampuan sistem.

## 2.2 Prioritas

| Priority | Definisi |
|---|---|
| P0 | Wajib untuk fondasi V1 |
| P1 | Sangat direkomendasikan untuk V1/V1.5 |
| P2 | Roadmap setelah core stabil |

---

# 3. P0 — Business Rules & Contract Lifecycle

## 3.1 Contract Lifecycle

Status kontrak:

```text
DRAFT
  ↓
PENDING
  ↓
ACTIVE
  ↓
EXPIRING
  ↓
ENDED
  ↓
CANCELLED
```

## 3.2 Aturan Kontrak

Kontrak minimal memiliki:

- tenant;
- property;
- room;
- tanggal mulai;
- tanggal selesai;
- harga sewa;
- periode pembayaran;
- tanggal jatuh tempo;
- deposit;
- status kontrak.

## 3.3 Aturan Perpanjangan

Tenant dapat melakukan renewal jika:

- kontrak masih ACTIVE;
- tidak ada proses checkout;
- tidak terdapat konflik kontrak pada kamar.

Renewal harus menyimpan histori kontrak sebelumnya.

## 3.4 Aturan Checkout

Checkout tidak boleh hanya mengubah status kamar menjadi kosong.

Proses checkout harus memeriksa:

1. tagihan outstanding;
2. denda;
3. deposit;
4. kerusakan;
5. refund deposit;
6. tanggal keluar;
7. final payment;
8. status kamar.

## Acceptance Criteria

- Sistem tidak boleh memiliki dua kontrak aktif pada kamar yang sama untuk periode yang overlap.
- Checkout menghasilkan histori.
- Kamar otomatis berubah menjadi AVAILABLE setelah checkout selesai.
- Semua outstanding balance dapat dilihat sebelum checkout.

---

# 4. P0 — Payment Lifecycle

## 4.1 Status Payment

```text
PENDING
  ↓
SUBMITTED
  ↓
UNDER_REVIEW
  ↓
APPROVED

atau

REJECTED
```

Untuk payment gateway:

```text
PENDING
  ↓
PROCESSING
  ↓
PAID
```

## 4.2 Payment Allocation

Satu pembayaran dapat digunakan untuk beberapa invoice.

Contoh:

```text
Payment
Rp1.500.000

Allocation:
- Invoice July      Rp1.000.000
- Invoice August    Rp500.000
```

Satu invoice juga dapat menerima beberapa pembayaran.

```text
Invoice
Rp1.000.000

Payment #1 Rp500.000
Payment #2 Rp500.000
```

## 4.3 Partial Payment

Sistem harus mendukung:

- pembayaran sebagian;
- pembayaran penuh;
- pembayaran lebih;
- pembayaran gabungan beberapa invoice.

## 4.4 Payment Rejection

Jika pembayaran ditolak:

- alasan penolakan wajib diisi;
- tenant menerima notifikasi;
- invoice kembali menjadi outstanding;
- bukti pembayaran tetap tersimpan sebagai histori.

---

# 5. P0 — Expenses & Cashflow

Expenses dipindahkan dari Future Roadmap menjadi fitur V1.

## 5.1 Expense Category

Minimal:

- Listrik
- Air
- Internet/WiFi
- Kebersihan
- Maintenance
- Keamanan
- Gaji/Staf
- Pajak/Retribusi
- Supplies
- Lainnya

## 5.2 Expense Data

Setiap expense memiliki:

- property;
- category;
- amount;
- transaction date;
- description;
- payment method;
- attachment;
- creator;
- status.

## 5.3 Cashflow

Dashboard keuangan minimal:

```text
Total Revenue
- Total Expenses
----------------
Net Cashflow
```

## 5.4 Profitability

Sistem dapat menghitung:

```text
Gross Revenue
- Discounts
- Refunds
= Net Revenue

Net Revenue
- Operating Expenses
= Net Profit
```

---

# 6. P0 — Deposit Management

## 6.1 Deposit Lifecycle

```text
COLLECTED
  ↓
HELD
  ↓
DEDUCTED
  ↓
REFUNDED
```

## 6.2 Deposit Deduction

Deposit dapat dipotong karena:

- kerusakan;
- tagihan;
- denda;
- kehilangan fasilitas;
- biaya lain yang disetujui.

## 6.3 Refund

Saat checkout:

```text
Initial Deposit
- Damage Deduction
- Outstanding Bill
----------------
Refund Amount
```

## Acceptance Criteria

- Deposit tidak boleh hilang dari histori.
- Setiap deduction memiliki alasan.
- Refund memiliki tanggal dan nominal.
- Owner dapat melihat saldo deposit setiap tenant.

---

# 7. P0 — Audit Log

Semua aktivitas kritis wajib dicatat.

## 7.1 Audit Data

Minimal:

- user;
- action;
- module;
- record ID;
- timestamp;
- IP address;
- user agent;
- before data;
- after data.

## 7.2 Aktivitas yang Wajib Diaudit

- login;
- logout;
- create;
- update;
- delete;
- approve payment;
- reject payment;
- change contract;
- checkout;
- change room price;
- expense creation;
- refund;
- role/permission changes.

## Acceptance Criteria

Data audit tidak dapat diubah oleh user biasa.

---

# 8. P0 — Notification Center

## 8.1 Notification Event

Minimal:

```text
INVOICE_CREATED
INVOICE_DUE_SOON
INVOICE_OVERDUE
PAYMENT_SUBMITTED
PAYMENT_APPROVED
PAYMENT_REJECTED
CONTRACT_EXPIRING
CONTRACT_ENDED
MAINTENANCE_CREATED
MAINTENANCE_UPDATED
DEPOSIT_REFUNDED
```

## 8.2 Notification Channel

Arsitektur harus mendukung:

- In-App
- Email
- WhatsApp
- Push Notification

WhatsApp dapat diaktifkan kemudian tanpa mengubah business event.

## 8.3 Notification Preference

Owner/Admin/Tenant dapat memiliki konfigurasi notification sesuai hak akses.

---

# 9. P0 — Multi-Tenancy & Data Isolation

Karena KostPay merupakan SaaS dan Owner dapat memiliki beberapa property, setiap data harus mempunyai ownership context yang jelas.

Konsep:

```text
Owner
 ├── Property A
 │    ├── Rooms
 │    ├── Tenants
 │    ├── Contracts
 │    └── Transactions
 │
 └── Property B
      ├── Rooms
      ├── Tenants
      ├── Contracts
      └── Transactions
```

## 9.1 Data Isolation

User tidak boleh:

- melihat property milik Owner lain;
- melihat tenant milik Owner lain;
- melihat invoice milik Owner lain;
- mengakses payment milik tenant/property lain.

## 9.2 Authorization

Authorization harus dilakukan di backend, bukan hanya menyembunyikan menu di frontend.

---

# 10. P0 — Security & Session Management

## 10.1 Authentication

Minimal:

- JWT access token;
- refresh token;
- password hashing;
- password reset;
- email verification;
- session revocation.

## 10.2 Security Control

Tambahkan:

- rate limiting;
- brute-force protection;
- CORS policy;
- secure HTTP headers;
- input validation;
- authorization middleware;
- file upload validation;
- maximum upload size;
- MIME type validation.

## 10.3 Sensitive Data

Password, token, secret key, dan credential tidak boleh disimpan dalam plaintext.

---

# 11. P1 — Utility / Metering

Untuk kost yang membebankan biaya berdasarkan pemakaian.

## 11.1 Utility Type

- Electricity
- Water
- Internet
- Gas
- Other

## 11.2 Pricing Model

```text
FLAT
METER
TIERED
```

## 11.3 Meter Reading

Data:

- room;
- utility;
- previous reading;
- current reading;
- usage;
- reading date;
- recorded by.

Formula:

```text
Usage = Current Reading - Previous Reading
```

## 11.4 Utility Billing

Utility dapat menjadi invoice item.

Contoh:

```text
Room Rent       Rp1.000.000
Electricity       Rp150.000
Water              Rp50.000
WiFi               Rp50.000
----------------------------
Total            Rp1.250.000
```

---

# 12. P1 — Maintenance & Complaint

## 12.1 Ticket Lifecycle

```text
OPEN
 ↓
ASSIGNED
 ↓
IN_PROGRESS
 ↓
RESOLVED
 ↓
CLOSED
```

## 12.2 Ticket Data

- ticket number;
- tenant;
- property;
- room;
- category;
- priority;
- description;
- photo;
- assigned staff;
- estimated cost;
- actual cost;
- status;
- timestamps.

## 12.3 Priority

```text
LOW
MEDIUM
HIGH
URGENT
```

---

# 13. P1 — Document Management

Dokumen yang dapat disimpan:

- identitas tenant;
- kontrak;
- bukti pembayaran;
- bukti deposit;
- dokumen checkout;
- dokumen maintenance;
- dokumen property.

## Security

File harus:

- memiliki access control;
- memiliki maximum size;
- memiliki allowed MIME type;
- tidak dapat diakses melalui public URL tanpa authorization.

---

# 14. P1 — Move-in & Move-out Inspection

## 14.1 Move-in

Saat tenant masuk:

- kondisi kamar dicatat;
- fasilitas dicatat;
- foto kondisi kamar dapat diunggah;
- meter awal dicatat.

## 14.2 Move-out

Saat checkout:

- kondisi akhir kamar dicatat;
- foto akhir dapat diunggah;
- meter akhir dicatat;
- kerusakan dihitung;
- deposit dihitung;
- refund diproses.

---

# 15. P1 — Recurring Billing

Sistem harus mendukung invoice otomatis.

Contoh:

```text
Every Month
Day 1
   ↓
Generate Invoice
   ↓
Due Date Day 5
   ↓
Reminder Day 3
   ↓
Overdue Day 6
```

Recurring billing harus menggunakan scheduler/background job.

---

# 16. P1 — Dashboard & KPI

## Owner Dashboard

Minimal:

- Occupancy Rate;
- Available Rooms;
- Active Tenants;
- Monthly Revenue;
- Monthly Expenses;
- Net Cashflow;
- Outstanding Invoice;
- Overdue Invoice;
- Expected Revenue;
- Contract Expiring;
- Maintenance Open Ticket.

## KPI Formula

### Occupancy Rate

```text
Occupied Rooms / Total Rentable Rooms × 100
```

### Collection Rate

```text
Collected Amount / Billed Amount × 100
```

### Outstanding

```text
Total Invoice - Total Paid
```

### Net Cashflow

```text
Revenue - Expenses
```

---

# 17. P1 — Room & Property Enhancement

Property dapat memiliki:

- address;
- description;
- contact information;
- facilities;
- photos;
- operational status.

Room dapat memiliki:

- room type;
- floor;
- facilities;
- base rent;
- additional charges;
- room status;
- maintenance status.

Room status:

```text
AVAILABLE
RESERVED
OCCUPIED
MAINTENANCE
UNAVAILABLE
```

---

# 18. P1 — Tenant Lifecycle

Lifecycle:

```text
PROSPECT
 ↓
ONBOARDING
 ↓
ACTIVE
 ↓
EXPIRING
 ↓
CHECKOUT
 ↓
FORMER_TENANT
```

Tenant history harus tetap tersedia setelah checkout.

---

# 19. P2 — Payment Gateway

Payment Gateway tetap menjadi roadmap, tetapi business abstraction harus disiapkan sejak awal.

Provider dapat berupa:

- Midtrans
- Xendit
- provider lain yang kompatibel.

Payment method:

- Virtual Account;
- QRIS;
- E-Wallet;
- Bank Transfer.

Webhook harus idempotent.

Event payment gateway tidak boleh membuat transaksi ganda walaupun webhook dikirim lebih dari satu kali.

---

# 20. P2 — WhatsApp Integration

WhatsApp digunakan untuk:

- invoice reminder;
- overdue reminder;
- payment confirmation;
- payment rejection;
- contract expiration;
- maintenance update.

Template pesan harus configurable.

---

# 21. P2 — SaaS Subscription

Jika KostPay dikomersialkan sebagai SaaS, tambahkan:

## Subscription

- FREE
- BASIC
- PRO
- ENTERPRISE

Setiap plan dapat mempunyai:

- maximum property;
- maximum room;
- maximum tenant;
- storage quota;
- notification quota;
- WhatsApp quota;
- payment gateway availability.

## Subscription Lifecycle

```text
TRIAL
 ↓
ACTIVE
 ↓
PAST_DUE
 ↓
SUSPENDED
 ↓
CANCELLED
```

---

# 22. Database Requirement Addon

Entitas utama yang direkomendasikan:

```text
users
roles
permissions

owners
properties
rooms
room_types

tenants
contracts

invoices
invoice_items
payments
payment_allocations

deposits
deposit_transactions

expenses
expense_categories

utilities
utility_meters
utility_readings

maintenance_tickets
maintenance_comments
maintenance_attachments

notifications
notification_preferences

documents

audit_logs

subscriptions
subscription_plans
```

Relasi utama:

```text
Owner
 └── Properties
      ├── Rooms
      ├── Tenants
      ├── Contracts
      ├── Invoices
      ├── Payments
      ├── Expenses
      ├── Utilities
      └── Maintenance
```

---

# 23. API Requirement Addon

API harus mendukung:

- pagination;
- filtering;
- sorting;
- searching;
- authorization;
- validation;
- consistent response format;
- idempotency untuk payment;
- transaction handling;
- audit logging.

Format response yang direkomendasikan:

```json
{
  "success": true,
  "message": "Payment approved successfully",
  "data": {},
  "meta": {}
}
```

Error:

```json
{
  "success": false,
  "message": "Payment cannot be approved",
  "errors": {}
}
```

---

# 24. Background Jobs & Scheduler

Gunakan background worker untuk proses:

- generate recurring invoices;
- calculate overdue;
- send reminders;
- notification delivery;
- WhatsApp delivery;
- email delivery;
- report generation;
- cleanup temporary files.

Scheduler tidak boleh menjalankan proses berat secara synchronous pada request user.

---

# 25. File Upload Requirement

File upload harus memiliki:

- maximum file size;
- MIME validation;
- extension validation;
- randomized filename;
- authorization;
- storage abstraction;
- virus/malware scanning jika tersedia.

Jenis file yang diperbolehkan harus dikonfigurasi berdasarkan module.

---

# 26. Acceptance Criteria Umum

Sebuah fitur dianggap selesai jika:

- business rule telah diimplementasikan;
- authorization telah diterapkan;
- validation tersedia;
- error handling tersedia;
- audit log diterapkan untuk aktivitas kritis;
- data dapat ditelusuri;
- tidak menyebabkan data antar Owner tercampur;
- memiliki API contract;
- memiliki UI state untuk loading, empty, success, dan error;
- memiliki test untuk business-critical flow.

---

# 27. Prioritas Implementasi

## Phase 1 — Core Foundation

```text
1. Business Rules
2. Contract Lifecycle
3. Payment Lifecycle
4. Expenses
5. Deposit
6. Audit Log
7. Notification Center
8. Multi-Tenancy
9. Security
```

## Phase 2 — Operational Enhancement

```text
10. Utilities
11. Maintenance
12. Documents
13. Move-in / Move-out
14. Recurring Billing
15. Advanced Dashboard
```

## Phase 3 — Commercial Expansion

```text
16. Payment Gateway
17. WhatsApp
18. SaaS Subscription
19. Advanced Analytics
```

---

# 28. Revised Product Scope

Dengan addon ini, KostPay tidak lagi hanya menjadi:

```text
Sistem Tagihan Kost
```

tetapi berkembang menjadi:

```text
KostPay
│
├── Property Management
├── Room Management
├── Tenant Management
├── Contract Management
├── Billing
├── Payment
├── Deposit
├── Expenses
├── Cashflow
├── Utility
├── Maintenance
├── Document Management
├── Notification
├── Reporting
├── Audit
├── RBAC
└── SaaS Management
```

## Target V1

Prioritas V1 adalah membuat siklus berikut stabil:

```text
Property
   ↓
Room
   ↓
Tenant
   ↓
Contract
   ↓
Recurring Invoice
   ↓
Payment
   ↓
Payment Verification
   ↓
Financial Record
   ↓
Dashboard
   ↓
Checkout
   ↓
Deposit Refund
```

Siklus tersebut merupakan core business process KostPay dan harus stabil sebelum fitur integrasi eksternal seperti payment gateway dan WhatsApp dikembangkan.
