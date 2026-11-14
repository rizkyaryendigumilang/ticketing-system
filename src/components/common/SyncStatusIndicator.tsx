import React, { useState, useEffect } from 'react';
import { RefreshCw, WifiOff } from 'lucide-react';
import {
  getDetailedConnection,
  subscribeConnection,
  retryConnectionNow,
} from '../../services/pbClient';
import { getOutbox, subscribeStore } from '../../services/storageService';
import { useToast } from '../../context/ToastContext';
import { useCrm } from '../../context/CrmContext';

interface Props {
  variant?: 'rail' | 'light';
  className?: string;
}

export function SyncStatusIndicator({ variant = 'rail', className = '' }: Props) {
  const toast = useToast();
  const { t } = useCrm();
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
      toast.info(t('nav.checkingConnection'));
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
            ? 'border border-white/10 bg-white/[0.05] text-neutral-200'
            : 'border border-neutral-200/80 bg-neutral-100/70 text-neutral-700 dark:border-white/10 dark:bg-white/[0.05] dark:text-neutral-200'
        } ${className}`}
        title={t('nav.connectedSseTooltip')}
      >
        <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500 dark:bg-emerald-400" />
        <span className="truncate">{t('nav.realtimeOnline')}</span>
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
            ? 'border border-amber-500/30 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20'
            : 'border border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200 hover:bg-amber-500/20'
        } ${className}`}
        title={t('nav.clickToRetryTooltip')}
      >
        <RefreshCw className={`h-3 w-3 text-amber-400 ${retrying ? 'animate-spin' : ''}`} />
        <span className="truncate">{t('nav.reconnecting', { attempt })}</span>
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
          ? 'border border-rose-500/30 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20'
          : 'border border-rose-500/30 bg-rose-500/10 text-rose-800 dark:text-rose-200 hover:bg-rose-500/20'
      } ${className}`}
      title={t('nav.offlineTooltip')}
    >
      <WifiOff className="h-3 w-3 text-rose-400" />
      <span className="truncate">
        {pendingCount > 0
          ? t('nav.offlineQueue', { count: pendingCount })
          : t('nav.offline')}
      </span>
    </button>
  );
}
