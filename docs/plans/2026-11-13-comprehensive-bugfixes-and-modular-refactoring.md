# Rencana Kerja: Perbaikan Bug Kritis, Restrukturisasi Modular Settings, dan Standarisasi Repositori

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

Rencana ini mengeksekusi 5 poin perbaikan yang diminta oleh pengguna:
1. **Fix Bug Kritis (1A & 1B):**
   - 1A: Sinkronisasi `settings.handoffSecretKey` di `HandoffRedirectPage.tsx`.
   - 1B: Proteksi *outbox race condition* di `storageService.ts` dan `pbClient.ts` agar event realtime tidak menimpa mutasi lokal yang sedang antre.
2. **Restrukturisasi Modular `AdminSettingsPage.tsx` (Prinsip *Codebase Design*):**
   - Memecah berkas raksasa 1.541 baris menjadi 10 sub-modul terfokus di bawah `src/components/crm-admin/settings/`.
3. **Penyempurnaan Arsitektur & Fallback Portal (AI Engineering Team):**
   - Menambahkan panduan akses ekosistem VPS pada `/portal` saat pelapor membuka tanpa sesi aktif.
   - Menambahkan automated unit test untuk skenario retry/revert outbox.
4. **Standarisasi Dokumen Domain (`setup-matt-pocock-skills`):**
   - Membuat `docs/agents/domain.md` yang memetakan domain model tunggal ke `GLOSSARY.md`.
5. **Verifikasi Bebas Bug & Deployment:**
   - Menjalankan seluruh unit test (`npm test`), build bundle produksi, commit ke git `main`, dan deploy ke server VPS live.

---

## File Structure Map

```
docs/
├── agents/
│   ├── issue-tracker.md
│   └── domain.md                     [BARU: Pemetaan domain docs Matt Pocock]
src/
├── components/
│   ├── crm-admin/
│   │   └── settings/                 [BARU: Direktori sub-komponen tab pengaturan]
│   │       ├── AccountTab.tsx
│   │       ├── PreferencesTab.tsx
│   │       ├── AppearanceTab.tsx
│   │       ├── NotificationsTab.tsx
│   │       ├── SecurityTab.tsx
│   │       ├── StorageTab.tsx
│   │       ├── AutomationsTab.tsx
│   │       ├── CannedResponsesTab.tsx
│   │       └── AboutSystemTab.tsx
│   └── user-portal/
│       └── PortalNoSessionGuide.tsx  [BARU: Panduan fallback akses 7 aplikasi VPS]
├── pages/
│   ├── HandoffRedirectPage.tsx       [PERBAIKAN: Sinkronisasi settings.handoffSecretKey]
│   ├── admin/AdminSettingsPage.tsx   [REFACTOR: Ramping ~180 baris sebagai orchestrator]
│   └── portal/PortalHomePage.tsx     [PERBAIKAN: Integrasi panduan jika sesi kosong]
└── services/
    ├── storageService.ts             [PERBAIKAN: Proteksi penimpaan outbox di upsertLocal]
    └── pbClient.test.ts              [BARU: Unit test simulasi outbox rollback & retry]
```

---

## Tasks

### Task 1: Perbaikan Bug Kritis (1A & 1B)
- [ ] **Step 1.1: Sinkronkan Kunci Rahasia Handoff di `HandoffRedirectPage.tsx`**
  - Ambil `settings` dari `useCrm()`.
  - Gunakan `settings.handoffSecretKey || import.meta.env.VITE_HANDOFF_SECRET || 'vps-helpdesk-secret-key'`.
- [ ] **Step 1.2: Proteksi Penimpaan Outbox Realtime di `storageService.ts`**
  - Perbarui `upsertLocal` agar memeriksa apakah `item.id` sedang mengantre di `outbox`.
  - Jika ada operasi outbox untuk `item.id`, abaikan penimpaan dari server sampai outbox selesai terkirim (*optimistic mutation preservation*).

### Task 2: Restrukturisasi Modular `AdminSettingsPage.tsx`
- [ ] **Step 2.1: Buat sub-komponen `AccountTab.tsx`**
- [ ] **Step 2.2: Buat sub-komponen `PreferencesTab.tsx`**
- [ ] **Step 2.3: Buat sub-komponen `AppearanceTab.tsx`**
- [ ] **Step 2.4: Buat sub-komponen `NotificationsTab.tsx`**
- [ ] **Step 2.5: Buat sub-komponen `SecurityTab.tsx`**
- [ ] **Step 2.6: Buat sub-komponen `StorageTab.tsx`**
- [ ] **Step 2.7: Buat sub-komponen `AutomationsTab.tsx`**
- [ ] **Step 2.8: Buat sub-komponen `CannedResponsesTab.tsx`**
- [ ] **Step 2.9: Buat sub-komponen `AboutSystemTab.tsx`**
- [ ] **Step 2.10: Perbarui `AdminSettingsPage.tsx` menjadi orchestrator bersih**

### Task 3: Penyempurnaan AI Engineering Team (Frontend & QA)
- [ ] **Step 3.1: Buat komponen `PortalNoSessionGuide.tsx` & integrasikan di `PortalHomePage.tsx`**
  - Tampilkan 7 aplikasi VPS dengan tautan langsung jika pengguna belum login.
- [ ] **Step 3.2: Buat unit test outbox rollback di `src/services/storageService.test.ts`**
  - Pastikan pengujian `node --test` memverifikasi ketahanan outbox.

### Task 4: Standarisasi Dokumen Domain Matt Pocock
- [ ] **Step 4.1: Buat `docs/agents/domain.md`**
  - Petakan kamus istilah ke `GLOSSARY.md` dan aturan single-context repository.

### Task 5: Verifikasi, Build & Deployment VPS
- [ ] **Step 5.1: Jalankan `npm test`**
- [ ] **Step 5.2: Jalankan `npm run build -- --base=/helpdesk/`**
- [ ] **Step 5.3: Commit & Push ke GitHub `main`**
- [ ] **Step 5.4: Deploy ke VPS & Verifikasi Live HTTP/2 200**
