import React from 'react';
import { Check, ShieldAlert, Zap, Layers } from 'lucide-react';
import type { AppSlaTier } from '../../types/billing';

export function ServicePlanTierSelector() {
  const tiers = [
    {
      id: 'internal',
      name: 'Internal Standar',
      slaHours: '24 Jam',
      cost: 'Rp 50.000',
      period: '/ bulan / app',
      features: [
        'Hingga 500 tiket / bulan',
        'Storage 10 MB per aplikasi',
        'Siklus tiket otomatis 7 hari',
        'Dashboard & integrasi tombol dasar',
      ],
      popular: false,
    },
    {
      id: 'pro_sla',
      name: 'Pro SLA (Urgensi Tinggi)',
      slaHours: '4 Jam',
      cost: 'Rp 150.000',
      period: '/ bulan / app',
      features: [
        'Hingga 2.500 tiket / bulan',
        'Storage 50 MB per aplikasi',
        'Alert bot Telegram real-time',
        'Prioritas antrean darurat (Urgent)',
        'Cadangan otomatis harian SQLite',
      ],
      popular: true,
    },
    {
      id: 'enterprise',
      name: 'Enterprise Dedicated Support',
      slaHours: '1 Jam',
      cost: 'Rp 350.000',
      period: '/ bulan / app',
      features: [
        'Kuota tiket tanpa batas',
        'Storage 250 MB per aplikasi',
        'Outbound Webhook HTTP POST langsung',
        'Dukungan integrasi DevOps VPS prioritas',
        'Retensi cadangan 30 hari',
      ],
      popular: false,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="border-b border-line pb-2">
        <h3 className="text-sm font-semibold text-ink">Paket Layanan & Target SLA Ekosistem</h3>
        <p className="text-xs text-ink-muted">
          Pilihan target kecepatan respons dan jatah komputasi untuk setiap aplikasi VPS yang terhubung.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tiers.map((t) => (
          <div
            key={t.id}
            className={`rounded-lg border p-5 flex flex-col justify-between transition-all ${
              t.popular
                ? 'border-ink bg-panel shadow-sm ring-1 ring-ink/10'
                : 'border-line bg-panel shadow-xs'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-sm font-bold text-ink">{t.name}</h4>
                {t.popular && (
                  <span className="rounded bg-ink text-white px-2 py-0.5 font-mono text-[10px] font-bold">
                    Rekomendasi
                  </span>
                )}
              </div>

              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-xl font-bold tracking-tight text-ink">{t.cost}</span>
                <span className="text-[11px] text-ink-muted">{t.period}</span>
              </div>
              <p className="mt-1 text-[11px] font-mono text-emerald-600 font-semibold">
                SLA Maksimal {t.slaHours}
              </p>

              <ul className="mt-4 space-y-2 border-t border-line pt-3 text-xs text-ink-muted">
                {t.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="leading-tight">{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-5 pt-3 border-t border-line">
              <button
                type="button"
                className={`w-full rounded py-1.5 text-xs font-semibold transition-all ${
                  t.popular
                    ? 'bg-ink text-white hover:opacity-90 active:scale-95'
                    : 'border border-line bg-subtle text-ink hover:border-line-strong'
                }`}
              >
                Tetapkan ke Aplikasi
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
