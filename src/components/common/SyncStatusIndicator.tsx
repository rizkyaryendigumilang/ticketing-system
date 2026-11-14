import React, { useState, useEffect } from 'react';
import { RefreshCw, Wifi, WifiOff } from 'lucide-react';
import {
  getDetailedConnection,
  subscribeConnection,
  retryConnectionNow,
  type Connection,
} from '../../services/pbClient';
import { getOutbox, subscribeStore } from '../../services/storageService';
import { useToast } from '../../context/ToastContext';

export function SyncStatusIndicator() {
  const toast = useToast();
  const [details, setDetails] = useState(getDetailedConnection);
  const [pendingCount, setPendingCount] = useState(() => getOutbox().length);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    const unsubConn = subscribeConnection(() => {
      setDetails(getDetailedConnection());
    });
    const unsubStore = subscribeStore(() => {
      setPendingCount(getOutbox().length);
    });
    return () => {
      unsubConn();
      unsubStore();
    };
  }, []);

  const handleManualSync = async () => {
    setRetrying(true);
    try {
      await retryConnectionNow();
      toast.info('Memeriksa koneksi server PocketBase...');
    } finally {
      setTimeout(() => setRetrying(false), 800);
    }
  };

  const { status, attempt } = details;

  if (status === 'online') {
    return (
      <div
        className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400"
        title="Terhubung ke server PocketBase secara realtime (SSE Aktif)"
      >
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        <span className="truncate">Realtime Online</span>
      </div>
    );
  }

  if (status === 'reconnecting') {
    return (
      <button
        type="button"
        onClick={handleManualSync}
        disabled={retrying}
        className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-medium text-amber-800 dark:text-amber-300 hover:bg-amber-500/20 transition-colors"
        title="Klik untuk mencoba koneksi ulang sekarang"
      >
        <RefreshCw className={`h-3 w-3 text-amber-700 dark:text-amber-400 ${retrying ? 'animate-spin' : ''}`} />
        <span>Menghubungkan ({attempt})...</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleManualSync}
      disabled={retrying}
      className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-0.5 text-[11px] font-medium text-red-800 dark:text-red-300 hover:bg-red-500/20 transition-colors"
      title="Mode Offline: perubahan disimpan di antrean outbox. Klik untuk mencoba sinkronisasi."
    >
      <WifiOff className="h-3 w-3 text-red-600 dark:text-red-400" />
      <span>Offline {pendingCount > 0 ? `(${pendingCount} antrean)` : ''}</span>
    </button>
  );
}
