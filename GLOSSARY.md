# Domain Glossary — VPS Helpdesk CRM

Kamus istilah dan pemodelan domain terpadu untuk sistem Helpdesk & Ticketing CRM VPS.

---

## 1. Identitas & Autentikasi

### Composite Key (Kunci Komposit)
Format string unik yang menggabungkan slug aplikasi dan ID eksternal pengguna:
```text
{app_slug}:{external_uid}
Contoh: "snackloop:admin", "wedding:admin", "recruiter:recruiter1"
```
Mencegah tabrakan identitas jika ada username yang sama di dua aplikasi berbeda (misalnya akun `admin` di Snackloop berbeda dari `admin` di Wedding Planner).

### Just-In-Time (JIT) Provisioning
Pola pembuatan dan pembaruan akun pengguna secara otomatis saat pengguna pertama kali mengakses rute `/handoff`. Pengguna tidak perlu mendaftar manual atau mengingat kata sandi terpisah.

### SSO Handoff
Mekanisme peralihan 1-klik dari aplikasi asal ke Helpdesk via URL terstandarisasi:
```text
/handoff?app={slug}&uid={uid}&name={name}&role={role}&from_url={url}&new=1
```
Mendukung parameter tambahan `auto_submit=1`, `subject`, `description`, `category`, dan `priority` untuk langsung membuat tiket tanpa mengisi formulir ulang di portal.

### HMAC-SHA256 Signature
Tanda tangan kriptografis opsional pada URL handoff untuk mencegah pemalsuan identitas (*anti-spoofing*). Ditandai dengan parameter `ts` (UNIX timestamp) dan `sig = HMAC_SHA256(app:uid:ts, secret)` dengan masa berlaku 15 menit.

---

## 2. Struktur Data Tiket

### Ticket Lifecycle (Siklus Status Tiket)
1. **Baru (`open`)**: Tiket baru masuk dan belum ditanggapi oleh Superadmin. Memiliki prioritas antrean teratas.
2. **Diproses (`in_progress`)**: Sedang diselidiki atau ditangani oleh Superadmin.
3. **Menunggu Balasan (`waiting_on_user`)**: Superadmin telah mengirim balasan dan menunggu tanggapan atau konfirmasi dari pelapor.
4. **Selesai (`solved`)**: Masalah telah teratasi oleh Superadmin atau ditandai selesai oleh pelapor.
5. **Ditutup (`closed`)**: Tiket telah diarsipkan dan tidak menerima balasan baru.

### Ticket Priority (Tingkat Urgensi)
- **`urgent` (Kritis/Darurat)**: Gangguan fatal yang menghentikan operasional (misal kasir mati total).
- **`high` (Tinggi)**: Error fitur penting tanpa solusi alternatif langsung.
- **`medium` (Normal)**: Kendala operasional standar dengan dampak terkontrol.
- **`low` (Rendah)**: Pertanyaan fitur, saran kosmetik, atau perbaikan minor.

### Ticket Category (Kategori Masalah)
- `bug_error`: Bug atau error sistem/aplikasi.
- `data_transaction`: Masalah transaksi, kasir, struk, atau laporan keuangan.
- `account_login`: Hak akses, sesi login, atau autentikasi akun.
- `feature_question`: Pertanyaan atau panduan penggunaan fitur.
- `other`: Masalah umum atau kendala lainnya.

---

## 3. Komunikasi & Arsitektur

### Internal Note (Catatan Internal)
Pesan dalam tiket dengan tanda `isInternalNote: true`. Catatan ini hanya tersimpan di database CRM dan **hanya terlihat oleh Superadmin**. Pelapor di portal pengguna tidak pernah menerima catatan ini.

### Canned Response (Template Balasan Cepat)
Daftar respons terstandarisasi yang dapat disisipkan Superadmin ke dalam editor balasan dengan 1 klik atau pencarian cepat.

### CSAT (Customer Satisfaction Rating)
Nilai kepuasan layanan bintang 1 hingga 5 serta ulasan opsional yang diberikan pelapor setelah tiket berstatus *Selesai* (`solved`).

### Outbox Pattern (Sinkronisasi Offline-First)
Arsitektur di mana setiap aksi perubahan (*create/update/delete*) langsung disimpan ke penyimpanan lokal dan dimasukkan ke antrean outbox terlebih dahulu, lalu di-flush ke PocketBase saat koneksi server aktif.
