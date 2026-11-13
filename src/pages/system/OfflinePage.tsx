import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { SystemPageLayout } from '../../components/system/SystemPageLayout';
import { getOutbox, subscribeStore } from '../../services/storageService';
import { flush } from '../../services/pbClient';
import { useToast } from '../../context/ToastContext';

export function OfflinePage() {
  const toast = useToast();
  const [outboxCount, setOutboxCount] = useState(getOutbox().length);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    return subscribeStore(() => {
      setOutboxCount(getOutbox().length);
    });
  }, []);

  const handleManualSync = async () => {
    setSyncing(true);
    try {
      await flush();
      toast.success('Pemeriksaan koneksi server selesai.');
    } catch {
      toast.error('Server belum dapat dijangkau. Data tetap aman di outbox.');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <SystemPageLayout
      code="OFFLINE"
      title="Mode Luring Aktif (Offline)"
      description="Koneksi ke backend server terputus. Anda tetap dapat membaca tiket, membuat tiket baru, dan menulis balasan pesan."
      icon={<WifiOff className="h-8 w-8 text-amber-600" />}
      primaryAction={{
        label: syncing ? 'Menghubungkan...' : 'Sinkronkan Sekarang',
        onClick: handleManualSync,
      }}
      secondaryAction={{ label: 'Lanjutkan Kerja', to: '/admin' }}
      details={
        <div className="space-y-2">
          <div className="flex items-center justify-between font-mono text-[11px]">
            <span>Antrean Outbox Lokal:</span>
            <span className="font-bold text-ink">{outboxCount} perubahan menunggu</span>
          </div>
          <p className="text-[11px] text-ink-muted leading-relaxed">
            Arsitektur offline-first menjamin seluruh aktivitas Anda dienkode ke penyimpanan lokal browser dan otomatis dikirim saat koneksi online pulih.
          </p>
        </div>
      }
    />
  );
}
