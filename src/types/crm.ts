export type TicketStatus = 'open' | 'in_progress' | 'waiting_on_user' | 'solved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketCategory = 'bug_error' | 'account_login' | 'data_transaction' | 'feature_question' | 'other';

export interface AppSource {
  id: string;              // 'recruiter' | 'snackloop' | 'wedding' | 'life-planner' | 'ai-endurance' | 'kept' | 'diskon-bot'
  name: string;            // 'Snackloop-ERP'
  prefix: string;          // 'SNK'
  appUrl: string;          // URL aplikasi
  adminDbUrl?: string;     // URL pintasan database (PocketBase / Supabase)
  color: string;           // Warna identitas badge aplikasi
  description: string;
}

export interface CrmUser {
  id: string;              // Internal ID: 15 char, diturunkan dari compositeKey (lihat userIdFor)
  compositeKey: string;    // Unique: '{appId}:{externalUid}' contoh: 'snackloop:staff1'
  appId: string;           // Relasi ke AppSource.id
  externalUid: string;     // Username/Email dari aplikasi asal ('staff1')
  name: string;            // Nama tampilan
  email?: string;
  appRole: string;         // Role di aplikasi asal ('Staff Rekap', 'Employer UMKM', dll)
  systemRole: 'admin' | 'requester';
  lastSeenUrl?: string;    // Halaman terakhir saat user menekan tombol Help
  createdAt: string;
  lastActiveAt: string;
}

export interface Ticket {
  id: string;
  ticketNumber: string;    // Format: 'SNK-001', 'REC-002'
  appId: string;           // Relasi ke AppSource.id
  requesterId: string;     // Relasi ke CrmUser.id
  requesterName: string;
  requesterUid: string;
  requesterRole: string;
  subject: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  assignedTo?: string;       // Admin user ID or email
  assignedToName?: string;   // Admin display name
  assignedToRole?: string;   // Admin role
  sourcePageUrl?: string;  // URL halaman saat terjadi kendala
  deviceInfo?: string;     // Browser / OS
  attachments: string[];   // Array DataURL / URL gambar screenshot
  resolutionSummary?: string; // Catatan solusi saat di-set Solved
  satisfactionRating?: number; // Nilai kepuasan pelapor: 1 - 5 bintang
  satisfactionComment?: string; // Komentar balik pelapor
  tags?: string[]; // Tag kustom agen (misal: "VIP", "Bug UI", "Payment", "Follow-up")
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
  isInternalNote: boolean; // Jika true, hanya terlihat oleh Admin di CRM
  createdAt: string;
}

export interface CannedResponse {
  id: string;
  title: string;
  content: string;
  category?: string;
}

export interface HandoffParams {
  app: string;
  uid: string;
  name: string;
  role: string;
  fromUrl?: string;
  newTicket?: boolean;
  autoSubmit?: boolean;
  subject?: string;
  description?: string;
  category?: TicketCategory;
  priority?: TicketPriority;
}
