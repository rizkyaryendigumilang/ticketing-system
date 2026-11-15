import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Radio, ArrowRight, BellRing } from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { VPS_APPS, getApp } from '../../config/vpsAppsConfig';
import { AppBadge } from '../common/AppBadge';

export function AppSpikeDetectorWidget() {
  const { data, settings, updateSettings, t, lang } = useCrm();
  const navigate = useNavigate();

  // Look for ticket bursts in recent window (last 6 hours or same day)
  const anomalies = useMemo(() => {
    const now = Date.now();
    const windowMs = 6 * 3600 * 1000; // 6 hours

    const recentTickets = data.tickets.filter((t) => {
      const created = Date.parse(t.createdAt);
      return !isNaN(created) && now - created <= windowMs;
    });

    const appCounts: Record<string, { count: number; bugs: number; latestSubject: string }> = {};

    for (const t of recentTickets) {
      if (!appCounts[t.appId]) {
        appCounts[t.appId] = { count: 0, bugs: 0, latestSubject: t.subject };
      }
      appCounts[t.appId].count += 1;
      if (t.category === 'bug_error' || t.priority === 'urgent' || t.priority === 'high') {
        appCounts[t.appId].bugs += 1;
      }
    }

    // Flag apps that have >= 2 tickets in the recent window with high severity, or highest count
    const flagged = Object.entries(appCounts)
      .filter(([_, stats]) => stats.count >= 2)
      .map(([appId, stats]) => {
        const app = getApp(appId);
        return {
          appId,
          appName: app?.name ?? appId,
          count: stats.count,
          bugs: stats.bugs,
          latestSubject: stats.latestSubject,
        };
      })
      .sort((a, b) => b.count - a.count);

    return flagged;
  }, [data.tickets]);

  const handleTriggerBroadcast = (appId: string, appName: string) => {
    updateSettings({
      ...settings,
      maintenanceNoticeEnabled: true,
      maintenanceNoticeAppId: appId,
      maintenanceNoticeTitle: `Investigasi Kendala Sistem: ${appName}`,
      maintenanceNoticeMessage: `Tim teknis sedang menginvestigasi lonjakan kendala pada sistem ${appName}. Tiket kendala baru tetap dicatat dan diprioritaskan.`,
    });
  };

  if (anomalies.length === 0) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-line bg-subtle/40 px-4 py-3 text-xs text-ink-muted">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>
            {lang === 'en'
              ? 'All 7 VPS ecosystem applications operating normally. No error spikes detected.'
              : 'Semua 7 aplikasi ekosistem beroperasi normal. Tidak ada lonjakan tiket atau anomali error.'}
          </span>
        </div>
        <span className="font-mono text-[11px] text-ink-faint hidden sm:inline">6j terakhir</span>
      </div>
    );
  }

  const primaryAnomaly = anomalies[0];

  return (
    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/[0.04] p-4 text-xs text-ink shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300 shrink-0 mt-0.5">
            <Radio className="h-4 w-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-amber-900 dark:text-amber-200">
                {lang === 'en' ? 'Potential Incident / Spike Detected' : 'Deteksi Lonjakan Kendala Sistem'}
              </span>
              <AppBadge appId={primaryAnomaly.appId} />
            </div>
            <p className="mt-1 text-ink-muted text-[11px] leading-relaxed">
              Terdeteksi <strong>{primaryAnomaly.count} tiket masuk</strong> pada <strong>{primaryAnomaly.appName}</strong> dalam rentang waktu singkat ({primaryAnomaly.bugs} tiket bug/urgensi tinggi).
              <span className="block mt-0.5 text-ink-faint italic truncate max-w-lg">
                &ldquo;{primaryAnomaly.latestSubject}&rdquo;
              </span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0 self-end sm:self-center">
          <button
            type="button"
            onClick={() => navigate(`/admin/tickets?app=${primaryAnomaly.appId}`)}
            className="inline-flex items-center gap-1 rounded-lg border border-line bg-panel px-2.5 py-1 text-xs font-semibold text-ink shadow-2xs hover:bg-subtle transition-colors"
          >
            <span>{lang === 'en' ? 'View Tickets' : 'Lihat Tiket'}</span>
            <ArrowRight className="h-3 w-3 text-ink-faint" />
          </button>

          <button
            type="button"
            onClick={() => handleTriggerBroadcast(primaryAnomaly.appId, primaryAnomaly.appName)}
            className="inline-flex items-center gap-1 rounded-lg bg-amber-600 dark:bg-amber-700 px-2.5 py-1 text-xs font-semibold text-white shadow-2xs hover:opacity-90 active:scale-95 transition-transform"
          >
            <BellRing className="h-3 w-3" />
            <span>{lang === 'en' ? 'Broadcast Notice' : 'Siarkan Pengumuman'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
