import React from 'react';
import { PhoneCall, ShieldAlert, Terminal, Mail, Server } from 'lucide-react';

export function ContactEscalationCard() {
  return (
    <div className="rounded-lg border border-line bg-panel p-5 shadow-xs">
      <div className="flex items-center gap-2 border-b border-line pb-3">
        <PhoneCall className="h-4 w-4 text-ink" />
        <h3 className="text-sm font-semibold text-ink">Kontak Eskalasi Darurat & Tim DevOps VPS</h3>
      </div>
      <p className="mt-2 text-xs text-ink-muted">
        Gunakan saluran eskalasi ini jika terjadi insiden sistemik kritis (misal server down total atau kegagalan basis data).
      </p>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="rounded border border-line bg-canvas p-3.5 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-ink">
            <Server className="h-4 w-4 text-blue-600" />
            <span>Host Server Produksi</span>
          </div>
          <p className="font-mono text-[11px] text-ink">43.156.236.102</p>
          <p className="text-[10px] text-ink-muted">Port SSH: 2222 · User: ubuntu</p>
        </div>

        <div className="rounded border border-line bg-canvas p-3.5 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-ink">
            <Mail className="h-4 w-4 text-emerald-600" />
            <span>Email Tim DevOps</span>
          </div>
          <p className="font-mono text-[11px] text-ink">devops@crm.local</p>
          <p className="text-[10px] text-ink-muted">Waktu respons insiden: &lt; 30 menit</p>
        </div>

        <div className="rounded border border-line bg-canvas p-3.5 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-ink">
            <Terminal className="h-4 w-4 text-amber-600" />
            <span>PocketBase Service</span>
          </div>
          <p className="font-mono text-[11px] text-ink">127.0.0.1:8094</p>
          <p className="text-[10px] text-ink-muted">Reverse proxy Caddy: /helpdesk-pb/</p>
        </div>
      </div>
    </div>
  );
}
