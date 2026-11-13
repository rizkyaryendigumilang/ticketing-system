import React, { useState } from 'react';
import { Check, Layers, Moon, SlidersHorizontal, Sun } from 'lucide-react';
import { useCrm } from '../../../context/CrmContext';
import { useToast } from '../../../context/ToastContext';

export function AppearanceTab() {
  const { settings, updateSettings, t } = useCrm();
  const toast = useToast();

  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(settings.theme || 'light');
  const [uiDensity, setUiDensity] = useState<'comfortable' | 'compact'>(settings.uiDensity || 'comfortable');

  const handleSaveAppearance = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      ...settings,
      theme,
      uiDensity,
    });
    toast.success(t('settings.saved'));
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-line bg-panel p-5 shadow-xs">
        <div className="flex items-center gap-2 border-b border-line pb-3">
          <SlidersHorizontal className="h-4 w-4 text-ink" />
          <h2 className="text-sm font-semibold text-ink">{t('settings.tabAppearance')}</h2>
        </div>

        <form onSubmit={handleSaveAppearance} className="mt-4 space-y-5 text-xs max-w-lg">
          {/* Theme Mode */}
          <div>
            <label className="block font-medium text-ink">{t('settings.theme')}</label>
            <div className="mt-2 grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`flex flex-col items-center gap-1.5 rounded-lg border p-3 text-center transition-colors ${
                  theme === 'light'
                    ? 'border-ink bg-subtle font-semibold text-ink ring-1 ring-ink/10'
                    : 'border-line hover:bg-subtle text-ink-muted'
                }`}
              >
                <Sun className="h-4 w-4" />
                <span>{t('settings.themeLight')}</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`flex flex-col items-center gap-1.5 rounded-lg border p-3 text-center transition-colors ${
                  theme === 'dark'
                    ? 'border-ink bg-subtle font-semibold text-ink ring-1 ring-ink/10'
                    : 'border-line hover:bg-subtle text-ink-muted'
                }`}
              >
                <Moon className="h-4 w-4" />
                <span>{t('settings.themeDark')}</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme('system')}
                className={`flex flex-col items-center gap-1.5 rounded-lg border p-3 text-center transition-colors ${
                  theme === 'system'
                    ? 'border-ink bg-subtle font-semibold text-ink ring-1 ring-ink/10'
                    : 'border-line hover:bg-subtle text-ink-muted'
                }`}
              >
                <Layers className="h-4 w-4" />
                <span>{t('settings.themeSystem')}</span>
              </button>
            </div>
          </div>

          {/* UI Density */}
          <div>
            <label className="block font-medium text-ink">{t('settings.density')}</label>
            <div className="mt-2 grid grid-cols-2 gap-2.5">
              <div
                onClick={() => setUiDensity('comfortable')}
                className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors ${
                  uiDensity === 'comfortable'
                    ? 'border-ink bg-subtle font-semibold text-ink ring-1 ring-ink/10'
                    : 'border-line hover:bg-subtle text-ink-muted'
                }`}
              >
                <div>
                  <div>{t('settings.densityComfortable')}</div>
                  <div className="text-[11px] text-ink-muted font-normal mt-0.5">Padding lapang</div>
                </div>
                {uiDensity === 'comfortable' && <Check className="h-4 w-4 text-ink" />}
              </div>

              <div
                onClick={() => setUiDensity('compact')}
                className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors ${
                  uiDensity === 'compact'
                    ? 'border-ink bg-subtle font-semibold text-ink ring-1 ring-ink/10'
                    : 'border-line hover:bg-subtle text-ink-muted'
                }`}
              >
                <div>
                  <div>{t('settings.densityCompact')}</div>
                  <div className="text-[11px] text-ink-muted font-normal mt-0.5">Maksimal baris terlihat</div>
                </div>
                {uiDensity === 'compact' && <Check className="h-4 w-4 text-ink" />}
              </div>
            </div>
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
