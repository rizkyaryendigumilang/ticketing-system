import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Copy, ExternalLink, KeyRound, Search, Users, Check } from 'lucide-react';
import { VPS_APPS } from '../../../config/vpsAppsConfig';
import { useCrm } from '../../../context/CrmContext';
import { timeAgo } from '../../../services/crmLogic';
import { AppBadge } from '../../common/AppBadge';
import { useToast } from '../../../context/ToastContext';

export function ContactsTab() {
  const { data, t } = useCrm();
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
        <div>
          <h2 className="text-sm font-semibold text-ink">Kontak Pelapor (Requester Contacts)</h2>
          <p className="text-xs text-ink-muted mt-0.5">
            Daftar seluruh identitas pengguna yang terdaftar secara otomatis via SSO Handoff dari 7 aplikasi VPS.
          </p>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-line bg-panel p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-ink-muted">
            <span>Total Pelapor Terdaftar</span>
            <Users className="h-4 w-4 text-ink-muted" />
          </div>
          <div className="mt-1 font-mono text-2xl font-bold text-ink tabular-nums">
            {contacts.length}
          </div>
        </div>

        <div className="rounded-lg border border-line bg-panel p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-ink-muted">
            <span>Total Tiket Terhubung</span>
            <KeyRound className="h-4 w-4 text-ink-muted" />
          </div>
          <div className="mt-1 font-mono text-2xl font-bold text-ink tabular-nums">
            {totalUserTickets}
          </div>
        </div>

        <div className="rounded-lg border border-line bg-panel p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-ink-muted">
            <span>Pelapor Bertiket Baru</span>
            <span className="h-2 w-2 rounded-full bg-red-600" />
          </div>
          <div className="mt-1 font-mono text-2xl font-bold text-red-600 tabular-nums">
            {contactsWithOpenTickets}
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-muted" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, externalUid, composite key, role..."
            className="w-full rounded border border-line bg-canvas py-1.5 pl-9 pr-3 text-xs text-ink placeholder:text-ink-muted focus:border-ink focus:outline-none"
          />
        </div>

        <select
          value={selectedApp}
          onChange={(e) => setSelectedApp(e.target.value)}
          className="rounded border border-line bg-canvas px-2.5 py-1.5 text-xs text-ink focus:border-ink focus:outline-none"
        >
          <option value="all">Semua Aplikasi ({contacts.length})</option>
          {VPS_APPS.map((a) => {
            const count = contacts.filter((c) => c.appId === a.id).length;
            return (
              <option key={a.id} value={a.id}>
                {a.name} ({count})
              </option>
            );
          })}
        </select>
      </div>

      {/* Contacts Table */}
      <div className="overflow-x-auto rounded-lg border border-line bg-panel shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-line bg-subtle/50 text-[11px] font-semibold text-ink-muted">
            <tr>
              <th className="px-4 py-3">Pelapor</th>
              <th className="px-4 py-3">Aplikasi Asal</th>
              <th className="px-4 py-3">Composite ID</th>
              <th className="px-4 py-3">Role Aplikasi</th>
              <th className="px-4 py-3">Aktivitas Terakhir</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/60">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-xs text-ink-muted">
                  Tidak ada kontak pelapor yang sesuai filter.
                </td>
              </tr>
            ) : (
              filtered.map((c) => {
                const userTickets = data.tickets.filter(
                  (t) =>
                    t.requesterId === c.id ||
                    (t.appId === c.appId && t.requesterUid === c.externalUid),
                );
                const openCount = userTickets.filter((t) => t.status === 'open').length;

                return (
                  <tr key={c.id} className="hover:bg-subtle/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-ink">{c.name}</div>
                      <div className="font-mono text-[11px] text-ink-muted">
                        UID: {c.externalUid}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <AppBadge appId={c.appId} />
                    </td>

                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => handleCopyKey(c.compositeKey)}
                        className="group inline-flex items-center gap-1.5 rounded bg-subtle px-2 py-1 font-mono text-[11px] text-ink hover:bg-subtle/80"
                        title="Klik untuk menyalin"
                      >
                        <span className="truncate max-w-[150px]">{c.compositeKey}</span>
                        {copiedId === c.compositeKey ? (
                          <Check className="h-3 w-3 text-emerald-600 shrink-0" />
                        ) : (
                          <Copy className="h-3 w-3 text-ink-muted group-hover:text-ink shrink-0" />
                        )}
                      </button>
                    </td>

                    <td className="px-4 py-3 text-ink-muted">
                      {c.appRole}
                    </td>

                    <td className="px-4 py-3 font-mono text-[11px] text-ink-muted">
                      {timeAgo(c.lastActiveAt)}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {openCount > 0 && (
                          <span className="rounded bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 px-1.5 py-0.5 font-mono text-[10px] font-bold">
                            {openCount} baru
                          </span>
                        )}
                        <a
                          href={getHandoffUrl(c)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-ink hover:underline"
                          title="Buka portal sebagai pelapor ini"
                        >
                          <span>Portal</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
