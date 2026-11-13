import React, { useState } from 'react';
import { Receipt, Download, FileText } from 'lucide-react';
import type { InfrastructureInvoice } from '../../types/billing';
import { useToast } from '../../context/ToastContext';

interface CostAttributionInvoiceProps {
  invoices: InfrastructureInvoice[];
}

export function CostAttributionInvoice({ invoices }: CostAttributionInvoiceProps) {
  const toast = useToast();
  const [selectedInvoice, setSelectedInvoice] = useState<InfrastructureInvoice | null>(
    invoices[0] || null,
  );

  const handleDownloadInvoice = (inv: InfrastructureInvoice) => {
    const content = `FAKTUR ATRIBUSI BIAYA VPS HELPDESK CRM
Nomor: ${inv.invoiceNumber}
Periode: ${inv.period}
Aplikasi: ${inv.appName} (${inv.appId})
Host Server: 43.156.236.102 (PocketBase :8094)
-----------------------------------------------------------
RINCIAN BIAYA INFRASTRUKTUR:
${inv.items.map((it) => `- ${it.description.padEnd(45, ' ')} : Rp ${it.amountRp.toLocaleString('id-ID')}`).join('\n')}
-----------------------------------------------------------
TOTAL ATRIBUSI BULAN INI : Rp ${inv.totalRp.toLocaleString('id-ID')}
Status: TERATRIBUSIKAN KE ANGGARAN VPS INTERNAL
`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `faktur-${inv.invoiceNumber}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Faktur ${inv.invoiceNumber} berhasil diunduh.`);
  };

  return (
    <div className="rounded-lg border border-line bg-panel p-5 shadow-xs">
      <div className="flex items-center gap-2 border-b border-line pb-3">
        <Receipt className="h-4 w-4 text-ink" />
        <h3 className="text-sm font-semibold text-ink">
          Laporan Atribusi Biaya Infrastruktur (Internal Invoice)
        </h3>
      </div>
      <p className="mt-2 text-xs text-ink-muted">
        Rincian beban pemakaian resource server VPS (komputasi, RAM, cadangan storage) yang dialokasikan ke masing-masing aplikasi ekosistem.
      </p>

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Invoice List */}
        <div className="space-y-2 lg:border-r border-line lg:pr-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">
            Daftar Tagihan Internal
          </p>
          <div className="space-y-1.5">
            {invoices.map((inv) => {
              const isSelected = selectedInvoice?.invoiceNumber === inv.invoiceNumber;
              return (
                <button
                  key={inv.invoiceNumber}
                  type="button"
                  onClick={() => setSelectedInvoice(inv)}
                  className={`w-full text-left p-2.5 rounded border transition-all text-xs ${
                    isSelected
                      ? 'border-ink bg-subtle font-semibold text-ink shadow-2xs'
                      : 'border-line/60 bg-canvas text-ink-muted hover:border-line hover:text-ink'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px]">{inv.invoiceNumber}</span>
                    <span className="font-bold text-ink">
                      Rp {inv.totalRp.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="mt-1 text-[11px] text-ink-muted flex items-center justify-between">
                    <span>{inv.appName}</span>
                    <span>{inv.period}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Invoice Detail */}
        {selectedInvoice && (
          <div className="lg:col-span-2 rounded border border-line bg-canvas p-4 text-xs flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between border-b border-line pb-3">
                <div>
                  <h4 className="font-bold text-ink text-sm">Faktur Atribusi Biaya VPS</h4>
                  <p className="font-mono text-[11px] text-ink-muted mt-0.5">
                    {selectedInvoice.invoiceNumber} · {selectedInvoice.period}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDownloadInvoice(selectedInvoice)}
                  className="inline-flex items-center gap-1.5 rounded bg-ink px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:opacity-90 active:scale-95 transition-all"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Unduh Dokumen</span>
                </button>
              </div>

              <dl className="grid grid-cols-2 gap-3 py-3 border-b border-line text-[11px] font-mono">
                <div>
                  <dt className="text-ink-muted">Aplikasi Ekosistem:</dt>
                  <dd className="font-bold text-ink">{selectedInvoice.appName}</dd>
                </div>
                <div>
                  <dt className="text-ink-muted">Host Server:</dt>
                  <dd className="font-bold text-ink">43.156.236.102 (Port SSH 2222)</dd>
                </div>
              </dl>

              {/* Line items */}
              <div className="mt-3 space-y-2">
                <p className="text-[11px] font-semibold text-ink">Rincian Komponen:</p>
                <div className="space-y-1.5">
                  {selectedInvoice.items.map((it, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs py-1 border-b border-line/40 last:border-none"
                    >
                      <span className="text-ink-muted">{it.description}</span>
                      <span className="font-mono font-semibold text-ink">
                        Rp {it.amountRp.toLocaleString('id-ID')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-line flex items-center justify-between">
              <span className="text-xs font-bold text-ink">Total Pembebanan Biaya:</span>
              <span className="font-mono text-base font-bold text-ink">
                Rp {selectedInvoice.totalRp.toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
