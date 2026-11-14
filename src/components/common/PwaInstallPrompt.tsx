import React, { useState, useEffect } from 'react';
import { Download, Check, Sparkles } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already in standalone mode
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true
    ) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  if (isInstalled || dismissed || !deferredPrompt) {
    return null;
  }

  return (
    <div className="mb-2 rounded border border-emerald-500/30 bg-emerald-500/10 p-2 text-xs">
      <div className="flex items-center justify-between gap-1.5">
        <span className="flex items-center gap-1.5 font-medium text-emerald-300">
          <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
          Pasang Helpdesk PWA
        </span>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="text-neutral-500 hover:text-neutral-300 text-[10px]"
          title="Tutup pemberitahuan"
        >
          ✕
        </button>
      </div>
      <p className="mt-1 text-[11px] text-neutral-400 leading-tight">
        Akses cepat tanpa browser bar, offline caching, dan notifikasi instan.
      </p>
      <button
        type="button"
        onClick={handleInstallClick}
        className="mt-2 flex w-full items-center justify-center gap-1.5 rounded bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-emerald-500 transition-colors shadow-xs"
      >
        <Download className="h-3 w-3" />
        Pasang di Perangkat
      </button>
    </div>
  );
}
