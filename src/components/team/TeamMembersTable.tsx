import React from 'react';
import { UserCheck, Shield, Trash2, Mail, ExternalLink } from 'lucide-react';
import type { TeamMember, UserRole } from '../../types/team';
import { VPS_APPS } from '../../config/vpsAppsConfig';

interface TeamMembersTableProps {
  members: TeamMember[];
  onRoleChange: (id: string, role: UserRole) => void;
  onRemove: (id: string) => void;
}

export function TeamMembersTable({ members, onRoleChange, onRemove }: TeamMembersTableProps) {
  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'superadmin':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-neutral-900 text-neutral-100 dark:bg-neutral-100 dark:text-neutral-900 px-2.5 py-0.5 text-[10px] font-semibold shadow-xs">
            <Shield className="h-3 w-3 text-emerald-400" />
            Superadmin
          </span>
        );
      case 'supervisor':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 px-2.5 py-0.5 text-[10px] font-semibold">
            Supervisor
          </span>
        );
      case 'agent':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 px-2.5 py-0.5 text-[10px] font-semibold">
            Helpdesk Agent
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-line bg-subtle px-2.5 py-0.5 text-[10px] font-medium text-ink-muted">
            Pelapor
          </span>
        );
    }
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-panel shadow-card">
      <table className="w-full text-left text-xs">
        <thead className="border-b border-line bg-subtle/50 text-[11px] font-semibold text-ink-muted">
          <tr>
            <th className="px-4 py-3">Nama Anggota</th>
            <th className="px-4 py-3">Peran (Role)</th>
            <th className="px-4 py-3">Aplikasi yang Ditugaskan</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line/60">
          {members.map((m) => (
            <tr key={m.id} className="hover:bg-subtle/40 transition-colors">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-subtle text-xs font-semibold text-ink">
                    {m.name
                      .split(' ')
                      .slice(0, 2)
                      .map((w) => w[0])
                      .join('')
                      .toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-ink">{m.name}</p>
                    <p className="font-mono text-[11px] text-ink-muted flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {m.email}
                    </p>
                  </div>
                </div>
              </td>

              <td className="px-4 py-3">
                {m.role === 'superadmin' ? (
                  getRoleBadge(m.role)
                ) : (
                  <select
                    value={m.role}
                    onChange={(e) => onRoleChange(m.id, e.target.value as UserRole)}
                    className="rounded border border-line bg-canvas px-2 py-1 text-xs text-ink focus:border-ink focus:outline-none"
                  >
                    <option value="supervisor">Supervisor</option>
                    <option value="agent">Helpdesk Agent</option>
                  </select>
                )}
              </td>

              <td className="px-4 py-3">
                {m.assignedApps.includes('all') ? (
                  <span className="font-mono text-[10px] text-ink-muted">Seluruh 7 Aplikasi</span>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {m.assignedApps.map((appId) => {
                      const app = VPS_APPS.find((a) => a.id === appId);
                      return (
                        <span
                          key={appId}
                          className="rounded px-1.5 py-0.5 font-mono text-[10px] border border-line"
                          style={{
                            backgroundColor: `${app?.color ?? '#888'}15`,
                            color: app?.color ?? '#333',
                          }}
                        >
                          {app?.prefix ?? appId}
                        </span>
                      );
                    })}
                  </div>
                )}
              </td>

              <td className="px-4 py-3">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold ${
                    m.status === 'active'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      m.status === 'active' ? 'bg-emerald-600' : 'bg-amber-600'
                    }`}
                  />
                  {m.status === 'active' ? 'Aktif' : 'Terkirim (Invited)'}
                </span>
              </td>

              <td className="px-4 py-3 text-right">
                {m.role !== 'superadmin' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Hapus anggota tim "${m.name}"?`)) {
                        onRemove(m.id);
                      }
                    }}
                    className="rounded p-1.5 text-ink-muted hover:text-red-600 hover:bg-subtle transition-colors"
                    title="Hapus dari Tim"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
