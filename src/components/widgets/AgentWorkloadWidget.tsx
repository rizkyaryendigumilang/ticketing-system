import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, UserCheck, AlertTriangle, ArrowUpRight, ShieldCheck } from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { getTeamMembers, subscribeTeam } from '../../services/teamService';
import type { TeamMember } from '../../types/team';

export function AgentWorkloadWidget() {
  const { data, t, lang } = useCrm();
  const navigate = useNavigate();
  const [team, setTeam] = useState<TeamMember[]>(getTeamMembers);

  useEffect(() => {
    return subscribeTeam(() => {
      setTeam(getTeamMembers());
    });
  }, []);

  // Compute workload for active tickets
  const { workloads, unassignedCount, maxLoad } = useMemo(() => {
    const activeTickets = data.tickets.filter(
      (t) => t.status === 'open' || t.status === 'in_progress' || t.status === 'waiting_on_user',
    );

    let unassigned = 0;
    const memberLoads: { member: TeamMember; count: number; urgentCount: number }[] = team.map(
      (m) => {
        const assigned = activeTickets.filter(
          (t) =>
            t.assignedTo === m.id ||
            t.assignedTo === m.email ||
            t.assignedToName?.toLowerCase() === m.name.toLowerCase(),
        );
        const urgent = assigned.filter((t) => t.priority === 'urgent').length;
        return {
          member: m,
          count: assigned.length,
          urgentCount: urgent,
        };
      },
    );

    for (const t of activeTickets) {
      if (!t.assignedTo && !t.assignedToName) {
        unassigned += 1;
      }
    }

    const max = Math.max(1, ...memberLoads.map((l) => l.count));

    return {
      workloads: memberLoads,
      unassignedCount: unassigned,
      maxLoad: max,
    };
  }, [data.tickets, team]);

  return (
    <div className="rounded-2xl border border-line bg-panel p-5 shadow-card transition-colors">
      <div className="flex items-center justify-between border-b border-line pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Users className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight text-ink">
              {lang === 'en' ? 'Team Workload & Capacity' : 'Beban Kerja & Kapasitas Agen'}
            </h3>
            <p className="text-[11px] text-ink-muted">
              {team.length} {lang === 'en' ? 'operators' : 'operator'}
              {unassignedCount > 0 && (
                <span className="font-semibold text-amber-700 dark:text-amber-400 ml-1">
                  · {unassignedCount} {lang === 'en' ? 'unassigned' : 'belum ditugaskan'}
                </span>
              )}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/admin/settings?tab=team')}
          className="inline-flex items-center gap-1 rounded-lg border border-line bg-subtle/80 px-2.5 py-1 text-xs font-medium text-ink hover:bg-subtle hover:border-line-strong transition-colors"
        >
          <span>{lang === 'en' ? 'Manage' : 'Kelola Tim'}</span>
          <ArrowUpRight className="h-3 w-3 text-ink-faint" />
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {workloads.map(({ member, count, urgentCount }) => {
          const loadPercentage = Math.round((count / maxLoad) * 100);
          const isHeavy = count >= 8;

          return (
            <div
              key={member.id}
              onClick={() => navigate(`/admin/tickets?assigned=${encodeURIComponent(member.id)}`)}
              className="content-auto group rounded-xl border border-line bg-subtle/40 p-3 hover:border-line-strong hover:bg-subtle/80 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink text-white font-mono text-[10px] font-bold">
                    {member.name.charAt(0).toUpperCase()}
                  </span>
                  <div className="truncate">
                    <p className="text-xs font-semibold text-ink truncate group-hover:text-blue-600 transition-colors">
                      {member.name}
                    </p>
                    <p className="text-[10px] text-ink-faint font-mono truncate">
                      {member.role.toUpperCase()} · {member.assignedApps.join(', ')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 text-right">
                  {urgentCount > 0 && (
                    <span className="inline-flex items-center gap-0.5 rounded bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-bold text-rose-700 dark:text-rose-300">
                      <AlertTriangle className="h-2.5 w-2.5" />
                      {urgentCount} darurat
                    </span>
                  )}
                  <span className="font-mono text-xs font-bold text-ink tabular-nums">
                    {count} {lang === 'en' ? 'tickets' : 'tiket'}
                  </span>
                </div>
              </div>

              {/* Progress bar of current workload */}
              <div className="mt-2.5 h-1.5 w-full rounded-full bg-line overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    isHeavy ? 'bg-amber-500' : 'bg-blue-600'
                  }`}
                  style={{ width: `${Math.max(8, loadPercentage)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
