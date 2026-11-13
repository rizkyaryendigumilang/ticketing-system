import React from 'react';
import { Clock, LogIn, ArrowLeft } from 'lucide-react';
import { SystemPageLayout } from '../../components/system/SystemPageLayout';

export function SessionExpiredPage() {
  return (
    <SystemPageLayout
      code="AUTH-EXP"
      title="Sesi Akses Telah Kedaluwarsa"
      description="Tanda tangan kriptografis (HMAC-SHA256) atau sesi autentikasi Anda telah melewati batas waktu berlaku (15 menit)."
      icon={<Clock className="h-8 w-8 text-amber-600" />}
      primaryAction={{ label: 'Masuk Ulang (Login)', to: '/login' }}
      secondaryAction={{ label: 'Buka Portal Bantuan', to: '/portal' }}
      details={
        <div className="space-y-1 text-ink-muted leading-relaxed">
          <p className="font-semibold text-ink">Mengapa ini terjadi?</p>
          <p>
            Untuk mencegah pemalsuan identitas (*anti-spoofing*), URL handoff dari aplikasi VPS memiliki masa aktif terbatas. Silakan klik kembali tombol bantuan di aplikasi asal untuk memperbarui sesi.
          </p>
        </div>
      }
    />
  );
}
