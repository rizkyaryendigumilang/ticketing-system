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
    <div className="mb-2.5 rounded-xl border border-white/10 bg-white/[0.04] p-2.5 text-xs">
      <div className="flex items-center justify-between gap-1.5">
        <span className="flex items-center gap-1.5 font-medium text-neutral-200">
          <Download className="h-3.5 w-3.5 text-neutral-400" />
          Pasang Aplikasi (PWA)
        </span>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="text-neutral-500 hover:text-neutral-300 text-xs p-0.5"
          title="Tutup pemberitahuan"
          aria-label="Tutup pemberitahuan"
        >
          ✕
        </button>
      </div>
      <p className="mt-1 text-[11px] text-neutral-400 leading-normal">
        Akses mandiri di layar utama HP / desktop dengan kemampuan offline.
      </p>
      <button
        type="button"
        onClick={handleInstallClick}
        className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/15 px-2.5 py-1.5 text-xs font-semibold text-white transition-all active:scale-[0.98] border border-white/10 shadow-xs"
      >
        <Download className="h-3.5 w-3.5" />
        Pasang di Layar Utama
      </button>
    </div>
  );
}
