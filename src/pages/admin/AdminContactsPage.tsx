import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExternalLink, KeyRound, Search } from 'lucide-react';
import { VPS_APPS } from '../../config/vpsAppsConfig';
import { useCrm } from '../../context/CrmContext';
import { timeAgo } from '../../services/crmLogic';
import { AppBadge } from '../../components/common/AppBadge';

export function AdminContactsPage() {
  const { data } = useCrm();
  const navigate = useNavigate();
  const [selectedApp, setSelectedApp] = useState<string>('all');
  const [search, setSearch] = useState('');

  const contacts = data.users.filter((u) => u.systemRole === 'requester');

  const q = search.trim().toLowerCase();
  const filtered = contacts.filter(
    (c) =>
      (selectedApp === 'all' || c.appId === selectedApp) &&
      (!q ||
        c.name.toLowerCase().includes(q) ||
        c.externalUid.toLowerCase().includes(q) ||
        c.compositeKey.toLowerCase().includes(q) ||
        c.appRole.toLowerCase().includes(q)),
  );

  const handleOpenAsUser = (c: (typeof contacts)[number]) => {
    const qs = new URLSearchParams({
      app: c.appId,
      uid: c.externalUid,
      name: c.name,
      role: c.appRole,
      ...(c.lastSeenUrl ? { from_url: c.lastSeenUrl } : {}),
    });
    navigate(`/handoff?${qs.toString()}`);
  };

  return (
    <div className="space-y-5 p-5 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink">
            Direktori Kontak Pelapor Lintas Aplikasi
          </h1>
          <p className="mt-0.5 text-xs text-ink-muted">
            Setiap user yang menekan tombol Help otomatis dibuatkan identitas unik{' '}
            <code className="rounded bg-subtle px-1 py-0.5 font-mono text-[11px]">
              {'{app_slug}:{external_uid}'}
            </code>{' '}
            agar tidak bentrok antar aplikasi.
          </p>
        </div>
        <div className="font-mono text-xs text-ink-muted">Total: {filtered.length} kontak</div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded border border-line bg-panel p-3">
        <div className="relative min-w-[240px] flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-faint" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, username, composite ID, atau role..."
            className="w-full rounded border border-line bg-canvas py-1.5 pl-8 pr-3 text-xs text-ink placeholder:text-ink-faint focus:border-ink focus:bg-panel focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => setSelectedApp('all')}
            className={`rounded border px-2.5 py-1 font-medium ${
              selectedApp === 'all'
                ? 'border-ink bg-ink text-white'
                : 'border-line bg-canvas text-ink-muted hover:text-ink'
            }`}
          >
            Semua ({contacts.length})
          </button>
          {VPS_APPS.map((app) => {
            const count = contacts.filter((c) => c.appId === app.id).length;
            return (
              <button
                key={app.id}
                type="button"
                onClick={() => setSelectedApp(app.id)}
                className={`rounded border px-2.5 py-1 font-medium ${
                  selectedApp === app.id
                    ? 'border-ink bg-ink text-white'
                    : 'border-line bg-canvas text-ink-muted hover:text-ink'
                }`}
              >
                {app.prefix} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Contacts Table */}
      <div className="overflow-x-auto rounded border border-line bg-panel">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-line bg-subtle/70 text-[11px] font-semibold text-ink-muted">
              <th className="py-2.5 pl-4 pr-2">Nama & Username</th>
              <th className="px-2 py-2.5">Composite ID</th>
              <th className="px-2 py-2.5">Aplikasi</th>
              <th className="px-2 py-2.5">Role Aplikasi</th>
              <th className="px-2 py-2.5">Tiket</th>
              <th className="px-2 py-2.5">Aktif Terakhir</th>
              <th className="py-2.5 pl-2 pr-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {filtered.map((c) => {
              const userTickets = data.tickets.filter(
                (t) => t.requesterId === c.id || (t.appId === c.appId && t.requesterUid === c.externalUid),
              );
              const openCount = userTickets.filter((t) => t.status === 'open').length;
              return (
                <tr key={c.id} className="hover:bg-subtle/50">
                  <td className="py-3 pl-4 pr-2">
                    <div className="font-semibold text-ink">{c.name}</div>
                    <div className="font-mono text-[11px] text-ink-muted">{c.externalUid}</div>
                  </td>
                  <td className="whitespace-nowrap px-2 py-3">
                    <span className="inline-flex items-center gap-1 rounded border border-line bg-subtle px-2 py-0.5 font-mono text-[11px] text-ink">
                      <KeyRound className="h-3 w-3 text-ink-muted" />
                      {c.compositeKey}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-2 py-3">
                    <AppBadge appId={c.appId} />
                  </td>
                  <td className="px-2 py-3 text-ink">{c.appRole}</td>
                  <td className="whitespace-nowrap px-2 py-3 font-mono tabular-nums">
                    <span className="font-semibold text-ink">{userTickets.length} total</span>
                    {openCount > 0 && (
                      <span className="ml-1.5 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700">
                        {openCount} open
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-2 py-3 font-mono text-[11px] text-ink-muted">
                    {timeAgo(c.lastActiveAt)}
                  </td>
                  <td className="whitespace-nowrap py-3 pl-2 pr-4 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => navigate(`/admin/tickets?app=${c.appId}`)}
                        className="rounded border border-line bg-canvas px-2 py-1 text-[11px] font-medium text-ink hover:border-line-strong"
                      >
                        Lihat Tiket
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenAsUser(c)}
                        className="inline-flex items-center gap-1 rounded border border-line bg-subtle px-2 py-1 text-[11px] font-medium text-ink hover:border-ink"
                      >
                        Buka Portal User
                        <ExternalLink className="h-3 w-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
