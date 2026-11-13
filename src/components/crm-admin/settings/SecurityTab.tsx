import React, { useState } from 'react';
import { ShieldCheck, Eye, EyeOff, Copy, Check, RefreshCw } from 'lucide-react';
import { useCrm } from '../../../context/CrmContext';
import { useToast } from '../../../context/ToastContext';

export function SecurityTab() {
  const { settings, updateSettings, t } = useCrm();
  const toast = useToast();

  const [handoffSecret, setHandoffSecret] = useState(settings.handoffSecret);
  const [showSecret, setShowSecret] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [expiryMinutes, setExpiryMinutes] = useState(settings.handoffExpiryMinutes);
  const [allowedOrigins, setAllowedOrigins] = useState(settings.allowedOrigins.join('\n'));

  const handleSaveSecurity = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSecret = handoffSecret.trim() || 'vps-helpdesk-secret-key';
    const origins = allowedOrigins
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    updateSettings({
      ...settings,
      handoffSecret: cleanSecret,
      handoffExpiryMinutes: Number(expiryMinutes) || 15,
      allowedOrigins: origins.length ? origins : ['https://43.156.236.102'],
    });
    toast.success('Konfigurasi keamanan SSO handoff berhasil disimpan.');
  };

  const handleGenerateSecret = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_';
    const randomSecret = Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) => chars[b % chars.length]).join('');
    setHandoffSecret(randomSecret);
    toast.info('Kunci rahasia baru dibuat. Klik "Simpan Pengaturan" untuk menerapkan.');
  };

  const handleCopySecret = () => {
    navigator.clipboard.writeText(handoffSecret);
    setCopiedSecret(true);
    toast.success('Kunci rahasia HMAC disalin.');
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-line bg-panel p-5 shadow-xs">
        <div className="flex items-center gap-2 border-b border-line pb-3">
          <ShieldCheck className="h-4 w-4 text-ink" />
          <h2 className="text-sm font-semibold text-ink">{t('settings.tabSecurity')}</h2>
        </div>
        <p className="mt-2 text-xs text-ink-muted">
          Konfigurasi tanda tangan kriptografis HMAC-SHA256 untuk memverifikasi autentisitas link handoff dari 7 aplikasi VPS.
        </p>

        <form onSubmit={handleSaveSecurity} className="mt-4 space-y-4 text-xs">
          <div>
            <label className="block font-medium text-ink">HMAC Secret Key</label>
            <div className="mt-1 flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type={showSecret ? 'text' : 'password'}
                  value={handoffSecret}
                  onChange={(e) => setHandoffSecret(e.target.value)}
                  className="w-full rounded border border-line bg-canvas px-3 py-2 font-mono text-xs text-ink focus:border-ink focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink"
                >
                  {showSecret ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>

              <button
                type="button"
                onClick={handleCopySecret}
                className="rounded border border-line bg-subtle px-2.5 py-2 font-medium text-ink hover:border-line-strong active:scale-95 transition-all"
                title="Salin Secret"
              >
                {copiedSecret ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              </button>

              <button
                type="button"
                onClick={handleGenerateSecret}
                className="rounded border border-line bg-subtle px-2.5 py-2 font-medium text-ink hover:border-line-strong active:scale-95 transition-all"
                title="Buat Kunci Baru"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div>
            <label className="block font-medium text-ink">Masa Berlaku URL Handoff (Menit)</label>
            <input
              type="number"
              min={1}
              max={1440}
              value={expiryMinutes}
              onChange={(e) => setExpiryMinutes(Number(e.target.value))}
              className="mt-1 w-32 rounded border border-line bg-canvas px-3 py-2 text-xs text-ink focus:border-ink focus:outline-none"
            />
            <p className="mt-1 text-[11px] text-ink-muted">Standar rekomendasi: 15 menit.</p>
          </div>

          <div>
            <label className="block font-medium text-ink">Domain yang Diizinkan (Allowed Origins)</label>
            <textarea
              rows={4}
              value={allowedOrigins}
              onChange={(e) => setAllowedOrigins(e.target.value)}
              placeholder="https://43.156.236.102&#10;http://localhost:5173"
              className="mt-1 w-full rounded border border-line bg-canvas p-3 font-mono text-xs text-ink focus:border-ink focus:outline-none leading-relaxed"
            />
            <p className="mt-1 text-[11px] text-ink-muted">Satu domain per baris.</p>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="rounded bg-ink px-4 py-2 font-semibold text-white shadow-xs hover:opacity-90 active:scale-95 transition-all"
            >
              {t('settings.saveChanges')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
