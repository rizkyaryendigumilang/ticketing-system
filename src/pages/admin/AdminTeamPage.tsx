import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Shield, ShieldCheck } from 'lucide-react';
import {
  getTeamMembers,
  addTeamMember,
  removeTeamMember,
  updateMemberRole,
  subscribeTeam,
} from '../../services/teamService';
import type { TeamMember, InvitationInput, UserRole } from '../../types/team';
import { TeamMembersTable } from '../../components/team/TeamMembersTable';
import { RolePermissionMatrix } from '../../components/team/RolePermissionMatrix';
import { InviteMemberModal } from '../../components/team/InviteMemberModal';
import { useToast } from '../../context/ToastContext';
import { useCrm } from '../../context/CrmContext';

export function AdminTeamPage() {
  const { admin } = useCrm();
  const toast = useToast();
  const [members, setMembers] = useState<TeamMember[]>(getTeamMembers);
  const [activeTab, setActiveTab] = useState<'members' | 'matrix'>('members');
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
    <div className="space-y-6 p-5 sm:p-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
            Pengguna & Manajemen Tim
          </h1>
          <p className="mt-1 text-xs text-ink-muted">
            Kelola operator helpdesk, supervisor divisi, peran akses (*RBAC*), dan undangan staf baru.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setInviteModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded bg-ink px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:opacity-90 active:scale-95 transition-all"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Undang Anggota Tim
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-line gap-2 text-xs font-medium">
        <button
          type="button"
          onClick={() => setActiveTab('members')}
          className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 transition-colors ${
            activeTab === 'members'
              ? 'border-ink text-ink font-semibold'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          <Users className="h-3.5 w-3.5" />
          <span>Daftar Operator & Anggota ({members.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('matrix')}
          className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 transition-colors ${
            activeTab === 'matrix'
              ? 'border-ink text-ink font-semibold'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          <Shield className="h-3.5 w-3.5" />
          <span>Matriks Otoritas (RBAC Permissions)</span>
        </button>
      </div>

      {/* Content */}
      {activeTab === 'members' ? (
        <div className="space-y-4">
          <TeamMembersTable
            members={members}
            onRoleChange={handleRoleChange}
            onRemove={handleRemove}
          />
        </div>
      ) : (
        <RolePermissionMatrix />
      )}

      {/* Modal Invite */}
      <InviteMemberModal
        open={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        onInvite={handleInvite}
      />
    </div>
  );
}
