# Referensi API & Protokol Handoff — VPS Helpdesk CRM

Dokumentasi teknis resmi antarmuka pemrograman aplikasi (API) dan protokol Single Sign-On (SSO) Just-In-Time (JIT) Handoff untuk sistem tiket VPS Helpdesk CRM.

---

## 1. Ikhtisar Arsitektur

Helpdesk CRM menggunakan dua lapisan antarmuka data:
1. **SSO JIT Handoff Endpoint (`/helpdesk/handoff`):** Titik masuk berbasis URL query untuk autentikasi instan pelapor dari aplikasi ekosistem VPS tanpa sesi login manual terpisah.
2. **PocketBase REST API (`/helpdesk-pb/api/`):** Titik akhir penyimpanan terpusat dan sinkronisasi realtime berbasis WebSocket/SSE.

---

## 2. Protokol SSO JIT Handoff (`/handoff`)

Setiap aplikasi internal mengarahkan pengguna ke endpoint handoff saat tombol bantuan diklik. Sistem memverifikasi parameter, membuat/memperbarui rekaman kontak pelapor (`crm_users`), lalu mengarahkan browser ke portal tiket aplikasi terkait.

### Format Endpoint
```http
GET /helpdesk/handoff?app={app_slug}&uid={user_id}&name={display_name}&role={role}&from_url={url}&new={0|1}&auto_submit={0|1}
```

### Parameter Permintaan

| Parameter | Tipe | Wajib | Batas | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| `app` | `string` | **Ya** | Maks 50 char | Slug unik aplikasi (contoh: `snackloop`, `wedding`, `recruiter`). Harus terdaftar di `apps`. |
| `uid` | `string` | **Ya** | Maks 200 char | ID unik atau username pelapor pada aplikasi asal. Bersih dari karakter kontrol. |
| `name` | `string` | Tidak | Maks 120 char | Nama lengkap atau display name pelapor. Default: sama dengan `uid`. |
| `role` | `string` | Tidak | Maks 120 char | Role pelapor di aplikasi asal (contoh: `Owner`, `Kasir`, `Kandidat`). Default: `User`. |
| `from_url` | `url` | Tidak | Maks 2048 char | URL halaman asal pelapor saat mengalami kendala (protokol `http:` atau `https:`). |
| `new` | `string` | Tidak | `1` atau `0` | Jika `1`, browser langsung diarahkan ke form pembuatan tiket baru (`/portal/new`). |
| `auto_submit` | `string` | Tidak | `1` atau `0` | Jika `1` dan subjek/deskripsi tersedia, tiket otomatis dibuat dan diarahkan ke rincian tiket. |
| `subject` | `string` | Tidak | Maks 200 char | Judul awal kendala untuk prefill form atau auto-submit. |
| `description`| `string` | Tidak | Maks 4000 char| Rincian kendala untuk prefill form atau auto-submit. |
| `category` | `string` | Tidak | enum | Kategori kendala (`bug_error`, `account_login`, `data_transaction`, `feature_question`, `other`). |
| `priority` | `string` | Tidak | enum | Tingkat urgensi (`low`, `medium`, `high`, `urgent`). |
| `sig` | `string` | Tidak | 64 char hex | Tanda tangan HMAC-SHA256 untuk verifikasi integritas request. |
| `t` | `number` | Kondisional | UNIX timestamp | Timestamp pembuatan URL (wajib jika `sig` disertakan, masa berlaku: 15 menit). |

### Aturan Keamanan Multi-Tenant
1. **Kunci Komposit (`compositeKey`):**
   Setiap kontak disimpan dengan format:
   ```text
   {app}:{uid}
   ```
   Contoh: `snackloop:admin` tidak akan pernah bertubrukan dengan `wedding:admin`.
2. **Pembersihan Kontrol Karakter:**
   Semua masukan teks dibersihkan dari karakter kontrol ASCII (`\x00-\x1F\x7F`).
3. **Validasi URL Rujukan:**
   Parameter `from_url` divalidasi via fungsi `safeHttpUrl()` untuk mencegah serangan Open Redirect dan skema `javascript:`.

---

## 3. Koleksi PocketBase REST API

Endpoint PocketBase beroperasi di bawah prefix terbalik: `https://43.156.236.102/helpdesk-pb/api/`.

### 3.1. Koleksi `crm_users`

Menyimpan data identitas pelapor dan admin lintas aplikasi.

- **Daftar Kontak:** `GET /helpdesk-pb/api/collections/crm_users/records`
- **Pembaruan Kontak:** `PATCH /helpdesk-pb/api/collections/crm_users/records/:id`

#### Skema Record:
```json
{
  "id": "0dkzz43otpsub87",
  "composite_key": "snackloop:admin",
  "app_slug": "snackloop",
  "external_uid": "admin",
  "name": "admin",
  "email": "",
  "app_role": "Owner (Super Admin)",
  "system_role": "requester",
  "last_seen_url": "https://43.156.236.102/snackloop/#",
  "created_at": "2026-11-10 09:38:43.398Z",
  "last_active_at": "2026-11-11 06:20:50.156Z"
}
```

### 3.2. Koleksi `tickets`

Menyimpan tiket laporan kendala yang diajukan oleh pengguna atau dibuat otomatis oleh sistem.

- **Daftar Tiket:** `GET /helpdesk-pb/api/collections/tickets/records`
- **Buat Tiket Baru:** `POST /helpdesk-pb/api/collections/tickets/records`
- **Perbarui Tiket:** `PATCH /helpdesk-pb/api/collections/tickets/records/:id`

#### Parameter Filter Umum:
| Filter Query | Deskripsi |
| :--- | :--- |
| `app_id = "snackloop"` | Filter berdasarkan aplikasi asal |
| `status = "open"` | Filter tiket yang belum ditangani |
| `requester_uid = "admin"` | Filter tiket milik akun pelapor tertentu |

#### Contoh Payload Tiket Baru:
```json
{
  "ticket_number": "SNK-001",
  "app_id": "snackloop",
  "requester_id": "0dkzz43otpsub87",
  "requester_name": "admin",
  "requester_uid": "admin",
  "requester_role": "Owner (Super Admin)",
  "subject": "Kendala sinkronisasi stok otomatis saat tutup kasir",
  "description": "Saat melakukan closing shift kasir di Snackloop ERP, stok beberapa varian keripik singkong tidak otomatis terpotong di modul inventaris.",
  "category": "data_transaction",
  "priority": "high",
  "status": "open",
  "source_page_url": "https://43.156.236.102/snackloop/#",
  "created_at": "2026-11-11T06:51:34.654Z"
}
```

### 3.3. Koleksi `ticket_messages`

Menyimpan balasan diskusi, interaksi antara Superadmin dan pelapor, serta catatan internal.

- **Daftar Pesan:** `GET /helpdesk-pb/api/collections/ticket_messages/records?filter=ticket_id="iwzcs1v7gcq7f9m"&sort=created_at`
- **Kirim Balasan:** `POST /helpdesk-pb/api/collections/ticket_messages/records`

#### Hak Akses Catatan Internal:
- Pesan dengan atribut `is_internal_note: true` dilindungi oleh API Rules PocketBase dan **hanya bisa dibaca oleh Superadmin** yang terautentikasi. Pelapor umum tidak dapat menerima atau melihat catatan internal.

---

## 4. Sinkronisasi Realtime (Server-Sent Events)

Aplikasi klien berlangganan pembaruan langsung melalui rute SSE PocketBase:
```http
GET /helpdesk-pb/api/realtime
```
Setiap mutasi pada koleksi `crm_users`, `tickets`, dan `ticket_messages` memicu event broadcast secara langsung tanpa memerlukan reload halaman manual.
