export type TicketStatus = 'open' | 'in_progress' | 'waiting_on_user' | 'solved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketCategory = 'bug_error' | 'account_login' | 'data_transaction' | 'feature_question' | 'other';

export interface AppSource {
  id: string;
  name: string;
  prefix: string;
  appUrl: string;
  adminDbUrl?: string;
  color: string;
  description: string;
}

export interface CrmUser {
  id: string;
  compositeKey: string;
  appId: string;
  externalUid: string;
  name: string;
  email?: string;
  appRole: string;
  systemRole: 'admin' | 'requester';
  createdAt: string;
  lastActiveAt: string;
}

export interface Ticket {
  id: string;
  ticketNumber: string;
  appId: string;
  requesterId: string;
  requesterName: string;
  requesterUid: string;
  requesterRole: string;
  subject: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  sourcePageUrl?: string;
  deviceInfo?: string;
  attachments: string[];
  resolutionSummary?: string;
  createdAt: string;
  updatedAt: string;
  solvedAt?: string;
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  senderId: string;
  senderName: string;
  senderRole: 'admin' | 'requester' | 'system';
  body: string;
  attachments?: string[];
  isInternalNote: boolean;
  createdAt: string;
}

export interface CannedResponse {
  id: string;
  title: string;
  content: string;
  category?: string;
}

export interface DemoAccount {
  compositeKey: string;
  appId: string;
  uid: string;
  name: string;
  role: string;
  label: string;
}
