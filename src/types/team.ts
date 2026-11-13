export type UserRole = 'superadmin' | 'agent' | 'supervisor' | 'requester';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  assignedApps: string[]; // e.g. ['all'] or specific app ids
  status: 'active' | 'invited' | 'suspended';
  lastActiveAt: string;
}

export interface PermissionDefinition {
  key: string;
  category: string;
  label: string;
  description: string;
  allowedRoles: UserRole[];
}

export interface InvitationInput {
  name: string;
  email: string;
  role: UserRole;
  assignedApps: string[];
}
