import { useState } from 'react';
import { AlertTriangle, Edit3, X, Check, Power } from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { getApp } from '../../config/vpsAppsConfig';

interface Props {
  appId?: string;
  isAdmin?: boolean;
}

export function BroadcastBannerWidget({ appId, isAdmin = false }: Props) {
  const { settings, updateSettings, t, lang } = useCrm();
  const [dismissed, setDismissed] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(settings.maintenanceNoticeTitle || '');
  const [editMessage, setEditMessage] = useState(settings.maintenanceNoticeMessage || '');
  const [editAppId, setEditAppId] = useState(settings.maintenanceNoticeAppId || 'all');

  const isEnabled = settings.maintenanceNoticeEnabled;
  const targetAppId = settings.maintenanceNoticeAppId || 'all';

  // Check relevance: if targetAppId !== 'all' and user is in a different app, hide
  if (!isEnabled && !isAdmin) return null;
  if (!isAdmin && targetAppId !== 'all' && appId && targetAppId !== appId) return null;
  if (dismissed && !isAdmin) return null;

  const appInfo = targetAppId !== 'all' ? getApp(targetAppId) : null;

  const handleSave = () => {
    updateSettings({
      ...settings,
      maintenanceNoticeEnabled: true,
      maintenanceNoticeTitle: editTitle.trim(),
      maintenanceNoticeMessage: editMessage.trim(),
      maintenanceNoticeAppId: editAppId,
    });
    setEditing(false);
  };

  const handleToggleOff = () => {
    updateSettings({
      ...settings,
      maintenanceNoticeEnabled: false,
    });
    setEditing(false);
  };

  if (editing && isAdmin) {
    return (
      <div className="border-b border-amber-500/40 bg-amber-500/10 px-4 py-3 text-xs text-ink">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex-1 space-y-2 w-full">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Judul Pengumuman (Contoh: Pemeliharaan Server Database)"
                className="field !py-1 text-xs font-semibold"
              />
            </div>
            <textarea
              rows={2}
              value={editMessage}
              onChange={(e) => setEditMessage(e.target.value)}
              placeholder="Rincian informasi untuk pelapor/agen..."
              className="field !py-1 text-xs"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <select
              value={editAppId}
              onChange={(e) => setEditAppId(e.target.value)}
              className="field !py-1 text-xs w-auto"
            >
              <option value="all">Semua Aplikasi Ekosistem (Global)</option>
              <option value="snackloop">Snackloop-ERP</option>
              <option value="recruiter">Recruiter</option>
              <option value="kept">Kept Financial</option>
              <option value="wedding">Wedding Planner</option>
              <option value="life-planner">Life Planner</option>
              <option value="ai-endurance">AI-Endurance</option>
              <option value="diskon-bot">Diskon-Bot</option>
            </select>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-1 rounded bg-ink px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 active:scale-95 transition-transform"
            >
              <Check className="h-3 w-3" />
              Simpan & Siarkan
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="btn !py-1 text-xs"
            >
              Batal
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isEnabled) {
    if (!isAdmin) return null;
    return null;
  }

  return (
    <aside
      aria-label="Pengumuman Sistem"
      className="border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs text-amber-900 dark:text-amber-200"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <div className="truncate">
            <strong className="font-semibold">
              {settings.maintenanceNoticeTitle || (lang === 'en' ? 'System Maintenance Notice' : 'Pemberitahuan Sistem')}
            </strong>
            {appInfo && (
              <span className="ml-1.5 rounded bg-amber-500/20 px-1.5 py-0.2 font-mono text-[10px] text-amber-800 dark:text-amber-300">
                {appInfo.name}
              </span>
            )}
            <span className="mx-2 text-amber-700/60 dark:text-amber-400/60 hidden sm:inline">·</span>
            <span className="text-amber-800/90 dark:text-amber-300/90 hidden sm:inline">
              {settings.maintenanceNoticeMessage || (lang === 'en' ? 'Scheduled maintenance is underway. Ticket creation remains active.' : 'Pemeliharaan server sedang berlangsung. Tiket kendala tetap dicatat.')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {isAdmin && (
            <>
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:text-amber-200 hover:bg-amber-500/20 transition-colors"
                title="Sunting Pengumuman"
              >
                <Edit3 className="h-3 w-3" />
                <span className="hidden md:inline">Edit</span>
              </button>
              <button
                type="button"
                onClick={handleToggleOff}
                className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:text-amber-200 hover:bg-amber-500/20 transition-colors"
                title="Nonaktifkan Pengumuman"
              >
                <Power className="h-3 w-3" />
                <span className="hidden md:inline">Matikan</span>
              </button>
            </>
          )}
          {!isAdmin && (
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="rounded p-1 text-amber-800/80 hover:bg-amber-500/20 dark:text-amber-300"
              title="Tutup banner"
              aria-label="Tutup banner"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
