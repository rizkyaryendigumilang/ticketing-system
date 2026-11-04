import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Copy, Play, Sparkles, Terminal } from 'lucide-react';
import { DEMO_ACCOUNTS, VPS_APPS, getApp } from '../../config/vpsAppsConfig';

export function AdminIntegrationPage() {
  const navigate = useNavigate();
  const [selectedAppId, setSelectedAppId] = useState<string>(VPS_APPS[1].id); // default snackloop
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Custom JIT user tester
  const [customApp, setCustomApp] = useState<string>('snackloop');
  const [customUid, setCustomUid] = useState<string>('kasir_shift2');
  const [customName, setCustomName] = useState<string>('Budi (Kasir Shift 2)');
  const [customRole, setCustomRole] = useState<string>('Kasir Outlet');
  const [customUrl, setCustomUrl] = useState<string>(
    'https://43.156.236.102/snackloop/pos',
  );

  const selectedApp = getApp(selectedAppId) ?? VPS_APPS[0];
  const origin =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'http://localhost:5173';

  const sampleAccounts = DEMO_ACCOUNTS.filter(
    (d) => d.appId === selectedApp.id,
  );
  const sample = sampleAccounts[0] ?? {
    appId: selectedApp.id,
    uid: 'user_demo',
    name: 'User Demo',
    role: 'Member',
    fromUrl: selectedApp.appUrl,
  };

  const handoffUrlExample = `${origin}/handoff?app=${encodeURIComponent(
    selectedApp.id,
  )}&uid=${encodeURIComponent(sample.uid)}&name=${encodeURIComponent(
    sample.name,
  )}&role=${encodeURIComponent(sample.role)}&from_url=${encodeURIComponent(
    sample.fromUrl,
  )}`;

  const htmlSnippet = `<!-- Tombol Help ${selectedApp.name} (${selectedApp.prefix}) -->
<a
  href="${origin}/handoff?app=${selectedApp.id}&uid=${sample.uid}&name=${encodeURIComponent(
    sample.name,
  )}&role=${encodeURIComponent(sample.role)}&from_url=${encodeURIComponent(
    selectedApp.appUrl,
  )}"
  target="_blank"
  rel="noopener noreferrer"
  style="display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:6px;background:${
    selectedApp.color
  };color:#fff;font:600 13px/1.2 sans-serif;text-decoration:none;"
>
  Butuh Bantuan / Lapor Kendala
</a>`;

  const jsSnippet = `// Pasang di navbar/sidebar ${selectedApp.name}
function openHelpdeskCRM(currentUser) {
  const params = new URLSearchParams({
    app: '${selectedApp.id}',
    uid: currentUser.usernameOrEmail, // contoh: '${sample.uid}'
    name: currentUser.displayName,    // contoh: '${sample.name}'
    role: currentUser.role,           // contoh: '${sample.role}'
    from_url: window.location.href,
  });
  window.open('${origin}/handoff?' + params.toString(), '_blank', 'noopener');
}`;

  const copyText = (key: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSimulateDemo = (demo: (typeof DEMO_ACCOUNTS)[number]) => {
    const qs = new URLSearchParams({
      app: demo.appId,
      uid: demo.uid,
      name: demo.name,
      role: demo.role,
      from_url: demo.fromUrl,
    });
    navigate(`/handoff?${qs.toString()}`);
  };

  const handleCustomHandoff = (e: React.FormEvent) => {
    e.preventDefault();
    const qs = new URLSearchParams({
      app: customApp,
      uid: customUid.trim(),
      name: customName.trim(),
      role: customRole.trim(),
      from_url: customUrl.trim(),
    });
    navigate(`/handoff?${qs.toString()}`);
  };

  return (
    <div className="space-y-6 p-5 sm:p-6">
      {/* Header */}
      <div className="border-b border-line pb-4">
        <h1 className="text-xl font-bold tracking-tight text-ink">
          Generator Kode Tombol &ldquo;Help&rdquo; &amp; Simulator SSO Handoff (7 Aplikasi)
        </h1>
        <p className="mt-1 text-xs text-ink-muted">
          Pasang 1 tombol di setiap aplikasi eksternal. Saat diklik, rute{' '}
          <code className="rounded bg-subtle px-1 py-0.5 font-mono text-[11px]">
            /handoff
          </code>{' '}
          otomatis mengecek <code className="rounded bg-subtle px-1 py-0.5 font-mono text-[11px]">compositeId = &quot;{'{app_slug}:{uid}'}&quot;</code>, membuatkan akun baru jika belum ada (Just-In-Time Provisioning), dan mengarahkan user ke Portal Bantuan aplikasinya.
        </p>
      </div>

      {/* 1-Click Simulator Grid for All 7 Apps */}
      <section className="rounded border border-line bg-panel p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
          <div>
            <h2 className="text-sm font-semibold text-ink">
              Simulasi 1-Klik Masuk Sebagai User dari 7 Aplikasi
            </h2>
            <p className="text-xs text-ink-muted">
              Klik salah satu tombol di bawah untuk menguji alur penuh Handoff &rarr; Auto-Create/Update User &rarr; Portal Bantuan Aplikasi.
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {DEMO_ACCOUNTS.map((demo) => {
            const app = getApp(demo.appId);
            return (
              <div
                key={demo.compositeKey}
                className="flex flex-col justify-between rounded border border-line bg-canvas p-3.5"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="rounded px-1.5 py-0.5 font-mono text-[11px] font-bold"
                      style={{
                        backgroundColor: `${app?.color ?? '#141413'}18`,
                        color: app?.color ?? '#141413',
                      }}
                    >
                      [{app?.prefix}] {app?.name}
                    </span>
                    <span className="font-mono text-[10px] text-ink-muted">
                      {demo.compositeKey}
                    </span>
                  </div>
                  <div className="mt-2 text-xs font-semibold text-ink">
                    {demo.name}{' '}
                    <span className="font-mono font-normal text-ink-muted">
                      ({demo.uid})
                    </span>
                  </div>
                  <div className="text-[11px] text-ink-muted">
                    Role: {demo.role}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleSimulateDemo(demo)}
                  className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded border border-line-strong bg-panel px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:bg-ink hover:text-white"
                >
                  <Play className="h-3 w-3" />
                  Simulasi Klik Help sebagai {demo.uid} dari {app?.name}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Code Snippet Generator per App */}
      <section className="rounded border border-line bg-panel p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
          <div>
            <h2 className="text-sm font-semibold text-ink">
              Potongan Kode HTML &amp; JavaScript Siap Copy-Paste
            </h2>
            <p className="text-xs text-ink-muted">
              Pilih aplikasi target untuk menyalin kode integrasi tombol Help-nya.
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {VPS_APPS.map((app) => (
              <button
                key={app.id}
                type="button"
                onClick={() => setSelectedAppId(app.id)}
                className={`rounded border px-2.5 py-1 text-xs font-medium ${
                  selectedAppId === app.id
                    ? 'border-ink bg-ink text-white'
                    : 'border-line bg-canvas text-ink-muted hover:text-ink'
                }`}
              >
                [{app.prefix}] {app.name}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 space-y-4">
          {/* Endpoint URL Preview */}
          <div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-ink">
                1. Endpoint Penerima Handoff ({selectedApp.name})
              </span>
              <button
                type="button"
                onClick={() => copyText('url', handoffUrlExample)}
                className="inline-flex items-center gap-1 text-xs font-medium text-ink hover:underline"
              >
                {copiedKey === 'url' ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-700" /> Disalin
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" /> Salin URL
                  </>
                )}
              </button>
            </div>
            <pre className="mt-1.5 overflow-x-auto rounded border border-line bg-subtle p-3 font-mono text-[11px] text-ink">
              {handoffUrlExample}
            </pre>
          </div>

          {/* HTML Snippet */}
          <div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-ink">
                2. Kode Tombol HTML Statis / Template Blade / Jinja
              </span>
              <button
                type="button"
                onClick={() => copyText('html', htmlSnippet)}
                className="inline-flex items-center gap-1 text-xs font-medium text-ink hover:underline"
              >
                {copiedKey === 'html' ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-700" /> Disalin
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" /> Salin HTML
                  </>
                )}
              </button>
            </div>
            <pre className="mt-1.5 overflow-x-auto rounded border border-rail-line bg-rail p-3.5 font-mono text-[11px] leading-relaxed text-neutral-200">
              {htmlSnippet}
            </pre>
          </div>

          {/* JS Snippet */}
          <div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-ink">
                3. Fungsi Helper JavaScript / React (Dinamis sesuai sesi user login)
              </span>
              <button
                type="button"
                onClick={() => copyText('js', jsSnippet)}
                className="inline-flex items-center gap-1 text-xs font-medium text-ink hover:underline"
              >
                {copiedKey === 'js' ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-700" /> Disalin
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" /> Salin JS
                  </>
                )}
              </button>
            </div>
            <pre className="mt-1.5 overflow-x-auto rounded border border-rail-line bg-rail p-3.5 font-mono text-[11px] leading-relaxed text-neutral-200">
              {jsSnippet}
            </pre>
          </div>
        </div>
      </section>

      {/* Custom JIT User Provisioning Tester */}
      <section className="rounded border border-line bg-panel p-5">
        <div className="flex items-center gap-2 border-b border-line pb-3">
          <Sparkles className="h-4 w-4 text-ink" />
          <div>
            <h2 className="text-sm font-semibold text-ink">
              Uji Auto-Create User Baru (Just-In-Time Provisioning) &amp; Anti-Bentrok Username
            </h2>
            <p className="text-xs text-ink-muted">
              Coba masukkan username yang sama (misal <code className="font-mono">admin</code>) pada dua aplikasi berbeda untuk membuktikan pemisahan <code className="font-mono">{'{app_slug}:{uid}'}</code>.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleCustomHandoff}
          className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5"
        >
          <div>
            <label className="block text-[11px] font-medium text-ink-muted">
              app (Slug Aplikasi)
            </label>
            <select
              value={customApp}
              onChange={(e) => {
                const nextApp = getApp(e.target.value);
                setCustomApp(e.target.value);
                if (nextApp) setCustomUrl(nextApp.appUrl);
              }}
              className="mt-1 w-full rounded border border-line bg-canvas px-2.5 py-1.5 text-xs text-ink"
            >
              {VPS_APPS.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.id} ({a.prefix})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-ink-muted">
              uid (Username / Email)
            </label>
            <input
              type="text"
              required
              value={customUid}
              onChange={(e) => setCustomUid(e.target.value)}
              className="mt-1 w-full rounded border border-line bg-canvas px-2.5 py-1.5 font-mono text-xs text-ink"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-ink-muted">
              name (Nama Tampilan)
            </label>
            <input
              type="text"
              required
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="mt-1 w-full rounded border border-line bg-canvas px-2.5 py-1.5 text-xs text-ink"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-ink-muted">
              role (Role di Aplikasi)
            </label>
            <input
              type="text"
              required
              value={customRole}
              onChange={(e) => setCustomRole(e.target.value)}
              className="mt-1 w-full rounded border border-line bg-canvas px-2.5 py-1.5 text-xs text-ink"
            />
          </div>

          <div className="flex flex-col justify-end">
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-1.5 rounded bg-ink px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
            >
              <Terminal className="h-3.5 w-3.5" />
              Jalankan Handoff ({customApp}:{customUid})
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
