import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft, RefreshCw, Server } from 'lucide-react';

interface SystemPageLayoutProps {
  code: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  primaryAction?: {
    label: string;
    onClick?: () => void;
    to?: string;
  };
  secondaryAction?: {
    label: string;
    onClick?: () => void;
    to?: string;
  };
  details?: React.ReactNode;
}

export function SystemPageLayout({
  code,
  title,
  description,
  icon,
  primaryAction = { label: 'Kembali ke Beranda', to: '/' },
  secondaryAction,
  details,
}: SystemPageLayoutProps) {
  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col justify-between p-6">
      <header className="flex items-center justify-between border-b border-line pb-4 max-w-4xl w-full mx-auto">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded bg-ink font-mono text-xs font-bold text-white">
            H
          </span>
          <span className="text-sm font-bold tracking-tight text-ink">Helpdesk CRM</span>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[11px] text-ink-muted">
          <Server className="h-3.5 w-3.5" />
          <span>43.156.236.102</span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center py-12">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-line bg-panel shadow-sm">
            {icon}
          </div>

          <div className="space-y-2">
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-ink-muted">
              Kode Status {code}
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              {title}
            </h1>
            <p className="text-xs text-ink-muted leading-relaxed max-w-sm mx-auto">
              {description}
            </p>
          </div>

          {details && (
            <div className="rounded-lg border border-line bg-panel p-4 text-left text-xs text-ink-muted">
              {details}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {secondaryAction && (
              secondaryAction.to ? (
                <Link
                  to={secondaryAction.to}
                  className="rounded border border-line bg-subtle px-4 py-2 text-xs font-medium text-ink hover:border-line-strong transition-all"
                >
                  {secondaryAction.label}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={secondaryAction.onClick}
                  className="rounded border border-line bg-subtle px-4 py-2 text-xs font-medium text-ink hover:border-line-strong transition-all"
                >
                  {secondaryAction.label}
                </button>
              )
            )}

            {primaryAction && (
              primaryAction.to ? (
                <Link
                  to={primaryAction.to}
                  className="rounded bg-ink px-4 py-2 text-xs font-semibold text-white shadow-xs hover:opacity-90 active:scale-95 transition-all"
                >
                  {primaryAction.label}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={primaryAction.onClick}
                  className="rounded bg-ink px-4 py-2 text-xs font-semibold text-white shadow-xs hover:opacity-90 active:scale-95 transition-all"
                >
                  {primaryAction.label}
                </button>
              )
            )}
          </div>
        </div>
      </main>

      <footer className="border-t border-line pt-4 text-center font-mono text-[11px] text-ink-muted max-w-4xl w-full mx-auto">
        VPS Helpdesk CRM · Sistem Terintegrasi 7 Aplikasi
      </footer>
    </div>
  );
}
