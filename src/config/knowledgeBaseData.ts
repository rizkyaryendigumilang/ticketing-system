export interface KbArticle {
  id: string;
  appId: string;
  title: string;
  summary: string;
  steps: string[];
}

export const KB_ARTICLES: KbArticle[] = [
  {
    id: 'kb-snk-01',
    appId: 'snackloop',
    title: 'Troubleshooting Printer Bluetooth Kasir POS Tidak Merespons',
    summary: 'Langkah mendiagnosis kegagalan cetak struk kasir saat transaksi sedang padat.',
    steps: [
      'Pastikan modul Bluetooth pada tablet POS aktif dan terhubung ke perangkat printer.',
      'Matikan printer kasir selama 5 detik, lalu nyalakan kembali.',
      'Buka Pengaturan SnackLoop POS > Perangkat Keras > Uji Cetak Struk Uji Coba.',
      'Jika struk tetap tidak keluar, periksa ketersediaan kertas thermal.',
    ],
  },
  {
    id: 'kb-rec-01',
    appId: 'recruiter',
    title: 'Mengatasi Gagal Unggah Berkas Resume/CV Kandidat (>5MB)',
    summary: 'Standar format dan pembatasan ukuran berkas lamaran pada platform rekrutmen.',
    steps: [
      'Format yang diterima sistem adalah PDF, DOCX, dan RTF.',
      'Ukuran maksimal per dokumen yang diizinkan sistem VPS adalah 5.0 MB.',
      'Kompres file PDF melalui alat kompresi sebelum mengunggah kembali.',
    ],
  },
  {
    id: 'kb-kpt-01',
    appId: 'kept',
    title: 'Prosedur Pemulihan Kunci Enkripsi Dokumen KEPT Vault',
    summary: 'Langkah aman memulihkan akses berkas saat frase sandi cadangan hilang.',
    steps: [
      'Gunakan berkas kunci darurat (.key) yang diunduh saat inisialisasi brankas pertama kali.',
      'Unggah kunci cadangan melalui menu Pengaturan Vault > Pulihkan Kunci.',
      'Jangan pernah membagikan frase kunci ke pihak ketiga melalui chat atau tiket publik.',
    ],
  },
  {
    id: 'kb-wed-01',
    appId: 'wedding',
    title: 'Sinkronisasi Buku Tamu Digital & QR Code Check-in',
    summary: 'Memastikan daftar tamu undangan terbarui saat lokasi memiliki koneksi lambat.',
    steps: [
      'Sebelum acara dimulai, lakukan sinkronisasi data offline di menu Buku Tamu.',
      'Gunakan pemindai kamera web lokal untuk verifikasi QR tamu tanpa akses internet.',
      'Setelah acara selesai dan koneksi tersedia, tekan tombol "Kirim Data Offline".',
    ],
  },
  {
    id: 'kb-lfp-01',
    appId: 'life-planner',
    title: 'Sinkronisasi Jadwal Kalender & Target Harian',
    summary: 'Memperbaiki jadwal kalender yang tidak muncul di dashboard ringkasan.',
    steps: [
      'Periksa apakah filter tanggal pada Life Planner diset ke minggu berjalan.',
      'Lakukan refresh sesi akun jika baru saja berganti zona waktu.',
      'Pastikan izin sinkronisasi kalender browser diaktifkan.',
    ],
  },
  {
    id: 'kb-end-01',
    appId: 'ai-endurance',
    title: 'Kalibrasi Sensor Detak Jantung & GPS Rute',
    summary: 'Mencegah pembacaan data olahraga yang terputus saat sesi latihan luar ruangan.',
    steps: [
      'Pastikan sensor smartwatch terpasang rapat pada pergelangan tangan.',
      'Nyalakan akurasi tinggi GPS pada smartphone sebelum menekan tombol Mulai.',
      'Keluarkan aplikasi dari mode hemat daya ekstrem di pengaturan sistem ponsel.',
    ],
  },
  {
    id: 'kb-dsk-01',
    appId: 'diskon-bot',
    title: 'Pengaturan Notifikasi Flash Sale & Diskon Kupon',
    summary: 'Menyesuaikan kata kunci produk agar bot Telegram hanya mengirim promo relevan.',
    steps: [
      'Ketik perintah /filter di chat bot untuk melihat aturan filter aktif.',
      'Tambahkan minimal persentase diskon (misal: /diskon min 50%).',
      'Matikan notifikasi kategori yang tidak Anda minati di menu Pengaturan Bot.',
    ],
  },
];
