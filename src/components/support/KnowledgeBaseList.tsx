import React, { useState } from 'react';
import { BookOpen, Search, ExternalLink, ArrowRight } from 'lucide-react';
import { VPS_APPS } from '../../config/vpsAppsConfig';

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
];

export function KnowledgeBaseList() {
  const [search, setSearch] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<KbArticle | null>(null);

  const filtered = KB_ARTICLES.filter(
    (a) =>
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.summary.toLowerCase().includes(search.toLowerCase()) ||
      a.appId.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="rounded-lg border border-line bg-panel p-5 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-ink" />
          <h3 className="text-sm font-semibold text-ink">Basis Pengetahuan & Panduan Solusi (Knowledge Base)</h3>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-muted" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari artikel solusi..."
            className="w-full rounded border border-line bg-canvas py-1.5 pl-8 pr-3 text-xs text-ink focus:border-ink focus:outline-none"
          />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map((art) => {
          const app = VPS_APPS.find((a) => a.id === art.appId);
          return (
            <div
              key={art.id}
              onClick={() => setSelectedArticle(art)}
              className="rounded-lg border border-line bg-canvas p-4 text-xs flex flex-col justify-between hover:border-line-strong transition-all cursor-pointer group"
            >
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="rounded px-1.5 py-0.5 font-mono text-[10px] font-bold border"
                    style={{
                      backgroundColor: `${app?.color ?? '#888'}15`,
                      borderColor: `${app?.color ?? '#888'}40`,
                      color: app?.color ?? '#141413',
                    }}
                  >
                    {app?.prefix ?? art.appId}
                  </span>
                  <span className="text-[11px] font-mono text-ink-muted">{app?.name}</span>
                </div>
                <h4 className="font-bold text-ink group-hover:underline leading-snug">
                  {art.title}
                </h4>
                <p className="mt-1.5 text-ink-muted text-[11px] leading-relaxed line-clamp-2">
                  {art.summary}
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-line/60 flex items-center justify-between text-[11px] text-ink font-semibold">
                <span>Baca Panduan Langkah</span>
                <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Article Detail Modal */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl border border-line bg-panel p-6 shadow-xl text-xs space-y-4">
            <div className="flex items-start justify-between gap-3 border-b border-line pb-3">
              <div>
                <span className="rounded bg-subtle px-2 py-0.5 font-mono text-[10px] font-bold text-ink">
                  {selectedArticle.appId.toUpperCase()}
                </span>
                <h3 className="mt-1 text-sm font-bold text-ink leading-snug">
                  {selectedArticle.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedArticle(null)}
                className="rounded p-1 text-ink-muted hover:text-ink hover:bg-subtle"
              >
                ✕
              </button>
            </div>

            <p className="text-ink-muted leading-relaxed">{selectedArticle.summary}</p>

            <div className="space-y-2 border-t border-line pt-3">
              <p className="font-semibold text-ink">Instruksi Penyelesaian Langkah Demi Langkah:</p>
              <ol className="list-decimal pl-4 space-y-1.5 text-ink-muted">
                {selectedArticle.steps.map((st, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {st}
                  </li>
                ))}
              </ol>
            </div>

            <div className="flex justify-end pt-3 border-t border-line">
              <button
                type="button"
                onClick={() => setSelectedArticle(null)}
                className="rounded bg-ink px-4 py-1.5 font-semibold text-white shadow-xs hover:opacity-90"
              >
                Tutup Panduan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
