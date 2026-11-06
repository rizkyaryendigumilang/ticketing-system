import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { VPS_APPS } from '../config/vpsAppsConfig';
import { parseHandoff } from '../services/crmLogic';
import { useCrm } from '../context/CrmContext';

export function HandoffRedirectPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handoff } = useCrm();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const result = parseHandoff(searchParams, VPS_APPS.map((a) => a.id));
    if (!result.ok) {
      setError(result.error);
      return;
    }

    const openNewForm = searchParams.get('new') === '1';

    handoff(result.params)
      .then(() => {
        if (!active) return;
        navigate(openNewForm ? '/portal/new' : '/portal', { replace: true });
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Gagal memproses sesi handoff aplikasi.');
      });

    return () => { active = false; };
  }, []); // Run once on mount

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas p-4 text-ink">
        <div className="w-full max-w-md rounded border border-red-300 bg-panel p-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-red-700">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Link Handoff Tidak Valid
          </div>
          <p className="mt-2 text-xs leading-relaxed text-ink-muted">{error}</p>
          <div className="mt-4 rounded border border-line bg-subtle p-3 font-mono text-[11px] text-ink-muted">
            Contoh format URL yang benar:
            <div className="mt-1 break-all text-ink">
              /handoff?app=snackloop&amp;uid=staff1&amp;name=Staff&amp;role=Staff%20Rekap
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 rounded bg-ink px-3.5 py-2 text-xs font-semibold text-white hover:opacity-90"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Kembali ke Halaman Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas p-4 text-ink">
      <div className="rounded border border-line bg-panel px-6 py-5 text-center">
        <div className="font-mono text-xs font-semibold text-ink">
          Memverifikasi Identitas Aplikasi Asal...
        </div>
        <p className="mt-1 text-xs text-ink-muted">
          Menyiapkan sesi portal bantuan untuk{' '}
          <span className="font-mono text-ink">
            {searchParams.get('app')}:{searchParams.get('uid')}
          </span>
        </p>
      </div>
    </div>
  );
}
