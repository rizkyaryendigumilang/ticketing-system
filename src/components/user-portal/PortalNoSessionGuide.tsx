import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ExternalLink, ShieldAlert, ShieldCheck, ArrowRight, Server } from 'lucide-react';
import { VPS_APPS, DEMO_ACCOUNTS, getApp } from '../../config/vpsAppsConfig';
import { useCrm } from '../../context/CrmContext';

export function PortalNoSessionGuide() {
  const { admin } = useCrm();
  const navigate = useNavigate();

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

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-2">
      {/* Notice Card */}
      <div className="rounded-lg border border-line bg-panel p-5 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="rounded-md bg-subtle p-2 text-ink">
            <ShieldAlert className="h-5 w-5 text-amber-600" />
          </div>
          <div className="space-y-1 flex-1">
            <h2 className="text-sm font-bold text-ink">
              Sesi Pelapor Belum Terhubung
            </h2>
            <p className="text-xs text-ink-muted leading-relaxed">
              Portal bantuan ini melayani pengguna dari 7 aplikasi VPS. Pengguna biasanya diarahkan secara otomatis melalui tombol bantuan di aplikasi masing-masing.
            </p>
            <p className="text-xs text-ink-muted">
              Pilih salah satu aplikasi di bawah untuk mencoba alur pelapor, atau masuk sebagai admin.
            </p>
          </div>
          {admin && (
            <Link
              to="/admin"
              className="inline-flex items-center gap-1.5 rounded bg-ink px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:opacity-90 transition-all shrink-0"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              Buka Halaman Admin
            </Link>
          )}
        </div>
      </div>

      {/* 7 VPS Applications Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-line pb-2">
          <div className="flex items-center gap-2">
            <Server className="h-4 w-4 text-ink-muted" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted">
              Pilih Aplikasi untuk Memulai Sesi Pelapor
            </h3>
          </div>
          <span className="text-[11px] font-mono text-ink-muted">
            {VPS_APPS.length} Aplikasi Terdaftar
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {VPS_APPS.map((app) => {
            const demo = DEMO_ACCOUNTS.find((d) => d.app === app.id);
            return (
              <div
                key={app.id}
                className="flex flex-col justify-between rounded-lg border border-line bg-panel p-4 shadow-xs transition-all hover:border-line-strong"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="inline-flex h-8 w-8 items-center justify-center rounded font-mono text-xs font-bold shrink-0 border"
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
                      className="text-ink-muted hover:text-ink p-1"
                      title={`Buka ${app.name}`}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>

                  <p className="mt-2.5 text-xs text-ink-muted leading-relaxed line-clamp-2">
                    {app.description}
                  </p>

                  {demo && (
                    <div className="mt-3 rounded border border-line/60 bg-subtle/50 px-2.5 py-1.5 text-[11px]">
                      <span className="text-ink-muted">Akun Uji: </span>
                      <strong className="text-ink font-medium">{demo.name}</strong>{' '}
                      <span className="text-ink-muted">({demo.role})</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-line flex items-center justify-between">
                  <a
                    href={app.appUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-ink-muted hover:text-ink hover:underline"
                  >
                    Buka Aplikasi
                  </a>

                  {demo && (
                    <button
                      type="button"
                      onClick={() => handleStartDemoSession(demo)}
                      className="inline-flex items-center gap-1 rounded bg-ink px-2.5 py-1 text-xs font-semibold text-white shadow-xs hover:opacity-90 active:scale-95 transition-all"
                    >
                      <span>Masuk Sesi Ini</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
