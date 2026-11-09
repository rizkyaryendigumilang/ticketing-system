import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Crown, ExternalLink, Lock, ShieldCheck } from 'lucide-react';
import { DEMO_ACCOUNTS, DEMO_ADMIN, getApp } from '../config/vpsAppsConfig';
import { useCrm } from '../context/CrmContext';

export function LoginPage() {
  const { loginAdmin } = useCrm();
  const navigate = useNavigate();

  const [email, setEmail] = useState(DEMO_ADMIN.email);
  const [password, setPassword] = useState(DEMO_ADMIN.password);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await loginAdmin(email, password);
      navigate('/admin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal masuk sebagai Superadmin.');
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateHandoff = (demo: (typeof DEMO_ACCOUNTS)[number]) => {
    const qs = new URLSearchParams({
      app: demo.app,
      uid: demo.uid,
      name: demo.name,
      role: demo.role,
      from_url: demo.fromUrl ?? '',
    });
    navigate(`/handoff?${qs.toString()}`);
  };

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="mb-8 border-b border-line pb-5">
          <div className="inline-flex items-center gap-2 rounded border border-line bg-panel px-2.5 py-1 font-mono text-xs text-ink-muted">
            <ShieldCheck className="h-3.5 w-3.5 text-ink" />
            Internal VPS Helpdesk CRM & SSO Handoff Portal
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Pusat Kendali Tiket 7 Aplikasi VPS
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-muted">
            Masuk sebagai Superadmin untuk mengelola seluruh antrean laporan kendala, atau uji simulasi tombol Help dari masing-masing aplikasi.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left: Superadmin Login */}
          <div className="lg:col-span-5">
            <div className="rounded border border-line bg-panel p-5">
              <div className="flex items-center gap-2 border-b border-line pb-3">
                <Crown className="h-4 w-4 text-amber-600" />
                <h2 className="text-sm font-semibold text-ink">Login Superadmin (Owner VPS)</h2>
              </div>

              <form onSubmit={handleAdminSubmit} className="mt-4 space-y-3.5">
                {error && (
                  <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    {error}
                  </div>
                )}

                <div>
                  <label htmlFor="admin-email" className="block text-xs font-medium text-ink">
                    Email Superadmin
                  </label>
                  <input
                    id="admin-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 w-full rounded border border-line bg-canvas px-3 py-2 font-mono text-xs text-ink focus:border-ink focus:bg-panel focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="admin-pass" className="block text-xs font-medium text-ink">
                    Kata Sandi
                  </label>
                  <input
                    id="admin-pass"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 w-full rounded border border-line bg-canvas px-3 py-2 font-mono text-xs text-ink focus:border-ink focus:bg-panel focus:outline-none"
                  />
                </div>

                <div className="rounded border border-line bg-subtle/60 px-3 py-2 font-mono text-[11px] text-ink-muted">
                  <div className="flex items-center gap-1.5 font-sans font-medium text-ink">
                    <Lock className="h-3 w-3" />
                    Kredensial Demo Terisi Otomatis
                  </div>
                  <div className="mt-0.5">Email: {DEMO_ADMIN.email}</div>
                  <div>Pass: {DEMO_ADMIN.password}</div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded bg-ink px-4 py-2.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
                >
                  {loading ? 'Memproses...' : 'Buka Meja Kerja Superadmin'}
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </form>
            </div>
          </div>

          {/* Right: 7 App Handoff Simulators */}
          <div className="lg:col-span-7">
            <div className="rounded border border-line bg-panel p-5">
              <div className="border-b border-line pb-3">
                <h2 className="text-sm font-semibold text-ink">
                  Simulasi Klik Tombol &ldquo;Help&rdquo; dari 7 Aplikasi (SSO Handoff)
                </h2>
                <p className="mt-0.5 text-xs text-ink-muted">
                  Menguji endpoint{' '}
                  <code className="rounded bg-subtle px-1 py-0.5 font-mono text-[11px]">
                    /handoff?app=...&amp;uid=...
                  </code>{' '}
                  dengan auto-create user berdasarkan Composite ID{' '}
                  <code className="rounded bg-subtle px-1 py-0.5 font-mono text-[11px]">
                    {'{app_slug}:{uid}'}
                  </code>
                  .
                </p>
              </div>

              <div className="mt-3 divide-y divide-line">
                {DEMO_ACCOUNTS.map((demo) => {
                  const app = getApp(demo.app);
                  const compositeKey = `${demo.app}:${demo.uid}`;
                  return (
                    <div
                      key={compositeKey}
                      className="flex flex-wrap items-center justify-between gap-3 py-2.5 first:pt-1 last:pb-0"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-flex rounded px-1.5 py-0.5 font-mono text-[10px] font-bold"
                            style={{
                              backgroundColor: `${app?.color ?? '#141413'}15`,
                              color: app?.color ?? '#141413',
                            }}
                          >
                            {app?.prefix}
                          </span>
                          <span className="text-xs font-semibold text-ink">{app?.name}</span>
                          <span className="font-mono text-[11px] text-ink-muted">({compositeKey})</span>
                        </div>
                        <p className="mt-0.5 text-xs text-ink-muted">
                          {demo.name} · <span className="text-ink">{demo.role}</span>
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSimulateHandoff(demo)}
                        className="inline-flex shrink-0 items-center gap-1.5 rounded border border-line bg-subtle px-2.5 py-1.5 text-xs font-medium text-ink hover:border-ink"
                      >
                        Masuk Portal User
                        <ExternalLink className="h-3 w-3 text-ink-muted" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
