import React, { useState } from 'react';
import { Lock, Send } from 'lucide-react';
import {
  CATEGORY_LABEL,
  getApp,
  PRIORITY_LABEL,
  PRIORITY_ORDER,
} from '../../config/vpsAppsConfig';
import type { CrmUser, TicketCategory, TicketPriority } from '../../types/crm';
import type { CreateTicketInput } from '../../services/ticketCrmService';
import { ScreenshotUploader } from '../common/ScreenshotUploader';

interface Props {
  user: CrmUser;
  onSubmit: (input: CreateTicketInput) => Promise<void>;
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
  const app = getApp(user.appId);
  const [category, setCategory] = useState<TicketCategory>('bug_error');
  const [priority, setPriority] = useState<TicketPriority>('medium');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [sourcePageUrl, setSourcePageUrl] = useState(
    user.lastSeenUrl ?? app?.appUrl ?? '',
  );
  const [attachments, setAttachments] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
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
    try {
      await onSubmit({
        appId: user.appId,
        requesterId: user.id,
        requesterName: user.name,
        requesterUid: user.externalUid,
        requesterRole: user.appRole,
        subject: subject.trim(),
        description: description.trim(),
        category,
        priority,
        sourcePageUrl: sourcePageUrl.trim() || undefined,
        attachments,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Gagal mengirim tiket laporan.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded border border-line bg-panel p-5 sm:p-6"
    >
      {/* Locked Handoff Identity Section */}
      <div className="rounded border border-line bg-subtle/70 p-3.5">
        <div className="flex items-center justify-between gap-2 text-xs font-semibold text-ink">
          <span className="inline-flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5 text-ink-muted" />
            Identitas Pelapor (Terkunci Otomatis dari Tombol Help)
          </span>
          <span className="rounded border border-line bg-panel px-2 py-0.5 font-mono text-[11px] text-ink-muted">
            {user.compositeKey}
          </span>
        </div>

        <div className="mt-2.5 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          <div>
            <label className="block text-[11px] text-ink-muted">
              Aplikasi Asal
            </label>
            <input
              type="text"
              disabled
              value={app ? `${app.name} [${app.prefix}]` : user.appId}
              className="mt-1 w-full cursor-not-allowed rounded border border-line bg-panel/70 px-2.5 py-1.5 text-xs font-medium text-ink"
            />
          </div>

          <div>
            <label className="block text-[11px] text-ink-muted">
              Username / Email
            </label>
            <input
              type="text"
              disabled
              value={`${user.name} (${user.externalUid})`}
              className="mt-1 w-full cursor-not-allowed rounded border border-line bg-panel/70 px-2.5 py-1.5 font-mono text-xs text-ink"
            />
          </div>

          <div>
            <label className="block text-[11px] text-ink-muted">
              Peran (Role)
            </label>
            <input
              type="text"
              disabled
              value={user.appRole}
              className="mt-1 w-full cursor-not-allowed rounded border border-line bg-panel/70 px-2.5 py-1.5 text-xs text-ink"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700">
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
            className="mt-1.5 w-full rounded border border-line bg-canvas px-3 py-2 text-xs text-ink focus:border-ink focus:bg-panel focus:outline-none"
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
            className="mt-1.5 w-full rounded border border-line bg-canvas px-3 py-2 text-xs text-ink focus:border-ink focus:bg-panel focus:outline-none"
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
          className="mt-1.5 w-full rounded border border-line bg-canvas px-3 py-2 text-xs text-ink placeholder:text-ink-faint focus:border-ink focus:bg-panel focus:outline-none"
        />
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
          className="mt-1.5 w-full rounded border border-line bg-canvas p-3 text-xs leading-relaxed text-ink placeholder:text-ink-faint focus:border-ink focus:bg-panel focus:outline-none"
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
          className="mt-1.5 w-full rounded border border-line bg-canvas px-3 py-2 font-mono text-xs text-ink placeholder:text-ink-faint focus:border-ink focus:bg-panel focus:outline-none"
        />
      </div>

      {/* Screenshot Uploader */}
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-ink">
          Lampiran Screenshot Layar (Bisa langsung tekan Ctrl+V)
        </label>
        <ScreenshotUploader
          attachments={attachments}
          onChange={setAttachments}
          enableGlobalPaste
        />
      </div>

      <div className="flex items-center justify-end gap-2.5 border-t border-line pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="rounded border border-line bg-subtle px-4 py-2 text-xs font-medium text-ink hover:border-line-strong"
        >
          Batal
        </button>

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-1.5 rounded bg-ink px-4 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
        >
          <Send className="h-3.5 w-3.5" />
          {submitting ? 'Mengirim Laporan...' : 'Kirim Laporan Tiket'}
        </button>
      </div>
    </form>
  );
}
