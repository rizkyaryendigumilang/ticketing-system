import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info') => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      setToasts((prev) => [...prev, { id, type, message }]);
      setTimeout(() => {
        removeToast(id);
      }, 3500);
    },
    [removeToast],
  );

  const success = useCallback((msg: string) => showToast(msg, 'success'), [showToast]);
  const error = useCallback((msg: string) => showToast(msg, 'error'), [showToast]);
  const info = useCallback((msg: string) => showToast(msg, 'info'), [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, info }}>
      {children}
      {/* Toast Overlay Container */}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-4 right-4 z-50 flex max-w-sm flex-col gap-2"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-2.5 rounded-lg border p-3 shadow-lg transition-all animate-in fade-in slide-in-from-bottom-2 duration-150 ${
              t.type === 'success'
                ? 'border-emerald-700/50 bg-[#0F291E] text-emerald-100'
                : t.type === 'error'
                  ? 'border-red-700/50 bg-[#2D1214] text-red-100'
                  : 'border-neutral-700 bg-[#161B22] text-neutral-100'
            }`}
          >
            <span className="mt-0.5 shrink-0">
              {t.type === 'success' && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
              {t.type === 'error' && <AlertCircle className="h-4 w-4 text-red-400" />}
              {t.type === 'info' && <Info className="h-4 w-4 text-sky-400" />}
            </span>
            <p className="min-w-0 flex-1 text-xs font-medium leading-relaxed">{t.message}</p>
            <button
              type="button"
              onClick={() => removeToast(t.id)}
              className="shrink-0 rounded p-0.5 text-neutral-400 hover:text-white active:scale-95 transition-transform"
              aria-label="Tutup notifikasi"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Fallback if used outside provider so code never crashes
    return {
      showToast: () => {},
      success: () => {},
      error: () => {},
      info: () => {},
    };
  }
  return ctx;
}
