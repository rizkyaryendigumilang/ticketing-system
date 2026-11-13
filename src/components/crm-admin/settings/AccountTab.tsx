import React, { useState } from 'react';
import { Lock, User } from 'lucide-react';
import { useCrm } from '../../../context/CrmContext';
import { useToast } from '../../../context/ToastContext';

export function AccountTab() {
  const { admin, t } = useCrm();
  const toast = useToast();

  const [adminName, setAdminName] = useState(admin?.name ?? 'Superadmin');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Profil Superadmin berhasil diperbarui.');
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error('Kata sandi baru minimal 8 karakter');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Konfirmasi kata sandi tidak cocok');
      return;
    }
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    toast.success('Kata sandi berhasil diperbarui');
  };

  return (
    <div className="space-y-6">
      {/* Profile Card */}
      <div className="rounded-lg border border-line bg-panel p-5 shadow-xs">
        <div className="flex items-center gap-2 border-b border-line pb-3">
          <User className="h-4 w-4 text-ink" />
          <h2 className="text-sm font-semibold text-ink">{t('settings.tabAccount')}</h2>
        </div>

        <form onSubmit={handleSaveProfile} className="mt-4 space-y-4 text-xs">
          <div>
            <label className="block font-medium text-ink">Email Superadmin</label>
            <input
              type="email"
              disabled
              value={admin?.email ?? 'admin@crm.local'}
              className="mt-1 w-full rounded border border-line bg-subtle/80 px-3 py-2 font-mono text-ink-muted cursor-not-allowed"
            />
            <p className="mt-1 text-[11px] text-ink-muted">
              Akun superuser PocketBase pengelola 7 aplikasi VPS.
            </p>
          </div>

          <div>
            <label className="block font-medium text-ink">Nama Tampilan</label>
            <input
              type="text"
              required
              value={adminName}
              onChange={(e) => setAdminName(e.target.value)}
              placeholder="Superadmin"
              className="mt-1 w-full rounded border border-line bg-canvas px-3 py-2 text-ink focus:border-ink focus:outline-none"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="rounded bg-ink px-4 py-2 font-semibold text-white shadow-xs hover:opacity-90 active:scale-95 transition-all"
            >
              {t('settings.saveChanges')}
            </button>
          </div>
        </form>
      </div>

      {/* Change Password Card */}
      <div className="rounded-lg border border-line bg-panel p-5 shadow-xs">
        <div className="flex items-center gap-2 border-b border-line pb-3">
          <Lock className="h-4 w-4 text-ink" />
          <h2 className="text-sm font-semibold text-ink">Ubah Kata Sandi</h2>
        </div>

        <form onSubmit={handleChangePassword} className="mt-4 space-y-4 text-xs max-w-md">
          <div>
            <label className="block font-medium text-ink">Kata Sandi Saat Ini</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1 w-full rounded border border-line bg-canvas px-3 py-2 text-ink focus:border-ink focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-medium text-ink">Kata Sandi Baru</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimal 8 karakter"
              className="mt-1 w-full rounded border border-line bg-canvas px-3 py-2 text-ink focus:border-ink focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-medium text-ink">Konfirmasi Kata Sandi Baru</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Ketik ulang kata sandi baru"
              className="mt-1 w-full rounded border border-line bg-canvas px-3 py-2 text-ink focus:border-ink focus:outline-none"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="rounded bg-ink px-4 py-2 font-semibold text-white shadow-xs hover:opacity-90 active:scale-95 transition-all"
            >
              Perbarui Kata Sandi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
