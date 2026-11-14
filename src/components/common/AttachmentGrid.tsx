import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

/** Thumbnails that open a full-size view on click. Escape or a click anywhere closes it. */
export function AttachmentGrid({ urls, size = 'md' }: { urls: string[]; size?: 'sm' | 'md' }) {
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (urls.length === 0) return null;

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {urls.map((src, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setOpen(src)}
            className="overflow-hidden rounded-md border border-line hover:border-ink"
            aria-label={`Perbesar lampiran ${i + 1}`}
          >
            <img
              src={src}
              alt=""
              loading="lazy"
              decoding="async"
              className={size === 'sm' ? 'h-14 w-20 object-cover' : 'h-24 w-36 object-cover'}
            />
          </button>
        ))}
      </div>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Lampiran"
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-6"
          onClick={() => setOpen(null)}
        >
          <button type="button" className="absolute right-4 top-4 rounded-md p-2 text-white hover:bg-white/10" aria-label="Tutup">
            <X className="h-5 w-5" />
          </button>
          <img
            src={open}
            alt="Lampiran"
            decoding="async"
            className="max-h-full max-w-full rounded-md object-contain"
          />
        </div>
      )}
    </>
  );
}
