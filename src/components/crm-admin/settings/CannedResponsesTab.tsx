import React, { useState } from 'react';
import { RotateCcw, Plus } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { useCrm } from '../../../context/CrmContext';
import type { CannedResponse, TicketCategory } from '../../../types/crm';
import { CANNED_RESPONSES, CATEGORY_LABEL } from '../../../config/vpsAppsConfig';

export function CannedResponsesTab() {
  const toast = useToast();
  const { cannedResponses, updateCannedResponses, categoryLabel, t } = useCrm();
  const [cannedModalOpen, setCannedModalOpen] = useState(false);
  const [editingCannedId, setEditingCannedId] = useState<string | null>(null);
  const [cannedTitle, setCannedTitle] = useState('');
  const [cannedContent, setCannedContent] = useState('');
  const [cannedCategory, setCannedCategory] = useState<TicketCategory>('bug_error');

  const handleOpenAddCanned = () => {
    setEditingCannedId(null);
    setCannedTitle('');
    setCannedContent('');
    setCannedCategory('bug_error');
    setCannedModalOpen(true);
  };

  const handleOpenEditCanned = (cr: CannedResponse) => {
    setEditingCannedId(cr.id);
    setCannedTitle(cr.title);
    setCannedContent(cr.content);
    setCannedCategory((cr.category as TicketCategory) ?? 'bug_error');
    setCannedModalOpen(true);
  };

  const handleDeleteCanned = (id: string) => {
    if (confirm('Hapus template balasan cepat ini?')) {
      const next = cannedResponses.filter((c) => c.id !== id);
      updateCannedResponses(next);
      toast.success('Template balasan dihapus.');
    }
  };

  const handleSaveCanned = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cannedTitle.trim() || !cannedContent.trim()) {
      toast.error('Judul dan isi template wajib diisi.');
      return;
    }

    if (editingCannedId) {
      const next = cannedResponses.map((c) =>
        c.id === editingCannedId
          ? { ...c, title: cannedTitle.trim(), content: cannedContent.trim(), category: cannedCategory }
          : c,
      );
      updateCannedResponses(next);
      toast.success('Template balasan diperbarui.');
    } else {
      const newCr: CannedResponse = {
        id: `cr-${Date.now()}`,
        title: cannedTitle.trim(),
        content: cannedContent.trim(),
        category: cannedCategory,
      };
      updateCannedResponses([...cannedResponses, newCr]);
      toast.success('Template balasan baru ditambahkan.');
    }
    setCannedModalOpen(false);
  };

  const handleResetCanned = () => {
    if (confirm('Kembalikan seluruh template ke daftar bawaan standar?')) {
      updateCannedResponses(CANNED_RESPONSES);
      toast.success('Template balasan dikembalikan ke daftar bawaan.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
        <div>
          <h2 className="text-sm font-semibold text-ink">{t('settings.tabCanned')}</h2>
          <p className="text-xs text-ink-muted mt-0.5">
            Draf pesan standar yang bisa disisipkan ke tiket dalam 1 klik.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetCanned}
            className="inline-flex items-center gap-1.5 rounded border border-line bg-subtle px-3 py-1.5 text-xs font-medium text-ink hover:border-line-strong active:scale-95 transition-all"
          >
            <RotateCcw className="h-3.5 w-3.5 text-ink-muted" />
            Reset Bawaan
          </button>
          <button
            type="button"
            onClick={handleOpenAddCanned}
            className="inline-flex items-center gap-1.5 rounded bg-ink px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:opacity-90 active:scale-95 transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
            Tambah Template
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {cannedResponses.map((cr) => (
          <div
            key={cr.id}
            className="flex flex-col justify-between rounded-lg border border-line bg-panel p-4 shadow-xs"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-ink text-xs line-clamp-1">{cr.title}</h3>
                {cr.category && (
                  <span className="rounded bg-subtle px-1.5 py-0.5 font-mono text-[10px] text-ink-muted shrink-0">
                    {cr.category in CATEGORY_LABEL
                      ? categoryLabel(cr.category as TicketCategory)
                      : cr.category}
                  </span>
                )}
              </div>
              <p className="mt-2 text-xs text-ink-muted line-clamp-3 leading-relaxed">
                {cr.content}
              </p>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2 border-t border-line pt-2.5 text-xs">
              <button
                type="button"
                onClick={() => handleOpenEditCanned(cr)}
                className="font-medium text-ink hover:underline"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => handleDeleteCanned(cr.id)}
                className="text-red-600 hover:underline"
              >
                Hapus
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Add/Edit Canned Response */}
      {cannedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl border border-line bg-panel p-6 shadow-xl text-xs">
            <h3 className="text-sm font-bold text-ink">
              {editingCannedId ? 'Edit Template Balasan' : 'Tambah Template Balasan Baru'}
            </h3>

            <form onSubmit={handleSaveCanned} className="mt-4 space-y-3">
              <div>
                <label className="block font-medium text-ink">Judul Singkat Template</label>
                <input
                  type="text"
                  required
                  value={cannedTitle}
                  onChange={(e) => setCannedTitle(e.target.value)}
                  placeholder="Contoh: Minta Tangkapan Layar"
                  className="mt-1 w-full rounded border border-line bg-canvas px-3 py-2 text-ink focus:border-ink focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-ink">Kategori Kendala</label>
                <select
                  value={cannedCategory}
                  onChange={(e) => setCannedCategory(e.target.value as TicketCategory)}
                  className="mt-1 w-full rounded border border-line bg-canvas px-3 py-2 text-ink focus:border-ink focus:outline-none"
                >
                  <option value="bug_error">Bug / Error Fitur</option>
                  <option value="account_login">Akun & Akses Login</option>
                  <option value="data_transaction">Selisih Data / Transaksi</option>
                  <option value="feature_question">Pertanyaan / Request Fitur</option>
                  <option value="other">Umum / Lainnya</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-ink">Isi Pesan Balasan</label>
                <textarea
                  rows={4}
                  required
                  value={cannedContent}
                  onChange={(e) => setCannedContent(e.target.value)}
                  placeholder="Tulis draf pesan balasan yang jelas dan profesional..."
                  className="mt-1 w-full rounded border border-line bg-canvas p-3 leading-relaxed text-ink focus:border-ink focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-line">
                <button
                  type="button"
                  onClick={() => setCannedModalOpen(false)}
                  className="rounded border border-line bg-subtle px-3 py-1.5 text-xs font-medium text-ink hover:border-line-strong"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded bg-ink px-4 py-1.5 text-xs font-semibold text-white hover:opacity-90"
                >
                  Simpan Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
