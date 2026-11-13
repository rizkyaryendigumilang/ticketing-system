import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { SystemPageLayout } from '../../components/system/SystemPageLayout';

export function ForbiddenPage() {
  return (
    <SystemPageLayout
      code="403"
      title="Akses Ditolak"
      description="Anda tidak memiliki izin (otoritas peran) untuk membuka halaman atau melakukan tindakan ini."
      icon={<ShieldAlert className="h-8 w-8 text-amber-600" />}
      primaryAction={{ label: 'Kembali ke Meja Kerja', to: '/admin' }}
      secondaryAction={{ label: 'Buka Portal Pelapor', to: '/portal' }}
      details={
        <div className="space-y-1">
          <p className="font-semibold text-ink">Catatan Keamanan:</p>
          <p>
            Catatan internal, manajemen HMAC, dan konfigurasi sistem terbatas hanya untuk peran Superadmin dan Supervisor berwenang.
          </p>
        </div>
      }
    />
  );
}
