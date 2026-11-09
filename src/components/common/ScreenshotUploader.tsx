import { useCallback, useEffect, useRef, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';

const MAX_EDGE = 1600;

/** Downscale to max 1600 px JPEG so screenshots stay small enough for localStorage and upload. */
async function compress(file: File): Promise<string | null> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.fillStyle = '#fff'; // JPEG has no transparency
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.85);
  } catch (err) {
    console.warn('Gagal memproses gambar screenshot:', file.name, err);
    return null;
  }
}

const images = (files: FileList | File[] | null | undefined) =>
  Array.from(files ?? []).filter((f) => f.type.startsWith('image/'));

interface Props {
  attachments: string[];
  onChange: (attachments: string[]) => void;
  max?: number;
}

/** File picker, drag & drop, and Ctrl+V anywhere inside the surrounding form. */
export function ScreenshotUploader({ attachments, onChange, max = 5 }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const latest = useRef({ attachments, onChange });
  latest.current = { attachments, onChange };

  const add = useCallback(
    async (files: File[]) => {
      const { attachments: current, onChange: update } = latest.current;
      const picked = files.slice(0, max - current.length);
      if (picked.length) {
        const compressed = await Promise.all(picked.map(compress));
        const valid = compressed.filter((img): img is string => Boolean(img));
        if (valid.length) update([...current, ...valid]);
      }
    },
    [max],
  );

  useEffect(() => {
    const target = rootRef.current?.closest('form') ?? rootRef.current;
    if (!target) return;
    const onPaste = (e: Event) => {
      const files = images((e as ClipboardEvent).clipboardData?.files);
      if (files.length) {
        e.preventDefault();
        void add(files);
      }
    };
    target.addEventListener('paste', onPaste);
    return () => target.removeEventListener('paste', onPaste);
  }, [add]);

  return (
    <div ref={rootRef} className="space-y-2">
      {attachments.length < max && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            void add(images(e.dataTransfer.files));
          }}
          className={`flex w-full items-center gap-2 rounded-md border border-dashed px-3 py-2.5 text-left text-sm text-ink-muted ${
            dragging ? 'border-ink bg-subtle' : 'border-line-strong hover:border-ink'
          }`}
        >
          <ImagePlus className="h-4 w-4 shrink-0" />
          <span>
            Pilih atau tarik screenshot ke sini, atau tekan <kbd className="font-mono text-xs">Ctrl+V</kbd>.
          </span>
          <span className="ml-auto text-xs">
            {attachments.length}/{max}
          </span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          void add(images(e.target.files));
          e.target.value = '';
        }}
      />

      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {attachments.map((src, i) => (
            <div key={i} className="relative">
              <img src={src} alt={`Screenshot ${i + 1}`} className="h-16 w-24 rounded-md border border-line object-cover" />
              <button
                type="button"
                onClick={() => onChange(attachments.filter((_, j) => j !== i))}
                className="absolute -right-1.5 -top-1.5 rounded-full border border-line bg-panel p-0.5 text-ink-muted hover:text-red-700"
                aria-label={`Hapus screenshot ${i + 1}`}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
