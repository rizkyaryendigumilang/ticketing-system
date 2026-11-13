import React from 'react';
import { Check, X, Shield, Users } from 'lucide-react';
import { PERMISSION_DEFINITIONS } from '../../services/teamService';
import type { UserRole } from '../../types/team';

export function RolePermissionMatrix() {
  const roles: { role: UserRole; title: string; desc: string }[] = [
    {
      role: 'superadmin',
      title: 'Superadmin',
      desc: 'Akses penuh tanpa batas ke seluruh ekosistem VPS.',
    },
    {
      role: 'supervisor',
      title: 'Supervisor Divisi',
      desc: 'Mengelola tiket divisi, membuat laporan, dan mengundang operator.',
    },
    {
      role: 'agent',
      title: 'Helpdesk Agent',
      desc: 'Menjawab tiket pelapor dan menulis catatan teknis internal.',
    },
  ];

  // Group permissions by category
  const categories = Array.from(new Set(PERMISSION_DEFINITIONS.map((p) => p.category)));

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-line bg-panel p-5 shadow-xs">
        <div className="flex items-center gap-2 border-b border-line pb-3">
          <Shield className="h-4 w-4 text-ink" />
          <h2 className="text-sm font-semibold text-ink">Matriks Otoritas & Perizinan (RBAC)</h2>
        </div>
        <p className="mt-2 text-xs text-ink-muted leading-relaxed">
          Struktur perizinan berbasis peran terpadu (*Role-Based Access Control*) untuk menjaga isolasi data pelapor dan hak operasional staf helpdesk.
        </p>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-line bg-subtle/50 text-[11px] font-semibold text-ink-muted">
              <tr>
                <th className="px-4 py-3 min-w-[220px]">Kemampuan / Perizinan</th>
                {roles.map((r) => (
                  <th key={r.role} className="px-4 py-3 text-center min-w-[120px]">
                    <div className="font-bold text-ink">{r.title}</div>
                    <div className="font-normal text-[10px] text-ink-muted truncate max-w-[140px] mx-auto">
                      {r.desc}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {categories.map((category) => {
                const perms = PERMISSION_DEFINITIONS.filter((p) => p.category === category);
                return (
                  <React.Fragment key={category}>
                    <tr className="bg-subtle/20 font-bold text-ink text-[11px]">
                      <td colSpan={4} className="px-4 py-2 uppercase tracking-wider text-ink-muted">
                        {category}
                      </td>
                    </tr>
                    {perms.map((p) => (
                      <tr key={p.key} className="hover:bg-subtle/30 transition-colors">
                        <td className="px-4 py-2.5">
                          <p className="font-medium text-ink">{p.label}</p>
                          <p className="text-[11px] text-ink-muted">{p.description}</p>
                        </td>
                        {roles.map((r) => {
                          const allowed = p.allowedRoles.includes(r.role);
                          return (
                            <td key={r.role} className="px-4 py-2.5 text-center">
                              {allowed ? (
                                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                                  <Check className="h-3 w-3" />
                                </span>
                              ) : (
                                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-subtle text-ink-faint">
                                  <X className="h-3 w-3" />
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
