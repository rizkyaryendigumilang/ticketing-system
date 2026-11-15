import { useState } from 'react';
import {
  LifeBuoy,
  X,
  Send,
  MessageSquare,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { getApp } from '../../config/vpsAppsConfig';
import { KB_ARTICLES } from '../../config/knowledgeBaseData';
import { useToast } from '../../context/ToastContext';
import { createTicket } from '../../services/ticketCrmService';
import { userIdFor } from '../../services/crmLogic';
import type { CrmUser, TicketCategory } from '../../types/crm';

interface Props {
  appId?: string;
  externalUid?: string;
  userName?: string;
  userRole?: string;
  currentUrl?: string;
}

export function FloatingHelpdeskWidget({
  appId = 'snackloop',
  externalUid = 'user_demo',
  userName = 'Pelapor Demo',
  userRole = 'Staff',
  currentUrl,
}: Props) {
  const { data, t } = useCrm();
  const toast = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'create' | 'tickets' | 'faq'>('create');

  // Form State
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TicketCategory>('bug_error');
  const [submitting, setSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<string | null>(null);

  const app = getApp(appId);
  const detectedUrl = currentUrl || (typeof window !== 'undefined' ? window.location.href : app?.appUrl || '');

  // User tickets in this app
  const myTickets = data.tickets.filter(
    (t) => t.appId === appId && t.requesterUid === externalUid,
  );
  const activeCount = myTickets.filter(
    (t) => t.status === 'open' || t.status === 'in_progress' || t.status === 'waiting_on_user',
  ).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) return;

    setSubmitting(true);
    try {
      const compositeKey = `${appId}:${externalUid}`;
      const user: CrmUser = {
        id: userIdFor(compositeKey),
        compositeKey,
        appId,
        externalUid,
        name: userName,
        appRole: userRole,
        systemRole: 'requester',
        createdAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
      };

      const ticket = createTicket(user, {
        subject: subject.trim(),
        description: description.trim(),
        category,
        priority: 'medium',
        sourcePageUrl: detectedUrl,
        attachments: [],
      });
      setSubmittedTicket(ticket.ticketNumber);
      toast.success(`Tiket #${ticket.ticketNumber} berhasil dikirim ke Meja Bantuan.`);
      setSubject('');
      setDescription('');
    } catch {
      toast.error('Gagal mengirim tiket. Silakan coba kembali.');
    } finally {
      setSubmitting(false);
    }
  };

  const appFaqs = KB_ARTICLES.filter((a) => a.appId === appId || a.appId === 'global').slice(0, 3);

  return (
    <div className="fixed bottom-5 right-5 z-50 select-none">
      {/* ═══ Expanded Widget Panel ═══ */}
      {isOpen && (
        <div className="mb-3 w-[calc(100vw-2.5rem)] sm:w-96 rounded-2xl border border-line bg-panel shadow-drawer overflow-hidden flex flex-col max-h-[82vh] animate-scale-pop origin-bottom-right text-ink">
          {/* Header */}
          <div
            className="p-4 text-white flex items-center justify-between"
            style={{ backgroundColor: app?.color ?? '#0F172A' }}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20 font-mono text-xs font-bold text-white">
                {app?.prefix ?? 'VPS'}
              </span>
              <div className="truncate">
                <p className="text-xs font-bold truncate leading-tight">
                  Pusat Bantuan {app?.name ?? 'Aplikasi'}
                </p>
                <p className="text-[10px] text-white/80 font-mono truncate">
                  {userName} ({externalUid})
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1 text-white/80 hover:bg-white/20 hover:text-white transition-colors"
              aria-label="Tutup widget"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-line bg-subtle/50 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setActiveTab('create');
                setSubmittedTicket(null);
              }}
              className={`flex-1 py-2.5 text-center transition-colors border-b-2 ${
                activeTab === 'create'
                  ? 'border-ink text-ink bg-panel'
                  : 'border-transparent text-ink-muted hover:text-ink'
              }`}
            >
              Kirim Tiket
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('tickets')}
              className={`flex-1 py-2.5 text-center transition-colors border-b-2 ${
                activeTab === 'tickets'
                  ? 'border-ink text-ink bg-panel'
                  : 'border-transparent text-ink-muted hover:text-ink'
              }`}
            >
              Tiket Saya {activeCount > 0 && `(${activeCount})`}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('faq')}
              className={`flex-1 py-2.5 text-center transition-colors border-b-2 ${
                activeTab === 'faq'
                  ? 'border-ink text-ink bg-panel'
                  : 'border-transparent text-ink-muted hover:text-ink'
              }`}
            >
              Solusi Cepat
            </button>
          </div>

          {/* Body Content */}
          <div className="p-4 overflow-y-auto flex-1 space-y-3.5">
            {/* TAB 1: FORM KIRIM TIKET */}
            {activeTab === 'create' && (
              <>
                {submittedTicket ? (
                  <div className="py-6 text-center space-y-3">
                    <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
                    <div>
                      <h4 className="text-sm font-bold text-ink">Tiket Terkirim</h4>
                      <p className="text-xs font-mono font-semibold text-emerald-700 mt-1">
                        #{submittedTicket}
                      </p>
                      <p className="text-[11px] text-ink-muted mt-2">
                        Tim teknis kami telah menerima laporan Anda. Respons akan muncul langsung di tab &ldquo;Tiket Saya&rdquo;.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSubmittedTicket(null)}
                      className="btn !py-1 text-xs"
                    >
                      Kirim Laporan Lain
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-semibold text-ink-muted mb-1">
                        Kategori Kendala
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as TicketCategory)}
                        className="field !py-1.5 text-xs"
                      >
                        <option value="bug_error">Bug / Error Fitur</option>
                        <option value="account_login">Akun & Akses Login</option>
                        <option value="data_transaction">Selisih Data / Transaksi</option>
                        <option value="feature_question">Pertanyaan Fitur</option>
                        <option value="other">Lainnya</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-ink-muted mb-1">
                        Subjek Kendala
                      </label>
                      <input
                        type="text"
                        required
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Contoh: Gagal cetak struk pembayaran"
                        className="field !py-1.5 text-xs font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-ink-muted mb-1">
                        Rincian Masalah
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Jelaskan apa yang terjadi dan pesan error yang muncul..."
                        className="field !py-1.5 text-xs"
                      />
                    </div>

                    <div className="rounded-lg bg-subtle/60 p-2 text-[10px] text-ink-faint font-mono truncate">
                      Auto-detected URL: {detectedUrl}
                    </div>

                    <button
                      type="submit"
                      disabled={submitting || !subject.trim()}
                      className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-ink py-2 text-xs font-semibold text-white shadow-xs hover:opacity-90 active:scale-95 disabled:opacity-50 transition-all"
                    >
                      <Send className="h-3 w-3" />
                      {submitting ? 'Mengirim...' : 'Kirim Laporan Bantuan'}
                    </button>
                  </form>
                )}
              </>
            )}

            {/* TAB 2: TIKET SAYA */}
            {activeTab === 'tickets' && (
              <div className="space-y-2">
                {myTickets.length === 0 ? (
                  <p className="py-6 text-center text-xs text-ink-muted">
                    Belum ada riwayat tiket dari akun ini.
                  </p>
                ) : (
                  myTickets.map((t) => (
                    <div
                      key={t.id}
                      className="rounded-xl border border-line p-3 hover:border-line-strong bg-subtle/30 transition-colors space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-ink">
                          #{t.ticketNumber}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            t.status === 'solved'
                              ? 'bg-emerald-500/10 text-emerald-700'
                              : t.status === 'open'
                              ? 'bg-rose-500/10 text-rose-700'
                              : 'bg-amber-500/10 text-amber-700'
                          }`}
                        >
                          {t.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-ink line-clamp-1">{t.subject}</p>
                      <a
                        href={`/helpdesk/portal/ticket/${t.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:underline pt-1"
                      >
                        Buka Percakapan Lengkap
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB 3: FAQ KILAT */}
            {activeTab === 'faq' && (
              <div className="space-y-2 text-xs">
                {appFaqs.map((faq) => (
                  <div key={faq.id} className="rounded-xl border border-line p-2.5 bg-subtle/30">
                    <p className="font-semibold text-ink leading-snug">{faq.title}</p>
                    <p className="mt-1 text-[11px] text-ink-muted">{faq.summary}</p>
                    <ol className="mt-2 list-decimal pl-4 text-[11px] space-y-1 text-ink leading-relaxed">
                      {faq.steps.map((st, i) => (
                        <li key={i}>{st}</li>
                      ))}
                    </ol>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ Trigger Floating Bubble ═══ */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="group relative flex h-12 w-12 items-center justify-center rounded-full bg-ink text-white shadow-xl hover:opacity-95 active:scale-95 transition-[transform,opacity] cursor-pointer"
        aria-label="Buka Widget Bantuan"
        title="Pusat Bantuan & Tiket"
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <>
            <LifeBuoy className="h-6 w-6 text-white group-hover:rotate-45 transition-transform duration-300" />
            {activeCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white shadow-sm ring-2 ring-panel">
                {activeCount}
              </span>
            )}
          </>
        )}
      </button>
    </div>
  );
}
