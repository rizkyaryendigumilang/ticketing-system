import React, { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertTriangle, ArrowRight, CheckCircle2, Lock, Send, Sparkles } from 'lucide-react';
import {
  CATEGORY_LABEL,
  getApp,
  PRIORITY_LABEL,
  PRIORITY_ORDER,
} from '../../config/vpsAppsConfig';
import type { CrmUser, TicketCategory, TicketPriority } from '../../types/crm';
import type { NewTicketInput } from '../../services/ticketCrmService';
import { ScreenshotUploader } from '../common/ScreenshotUploader';
import { findSuggestedSolutions, checkDuplicateTicket } from '../../services/deflectionService';
import { useCrm } from '../../context/CrmContext';
import { useToast } from '../../context/ToastContext';

interface Props {
  user: CrmUser;
  onSubmit: (input: NewTicketInput) => void;
  onCancel: () => void;
}

const CATEGORIES: TicketCategory[] = [
  'bug_error',
  'account_login',
  'data_transaction',
  'feature_question',
  'other',
];

export function UserTicketForm({ user, onSubmit, onCancel }: Props) {
  const [searchParams] = useSearchParams();
  const rawCat = searchParams.get('category') as TicketCategory | null;
  const rawPriority = searchParams.get('priority') as TicketPriority | null;

  const app = getApp(user.appId);
  const [category, setCategory] = useState<TicketCategory>(
    rawCat && CATEGORIES.includes(rawCat) ? rawCat : 'bug_error',
  );
  const [priority, setPriority] = useState<TicketPriority>(
    rawPriority && (['urgent', 'high', 'medium', 'low'] as const).includes(rawPriority)
      ? rawPriority
      : 'medium',
  );
  const { data, statusLabel } = useCrm();
  const toast = useToast();
  const [subject, setSubject] = useState(searchParams.get('subject') ?? '');
  const [description, setDescription] = useState(searchParams.get('description') ?? '');
  const [sourcePageUrl, setSourcePageUrl] = useState(
    user.lastSeenUrl ?? app?.appUrl ?? '',
  );
  const [attachments, setAttachments] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedArticleId, setExpandedArticleId] = useState<string | null>(null);

  // Smart Solution Deflection: automatically search solutions when subject or description is typed
  const suggestions = useMemo(() => {
    return findSuggestedSolutions(user.appId, subject, description);
  }, [user.appId, subject, description]);

  // Duplicate Ticket Detection
  const duplicateTicket = useMemo(() => {
    return checkDuplicateTicket(data.tickets, user.appId, user.externalUid, subject);
  }, [data.tickets, user.appId, user.externalUid, subject]);

  const handleDeflected = (articleTitle: string) => {
    toast.success(`Senang bisa membantu! Solusi "${articleTitle}" telah menyelesaikan masalah Anda.`);
    onCancel();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) {
      setError('Judul laporan wajib diisi.');
      return;
    }
    if (!description.trim()) {
      setError('Deskripsi kendala wajib diisi.');
      return;
    }

    setError(null);
    setSubmitting(true);
    onSubmit({
      subject: subject.trim(),
      description: description.trim(),
      category,
      priority,
      sourcePageUrl: sourcePageUrl.trim() || undefined,
      attachments,
    });
    setSubmitting(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-2xl border border-line bg-panel p-5 sm:p-7 shadow-card"
    >
      {/* Locked Handoff Identity Section */}
      <div className="rounded-xl border border-line bg-subtle/50 p-4">
        <div className="flex items-center justify-between gap-2 text-xs font-semibold text-ink">
          <span className="inline-flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5 text-ink-muted" />
            Identitas Pelapor (Terkunci Otomatis dari Tombol Help)
          </span>
          <span className="rounded-full border border-line bg-panel px-2.5 py-0.5 font-mono text-[10px] text-ink-muted shadow-xs">
            {user.compositeKey}
          </span>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="block text-[11px] font-medium text-ink-muted">
              Aplikasi Asal
            </label>
            <input
              type="text"
              disabled
              value={app ? `${app.name} [${app.prefix}]` : user.appId}
              className="mt-1 w-full cursor-not-allowed rounded-lg border border-line bg-panel/70 px-2.5 py-1.5 text-xs font-medium text-ink shadow-xs"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-ink-muted">
              Username / Email
            </label>
            <input
              type="text"
              disabled
              value={`${user.name} (${user.externalUid})`}
              className="mt-1 w-full cursor-not-allowed rounded-lg border border-line bg-panel/70 px-2.5 py-1.5 font-mono text-xs text-ink shadow-xs"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-ink-muted">
              Peran (Role)
            </label>
            <input
              type="text"
              disabled
              value={user.appRole}
              className="mt-1 w-full cursor-not-allowed rounded-lg border border-line bg-panel/70 px-2.5 py-1.5 text-xs text-ink shadow-xs"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-xs font-medium text-rose-700">
          {error}
        </div>
      )}

      {/* Category & Priority */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="portal-category"
            className="block text-xs font-semibold text-ink"
          >
            Kategori Masalah
          </label>
          <select
            id="portal-category"
            value={category}
            onChange={(e) => setCategory(e.target.value as TicketCategory)}
            className="mt-1.5 w-full rounded-lg border border-line bg-panel px-3 py-2 text-xs text-ink shadow-xs focus:border-ink focus:ring-2 focus:ring-ink/5 focus:outline-none transition-all"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABEL[c]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="portal-priority"
            className="block text-xs font-semibold text-ink"
          >
            Skala Prioritas
          </label>
          <select
            id="portal-priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as TicketPriority)}
            className="mt-1.5 w-full rounded-lg border border-line bg-panel px-3 py-2 text-xs text-ink shadow-xs focus:border-ink focus:ring-2 focus:ring-ink/5 focus:outline-none transition-all"
          >
            {PRIORITY_ORDER.map((p) => (
              <option key={p} value={p}>
                {PRIORITY_LABEL[p]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Subject */}
      <div>
        <label
          htmlFor="portal-subject"
          className="block text-xs font-semibold text-ink"
        >
          Judul Keluhan / Kendala
        </label>
        <input
          id="portal-subject"
          type="text"
          required
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Contoh: Tombol Simpan di halaman Rekap Harian tidak merespons"
          className="mt-1.5 w-full rounded-lg border border-line bg-panel px-3 py-2 text-xs text-ink placeholder:text-ink-faint shadow-xs focus:border-ink focus:ring-2 focus:ring-ink/5 focus:outline-none transition-all"
        />

        {/* Smart Deflection Suggestion */}
        {suggestions.length > 0 && (
          <div className="mt-2.5 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.04] p-3.5 text-xs text-ink animate-fadeIn shadow-xs">
            <div className="flex items-center gap-1.5 font-semibold text-emerald-800 dark:text-emerald-300">
              <Sparkles className="h-4 w-4 text-emerald-600" />
              <span>Solusi Mandiri Cepat: Kami menemukan artikel panduan yang mungkin cocok:</span>
            </div>
            <div className="mt-2 space-y-2">
              {suggestions.map(({ article: art }) => (
                <div
                  key={art.id}
                  className="rounded-lg border border-emerald-500/20 bg-panel p-3 shadow-xs text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-ink">{art.title}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedArticleId(
                          expandedArticleId === art.id ? null : art.id,
                        )
                      }
                      className="text-[11px] font-medium text-emerald-600 hover:text-emerald-700 underline shrink-0"
                    >
                      {expandedArticleId === art.id ? 'Tutup Panduan' : 'Lihat Solusi'}
                    </button>
                  </div>
                  <p className="mt-1 text-ink-muted text-[11px]">{art.summary}</p>

                  {expandedArticleId === art.id && (
                    <div className="mt-2.5 border-t border-line pt-2.5 space-y-2">
                      <p className="font-semibold text-[11px] text-emerald-900 dark:text-emerald-300">
                        Langkah Solusi Mandiri:
                      </p>
                      <ol className="list-decimal pl-4 space-y-1 text-[11px] text-ink">
                        {art.steps.map((st, i) => (
                          <li key={i}>{st}</li>
                        ))}
                      </ol>
                      <div className="mt-3 flex justify-end border-t border-line pt-2">
                        <button
                          type="button"
                          onClick={() => handleDeflected(art.title)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 active:scale-95 transition-all shadow-xs"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Masalah Selesai (Batal Buat Tiket)
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor="portal-description"
          className="block text-xs font-semibold text-ink"
        >
          Detail Kronologi / Deskripsi Masalah
        </label>
        <textarea
          id="portal-description"
          rows={5}
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Jelaskan apa yang sedang Anda kerjakan, langkah yang dilakukan, dan pesan error yang muncul..."
          className="mt-1.5 w-full rounded-lg border border-line bg-panel p-3 text-xs leading-relaxed text-ink placeholder:text-ink-faint shadow-xs focus:border-ink focus:ring-2 focus:ring-ink/5 focus:outline-none transition-all"
        />
      </div>

      {/* Source Page URL */}
      <div>
        <label
          htmlFor="portal-url"
          className="block text-xs font-semibold text-ink"
        >
          URL Halaman Saat Terjadi Error
        </label>
        <input
          id="portal-url"
          type="url"
          value={sourcePageUrl}
          onChange={(e) => setSourcePageUrl(e.target.value)}
          placeholder="https://43.156.236.102/..."
          className="mt-1.5 w-full rounded-lg border border-line bg-panel px-3 py-2 font-mono text-xs text-ink placeholder:text-ink-faint shadow-xs focus:border-ink focus:ring-2 focus:ring-ink/5 focus:outline-none transition-all"
        />
      </div>

      {/* Attachments Uploader */}
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-ink">
          Lampiran Berkas / Screenshot Layar (Bisa langsung tekan Ctrl+V)
        </label>
        <ScreenshotUploader
          attachments={attachments}
          onChange={setAttachments}
        />
      </div>

      {/* Duplicate Ticket Detection Warning */}
      {duplicateTicket && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-900 shadow-xs animate-fadeIn">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-700 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-amber-950">
                Peringatan: Anda sudah memiliki tiket terbuka untuk kendala serupa
              </p>
              <p className="text-amber-900/90 leading-relaxed">
                Tiket <strong>#{duplicateTicket.ticketNumber}</strong> (&ldquo;{duplicateTicket.subject}&rdquo;) saat ini berstatus <strong>{statusLabel(duplicateTicket.status)}</strong>. Disarankan untuk mengecek atau membalas di tiket tersebut.
              </p>
              <Link
                to={`/portal/ticket/${duplicateTicket.id}`}
                className="inline-flex items-center gap-1 font-semibold text-amber-950 underline hover:text-black mt-1"
              >
                <span>Buka tiket #{duplicateTicket.ticketNumber} yang sudah ada</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-end gap-2.5 border-t border-line pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="btn px-4 py-2 text-xs font-medium"
        >
          Batal
        </button>

        <button
          type="submit"
          disabled={submitting}
          className="btn-primary px-5 py-2 text-xs font-semibold"
        >
          <Send className="h-3.5 w-3.5" />
          {submitting ? 'Mengirim Laporan...' : 'Kirim Laporan Tiket'}
        </button>
      </div>
    </form>
  );
}
