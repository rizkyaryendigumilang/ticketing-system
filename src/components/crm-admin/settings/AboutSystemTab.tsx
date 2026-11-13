import React from 'react';
import { Info } from 'lucide-react';
import { useCrm } from '../../../context/CrmContext';
import { VPS_APPS } from '../../../config/vpsAppsConfig';

export function AboutSystemTab() {
  const { t } = useCrm();

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-line bg-panel p-5 shadow-xs">
        <div className="flex items-center gap-2 border-b border-line pb-3">
          <Info className="h-4 w-4 text-ink" />
          <h2 className="text-sm font-semibold text-ink">{t('settings.tabAbout')}</h2>
        </div>

        <div className="mt-4 space-y-4 text-xs">
          <p className="text-ink leading-relaxed">
            {t('settings.aboutDesc')}
          </p>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-line pt-4 font-mono text-[11px]">
            <div className="rounded border border-line bg-canvas p-3">
              <dt className="text-ink-muted">{t('settings.aboutVersion')}</dt>
              <dd className="font-bold text-ink mt-0.5">v1.2.0 (Stable Release)</dd>
            </div>

            <div className="rounded border border-line bg-canvas p-3">
              <dt className="text-ink-muted">{t('settings.aboutVpsHost')}</dt>
              <dd className="font-bold text-ink mt-0.5">43.156.236.102 (Port SSH 2222)</dd>
            </div>

            <div className="rounded border border-line bg-canvas p-3">
              <dt className="text-ink-muted">{t('settings.aboutArchitecture')}</dt>
              <dd className="font-bold text-ink mt-0.5">Offline-First · PocketBase 0.25 · React 18</dd>
            </div>

            <div className="rounded border border-line bg-canvas p-3">
              <dt className="text-ink-muted">Aplikasi Terdaftar</dt>
              <dd className="font-bold text-ink mt-0.5">{VPS_APPS.length} Aplikasi Ekosistem</dd>
            </div>
          </dl>

          <div className="rounded border border-line bg-subtle/50 p-4 space-y-1">
            <p className="font-semibold text-ink">{t('settings.aboutDocs')}</p>
            <p className="text-ink-muted">
              Seluruh istilah baku mengikuti standar kamus domain repositori (`GLOSSARY.md`): ID Komposit, Pelapor, Catatan Internal, dan Template Balasan.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
