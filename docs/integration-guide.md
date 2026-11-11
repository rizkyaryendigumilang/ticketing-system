# Panduan Integrasi Aplikasi — VPS Helpdesk CRM

Panduan praktis bagi developer yang ingin menghubungkan aplikasi baru atau aplikasi ekosistem VPS ke **VPS Helpdesk CRM**.

---

## 1. Prasyarat Integrasi

Sebelum menghubungkan aplikasi:
1. Pastikan aplikasi Anda sudah memiliki slug terdaftar di `VPS_APPS` (pada `src/config/vpsAppsConfig.ts`) atau tambahkan slug baru.
2. Identifikasi username/ID unik pengguna dan role pada aplikasi Anda.

---

## 2. Pola Integrasi: Tautan Langsung (Direct Link)

Cara paling sederhana untuk menyematkan tombol bantuan di navbar atau menu pengaturan aplikasi Anda.

### Kode Vanilla JavaScript
```javascript
function bukaHelpdeskPortal() {
  const HELPDESK_BASE = 'https://43.156.236.102/helpdesk/handoff';

  // Ambil sesi user aktif dari aplikasi Anda
  const currentUser = {
    appSlug: 'snackloop', // Ganti dengan slug aplikasi Anda
    uid: String(window.currentUserId || 'guest_user'),
    name: String(window.currentUserName || 'Pengguna Aplikasi'),
    role: String(window.currentUserRole || 'User'),
    fromUrl: window.location.href,
  };

  const params = new URLSearchParams({
    app: currentUser.appSlug,
    uid: currentUser.uid,
    name: currentUser.name,
    role: currentUser.role,
    from_url: currentUser.fromUrl,
  });

  // Buka portal pelapor di tab baru
  window.open(`${HELPDESK_BASE}?${params.toString()}`, '_blank', 'noopener,noreferrer');
}
```

---

## 3. Pola Integrasi: Form Lapor Kendala Cepat (Modal Auto-Submit)

Jika Anda ingin pengguna mengetik keluhan langsung di dalam aplikasi Anda tanpa membuka formulir kosong terlebih dahulu:

### Contoh Fungsi Lapor Kendala Cepat
```javascript
async function kirimTiketLangsung({ subject, description, category = 'bug_error', isUrgent = false }) {
  const HELPDESK_BASE = 'https://43.156.236.102/helpdesk/handoff';

  const params = new URLSearchParams({
    app: 'snackloop',
    uid: String(window.currentUserId || 'user_123'),
    name: String(window.currentUserName || 'Budi'),
    role: String(window.currentUserRole || 'Kasir'),
    from_url: window.location.href,
    new: '1',
    auto_submit: '1', // Tiket langsung dibuat otomatis oleh sistem helpdesk
    subject: subject.slice(0, 200),
    description: description.slice(0, 2500),
    category: category,
    priority: isUrgent ? 'urgent' : 'medium',
  });

  const targetUrl = `${HELPDESK_BASE}?${params.toString()}`;

  // Buka jendela baru yang langsung menampilkan tiket yang berhasil dibuat
  window.open(targetUrl, '_blank', 'noopener,noreferrer');
}
```

---

## 4. Troubleshooting & FAQ

### Kendala 1: Jendela Terblokir oleh Browser (Popup Blocker)
- **Gejala:** Tombol diklik tetapi tidak ada tab baru yang terbuka.
- **Penyebab:** Pemanggilan `window.open()` dilakukan di luar callback interaksi klik pengguna langsung (misalnya setelah `await async` yang lama).
- **Solusi:** Buka jendela terlebih dahulu dengan placeholder atau gunakan elemen `<a target="_blank" href="...">` langsung.

### Kendala 2: User Tidak Bisa Melihat Tiket Miliknya
- **Gejala:** Portal menampilkan `0 tiket aktif` padahal user sudah pernah membuat laporan.
- **Penyebab:** Perbedaan nilai `uid` yang dikirim antar sesi (misalnya menggunakan random guest ID alih-alih ID login tetap).
- **Solusi:** Pastikan parameter `uid` konsisten untuk pengguna yang sama di setiap panggilan handoff.
