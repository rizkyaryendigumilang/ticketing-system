import React, { useState } from 'react';
import {
  Check,
  Copy,
  QrCode,
  ShieldCheck,
  User,
  X,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import type { CrmUser } from '../../types/crm';
import { getApp } from '../../config/vpsAppsConfig';
import { useToast } from '../../context/ToastContext';

interface Props {
  user: CrmUser;
  isOpen: boolean;
  onClose: () => void;
}

export function MemberPassportCard({ user, isOpen, onClose }: Props) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const app = getApp(user.appId);

  if (!isOpen) return null;

  const handleCopyId = () => {
    navigator.clipboard.writeText(user.compositeKey);
    setCopied(true);
    toast.success('ID Pelapor Komposit berhasil disalin ke clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl border border-line bg-panel p-6 shadow-popover animate-scale-pop text-ink space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Close */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-ink">
            <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>Kartu Identitas Anggota Ekosistem</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-ink-muted hover:bg-subtle hover:text-ink transition-colors"
            aria-label="Tutup"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ═══ Apple Wallet Aesthetic Digital Membership Card ═══ */}
        <div
          className="relative overflow-hidden rounded-2xl p-5 text-white shadow-xl transition-transform"
          style={{
            background: `linear-gradient(135deg, ${app?.color ?? '#0F172A'} 0%, #0B0F17 100%)`,
          }}
        >
          {/* Subtle geometric pattern overlay */}
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-xl pointer-events-none" />

          {/* Card Top Strip */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white/20 font-mono text-[10px] font-bold text-white">
                {app?.prefix ?? 'VPS'}
              </span>
              <span className="font-mono text-[11px] font-semibold tracking-wider text-white/90 uppercase">
                {app?.name ?? 'Ecosystem App'}
              </span>
            </div>

            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              AKTIF
            </span>
          </div>

          {/* Card Middle: Member Name & Role */}
          <div className="mt-6 space-y-1">
            <p className="text-[10px] uppercase font-semibold text-white/60 tracking-wider">
              Identitas Pelapor
            </p>
            <h3 className="text-lg font-bold text-white leading-tight">
              {user.name}
            </h3>
            <p className="text-xs text-white/80 font-medium">
              {user.appRole} · <span className="font-mono text-[11px]">{user.externalUid}</span>
            </p>
          </div>

          {/* Card Bottom: Composite ID & QR Visual */}
          <div className="mt-6 flex items-end justify-between border-t border-white/15 pt-3.5">
            <div>
              <p className="text-[9px] uppercase font-semibold text-white/60 tracking-wider">
                ID Komposit Sistem
              </p>
              <p className="font-mono text-xs font-bold text-white tracking-wide">
                {user.compositeKey}
              </p>
            </div>

            {/* Stylized Simulated QR Code Matrix */}
            <div
              className="flex h-12 w-12 items-center justify-center rounded-lg bg-white p-1 shadow-md text-black"
              title={`QR ID: ${user.compositeKey}`}
            >
              <QrCode className="h-10 w-10 text-neutral-900" />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={handleCopyId}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-ink py-2.5 text-xs font-semibold text-white shadow-xs hover:opacity-90 active:scale-[0.98] transition-transform"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span>ID Komposit Tersalin!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Salin ID Komposit ({user.compositeKey})</span>
              </>
            )}
          </button>

          <p className="text-center text-[11px] text-ink-muted">
            Tunjukkan kartu digital ini saat meminta verifikasi atau eskalasi teknis kepada tim agen helpdesk.
          </p>
        </div>
      </div>
    </div>
  );
}
