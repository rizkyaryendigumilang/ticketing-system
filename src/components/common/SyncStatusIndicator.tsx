import React, { useState, useEffect } from 'react';
import { RefreshCw, WifiOff } from 'lucide-react';
import {
  getDetailedConnection,
  subscribeConnection,
  retryConnectionNow,
} from '../../services/pbClient';
import { getOutbox, subscribeStore } from '../../services/storageService';
import { useToast } from '../../context/ToastContext';

interface Props {
  variant?: 'rail' | 'light';
  className?: string;
}

export function SyncStatusIndicator({ variant = 'rail', className = '' }: Props) {
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
  const isRail = variant === 'rail';

  if (status === 'online') {
    return (
      <div
        className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[11px] font-medium tracking-tight select-none shadow-2xs transition-colors ${
          isRail
            ? 'border border-emerald-500/30 bg-emerald-500/15 text-emerald-300'
            : 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
        } ${className}`}
        title="Terhubung ke server PocketBase secara realtime (SSE Aktif)"
      >
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75 duration-1000" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
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
        className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[11px] font-medium tracking-tight select-none transition-all active:scale-95 ${
          isRail
            ? 'border border-amber-500/35 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25'
            : 'border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20'
        } ${className}`}
        title="Klik untuk mencoba koneksi ulang sekarang"
      >
        <RefreshCw className={`h-3 w-3 text-amber-400 ${retrying ? 'animate-spin' : ''}`} />
        <span className="truncate">Menghubungkan ({attempt})...</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleManualSync}
      disabled={retrying}
      className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[11px] font-medium tracking-tight select-none transition-all active:scale-95 ${
        isRail
          ? 'border border-rose-500/35 bg-rose-500/15 text-rose-300 hover:bg-rose-500/25'
          : 'border border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300 hover:bg-rose-500/20'
      } ${className}`}
      title="Mode Offline: perubahan disimpan di antrean outbox. Klik untuk mencoba sinkronisasi."
    >
      <WifiOff className="h-3 w-3 text-rose-400" />
      <span className="truncate">Offline {pendingCount > 0 ? `(${pendingCount} antrean)` : ''}</span>
    </button>
  );
}
