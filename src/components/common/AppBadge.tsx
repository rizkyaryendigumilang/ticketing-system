import { getApp } from '../../config/vpsAppsConfig';

/** The app's ticket prefix on a tile in its identity colour, optionally followed by the app name. */
export function AppBadge({ appId, withName = true }: { appId: string; withName?: boolean }) {
  const app = getApp(appId);
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5 text-xs text-ink">
      <span
        className="inline-flex h-5 shrink-0 items-center rounded px-1.5 font-mono text-[11px] font-semibold text-white"
        style={{ backgroundColor: app?.color ?? '#5B6672' }}
        title={app?.name}
      >
        {app?.prefix ?? appId}
      </span>
      {withName && <span className="truncate">{app?.name ?? appId}</span>}
    </span>
  );
}
