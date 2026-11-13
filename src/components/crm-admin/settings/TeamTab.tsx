import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Shield } from 'lucide-react';
import {
  getTeamMembers,
  addTeamMember,
  removeTeamMember,
  updateMemberRole,
  subscribeTeam,
} from '../../../services/teamService';
import type { TeamMember, InvitationInput, UserRole } from '../../../types/team';
import { TeamMembersTable } from '../../team/TeamMembersTable';
import { RolePermissionMatrix } from '../../team/RolePermissionMatrix';
import { InviteMemberModal } from '../../team/InviteMemberModal';
import { useToast } from '../../../context/ToastContext';

export function TeamTab() {
  const toast = useToast();
  const [members, setMembers] = useState<TeamMember[]>(getTeamMembers);
  const [activeSubTab, setActiveSubTab] = useState<'members' | 'matrix'>('members');
  const [inviteModalOpen, setInviteModalOpen] = useState(false);

  useEffect(() => {
    setMembers(getTeamMembers());
    return subscribeTeam(() => {
      setMembers(getTeamMembers());
    });
  }, []);

  const handleRoleChange = (id: string, role: UserRole) => {
    updateMemberRole(id, role);
    toast.success('Peran anggota tim berhasil diperbarui.');
  };

  const handleRemove = (id: string) => {
    removeTeamMember(id);
    toast.success('Anggota berhasil dihapus dari tim.');
  };

  const handleInvite = (input: InvitationInput) => {
    addTeamMember(input);
    toast.success(`Undangan berhasil dikirim ke ${input.email}.`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
        <div>
          <h2 className="text-sm font-semibold text-ink">Tim & Otoritas (Helpdesk Team & Roles)</h2>
          <p className="text-xs text-ink-muted mt-0.5">
            Kelola operator helpdesk, supervisor divisi, hak akses RBAC, dan undangan staf baru.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setInviteModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded bg-ink px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:opacity-90 active:scale-95 transition-all"
        >
          <UserPlus className="h-3.5 w-3.5" />
          <span>Undang Anggota</span>
        </button>
      </div>

      {/* Sub Tabs */}
      <div className="flex border-b border-line gap-2 text-xs font-medium">
        <button
          type="button"
          onClick={() => setActiveSubTab('members')}
          className={`flex items-center gap-1.5 py-2 px-2.5 border-b-2 transition-colors ${
            activeSubTab === 'members'
              ? 'border-ink text-ink font-semibold'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          <Users className="h-3.5 w-3.5" />
          <span>Daftar Operator ({members.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('matrix')}
          className={`flex items-center gap-1.5 py-2 px-2.5 border-b-2 transition-colors ${
            activeSubTab === 'matrix'
              ? 'border-ink text-ink font-semibold'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          <Shield className="h-3.5 w-3.5" />
          <span>Matriks Otoritas (RBAC)</span>
        </button>
      </div>

      {activeSubTab === 'members' ? (
        <TeamMembersTable
          members={members}
          onRoleChange={handleRoleChange}
          onRemove={handleRemove}
        />
      ) : (
        <RolePermissionMatrix />
      )}

      <InviteMemberModal
        open={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        onInvite={handleInvite}
      />
    </div>
  );
}
