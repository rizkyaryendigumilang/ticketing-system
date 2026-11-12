import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Copy, ExternalLink, KeyRound, Search, Users, X } from 'lucide-react';
import { VPS_APPS } from '../../config/vpsAppsConfig';
import { useCrm } from '../../context/CrmContext';
import { timeAgo } from '../../services/crmLogic';
import { AppBadge } from '../../components/common/AppBadge';
import { useToast } from '../../context/ToastContext';

export function AdminContactsPage() {
  const { data } = useCrm();
  const navigate = useNavigate();
  const toast = useToast();
  const [selectedApp, setSelectedApp] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

  const totalUserTickets = data.tickets.filter((t) => t.requesterRole !== 'system').length;
  const contactsWithOpenTickets = contacts.filter((c) =>
    data.tickets.some(
      (t) =>
        t.status === 'open' &&
        (t.requesterId === c.id || (t.appId === c.appId && t.requesterUid === c.externalUid)),
    ),
  ).length;

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedId(key);
    toast.success(`Composite ID disalin: ${key}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getHandoffUrl = (c: (typeof contacts)[number]) => {
    const qs = new URLSearchParams({
      app: c.appId,
      uid: c.externalUid,
      name: c.name,
      role: c.appRole,
      ...(c.lastSeenUrl ? { from_url: c.lastSeenUrl } : {}),
    });
    const base = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '');
    return `${base}/handoff?${qs.toString()}`;
  };

  return (
    <div className="space-y-5 p-5 sm:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-4">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-ink sm:text-xl">
            Kontak Pelapor Lintas Aplikasi
          </h1>
          <p className="mt-0.5 text-xs text-ink-muted">
            Identitas pelapor terisolasi secara otomatis berdasarkan ID Komposit{' '}
            <code className="rounded bg-subtle px-1.5 py-0.5 font-mono text-[11px] text-ink font-semibold">
              {'{app_slug}:{external_uid}'}
            </code>{' '}
            sehingga data antaraplikasi tidak saling bercampur.
          </p>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-line bg-panel p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-ink-muted">
            <span>Total Pelapor Terdaftar</span>
            <Users className="h-4 w-4 text-ink-muted" />
          </div>
          <div className="mt-1 font-mono text-2xl font-bold text-ink tabular-nums">
            {contacts.length}
          </div>
          <div className="mt-0.5 text-[11px] text-ink-muted">Tercatat di seluruh aplikasi ekosistem</div>
        </div>

        <div className="rounded-lg border border-line bg-panel p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-ink-muted">
            <span>Total Tiket Dilaporkan</span>
            <KeyRound className="h-4 w-4 text-ink-muted" />
          </div>
          <div className="mt-1 font-mono text-2xl font-bold text-ink tabular-nums">
            {totalUserTickets}
          </div>
          <div className="mt-0.5 text-[11px] text-ink-muted">Akumulasi laporan dari seluruh pelapor</div>
        </div>

        <div className="rounded-lg border border-line bg-panel p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-ink-muted">
            <span>Pelapor dengan Tiket Baru</span>
            <span className="h-2 w-2 rounded-full bg-red-600" />
          </div>
          <div className="mt-1 font-mono text-2xl font-bold text-red-600 tabular-nums">
            {contactsWithOpenTickets}
          </div>
          <div className="mt-0.5 text-[11px] text-ink-muted">Menunggu tanggapan Superadmin</div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-panel p-3 shadow-sm">
        <div className="relative min-w-[240px] flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-faint" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, username, composite ID..."
            className="w-full rounded border border-line bg-canvas py-1.5 pl-8 pr-7 text-xs text-ink placeholder:text-ink-faint focus:border-ink focus:bg-panel focus:outline-none"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* App Filter Chips */}
        <div className="flex flex-wrap gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => setSelectedApp('all')}
            className={`rounded px-2.5 py-1 font-medium transition-colors ${
              selectedApp === 'all'
                ? 'border border-ink bg-ink text-white font-semibold'
                : 'border border-line bg-canvas text-ink-muted hover:text-ink'
            }`}
          >
            Semua ({contacts.length})
          </button>
          {VPS_APPS.map((app) => {
            const count = contacts.filter((c) => c.appId === app.id).length;
            const isSelected = selectedApp === app.id;
            return (
              <button
                key={app.id}
                type="button"
                onClick={() => setSelectedApp(app.id)}
                className={`inline-flex items-center gap-1.5 rounded border px-2.5 py-1 font-medium transition-colors ${
                  isSelected
                    ? 'border-ink bg-ink text-white font-semibold'
                    : 'border-line bg-canvas text-ink-muted hover:text-ink'
                }`}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: app.color }}
                />
                <span>{app.prefix}</span>
                <span className="font-mono text-[10px] opacity-75">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Contacts Table */}
      <div className="overflow-x-auto rounded-lg border border-line bg-panel shadow-sm">
        {filtered.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-semibold text-ink">Tidak ada kontak yang cocok dengan filter.</p>
            <p className="mt-1 text-xs text-ink-muted">Ubah kata kunci pencarian atau reset filter aplikasi.</p>
          </div>
        ) : (
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-line bg-subtle/70 text-[11px] font-semibold text-ink-muted">
                <th className="py-2.5 pl-4 pr-2">Nama & Username</th>
                <th className="px-2 py-2.5">Composite ID (Unik)</th>
                <th className="px-2 py-2.5">Aplikasi</th>
                <th className="px-2 py-2.5">Role Aplikasi</th>
                <th className="px-2 py-2.5">Riwayat Tiket</th>
                <th className="px-2 py-2.5">Aktif Terakhir</th>
                <th className="py-2.5 pl-2 pr-4 text-right">Aksi Pintas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((c) => {
                const userTickets = data.tickets.filter(
                  (t) => t.requesterId === c.id || (t.appId === c.appId && t.requesterUid === c.externalUid),
                );
                const openCount = userTickets.filter((t) => t.status === 'open').length;
                const isCopied = copiedId === c.compositeKey;

                return (
                  <tr key={c.id} className="transition-colors hover:bg-subtle/50">
                    <td className="py-3 pl-4 pr-2">
                      <div className="font-semibold text-ink">{c.name}</div>
                      <div className="font-mono text-[11px] text-ink-muted">{c.externalUid}</div>
                    </td>

                    <td className="whitespace-nowrap px-2 py-3">
                      <button
                        type="button"
                        onClick={() => handleCopyKey(c.compositeKey)}
                        title="Klik untuk menyalin Composite Key"
                        className="group inline-flex items-center gap-1.5 rounded border border-line bg-subtle px-2 py-0.5 font-mono text-[11px] text-ink transition-colors hover:border-line-strong hover:bg-line/40"
                      >
                        <KeyRound className="h-3 w-3 text-ink-muted" />
                        <span>{c.compositeKey}</span>
                        {isCopied ? (
                          <Check className="h-3 w-3 text-emerald-600" />
                        ) : (
                          <Copy className="h-2.5 w-2.5 text-ink-faint group-hover:text-ink" />
                        )}
                      </button>
                    </td>

                    <td className="whitespace-nowrap px-2 py-3">
                      <AppBadge appId={c.appId} />
                    </td>

                    <td className="px-2 py-3 text-ink">
                      <span className="rounded bg-subtle px-1.5 py-0.5 text-xs text-ink">
                        {c.appRole}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-2 py-3 font-mono tabular-nums">
                      <span className="font-semibold text-ink">{userTickets.length} tiket</span>
                      {openCount > 0 && (
                        <span className="ml-1.5 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700">
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
                          onClick={() =>
                            navigate(
                              `/admin/tickets?app=${c.appId}&q=${encodeURIComponent(c.externalUid)}`,
                            )
                          }
                          className="rounded border border-line bg-canvas px-2.5 py-1 text-[11px] font-medium text-ink hover:border-line-strong transition-colors"
                        >
                          Lihat Tiket
                        </button>
                        <a
                          href={getHandoffUrl(c)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded border border-line bg-subtle px-2.5 py-1 text-[11px] font-medium text-ink hover:border-ink transition-colors"
                        >
                          Buka Portal
                          <ExternalLink className="h-3 w-3 text-ink-muted" />
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
