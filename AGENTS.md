# Panduan Developer & AI Agent — VPS Helpdesk CRM

Dokumen panduan standar untuk AI Coding Agent dan kontributor yang bekerja pada repositori `ticketing-system`.

---

## 1. Perintah Inti Repositori

| Tugas | Perintah | Catatan |
| :--- | :--- | :--- |
| **Instal Dependensi** | `npm ci` | Gunakan file package-lock yang terkunci |
| **Jalankan Unit Test** | `npm test` | Menjalankan node test runner (`node --test`) |
| **Build Web Bundle** | `npm run build` | Menjalankan `tsc && vite build` |
| **Build Khusus VPS** | `npm run build -- --base=/helpdesk/` | Dipakai saat CI/CD untuk penempatan `/helpdesk/` |
| **Dev Server Lokal** | `npm run dev` | Port default `5173` |

---

## 2. Standar Arsitektur & Keamanan

1. **Isolasi Multi-Tenant Wajib Dijaga:**
   Setiap akses tiket pelapor di portal (`/portal/ticket/:id`) **wajib** memverifikasi kepemilikan tiket berbasis `requesterId` atau kombinasi `appId === requester.appId && requesterUid === requester.externalUid`. Jangan pernah memvalidasi `requesterUid` tanpa menyertakan `appId`.

2. **Sanitisasi & Keamanan Input:**
   - Semua input teks dari luar (parameter query handoff, judul, rincian) wajib dibersihkan dari *control characters* (`\x00-\x1F\x7F`).
   - URL rujukan (`sourcePageUrl` / `fromUrl`) wajib divalidasi via `safeHttpUrl()` untuk mencegah serangan `javascript:` atau *open redirect*.

3. **Offline-First & Outbox Pattern:**
   Setiap mutasi data harus melalui `saveRecord()` agar tersimpan ke *local store* terlebih dahulu dan diantrekan ke *outbox* sebelum dikirim ke PocketBase.

4. **Konsistensi Istilah Bahasa:**
   Gunakan istilah teknis bahasa Indonesia yang baku sesuai [`GLOSSARY.md`](file:///c:/Users/rizky/Documents/Dev/ticketing-system/GLOSSARY.md):
   - Status: `Baru`, `Diproses`, `Menunggu Balasan`, `Selesai`, `Ditutup`.
   - Entitas: `Pelapor`, `ID Komposit`, `Catatan Internal`, `Template Balasan Cepat`.

---

## 3. Konfigurasi CI/CD & Server Produksi

- **Host VPS:** `43.156.236.102` (Port SSH: `2222`, User: `ubuntu`).
- **PocketBase Service:** `http://127.0.0.1:8094` (Reverse proxy Caddy: `/helpdesk-pb/`).
- **Direktori Web Live:** `/srv/www/helpdesk/`.
- **Workflow GitHub Actions:** `.github/workflows/deploy-vps.yml` otomatis membuild dan mendeploy perubahan pada cabang `main` setelah seluruh pengujian unit test lulus.

---

## 4. Agent Skills & Issue Tracker

### Issue Tracker
Isu dan pelacakan fitur dikelola pada [GitHub Issues](https://github.com/rizkyaryendigumilang/ticketing-system/issues). Lihat `docs/agents/issue-tracker.md`.

### Domain Docs
Kamus istilah dan konsep domain lengkap tercatat di [`GLOSSARY.md`](file:///c:/Users/rizky/Documents/Dev/ticketing-system/GLOSSARY.md).
