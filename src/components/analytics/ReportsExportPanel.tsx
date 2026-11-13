import React, { useState } from 'react';
import { Download, FileSpreadsheet, FileJson, Calendar } from 'lucide-react';
import { formatTicketsCsv } from '../../services/crmLogic';
import type { Ticket } from '../../types/crm';
import { VPS_APPS } from '../../config/vpsAppsConfig';
import { useToast } from '../../context/ToastContext';

interface ReportsExportPanelProps {
  tickets: Ticket[];
}

export function ReportsExportPanel({ tickets }: ReportsExportPanelProps) {
  const toast = useToast();
  const [selectedApp, setSelectedApp] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<number>(30); // days

  const filteredTickets = tickets.filter((t) => {
    if (selectedApp !== 'all' && t.appId !== selectedApp) return false;
    const daysAgo = (Date.now() - new Date(t.createdAt).getTime()) / (1000 * 3600 * 24);
    return daysAgo <= selectedPeriod;
  });

  const handleExportCsv = () => {
    if (filteredTickets.length === 0) {
      toast.error('Tidak ada tiket yang cocok dengan kriteria filter.');
      return;
    }
    const csvContent = formatTicketsCsv(filteredTickets);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laporan-tiket-${selectedApp}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Ekspor CSV ${filteredTickets.length} tiket berhasil diunduh.`);
  };

  const handleExportJson = () => {
    if (filteredTickets.length === 0) {
      toast.error('Tidak ada tiket yang cocok dengan kriteria filter.');
      return;
    }
    const jsonBlob = new Blob([JSON.stringify(filteredTickets, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(jsonBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laporan-tiket-${selectedApp}-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Ekspor JSON ${filteredTickets.length} tiket berhasil diunduh.`);
  };

  return (
    <div className="rounded-lg border border-line bg-panel p-5 shadow-xs">
      <div className="flex items-center gap-2 border-b border-line pb-3">
        <FileSpreadsheet className="h-4 w-4 text-ink" />
        <h3 className="text-sm font-semibold text-ink">Ekspor Laporan & Data Analitik</h3>
      </div>
      <p className="mt-2 text-xs text-ink-muted">
        Unduh berkas laporan tiket dengan rentang tanggal dan filter aplikasi tertentu untuk kebutuhan audit atau integrasi spreadsheet eksternal.
      </p>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div>
          <label className="block font-medium text-ink mb-1">Filter Aplikasi</label>
          <select
            value={selectedApp}
            onChange={(e) => setSelectedApp(e.target.value)}
            className="w-full rounded border border-line bg-canvas px-3 py-2 text-ink focus:border-ink focus:outline-none"
          >
            <option value="all">Seluruh 7 Aplikasi VPS</option>
            {VPS_APPS.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-medium text-ink mb-1">Rentang Waktu</label>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(Number(e.target.value))}
            className="w-full rounded border border-line bg-canvas px-3 py-2 text-ink focus:border-ink focus:outline-none"
          >
            <option value={7}>7 Hari Terakhir</option>
            <option value={14}>14 Hari Terakhir</option>
            <option value={30}>30 Hari Terakhir</option>
            <option value={90}>90 Hari Terakhir</option>
            <option value={365}>1 Tahun Terakhir</option>
          </select>
        </div>

        <div className="flex items-end gap-2">
          <button
            type="button"
            onClick={handleExportCsv}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded bg-ink px-3 py-2 font-semibold text-white shadow-xs hover:opacity-90 active:scale-95 transition-all"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Ekspor CSV</span>
          </button>

          <button
            type="button"
            onClick={handleExportJson}
            className="inline-flex items-center justify-center gap-1.5 rounded border border-line bg-subtle px-3 py-2 font-medium text-ink hover:border-line-strong active:scale-95 transition-all"
            title="Ekspor JSON"
          >
            <FileJson className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
