import React, { useState } from 'react';
import { X, UserPlus } from 'lucide-react';
import type { InvitationInput, UserRole } from '../../types/team';
import { VPS_APPS } from '../../config/vpsAppsConfig';

interface InviteMemberModalProps {
  open: boolean;
  onClose: () => void;
  onInvite: (input: InvitationInput) => void;
}

export function InviteMemberModal({ open, onClose, onInvite }: InviteMemberModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('agent');
  const [selectedApps, setSelectedApps] = useState<string[]>(['all']);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    onInvite({
      name,
      email,
      role,
      assignedApps: selectedApps,
    });
    setName('');
    setEmail('');
    setRole('agent');
    setSelectedApps(['all']);
    onClose();
  };

  const toggleApp = (appId: string) => {
    if (appId === 'all') {
      setSelectedApps(['all']);
      return;
    }
    const withoutAll = selectedApps.filter((a) => a !== 'all');
    if (withoutAll.includes(appId)) {
      const next = withoutAll.filter((a) => a !== appId);
      setSelectedApps(next.length === 0 ? ['all'] : next);
    } else {
      setSelectedApps([...withoutAll, appId]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-xl border border-line bg-panel p-6 shadow-xl text-xs">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div className="flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-ink" />
            <h3 className="text-sm font-bold text-ink">Undang Anggota Helpdesk Baru</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-ink-muted hover:text-ink hover:bg-subtle"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block font-medium text-ink">Nama Lengkap</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Rian Pratama"
              className="mt-1 w-full rounded border border-line bg-canvas px-3 py-2 text-ink focus:border-ink focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-medium text-ink">Email Kantor</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="rian@crm.local"
              className="mt-1 w-full rounded border border-line bg-canvas px-3 py-2 text-ink focus:border-ink focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-medium text-ink">Peran (Role Akses)</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="mt-1 w-full rounded border border-line bg-canvas px-3 py-2 text-ink focus:border-ink focus:outline-none"
            >
              <option value="agent">Helpdesk Agent (Menjawab & Menangani Tiket)</option>
              <option value="supervisor">Supervisor Divisi (Akses Laporan & Tiket Terkait)</option>
            </select>
          </div>

          <div>
            <label className="block font-medium text-ink mb-1.5">Aplikasi yang Ditugaskan</label>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => toggleApp('all')}
                className={`rounded px-2.5 py-1 font-mono text-[11px] font-semibold border transition-colors ${
                  selectedApps.includes('all')
                    ? 'bg-ink text-white border-ink'
                    : 'bg-canvas text-ink-muted border-line hover:border-ink'
                }`}
              >
                Seluruh 7 Aplikasi
              </button>
              {VPS_APPS.map((app) => {
                const isSelected = selectedApps.includes(app.id);
                return (
                  <button
                    key={app.id}
                    type="button"
                    onClick={() => toggleApp(app.id)}
                    className={`rounded px-2.5 py-1 font-mono text-[11px] font-medium border transition-colors ${
                      isSelected
                        ? 'bg-ink text-white border-ink'
                        : 'bg-canvas text-ink-muted border-line hover:border-ink'
                    }`}
                  >
                    {app.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-line">
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-line bg-subtle px-3 py-1.5 font-medium text-ink hover:border-line-strong"
            >
              Batal
            </button>
            <button
              type="submit"
              className="rounded bg-ink px-4 py-1.5 font-semibold text-white shadow-xs hover:opacity-90 active:scale-95 transition-all"
            >
              Kirim Undangan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
