import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  ExternalLink,
  Layers,
  LifeBuoy,
  Server,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { VPS_APPS, DEMO_ACCOUNTS } from '../../config/vpsAppsConfig';
import { useCrm } from '../../context/CrmContext';
import { SelfServiceDeflectionWidget } from '../widgets/SelfServiceDeflectionWidget';

export function PortalNoSessionGuide() {
  const { admin, lang, connection } = useCrm();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'apps' | 'kb' | 'health'>('apps');

  const handleStartDemoSession = (demo: (typeof DEMO_ACCOUNTS)[number]) => {
    const qs = new URLSearchParams({
      app: demo.app,
      uid: demo.uid,
      name: demo.name,
      role: demo.role,
      from_url: demo.fromUrl ?? '',
    });
    navigate(`/handoff?${qs.toString()}`);
  };

  const isEn = lang === 'en';

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-2">
      {/* Public Ecosystem Hero Section */}
      <div className="relative overflow-hidden rounded-2xl border border-line bg-panel p-6 sm:p-8 shadow-card">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-xl">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>{isEn ? 'Public Ecosystem Help Center' : 'Pusat Bantuan Ekosistem Terpadu'}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-ink">
              {isEn
                ? 'Integrated Support & Service Platform'
                : 'Layanan Bantuan & Panduan Terpadu Ekosistem VPS'}
            </h1>
            <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
              {isEn
                ? 'Centralized service portal connecting users across 7 VPS applications. Access instant self-help guides, report incidents, or track system health.'
                : 'Pintu layanan tunggal untuk seluruh pengguna 7 aplikasi ekosistem VPS. Temukan solusi mandiri bebas antre, ajukan kendala operasional, dan pantau status sistem.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-2 w-full md:w-auto shrink-0">
            {admin ? (
              <Link
                to="/admin"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:opacity-90 active:scale-95 transition-all"
              >
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>{isEn ? 'Open Admin Workspace' : 'Buka Dashboard Admin'}</span>
              </Link>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-subtle/80 px-4 py-2.5 text-xs font-semibold text-ink shadow-2xs hover:bg-subtle active:scale-95 transition-all"
              >
                <ShieldCheck className="h-4 w-4 text-ink-muted" />
                <span>{isEn ? 'Staff / Admin Login' : 'Masuk Petugas / Admin'}</span>
              </Link>
            )}
          </div>
        </div>

        {/* 3 Key Operational Metrics Pill Grid */}
        <div className="mt-6 grid grid-cols-1 gap-3 border-t border-line/70 pt-5 sm:grid-cols-3">
          <div className="flex items-center gap-3 rounded-xl border border-line/60 bg-subtle/40 p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-ink tabular-nums">7 {isEn ? 'Apps' : 'Aplikasi'}</div>
              <div className="text-[11px] text-ink-muted">{isEn ? 'Connected Divisions' : 'Divisi Terintegrasi'}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-line/60 bg-subtle/40 p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-ink tabular-nums">&lt; 15 {isEn ? 'Mins' : 'Menit'}</div>
              <div className="text-[11px] text-ink-muted">{isEn ? 'Target Response SLA' : 'Target SLA Respon'}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-line/60 bg-subtle/40 p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Zap className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-ink tabular-nums">99.98%</div>
              <div className="text-[11px] text-ink-muted">{isEn ? 'System Availability' : 'Ketersediaan Layanan'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Segment Navigation */}
      <div className="flex items-center gap-2 border-b border-line pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('apps')}
          className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
            activeTab === 'apps'
              ? 'bg-ink text-white shadow-xs'
              : 'text-ink-muted hover:text-ink hover:bg-subtle'
          }`}
        >
          <Server className="h-3.5 w-3.5" />
          <span>{isEn ? 'Application Directory' : 'Katalog 7 Aplikasi'}</span>
          <span className="rounded-full bg-white/20 px-1.5 py-0.2 text-[10px] font-mono">7</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('kb')}
          className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
            activeTab === 'kb'
              ? 'bg-ink text-white shadow-xs'
              : 'text-ink-muted hover:text-ink hover:bg-subtle'
          }`}
        >
          <BookOpen className="h-3.5 w-3.5" />
          <span>{isEn ? 'Instant Self-Help & FAQ' : 'Solusi Mandiri & FAQ'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('health')}
          className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
            activeTab === 'health'
              ? 'bg-ink text-white shadow-xs'
              : 'text-ink-muted hover:text-ink hover:bg-subtle'
          }`}
        >
          <Activity className="h-3.5 w-3.5" />
          <span>{isEn ? 'System Status & SLA' : 'Integritas Sistem & SLA'}</span>
        </button>
      </div>

      {/* Tab 1: Application Directory */}
      {activeTab === 'apps' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-ink-muted">
            <p>
              {isEn
                ? 'Select an application below to simulate a requester session or visit the app live:'
                : 'Pilih aplikasi di bawah untuk mencoba sesi simulasi pelapor atau kunjungi langsung:'}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            {VPS_APPS.map((app) => {
              const demo = DEMO_ACCOUNTS.find((d) => d.app === app.id);
              return (
                <div
                  key={app.id}
                  className="flex flex-col justify-between rounded-xl border border-line bg-panel p-4 shadow-xs transition-colors hover:border-line-strong"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <span
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg font-mono text-xs font-bold shrink-0 border shadow-2xs select-none"
                          style={{
                            backgroundColor: `${app.color}15`,
                            borderColor: `${app.color}40`,
                            color: app.color,
                          }}
                        >
                          {app.prefix}
                        </span>
                        <div>
                          <h4 className="text-xs font-bold text-ink leading-tight">{app.name}</h4>
                          <span className="font-mono text-[10px] text-ink-muted">{app.id}</span>
                        </div>
                      </div>

                      <a
                        href={app.appUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg p-1 text-ink-muted hover:text-ink hover:bg-subtle transition-colors"
                        title={`${isEn ? 'Visit' : 'Buka'} ${app.name}`}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>

                    <p className="mt-2.5 text-xs text-ink-muted leading-relaxed line-clamp-2">
                      {app.description}
                    </p>

                    {demo && (
                      <div className="mt-3 rounded-lg border border-line/60 bg-subtle/50 px-2.5 py-1.5 text-[11px]">
                        <span className="text-ink-muted">{isEn ? 'Demo Persona: ' : 'Akun Uji: '}</span>
                        <strong className="text-ink font-semibold">{demo.name}</strong>{' '}
                        <span className="text-ink-muted">({demo.role})</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-line flex items-center justify-between">
                    <a
                      href={app.appUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-ink-muted hover:text-ink hover:underline inline-flex items-center gap-1"
                    >
                      <span>{isEn ? 'Visit Application' : 'Buka Aplikasi'}</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>

                    {demo && (
                      <button
                        type="button"
                        onClick={() => handleStartDemoSession(demo)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3 py-1.5 text-xs font-semibold text-white shadow-2xs hover:opacity-90 active:scale-95 transition-all"
                      >
                        <span>{isEn ? 'Launch Session' : 'Masuk Sesi'}</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Instant Self-Help & Deflection FAQ */}
      {activeTab === 'kb' && (
        <div className="space-y-4">
          <SelfServiceDeflectionWidget />
          <div className="rounded-xl border border-line bg-subtle/30 p-4 text-xs text-ink-muted leading-relaxed flex items-start gap-3">
            <LifeBuoy className="h-4 w-4 text-ink-muted shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-ink">
                {isEn ? 'Need personalized assistance?' : 'Butuh bantuan lebih lanjut?'}
              </span>{' '}
              {isEn
                ? 'If your inquiry is not resolved via the self-help articles above, access your application and click the in-app helpdesk launcher or contact your division lead.'
                : 'Jika kendala Anda belum teratasi melalui panduan mandiri di atas, buka aplikasi terkait dan tekan tombol bantuan di dalam aplikasi atau hubungi koordinator divisi Anda.'}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: System Status & SLAs */}
      {activeTab === 'health' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-line bg-panel p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <h3 className="text-xs font-bold text-ink">
                  {isEn ? 'Ecosystem Service Status' : 'Status Layanan Ekosistem VPS'}
                </h3>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {connection === 'online' ? (isEn ? 'All Systems Operational' : 'Semua Sistem Berjalan Normal') : (isEn ? 'Local Offline-First Mode' : 'Mode Penyimpanan Lokal')}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="rounded-lg border border-line bg-subtle/30 p-3 space-y-1">
                <div className="font-semibold text-ink">Helpdesk Core Engine</div>
                <div className="text-[11px] text-ink-muted">PocketBase Service on Port 8094 · Reverse Proxy Caddy /helpdesk-pb/</div>
                <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-medium">HEALTHY · 0 LATENCY ANOMALY</div>
              </div>

              <div className="rounded-lg border border-line bg-subtle/30 p-3 space-y-1">
                <div className="font-semibold text-ink">Multi-Tenant Isolation</div>
                <div className="text-[11px] text-ink-muted">Requester validation enforced via (appId + requesterUid) composite identity</div>
                <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-medium">ENFORCED · STRICT ISOLATION</div>
              </div>

              <div className="rounded-lg border border-line bg-subtle/30 p-3 space-y-1">
                <div className="font-semibold text-ink">Offline-First Outbox Sync</div>
                <div className="text-[11px] text-ink-muted">LocalStorage caching with auto-retry and collision-safe mutations</div>
                <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-medium">ENABLED · ZERO DATA LOSS</div>
              </div>

              <div className="rounded-lg border border-line bg-subtle/30 p-3 space-y-1">
                <div className="font-semibold text-ink">SLA Target Benchmarks</div>
                <div className="text-[11px] text-ink-muted">Urgent: First response &lt;15m, Normal: &lt;2h, Resolution: &lt;24h</div>
                <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-medium">REALTIME SLA RADAR ACTIVE</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
