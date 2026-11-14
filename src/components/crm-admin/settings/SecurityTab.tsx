import React, { useState } from 'react';
import {
  ShieldCheck,
  Eye,
  EyeOff,
  Copy,
  Check,
  RefreshCw,
  Key,
  Plus,
  Trash2,
  AlertTriangle,
  Lock,
  Sparkles,
} from 'lucide-react';
import { useCrm } from '../../../context/CrmContext';
import { useToast } from '../../../context/ToastContext';
import { VPS_APPS } from '../../../config/vpsAppsConfig';
import {
  getApiKeys,
  createApiKey,
  revokeApiKey,
  type ApiKeyRecord,
  type ApiScope,
} from '../../../services/apiKeyService';

export function SecurityTab() {
  const { settings, updateSettings, adminActor, t } = useCrm();
  const toast = useToast();

  // HMAC Secret & SSO settings
  const [handoffSecret, setHandoffSecret] = useState(settings.handoffSecret);
  const [showSecret, setShowSecret] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [expiryMinutes, setExpiryMinutes] = useState(settings.handoffExpiryMinutes);
  const [allowedOrigins, setAllowedOrigins] = useState(settings.allowedOrigins.join('\n'));

  // API Key Management state
  const [apiKeys, setApiKeys] = useState<ApiKeyRecord[]>(getApiKeys);
  const [isCreatingKey, setIsCreatingKey] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [selectedApp, setSelectedApp] = useState('');
  const [selectedScopes, setSelectedScopes] = useState<ApiScope[]>(['tickets:read', 'tickets:write']);
  const [newlyCreatedRawKey, setNewlyCreatedRawKey] = useState<string | null>(null);
  const [copiedRawKey, setCopiedRawKey] = useState(false);

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

  // API Key Handlers
  const handleCreateKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName.trim()) {
      toast.error('Nama kunci API wajib diisi.');
      return;
    }
    const { record, rawKey } = createApiKey({
      name: keyName.trim(),
      appId: selectedApp || undefined,
      scopes: selectedScopes,
      actorName: adminActor.name,
    });
    setApiKeys(getApiKeys());
    setNewlyCreatedRawKey(rawKey);
    setKeyName('');
    setIsCreatingKey(false);
    toast.success('Kunci API baru berhasil dibuat.');
  };

  const handleRevokeKey = (id: string, name: string) => {
    if (!window.confirm(`Yakin ingin mencabut kunci API "${name}"? Tindakan ini tidak dapat dibatalkan.`)) {
      return;
    }
    revokeApiKey(id, adminActor.name);
    setApiKeys(getApiKeys());
    toast.info(`Kunci API "${name}" berhasil dicabut.`);
  };

  const handleCopyRawKey = () => {
    if (!newlyCreatedRawKey) return;
    navigator.clipboard.writeText(newlyCreatedRawKey);
    setCopiedRawKey(true);
    toast.success('Kunci API disalin ke clipboard.');
    setTimeout(() => setCopiedRawKey(false), 2500);
  };

  const toggleScope = (scope: ApiScope) => {
    setSelectedScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope],
    );
  };

  return (
    <div className="space-y-6">
      {/* ═══ 1. HMAC HandOff & SSO Security ═══ */}
      <div className="rounded-2xl border border-line/60 bg-panel/70 backdrop-blur-md p-6 shadow-xs">
        <div className="flex items-center gap-2 border-b border-line/60 pb-3">
          <ShieldCheck className="h-4 w-4 text-ink" />
          <h2 className="text-sm font-semibold text-ink">{t('settings.tabSecurity')}</h2>
        </div>
        <p className="mt-2 text-xs text-ink-muted">
          Konfigurasi tanda tangan kriptografis HMAC-SHA256 untuk memverifikasi autentisitas link handoff dari 7 aplikasi VPS.
        </p>

        <form onSubmit={handleSaveSecurity} className="mt-5 space-y-4 text-xs max-w-lg">
          <div>
            <label className="block font-medium text-ink">HMAC Secret Key</label>
            <div className="mt-1 flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type={showSecret ? 'text' : 'password'}
                  value={handoffSecret}
                  onChange={(e) => setHandoffSecret(e.target.value)}
                  className="w-full rounded-xl border border-line bg-canvas px-3 py-2 font-mono text-xs text-ink focus:border-ink focus:outline-none"
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
                className="rounded-xl border border-line bg-subtle px-3 py-2 font-medium text-ink hover:border-line-strong active:scale-95 transition-all shadow-2xs"
                title="Salin Secret"
              >
                {copiedSecret ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              </button>

              <button
                type="button"
                onClick={handleGenerateSecret}
                className="rounded-xl border border-line bg-subtle px-3 py-2 font-medium text-ink hover:border-line-strong active:scale-95 transition-all shadow-2xs"
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
              className="mt-1 w-32 rounded-xl border border-line bg-canvas px-3 py-2 text-xs text-ink focus:border-ink focus:outline-none"
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
              className="mt-1 w-full rounded-xl border border-line bg-canvas p-3 font-mono text-xs text-ink focus:border-ink focus:outline-none leading-relaxed"
            />
            <p className="mt-1 text-[11px] text-ink-muted">Satu domain per baris.</p>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2 font-semibold text-canvas shadow-xs hover:bg-ink/90 active:scale-95 transition-all"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {t('settings.saveChanges')}
            </button>
          </div>
        </form>
      </div>

      {/* ═══ 2. API Keys Management (Pillar 5: Tata Kelola API) ═══ */}
      <div className="rounded-2xl border border-line/60 bg-panel/70 backdrop-blur-md p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/60 pb-3">
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4 text-ink" />
            <h2 className="text-sm font-semibold text-ink">Kunci API & Akses Pengembang (Developer Governance)</h2>
          </div>
          <button
            type="button"
            onClick={() => setIsCreatingKey(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-ink px-3 py-1.5 text-xs font-medium text-canvas shadow-xs hover:bg-ink/90 active:scale-95 transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Buat Kunci API Baru</span>
          </button>
        </div>
        <p className="mt-2 text-xs text-ink-muted">
          Kunci akses API terotentikasi (prefix <code>vps_live_</code>) dengan cakupan hak akses (scopes) per aplikasi untuk integrasi backend otomatis.
        </p>

        {/* Newly Created Key Alert Banner */}
        {newlyCreatedRawKey && (
          <div className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-xs animate-fade-in">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1">
                <span className="font-semibold text-amber-800 dark:text-amber-300">
                  Simpan Kunci API Anda Sekarang!
                </span>
                <p className="text-amber-700 dark:text-amber-400">
                  Kunci ini hanya ditampilkan sekali demi keamanan. Anda tidak akan bisa melihatnya lagi setelah menutup halaman.
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <code className="flex-1 rounded-lg bg-panel/90 border border-line p-2 font-mono text-[11px] text-ink select-all break-all">
                    {newlyCreatedRawKey}
                  </code>
                  <button
                    type="button"
                    onClick={handleCopyRawKey}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3 py-2 text-xs font-semibold text-canvas shadow-xs hover:bg-ink/90 active:scale-95 transition-all shrink-0"
                  >
                    {copiedRawKey ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedRawKey ? 'Tersalin' : 'Salin Kunci'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Key Creation Form Modal */}
        {isCreatingKey && (
          <div className="mt-4 rounded-xl border border-line bg-canvas/60 p-4 text-xs animate-fade-in space-y-3">
            <h3 className="font-semibold text-ink flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-accent" />
              <span>Parameter Kunci API Baru</span>
            </h3>

            <form onSubmit={handleCreateKey} className="space-y-3 max-w-lg">
              <div>
                <label className="block font-medium text-ink">Nama Deskripsi Kunci</label>
                <input
                  type="text"
                  placeholder="Misal: Snackloop Sync Bot, Recruiter Auto-Ticket"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-line bg-panel px-3 py-2 text-xs text-ink placeholder:text-ink-muted focus:border-ink focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-ink">Batasi Aplikasi Asal (Opsional)</label>
                <select
                  value={selectedApp}
                  onChange={(e) => setSelectedApp(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-line bg-panel px-3 py-2 text-xs text-ink focus:border-ink focus:outline-none"
                >
                  <option value="">Semua Aplikasi Ekosistem (Global)</option>
                  {VPS_APPS.map((app) => (
                    <option key={app.id} value={app.id}>
                      {app.name} ({app.prefix})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-ink mb-1.5">Hak Akses (Scopes)</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'tickets:read' as ApiScope, label: 'Baca Data Tiket' },
                    { id: 'tickets:write' as ApiScope, label: 'Buat & Balas Tiket' },
                    { id: 'kb:read' as ApiScope, label: 'Akses Basis Pengetahuan' },
                    { id: 'stats:read' as ApiScope, label: 'Baca Metrik & CSAT' },
                  ].map((sc) => (
                    <label key={sc.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedScopes.includes(sc.id)}
                        onChange={() => toggleScope(sc.id)}
                        className="rounded border-line text-ink"
                      />
                      <span className="text-ink">{sc.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="rounded-xl bg-ink px-4 py-2 text-xs font-semibold text-canvas shadow-xs hover:bg-ink/90 active:scale-95 transition-all"
                >
                  Buat Kunci Sekarang
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreatingKey(false)}
                  className="rounded-xl border border-line bg-panel px-3 py-2 text-xs text-ink-muted hover:text-ink hover:bg-subtle transition-colors"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Existing Keys Table */}
        <div className="mt-4 overflow-x-auto rounded-xl border border-line/60">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-line bg-subtle/50 text-[11px] font-semibold text-ink-muted">
                <th className="py-2.5 px-3">Nama Kunci</th>
                <th className="py-2.5 px-3">Prefix Identitas</th>
                <th className="py-2.5 px-3">Aplikasi</th>
                <th className="py-2.5 px-3">Hak Akses</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {apiKeys.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-xs text-ink-muted italic">
                    Belum ada kunci API yang dibuat. Klik tombol di atas untuk membuat kunci baru.
                  </td>
                </tr>
              ) : (
                apiKeys.map((k) => (
                  <tr key={k.id} className="hover:bg-subtle/30">
                    <td className="py-2.5 px-3 font-medium text-ink">{k.name}</td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-ink-muted">{k.prefix}...</td>
                    <td className="py-2.5 px-3">
                      {k.appId ? (
                        <span className="rounded bg-subtle px-1.5 py-0.5 font-mono text-[10px] text-ink">
                          {k.appId}
                        </span>
                      ) : (
                        <span className="text-[11px] text-ink-muted italic">Global</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex flex-wrap gap-1">
                        {k.scopes.map((s) => (
                          <span
                            key={s}
                            className="rounded-sm bg-accent/10 border border-accent/20 px-1 py-0 text-[9px] font-medium text-accent"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      {k.isRevoked ? (
                        <span className="rounded-md bg-rose-500/10 px-2 py-0.5 text-[10px] font-semibold text-rose-600">
                          Dicabut
                        </span>
                      ) : (
                        <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
                          Aktif
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {!k.isRevoked && (
                        <button
                          type="button"
                          onClick={() => handleRevokeKey(k.id, k.name)}
                          className="rounded-lg p-1 text-ink-muted hover:text-red-500 hover:bg-rose-500/10 transition-colors"
                          title="Cabut akses kunci ini"
                          aria-label={`Cabut kunci ${k.name}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
