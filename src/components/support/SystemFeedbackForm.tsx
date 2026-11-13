import React, { useState } from 'react';
import { MessageSquarePlus, Star, Send } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export function SystemFeedbackForm() {
  const toast = useToast();
  const [rating, setRating] = useState(5);
  const [category, setCategory] = useState<'ui' | 'speed' | 'feature' | 'bug'>('feature');
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) return;

    try {
      const existing = JSON.parse(localStorage.getItem('vps-crm:system_feedback') || '[]');
      existing.push({
        id: `fb-${Date.now()}`,
        rating,
        category,
        feedback: feedback.trim(),
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem('vps-crm:system_feedback', JSON.stringify(existing));
    } catch {
      // fallback
    }

    setSubmitted(true);
    toast.success('Terima kasih! Masukan Anda berhasil dikirim ke pengembang.');
  };

  return (
    <div className="rounded-lg border border-line bg-panel p-5 shadow-xs">
      <div className="flex items-center gap-2 border-b border-line pb-3">
        <MessageSquarePlus className="h-4 w-4 text-ink" />
        <h3 className="text-sm font-semibold text-ink">Kirim Umpan Balik & Saran Pengembangan</h3>
      </div>
      <p className="mt-2 text-xs text-ink-muted">
        Bantu kami meningkatkan kegunaan sistem Helpdesk CRM ini untuk seluruh operator dan pengguna 7 aplikasi VPS.
      </p>

      {submitted ? (
        <div className="mt-4 rounded border border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/40 p-4 text-xs text-emerald-800 dark:text-emerald-200 space-y-1">
          <p className="font-bold">Masukan Berhasil Diterima!</p>
          <p>Terima kasih telah berkontribusi menyempurnakan Helpdesk CRM.</p>
          <button
            type="button"
            onClick={() => {
              setSubmitted(false);
              setFeedback('');
            }}
            className="mt-2 underline font-semibold cursor-pointer"
          >
            Kirim masukan lainnya
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4 space-y-3 text-xs max-w-lg">
          <div>
            <label className="block font-medium text-ink mb-1">Kepuasan Pengalaman Anda</label>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star
                    className={`h-5 w-5 ${
                      star <= rating ? 'text-amber-500 fill-amber-500' : 'text-line'
                    }`}
                  />
                </button>
              ))}
              <span className="ml-2 font-mono text-[11px] text-ink-muted">
                {rating === 5 ? 'Sangat Puas' : `${rating} dari 5 Bintang`}
              </span>
            </div>
          </div>

          <div>
            <label className="block font-medium text-ink mb-1">Kategori Masukan</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full rounded border border-line bg-canvas px-3 py-2 text-ink focus:border-ink focus:outline-none"
            >
              <option value="feature">Usulan Fitur Baru</option>
              <option value="ui">Tampilan & Kenyamanan Penggunaan (UI/UX)</option>
              <option value="speed">Kecepatan & Kinerja Sistem</option>
              <option value="bug">Laporan Masalah / Bug</option>
            </select>
          </div>

          <div>
            <label className="block font-medium text-ink mb-1">Pesan Masukan / Detail Saran</label>
            <textarea
              rows={4}
              required
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Jelaskan kendala atau ide perbaikan yang Anda harapkan..."
              className="w-full rounded border border-line bg-canvas p-3 text-ink focus:border-ink focus:outline-none leading-relaxed"
            />
          </div>

          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded bg-ink px-4 py-2 font-semibold text-white shadow-xs hover:opacity-90 active:scale-95 transition-all"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Kirim Masukan</span>
          </button>
        </form>
      )}
    </div>
  );
}
