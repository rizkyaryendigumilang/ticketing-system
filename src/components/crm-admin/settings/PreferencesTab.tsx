import React, { useState, useEffect } from 'react';
import { Check, Clock, Globe, Sparkles } from 'lucide-react';
import { useCrm } from '../../../context/CrmContext';
import { useToast } from '../../../context/ToastContext';
import type { Language } from '../../../i18n/translations';

export function PreferencesTab() {
  const { settings, updateSettings, lang, setLanguage, t } = useCrm();
  const toast = useToast();

  const [selectedLanguage, setSelectedLanguage] = useState<Language>(lang);
  const [timezone, setTimezone] = useState(settings.timezone || 'Asia/Jakarta');
  const [defaultView, setDefaultView] = useState<'dashboard' | 'tickets'>(settings.defaultView || 'dashboard');

  useEffect(() => {
    setSelectedLanguage(lang);
  }, [lang]);

  const handleSelectLanguage = (newLang: Language) => {
    setSelectedLanguage(newLang);
    setLanguage(newLang);
    toast.success(
      newLang === 'id'
        ? t('settings.langSuccessId')
        : t('settings.langSuccessEn'),
    );
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
      <div className="rounded-2xl border border-line/60 bg-panel/70 backdrop-blur-md p-6 shadow-xs">
        <div className="flex items-center gap-2 border-b border-line/60 pb-3">
          <Globe className="h-4 w-4 text-ink" />
          <h2 className="text-sm font-semibold text-ink">{t('settings.langTitle')}</h2>
        </div>
        <p className="mt-2 text-xs text-ink-muted">
          {t('settings.langSubtitle')}
        </p>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
          {/* Bahasa Indonesia Card */}
          <div
            onClick={() => handleSelectLanguage('id')}
            className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 transition-all duration-150 ${
              selectedLanguage === 'id'
                ? 'border-ink bg-canvas shadow-xs ring-1 ring-ink/15 text-ink'
                : 'border-line/70 bg-panel/50 hover:bg-canvas text-ink-muted hover:border-line-strong'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <span className="text-2xl select-none" aria-hidden="true">🇮🇩</span>
              <div>
                <div className="font-semibold text-ink flex items-center gap-1.5">
                  <span>{t('settings.langIdTitle')}</span>
                  {selectedLanguage === 'id' && (
                    <span className="rounded bg-ink/10 px-1.5 py-0.2 text-[10px] font-mono text-ink">
                      Aktif
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-ink-muted mt-0.5">
                  {t('settings.langIdDesc')}
                </div>
              </div>
            </div>
            {selectedLanguage === 'id' && (
              <div className="h-5 w-5 rounded-full bg-ink flex items-center justify-center shrink-0">
                <Check className="h-3 w-3 text-white" />
              </div>
            )}
          </div>

          {/* English Card */}
          <div
            onClick={() => handleSelectLanguage('en')}
            className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 transition-all duration-150 ${
              selectedLanguage === 'en'
                ? 'border-ink bg-canvas shadow-xs ring-1 ring-ink/15 text-ink'
                : 'border-line/70 bg-panel/50 hover:bg-canvas text-ink-muted hover:border-line-strong'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <span className="text-2xl select-none" aria-hidden="true">🇬🇧</span>
              <div>
                <div className="font-semibold text-ink flex items-center gap-1.5">
                  <span>{t('settings.langEnTitle')}</span>
                  {selectedLanguage === 'en' && (
                    <span className="rounded bg-ink/10 px-1.5 py-0.2 text-[10px] font-mono text-ink">
                      Active
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-ink-muted mt-0.5">
                  {t('settings.langEnDesc')}
                </div>
              </div>
            </div>
            {selectedLanguage === 'en' && (
              <div className="h-5 w-5 rounded-full bg-ink flex items-center justify-center shrink-0">
                <Check className="h-3 w-3 text-white" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Timezone & Landing View Preferences */}
      <div className="rounded-2xl border border-line/60 bg-panel/70 backdrop-blur-md p-6 shadow-xs">
        <div className="flex items-center gap-2 border-b border-line/60 pb-3">
          <Clock className="h-4 w-4 text-ink" />
          <h2 className="text-sm font-semibold text-ink">
            {lang === 'en' ? 'Timezone & Initial Landing View' : 'Zona Waktu & Navigasi Awal'}
          </h2>
        </div>

        <form onSubmit={handleSavePreferences} className="mt-5 space-y-4 text-xs max-w-md">
          <div>
            <label className="block font-medium text-ink">{t('settings.timezone')}</label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="mt-1 w-full rounded-xl border border-line bg-canvas px-3 py-2 text-ink focus:border-ink focus:outline-none"
            >
              <option value="Asia/Jakarta">Asia/Jakarta (WIB · UTC+07:00)</option>
              <option value="Asia/Makassar">Asia/Makassar (WITA · UTC+08:00)</option>
              <option value="Asia/Jayapura">Asia/Jayapura (WIT · UTC+09:00)</option>
              <option value="UTC">UTC (Universal Coordinated Time)</option>
            </select>
            <p className="mt-1 text-[11px] text-ink-muted">
              {lang === 'en' ? 'Current time: ' : 'Waktu saat ini: '}
              {new Date().toLocaleString(lang === 'en' ? 'en-US' : 'id-ID')}
            </p>
          </div>

          <div>
            <label className="block font-medium text-ink">{t('settings.defaultLanding')}</label>
            <select
              value={defaultView}
              onChange={(e) => setDefaultView(e.target.value as 'dashboard' | 'tickets')}
              className="mt-1 w-full rounded-xl border border-line bg-canvas px-3 py-2 text-ink focus:border-ink focus:outline-none"
            >
              <option value="dashboard">Dashboard</option>
              <option value="tickets">
                {lang === 'en' ? 'Ticket Inbox' : 'Kotak Masuk Tiket (Tickets Inbox)'}
              </option>
            </select>
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
    </div>
  );
}
