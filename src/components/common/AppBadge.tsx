import { getApp } from '../../config/vpsAppsConfig';

interface Props {
  appId: string;
  size?: 'sm' | 'md';
  showPrefix?: boolean;
}

export function AppBadge({ appId, size = 'md', showPrefix = false }: Props) {
  const app = getApp(appId);
  if (!app) {
    return (
      <span className="inline-flex items-center rounded border border-line bg-subtle px-2 py-0.5 text-xs text-ink-muted">
        {appId}
      </span>
    );
  }

  const pad = size === 'sm' ? 'px-1.5 py-0.5 text-[11px]' : 'px-2 py-0.5 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border font-medium leading-tight ${pad}`}
      style={{
        backgroundColor: `${app.color}12`,
        borderColor: `${app.color}38`,
        color: app.color,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full shrink-0"
        style={{ backgroundColor: app.color }}
      />
      <span className="truncate">{app.name}</span>
      {showPrefix && (
        <span className="font-mono text-[10px] opacity-75">[{app.prefix}]</span>
      )}
    </span>
  );
}
