import React from 'react';
import { Compass } from 'lucide-react';
import { SystemPageLayout } from '../../components/system/SystemPageLayout';

export function NotFoundPage() {
  return (
    <SystemPageLayout
      code="404"
      title="Halaman Tidak Ditemukan"
      description="Halaman yang Anda tuju mungkin telah dipindahkan, diarsipkan, atau alamat URL yang dimasukkan salah."
      icon={<Compass className="h-8 w-8 text-ink" />}
      primaryAction={{ label: 'Kembali ke Beranda', to: '/' }}
      secondaryAction={{ label: 'Buka Daftar Tiket', to: '/admin/tickets' }}
    />
  );
}
