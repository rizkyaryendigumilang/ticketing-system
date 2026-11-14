import React from 'react';
import { X, Printer, ShieldCheck, Award, Clock, CheckCircle2, TrendingUp, AlertCircle } from 'lucide-react';
import { VPS_APPS } from '../../config/vpsAppsConfig';
import type { Ticket } from '../../types/crm';
import { computeTicketSla } from '../../services/crmLogic';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  tickets: Ticket[];
}

export function ExecutiveReportModal({ isOpen, onClose, tickets }: Props) {
  if (!isOpen) return null;

  const total = tickets.length;
  const solved = tickets.filter((t) => t.status === 'solved' || t.status === 'closed');
  const active = tickets.filter((t) => t.status === 'open' || t.status === 'in_progress' || t.status === 'waiting_on_user');

  let breachedCount = 0;
  tickets.forEach((t) => {
    if (computeTicketSla(t).status === 'breached') breachedCount++;
  });
  const slaCompliance = total > 0 ? Math.round(((total - breachedCount) / total) * 100) : 100;

  const ratedTickets = tickets.filter((t) => typeof t.satisfactionRating === 'number' && t.satisfactionRating > 0);
  const avgCsat = ratedTickets.length > 0
    ? (ratedTickets.reduce((sum, t) => sum + (t.satisfactionRating ?? 5), 0) / ratedTickets.length).toFixed(1)
    : '5.0';

  const nowStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white animate-fade-in">
      <div className="relative w-full max-w-3xl rounded-2xl border border-line bg-panel p-6 sm:p-8 shadow-2xl overflow-hidden print:border-none print:shadow-none print:w-full print:max-w-none text-ink">
        {/* Top Control Bar (Hidden when printing) */}
        <div className="flex items-center justify-between border-b border-line pb-4 mb-6 print:hidden">
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-ink px-2.5 py-1 text-xs font-bold text-canvas">LAPORAN RESMI</span>
            <span className="text-xs text-ink-muted">Format Eksekutif Standar ISO/ITIL</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-xl bg-ink px-3.5 py-2 text-xs font-semibold text-canvas shadow-xs hover:bg-ink/90 active:scale-95 transition-all"
            >
              <Printer className="h-4 w-4" />
              <span>Cetak / Simpan PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-line p-2 text-ink-muted hover:text-ink hover:bg-subtle transition-colors"
              aria-label="Tutup Modal"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Printable Executive Document Area */}
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-line pb-6">
            <div>
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-ink flex items-center justify-center text-white font-bold text-sm">
                  H
                </div>
                <h1 className="text-xl font-bold tracking-tight text-ink">
                  VPS Helpdesk CRM — Ringkasan Eksekutif
                </h1>
              </div>
              <p className="mt-1 text-xs text-ink-muted">
                Laporan Kinerja Operasional Layanan Terpadu Multi-Aplikasi VPS
              </p>
            </div>
            <div className="text-right text-xs">
              <span className="text-ink-muted block">Tanggal Terbit</span>
              <span className="font-semibold text-ink font-mono">{nowStr}</span>
            </div>
          </div>

          {/* 4 Core Executive Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border border-line bg-canvas/60 p-4">
              <span className="text-[11px] font-medium text-ink-muted block mb-1">Total Tiket Masuk</span>
              <span className="text-2xl font-bold text-ink tabular-nums">{total}</span>
              <span className="text-[10px] text-ink-muted block mt-1">{active.length} aktif saat ini</span>
            </div>

            <div className="rounded-xl border border-line bg-canvas/60 p-4">
              <span className="text-[11px] font-medium text-ink-muted block mb-1">Kepatuhan SLA</span>
              <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                {slaCompliance}%
              </span>
              <span className="text-[10px] text-ink-muted block mt-1">{breachedCount} terlewat batas</span>
            </div>

            <div className="rounded-xl border border-line bg-canvas/60 p-4">
              <span className="text-[11px] font-medium text-ink-muted block mb-1">Tiket Selesai</span>
              <span className="text-2xl font-bold text-ink tabular-nums">{solved.length}</span>
              <span className="text-[10px] text-ink-muted block mt-1">
                {total > 0 ? Math.round((solved.length / total) * 100) : 0}% resolusi
              </span>
            </div>

            <div className="rounded-xl border border-line bg-canvas/60 p-4">
              <span className="text-[11px] font-medium text-ink-muted block mb-1">Indeks CSAT</span>
              <span className="text-2xl font-bold text-amber-500 tabular-nums">★ {avgCsat}</span>
              <span className="text-[10px] text-ink-muted block mt-1">{ratedTickets.length} ulasan pelapor</span>
            </div>
          </div>

          {/* Application Breakdown Table */}
          <div>
            <h2 className="text-xs font-semibold text-ink uppercase tracking-wider mb-2.5">
              Matriks Kinerja Per Aplikasi Ekosistem
            </h2>
            <div className="rounded-xl border border-line overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-line bg-subtle/50 text-[11px] font-semibold text-ink-muted">
                    <th className="py-2.5 px-3">Nama Aplikasi</th>
                    <th className="py-2.5 px-3">Kode Prefix</th>
                    <th className="py-2.5 px-3 text-center">Total Tiket</th>
                    <th className="py-2.5 px-3 text-center">SLA Terlewat</th>
                    <th className="py-2.5 px-3 text-right">Status Kesehatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60">
                  {VPS_APPS.map((app) => {
                    const appTickets = tickets.filter((t) => t.appId === app.id);
                    const appBreached = appTickets.filter((t) => computeTicketSla(t).status === 'breached').length;
                    const health = appBreached === 0 ? 'Optimal' : appBreached < 3 ? 'Waspada' : 'Kritis';
                    const healthColor =
                      health === 'Optimal'
                        ? 'text-emerald-600 bg-emerald-500/10'
                        : health === 'Waspada'
                          ? 'text-amber-600 bg-amber-500/10'
                          : 'text-rose-600 bg-rose-500/10';

                    return (
                      <tr key={app.id} className="hover:bg-subtle/30">
                        <td className="py-2.5 px-3 font-medium text-ink">{app.name}</td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-ink-muted">{app.prefix}</td>
                        <td className="py-2.5 px-3 text-center tabular-nums font-semibold">{appTickets.length}</td>
                        <td className="py-2.5 px-3 text-center tabular-nums text-ink-muted">{appBreached}</td>
                        <td className="py-2.5 px-3 text-right">
                          <span className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-semibold ${healthColor}`}>
                            {health}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Compliance & Operational Insights */}
          <div className="rounded-xl border border-line bg-canvas/40 p-4 space-y-2 text-xs">
            <h3 className="font-semibold text-ink flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <span>Kesimpulan & Kepatuhan Tata Kelola</span>
            </h3>
            <p className="text-ink-muted leading-relaxed">
              Sistem beroperasi dengan kepatuhan SLA {slaCompliance}%. Seluruh alur handoff pelapor terenkripsi menggunakan HMAC signature, dan data tiket terisolasi per aplikasi (Multi-tenant isolation).
            </p>
          </div>

          {/* Document Sign-off Footer */}
          <div className="border-t border-line pt-6 flex items-center justify-between text-[11px] text-ink-muted">
            <span>VPS Helpdesk CRM · Server Produksi 43.156.236.102</span>
            <span>Dokumen digenerate secara otomatis oleh sistem</span>
          </div>
        </div>
      </div>
    </div>
  );
}
