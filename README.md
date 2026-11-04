# VPS Helpdesk CRM & Multi-App Ticketing System

Aplikasi web Helpdesk CRM & Ticketing System terpusat (bergaya Libredesk / Zendesk internal) untuk **1 Superadmin (Owner VPS)** dalam memantau, mengelola, dan menyelesaikan (`solve`) tiket laporan kendala dari **7 aplikasi go-live**.

## 7 Ekosistem Aplikasi Terintegrasi (Pre-Seeded)

| Aplikasi | Slug | Prefix | URL Aplikasi | Admin DB URL | Contoh User & Role |
| --- | --- | --- | --- | --- | --- |
| **Recruiter Portal** | `recruiter` | `REC` | `https://43.156.236.102/recruiter/login` | `https://43.156.236.102/recruiter-pb/_/` | `employer@demo.com` (Employer UMKM), `kandidat@demo.com` (Candidate) |
| **Snackloop-ERP** | `snackloop` | `SNK` | `https://43.156.236.102/snackloop/` | — | `admin_kiky` (Super Admin Owner), `staff1` (Staff Rekap & Transaksi Harian) |
| **Wedding Planner Web** | `wedding` | `WED` | `https://43.156.236.102/wedding/login` | `https://43.156.236.102/_/` | `admin@wedding.local` (Owner Web Acara) |
| **Life Planner Web** | `life-planner` | `LFP` | `https://43.156.236.102/life-planner/` | `https://43.156.236.102/life-planner-pb/_/` | `kiky@lifeplanner.local` (User / Superadmin) |
| **AI Endurance Platform** | `ai-endurance` | `AIE` | `https://43.156.236.102:8445/login.html` | — | `kipchoge@berlin.org` (Athlete) |
| **Kept Password Vault** | `kept` | `KPT` | `https://43.156.236.102/kept/` | — | `user@kept.local` (Vault User) |
| **Diskon Bot Web** | `diskon-bot` | `BOT` | `https://43.156.236.102/diskon-bot/` | — | `8503838227` (Bot Member) |

## Cara Menjalankan

```bash
# 1. Install dependencies
npm install

# 2. (Opsional) Inisialisasi koleksi & seed data ke server PocketBase (http://127.0.0.1:8090)
npm run pb:init

# 3. Jalankan server development (http://localhost:5173)
npm run dev

# 4. Jalankan unit test logika bisnis CRM
npm test

# 5. Build untuk produksi (dist/)
npm run build
```

> **Mode Fallback Otomatis:** Jika server PocketBase (`VITE_PB_URL`) belum dinyalakan, `src/services/pbClient.ts` dan `src/services/storageService.ts` otomatis menjalankan penyimpanan lokal dengan 8 tiket seed realistis dan menyinkronkannya ke PocketBase begitu server aktif.

## Skema Integrasi SSO Handoff (Tombol "Help")

Setiap aplikasi cukup mengarahkan user ke rute:

```text
/handoff?app={app_slug}&uid={external_user_id}&name={display_name}&role={user_role}&from_url={current_page_url}
```

- **Anti-Bentrok Username (`Composite Identity`):** Sistem membuat kunci unik `compositeKey = "{app_slug}:{external_user_id}"` (contoh: `snackloop:admin_kiky`, `wedding:admin@wedding.local`).
- **Auto-Create User (JIT Provisioning):** Jika `compositeKey` belum terdaftar di `crm_users`, akun otomatis dibuat dan langsung login ke `/portal` aplikasi asalnya.
