import React from 'react';
import { AlertOctagon, RotateCw } from 'lucide-react';
import { SystemPageLayout } from '../../components/system/SystemPageLayout';

export function ServerErrorPage() {
  const handleReload = () => {
    window.location.reload();
  };

  return (
    <SystemPageLayout
      code="500"
      title="Terjadi Kesalahan Server"
      description="Layanan backend PocketBase atau proxy Caddy mengalami kendala saat memproses permintaan ini."
      icon={<AlertOctagon className="h-8 w-8 text-red-600" />}
      primaryAction={{ label: 'Muat Ulang Halaman', onClick: handleReload }}
      secondaryAction={{ label: 'Status Server & Bantuan', to: '/admin/settings?tab=support' }}
      details={
        <dl className="space-y-1 font-mono text-[11px]">
          <div className="flex justify-between">
            <span>Service:</span>
            <span className="text-ink">PocketBase (Port 8094)</span>
          </div>
          <div className="flex justify-between">
            <span>Host:</span>
            <span className="text-ink">43.156.236.102</span>
          </div>
          <div className="flex justify-between">
            <span>Fallback:</span>
            <span className="text-emerald-600">Offline-first Cache Aktif</span>
          </div>
        </dl>
      }
    />
  );
}
