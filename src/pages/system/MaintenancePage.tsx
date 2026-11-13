import React from 'react';
import { Wrench } from 'lucide-react';
import { SystemPageLayout } from '../../components/system/SystemPageLayout';

export function MaintenancePage() {
  return (
    <SystemPageLayout
      code="503"
      title="Pemeliharaan Sistem Rutin"
      description="Server VPS Helpdesk sedang dalam jendela pemeliharaan berkala atau pencadangan basis data otomatis."
      icon={<Wrench className="h-8 w-8 text-amber-600" />}
      primaryAction={{ label: 'Cek Ulang Halaman', onClick: () => window.location.reload() }}
      secondaryAction={{ label: 'Buka Portal Offline', to: '/portal' }}
      details={
        <div className="space-y-1.5 font-mono text-[11px]">
          <p className="font-semibold text-ink">Jadwal Pemeliharaan Cadangan:</p>
          <p className="text-ink-muted">Setiap hari pkl 02:00 - 02:15 WIB (Cron Job: 0 2 * * *)</p>
          <p className="text-emerald-600">Perubahan data yang Anda input saat ini tetap tersimpan aman di antrean outbox lokal.</p>
        </div>
      }
    />
  );
}
