# Implementasi Fondasi Teknis, Kolaborasi CRM, dan Pengalaman Pengguna (UI/UX)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

Rencana kerja ini mengimplementasikan tiga pilar perbaikan yang diminta oleh pengguna:
1. **Fondasi Teknis & Kinerja (Critical):** Kompresi gambar sisi klien, IndexedDB attachment fallback untuk mengatasi limit 5MB `localStorage`, penanganan konkurensi data (`updatedAt`), dan fitur pruning data tiket lama.
2. **Kolaborasi Tim & Alur Kerja CRM (High Impact):** Penugasan petugas/PIC tiket (`assignedTo`), kalkulasi & indikator SLA countdown otomatis per prioritas tiket, tab filter penugasan di inbox, dan presence indicator.
3. **Pengalaman Pengguna (UI/UX Refinement):** Global Command Palette (`Ctrl+K` / `Cmd+K`) untuk navigasi dan pencarian instan, serta toolbar pemformatan teks (*Markdown*) pada input balasan pesan.

---

## Daftar Berkas yang Dibuat / Dimodifikasi

| Berkas | Tanggung Jawab / Perubahan |
| :--- | :--- |
| `src/services/imageCompression.ts` | Utilitas kompresi gambar klien (resize max 1280px, WebP/JPEG 0.82) |
| `src/services/attachmentStore.ts` | Penyimpanan lampiran IndexedDB transparan dengan fallback memori |
| `src/services/crmLogic.ts` | Logika kalkulasi SLA (`computeTicketSla`), filter penugasan tiket (`filterTickets`) |
| `src/services/crmLogic.test.ts` | Unit test untuk SLA logic, filter assignedTo, dan kompresi |
| `src/types/crm.ts` | Penambahan field `assignedTo`, `assignedToName`, `assignedToRole` pada `Ticket` |
| `src/services/ticketCrmService.ts` | Fungsi `assignTicket()` untuk penugasan petugas dengan pesan sistem audit |
| `src/components/common/SlaBadge.tsx` | Komponen visual badge countdown SLA (On Track, Warning, Breached, Selesai) |
| `src/components/common/CommandPalette.tsx` | Dialog navigasi cepat `Ctrl+K` / `Cmd+K` global |
| `src/components/common/MessageToolbar.tsx` | Toolbar pemformatan markdown (Bold, Italic, Code, List, Quote) |
| `src/components/crm-admin/TicketInboxTable.tsx` | Kolom SLA badge, kolom PIC petugas, dan filter penugasan |
| `src/components/crm-admin/TicketWorkspace3Col.tsx` | Kontrol penugasan PIC, SLA banner, toolbar markdown balasan |
| `src/pages/admin/AdminTicketsPage.tsx` | Tab filter `Semua` / `Ditugaskan ke Saya` / `Belum Ditugaskan` |
| `src/components/layout/AdminCrmLayout.tsx` | Tombol pintas & event listener `Ctrl+K` Command Palette |
| `src/i18n/translations.ts` | Seluruh kunci terjemahan bilingual ID & EN |

---

## Rincian Tugas

### Task 1: Fondasi Teknis & Kinerja (Kompresi Gambar & IndexedDB Storage)

- [ ] **Step 1.1: Buat modul kompresi gambar klien `src/services/imageCompression.ts`**
  - Buat fungsi `compressImage(fileOrDataUrl: File | string, maxDimension = 1280, quality = 0.82): Promise<string>`
  - Jika dijalankan di peramban, gunakan Canvas API untuk resize dan ekspor ke `image/webp` (atau `image/jpeg`).
  - Jika ukuran gambar asli sudah < 100KB, pertahankan tanpa kompresi ulang.

- [ ] **Step 1.2: Buat adapter penyimpanan lampiran IndexedDB `src/services/attachmentStore.ts`**
  - Buat store IndexedDB `helpdesk_attachments` untuk menyimpan DataURL gambar berukuran besar.
  - Sediakan fungsi `storeAttachment(id: string, dataUrl: string): Promise<string>` dan `getAttachment(id: string): Promise<string | null>`.
  - Berikan fallback transparan jika IndexedDB diblokir/tidak didukung.

- [ ] **Step 1.3: Integrasikan kompresi pada komponen `ScreenshotUploader.tsx`**
  - Panggil `compressImage()` saat user memilih file atau paste tangkapan layar.
  - Memastikan ukuran base64 berkurang hingga ~80-90% sebelum masuk state.

- [ ] **Step 1.4: Tambahkan opsi Pruning Data Tiket Lama di `storageService.ts` dan Settings**
  - Fungsi `pruneOldClosedTickets(maxDays = 60)` untuk membersihkan tiket tertutup lama dari `localStorage` jika memori hampir penuh.

---

### Task 2: Kolaborasi Tim & Alur Kerja CRM (Assignee & SLA Tracking)

- [ ] **Step 2.1: Perbarui Tipe `Ticket` di `src/types/crm.ts`**
  - Tambahkan field opsional: `assignedTo?: string; assignedToName?: string; assignedToRole?: string;`

- [ ] **Step 2.2: Buat logika kalkulasi SLA di `src/services/crmLogic.ts`**
  - Aturan SLA dari `createdAt`:
    - `urgent`: 2 jam (120 menit)
    - `high`: 6 jam (360 menit)
    - `medium`: 24 jam (1440 menit)
    - `low`: 48 jam (2880 menit)
  - Fungsi `computeTicketSla(ticket: Ticket, now = Date.now())` menghasilkan status:
    - `achieved` jika status `solved` atau `closed` sebelum deadline
    - `breached` jika belum solved dan `now > deadline`
    - `warning` jika belum solved dan sisa waktu < 30 menit
    - `on_track` jika masih dalam rentang waktu aman
  - Kembalikan: `{ deadline: number, remainingMs: number, status: SlaStatus, label: string }`

- [ ] **Step 2.3: Tulis Unit Test untuk SLA & Assignee di `src/services/crmLogic.test.ts`**
  - Uji kalkulasi SLA untuk tiket baru, tiket mendekati deadline, dan tiket breached.
  - Pastikan semua tes lulus dengan `npm test`.

- [ ] **Step 2.4: Buat fungsi `assignTicket` di `src/services/ticketCrmService.ts`**
  - Mengubah `assignedTo`, `assignedToName`, `assignedToRole` dan mencatat pesan sistem audit di thread tiket.

- [ ] **Step 2.5: Buat komponen `src/components/common/SlaBadge.tsx`**
  - Menampilkan badge visual countdown dengan indikator warna (Hijau: Aman, Kuning: Warning, Merah: Lewat SLA, Abu-abu: Selesai).

- [ ] **Step 2.6: Integrasikan Assignee & SLA di `TicketInboxTable.tsx` dan `TicketWorkspace3Col.tsx`**
  - Tambahkan tab filter di `AdminTicketsPage.tsx`: "Semua", "Ditugaskan ke Saya", "Belum Ditugaskan".
  - Sediakan dropdown pemilihan PIC petugas di bilah detail kanan tiket.

---

### Task 3: Pengalaman Pengguna (Command Palette & Message Formatting)

- [ ] **Step 3.1: Buat komponen `src/components/common/CommandPalette.tsx`**
  - Tangkap shortcut global `Ctrl+K` dan `Cmd+K`.
  - Berikan pencarian cerdas:
    - Navigasi cepat: Dashboard, Tiket, Kontak, Pengaturan, Portal Pelapor
    - Cari tiket langsung berdasarkan nomor (`SNK-001`) atau subjek
    - Ganti bahasa cepat (ID / EN)
    - Filter aplikasi instan (Snackloop, Recruiter, dll.)

- [ ] **Step 3.2: Integrasikan Command Palette di `AdminCrmLayout.tsx`**
  - Tambahkan tombol pencarian cepat di header / sidebar icon rail dengan hint `Ctrl+K`.

- [ ] **Step 3.3: Buat toolbar format pesan `src/components/common/MessageToolbar.tsx`**
  - Tombol aksi: Bold (`**`), Italic (`*`), Inline Code (`` ` ``), List (`- `), Quote (`> `).
  - Mengotomatisasi penyisipan syntax markdown ke posisi kursor `textarea`.

- [ ] **Step 3.4: Format tampilan pesan di `TicketWorkspace3Col.tsx` dan `MessageThread.tsx`**
  - Tampilkan teks berformat (bold, inline code, baris kutipan, bullet points) dengan aman tanpa HTML mentah.

---

### Task 4: Verifikasi & Deployment

- [ ] **Step 4.1: Sinkronisasi Terjemahan `src/i18n/translations.ts`**
  - Pastikan seluruh string baru memiliki pasangan kunci identik di `id` dan `en`.

- [ ] **Step 4.2: Jalankan Unit Test**
  - `npm test` harus lulus 100%.

- [ ] **Step 4.3: Jalankan Build Produksi**
  - `npm run build -- --base=/helpdesk/` harus berhasil tanpa error TypeScript.

- [ ] **Step 4.4: Commit, Push, dan Deploy ke VPS Live**
  - `git commit` dan `git push origin main`.
  - `scp -r dist/* vpsku:/srv/www/helpdesk/`.
  - Verifikasi response live di VPS (`curl -skI https://127.0.0.1/helpdesk/`).
