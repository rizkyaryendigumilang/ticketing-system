import React, { useState, useEffect } from 'react';
import { X, ExternalLink, Tag, Plus, Check, Clock, User, MessageSquare, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Ticket, TicketStatus, TicketPriority } from '../../types/crm';
import { useCrm } from '../../context/CrmContext';
import { AppBadge } from '../common/AppBadge';
import { SlaBadge } from '../common/SlaBadge';
import { changeTicket, replyToTicket } from '../../services/ticketCrmService';
import { computeTicketSla } from '../../services/crmLogic';
import { useToast } from '../../context/ToastContext';

interface TicketPeekDrawerProps {
  ticket: Ticket | null;
  onClose: () => void;
}

export function TicketPeekDrawer({ ticket, onClose }: TicketPeekDrawerProps) {
  const { adminActor, statusLabel, priorityLabel } = useCrm();
  const toast = useToast();
  const [newTag, setNewTag] = useState('');
  const [quickNote, setQuickNote] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!ticket) return null;

  const currentTags = ticket.tags || [];
  const sla = computeTicketSla(ticket);

  const handleStatusChange = (status: TicketStatus) => {
    changeTicket(ticket, { status }, adminActor);
    toast.success(`Status tiket diubah ke ${statusLabel(status)}`);
  };

  const handlePriorityChange = (priority: TicketPriority) => {
    changeTicket(ticket, { priority }, adminActor);
    toast.success(`Prioritas diubah ke ${priorityLabel(priority)}`);
  };

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    const tag = newTag.trim();
    if (!tag) return;
    if (currentTags.includes(tag)) {
      toast.info('Tag ini sudah ada pada tiket.');
      setNewTag('');
      return;
    }
    const updated = [...currentTags, tag];
    changeTicket(ticket, { tags: updated }, adminActor);
    setNewTag('');
    toast.success(`Tag "${tag}" ditambahkan.`);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updated = currentTags.filter((t) => t !== tagToRemove);
    changeTicket(ticket, { tags: updated }, adminActor);
  };

  const handleSendQuickNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickNote.trim()) return;
    setIsSubmittingNote(true);
    try {
      replyToTicket(ticket, adminActor, quickNote.trim(), { internal: true });
      toast.success('Catatan internal berhasil disimpan.');
      setQuickNote('');
    } catch {
      toast.error('Gagal menyimpan catatan.');
    } finally {
      setIsSubmittingNote(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition-opacity animate-fade-in">
      <div
        className="w-full sm:w-[480px] bg-panel/95 backdrop-blur-xl border-l border-line/60 shadow-2xl flex flex-col h-full overflow-hidden animate-slide-left"
        role="dialog"
        aria-modal="true"
        aria-label={`Pratinjau Tiket ${ticket.ticketNumber}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-line/60 bg-canvas/40">
          <div className="flex items-center gap-2.5">
            <AppBadge appId={ticket.appId} />
            <span className="font-mono text-sm font-bold text-ink">#{ticket.ticketNumber}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Link
              to={`/admin/tickets/${ticket.id}`}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-ink-muted hover:text-ink hover:bg-canvas transition-colors"
              title="Buka Meja Kerja Penuh"
            >
              <span>Buka Penuh</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-ink-muted hover:text-ink hover:bg-canvas transition-colors"
              aria-label="Tutup Pratinjau"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
          {/* Subject & SLA */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <SlaBadge ticket={ticket} />
              {ticket.sourcePageUrl && (
                <span className="text-[11px] text-ink-muted truncate max-w-[200px]" title={ticket.sourcePageUrl}>
                  {ticket.sourcePageUrl}
                </span>
              )}
            </div>
            <h2 className="text-base font-semibold text-ink leading-snug">{ticket.subject}</h2>
          </div>

          {/* Quick Properties Matrix */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl border border-line/50 bg-canvas/50 text-xs">
            <div>
              <span className="text-[11px] text-ink-muted block mb-1">Status</span>
              <select
                value={ticket.status}
                onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
                className="w-full rounded-lg border border-line bg-panel px-2.5 py-1.5 text-xs text-ink font-medium focus:border-ink focus:outline-none"
              >
                <option value="open">Baru (Open)</option>
                <option value="in_progress">Diproses (In Progress)</option>
                <option value="waiting_on_user">Menunggu Balasan (Waiting)</option>
                <option value="solved">Selesai (Solved)</option>
                <option value="closed">Ditutup (Closed)</option>
              </select>
            </div>
            <div>
              <span className="text-[11px] text-ink-muted block mb-1">Prioritas</span>
              <select
                value={ticket.priority}
                onChange={(e) => handlePriorityChange(e.target.value as TicketPriority)}
                className="w-full rounded-lg border border-line bg-panel px-2.5 py-1.5 text-xs text-ink font-medium focus:border-ink focus:outline-none"
              >
                <option value="low">Rendah (Low - 48j)</option>
                <option value="medium">Sedang (Medium - 24j)</option>
                <option value="high">Tinggi (High - 6j)</option>
                <option value="urgent">Darurat (Urgent - 2j)</option>
              </select>
            </div>
          </div>

          {/* Pelapor Info */}
          <div className="rounded-xl border border-line/50 bg-canvas/30 p-3.5 space-y-1.5 text-xs">
            <div className="flex items-center gap-1.5 text-ink-muted font-medium text-[11px]">
              <User className="h-3.5 w-3.5" />
              <span>Informasi Pelapor</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="font-semibold text-ink">{ticket.requesterName}</span>
              <span className="text-ink-muted text-[11px]">({ticket.requesterRole})</span>
            </div>
            <div className="text-[11px] text-ink-muted font-mono truncate">
              UID: {ticket.requesterUid}
            </div>
          </div>

          {/* Description */}
          <div>
            <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider block mb-2">
              Rincian Masalah
            </span>
            <div className="rounded-xl border border-line/60 bg-panel p-3.5 text-xs text-ink leading-relaxed whitespace-pre-wrap">
              {ticket.description}
            </div>
          </div>

          {/* Custom Tags Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5" />
                <span>Label / Tag Tiket</span>
              </span>
              <span className="text-[11px] text-ink-muted">{currentTags.length} label</span>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {currentTags.length === 0 ? (
                <span className="text-xs text-ink-muted italic">Belum ada label.</span>
              ) : (
                currentTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-md bg-accent/10 border border-accent/20 px-2 py-0.5 text-xs font-medium text-accent"
                  >
                    <span>{tag}</span>
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-red-500 transition-colors"
                      title="Hapus label"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))
              )}
            </div>

            <form onSubmit={handleAddTag} className="flex gap-2">
              <input
                type="text"
                placeholder="Tambah label (misal: VIP, Bug UI)..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                className="flex-1 rounded-lg border border-line bg-canvas px-3 py-1.5 text-xs text-ink placeholder:text-ink-muted focus:border-ink focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-lg bg-ink px-3 py-1.5 text-xs font-medium text-canvas hover:bg-ink/90 active:scale-95 transition-all"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>

          {/* Quick Internal Note */}
          <div className="border-t border-line/50 pt-4">
            <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <MessageSquare className="h-3.5 w-3.5 text-amber-500" />
              <span>Tambah Catatan Internal Cepat</span>
            </span>
            <form onSubmit={handleSendQuickNote} className="space-y-2">
              <textarea
                rows={3}
                placeholder="Catatan rahasia tim hanya untuk agen..."
                value={quickNote}
                onChange={(e) => setQuickNote(e.target.value)}
                className="w-full rounded-xl border border-line bg-canvas p-3 text-xs text-ink placeholder:text-ink-muted focus:border-ink focus:outline-none resize-none"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmittingNote || !quickNote.trim()}
                  className="rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 px-3 py-1.5 text-xs font-medium hover:bg-amber-500/25 active:scale-95 disabled:opacity-50 transition-all"
                >
                  Simpan Catatan
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-line/60 bg-canvas/30 flex items-center justify-between">
          <span className="text-[11px] text-ink-muted">
            Dibuat {new Date(ticket.createdAt).toLocaleDateString('id-ID')}
          </span>
          <Link
            to={`/admin/tickets/${ticket.id}`}
            className="inline-flex items-center gap-1.5 rounded-xl bg-ink px-4 py-2 text-xs font-medium text-canvas hover:bg-ink/90 active:scale-95 transition-all shadow-xs"
          >
            <span>Buka Meja Kerja Penuh</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}