import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
  category: string;
}

const FAQS: FaqItem[] = [
  {
    category: 'Integrasi & SSO',
    question: 'Bagaimana cara kerja mekanisme peralihan 1-klik (SSO Handoff)?',
    answer:
      'Aplikasi ekosistem menyertakan tombol bantuan yang mengarahkan pengguna ke `/handoff?app={slug}&uid={uid}&name={name}&role={role}&from_url={url}`. Sistem memverifikasi kredensial serta tanda tangan HMAC-SHA256 (jika diaktifkan), lalu melakukan JIT Provisioning (pembuatan sesi instan) sehingga pelapor tidak perlu login ulang.',
  },
  {
    category: 'Integrasi & SSO',
    question: 'Mengapa identitas pengguna menggunakan Kunci Komposit (Composite Key)?',
    answer:
      'Format `{appId}:{externalUid}` (misal `snackloop:admin` vs `wedding:admin`) memastikan akun dengan username serupa di dua aplikasi berbeda tidak akan saling menimpa atau mengakses tiket aplikasi lain.',
  },
  {
    category: 'Keandalan & Offline',
    question: 'Apa yang terjadi jika jaringan atau server PocketBase terputus saat membuat tiket?',
    answer:
      'Sistem mengadopsi Outbox Pattern. Setiap pembuatan tiket atau balasan pesan segera tersimpan ke penyimpanan lokal (localStorage) dan diantrekan di outbox. Begitu server kembali online, antrean otomatis disinkronisasi ke basis data PocketBase.',
  },
  {
    category: 'Notifikasi & SLA',
    question: 'Bagaimana cara mengaktifkan alert tiket darurat ke Telegram?',
    answer:
      'Masuk ke Pengaturan > Notifikasi, aktifkan integrasi Telegram, masukkan Bot Token dan Chat ID Anda. Anda juga dapat memilih opsi "Hanya kirim notifikasi untuk tiket Darurat".',
  },
  {
    category: 'Siklus Tiket',
    question: 'Kapan tiket otomatis diarsipkan dan ditutup permanen?',
    answer:
      'Tiket yang telah ditandai Selesai (`solved`) akan otomatis beralih ke status Ditutup (`closed`) setelah rentang waktu yang ditentukan di Pengaturan > Otomasi (standar: 7 hari) jika tidak ada balasan lanjutan dari pelapor.',
  },
];

export function FaqAccordion() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <div className="rounded-lg border border-line bg-panel p-5 shadow-xs">
      <div className="flex items-center gap-2 border-b border-line pb-3">
        <HelpCircle className="h-4 w-4 text-ink" />
        <h3 className="text-sm font-semibold text-ink">Tanya Jawab Populer (FAQ)</h3>
      </div>
      <p className="mt-2 text-xs text-ink-muted">
        Pertanyaan umum seputar operasional helpdesk, integrasi handoff, dan keamanan multi-tenant.
      </p>

      <div className="mt-4 divide-y divide-line/60">
        {FAQS.map((faq, i) => {
          const isOpen = openIdx === i;
          return (
            <div key={i} className="py-3 first:pt-0 last:pb-0">
              <button
                type="button"
                onClick={() => setOpenIdx(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-3 text-left text-xs font-semibold text-ink hover:text-ink/80 transition-colors"
              >
                <span>{faq.question}</span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-ink-muted transition-transform duration-200 ${
                    isOpen ? 'rotate-180 text-ink' : ''
                  }`}
                />
              </button>

              {isOpen && (
                <div className="mt-2 text-xs text-ink-muted leading-relaxed pr-6 animate-in fade-in-50 duration-150">
                  <span className="inline-block rounded bg-subtle px-1.5 py-0.5 font-mono text-[10px] text-ink-muted mb-1.5">
                    {faq.category}
                  </span>
                  <p>{faq.answer}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
