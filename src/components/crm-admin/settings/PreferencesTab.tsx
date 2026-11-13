import React, { useState } from 'react';
import { Check, Clock, Globe } from 'lucide-react';
import { useCrm } from '../../../context/CrmContext';
import { useToast } from '../../../context/ToastContext';
import type { Language } from '../../../i18n/translations';

export function PreferencesTab() {
  const { settings, updateSettings, lang, t } = useCrm();
  const toast = useToast();

  const [selectedLanguage, setSelectedLanguage] = useState<Language>(lang);
  const [timezone, setTimezone] = useState(settings.timezone || 'Asia/Jakarta');
  const [defaultView, setDefaultView] = useState<'dashboard' | 'tickets'>(settings.defaultView || 'dashboard');

  const handleSaveLanguage = (newLang: Language) => {
    setSelectedLanguage(newLang);
    updateSettings({ ...settings, language: newLang });
    toast.success(newLang === 'id' ? 'Bahasa antarmuka diubah ke Bahasa Indonesia' : 'Language changed to English');
  };

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      ...settings,
      language: selectedLanguage,
      timezone,
      defaultView,
    });
    toast.success(t('settings.saved'));
  };

  return (
    <div className="space-y-6">
      {/* Language Selection Card */}
      <div className="rounded-lg border border-line bg-panel p-5 shadow-xs">
        <div className="flex items-center gap-2 border-b border-line pb-3">
          <Globe className="h-4 w-4 text-ink" />
          <h2 className="text-sm font-semibold text-ink">{t('settings.langTitle')}</h2>
        </div>
        <p className="mt-2 text-xs text-ink-muted">
          {t('settings.langSubtitle')}
        </p>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div
            onClick={() => handleSaveLanguage('id')}
            className={`flex cursor-pointer items-center justify-between rounded-lg border p-3.5 transition-colors ${
              selectedLanguage === 'id'
                ? 'border-ink bg-subtle font-medium text-ink ring-1 ring-ink/10'
                : 'border-line bg-panel hover:bg-subtle text-ink-muted'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl select-none">🇮🇩</span>
              <div>
                <div className="font-semibold text-ink">{t('settings.langIdTitle')}</div>
                <div className="text-[11px] text-ink-muted mt-0.5">
                  {t('settings.langIdDesc')}
                </div>
              </div>
            </div>
            {selectedLanguage === 'id' && <Check className="h-4 w-4 text-ink shrink-0" />}
          </div>

          <div
            onClick={() => handleSaveLanguage('en')}
            className={`flex cursor-pointer items-center justify-between rounded-lg border p-3.5 transition-colors ${
              selectedLanguage === 'en'
                ? 'border-ink bg-subtle font-medium text-ink ring-1 ring-ink/10'
                : 'border-line bg-panel hover:bg-subtle text-ink-muted'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl select-none">🇬🇧</span>
              <div>
                <div className="font-semibold text-ink">{t('settings.langEnTitle')}</div>
                <div className="text-[11px] text-ink-muted mt-0.5">
                  {t('settings.langEnDesc')}
                </div>
              </div>
            </div>
            {selectedLanguage === 'en' && <Check className="h-4 w-4 text-ink shrink-0" />}
          </div>
        </div>
      </div>

      {/* Timezone & Landing View Preferences */}
      <div className="rounded-lg border border-line bg-panel p-5 shadow-xs">
        <div className="flex items-center gap-2 border-b border-line pb-3">
          <Clock className="h-4 w-4 text-ink" />
          <h2 className="text-sm font-semibold text-ink">Zona Waktu &amp; Navigasi Awal</h2>
        </div>

        <form onSubmit={handleSavePreferences} className="mt-4 space-y-4 text-xs max-w-md">
          <div>
            <label className="block font-medium text-ink">{t('settings.timezone')}</label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="mt-1 w-full rounded border border-line bg-canvas px-3 py-2 text-ink focus:border-ink focus:outline-none"
            >
              <option value="Asia/Jakarta">Asia/Jakarta (WIB · UTC+07:00)</option>
              <option value="Asia/Makassar">Asia/Makassar (WITA · UTC+08:00)</option>
              <option value="Asia/Jayapura">Asia/Jayapura (WIT · UTC+09:00)</option>
              <option value="UTC">UTC (Universal Coordinated Time)</option>
            </select>
            <p className="mt-1 text-[11px] text-ink-muted">
              Waktu saat ini: {new Date().toLocaleString('id-ID')}
            </p>
          </div>

          <div>
            <label className="block font-medium text-ink">{t('settings.defaultLanding')}</label>
            <select
              value={defaultView}
              onChange={(e) => setDefaultView(e.target.value as 'dashboard' | 'tickets')}
              className="mt-1 w-full rounded border border-line bg-canvas px-3 py-2 text-ink focus:border-ink focus:outline-none"
            >
              <option value="dashboard">Dashboard</option>
              <option value="tickets">Kotak Masuk Tiket (Tickets Inbox)</option>
            </select>
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
