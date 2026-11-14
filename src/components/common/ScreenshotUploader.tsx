import { useCallback, useEffect, useRef, useState } from 'react';
import { FileCode, FileText, ImagePlus, X } from 'lucide-react';
import { compressImage } from '../../services/imageCompression';

const ALLOWED_MIME = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'application/pdf',
  'text/plain',
  'application/json',
];

const isValidFile = (file: File) => {
  if (file.size > 5 * 1024 * 1024) return false; // 5MB limit
  if (file.type.startsWith('image/')) return true;
  if (ALLOWED_MIME.includes(file.type)) return true;
  const name = file.name.toLowerCase();
  return name.endsWith('.log') || name.endsWith('.txt') || name.endsWith('.json') || name.endsWith('.pdf');
};

const readFileAsDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

interface Props {
  attachments: string[];
  onChange: (attachments: string[]) => void;
  max?: number;
}

/** File picker, drag & drop, and Ctrl+V anywhere inside the surrounding form. Supports Images, PDF, and Logs. */
export function ScreenshotUploader({ attachments, onChange, max = 5 }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const latest = useRef({ attachments, onChange });
  latest.current = { attachments, onChange };

  const add = useCallback(
    async (rawFiles: FileList | File[] | null | undefined) => {
      const files = Array.from(rawFiles ?? []).filter(isValidFile);
      const { attachments: current, onChange: update } = latest.current;
      const picked = files.slice(0, max - current.length);
      if (!picked.length) return;

      const processed = await Promise.all(
        picked.map(async (f) => {
          if (f.type.startsWith('image/')) {
            const compressed = await compressImage(f);
            return compressed || (await readFileAsDataUrl(f));
          }
          return readFileAsDataUrl(f);
        }),
      );

      const valid = processed.filter((item): item is string => Boolean(item));
      if (valid.length) update([...current, ...valid]);
    },
    [max],
  );

  useEffect(() => {
    const target = rootRef.current?.closest('form') ?? rootRef.current;
    if (!target) return;
    const onPaste = (e: Event) => {
      const files = (e as ClipboardEvent).clipboardData?.files;
      if (files && files.length) {
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
            void add(e.dataTransfer.files);
          }}
          className={`flex w-full items-center gap-2.5 rounded-xl border border-dashed px-3.5 py-3 text-left text-xs text-ink-muted transition-all duration-150 ${
            dragging ? 'border-ink bg-subtle' : 'border-line hover:border-line-strong hover:bg-subtle/40'
          }`}
        >
          <ImagePlus className="h-4 w-4 shrink-0 text-ink-muted" />
          <span>
            Pilih berkas log, PDF, screenshot layar, atau tekan <kbd className="font-mono text-[10px] rounded border border-line bg-panel px-1 py-0.5 shadow-2xs">Ctrl+V</kbd>.
          </span>
          <span className="ml-auto text-xs font-semibold tabular-nums">
            {attachments.length}/{max}
          </span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf,text/plain,.log,.json"
        multiple
        hidden
        onChange={(e) => {
          void add(e.target.files);
          e.target.value = '';
        }}
      />

      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2.5">
          {attachments.map((src, i) => {
            const isImage = src.startsWith('data:image/');
            const isPdf = src.startsWith('data:application/pdf');

            return (
              <div key={i} className="relative group">
                {isImage ? (
                  <img
                    src={src}
                    alt={`Lampiran ${i + 1}`}
                    className="h-16 w-24 rounded-lg border border-line object-cover shadow-2xs"
                  />
                ) : (
                  <div className="flex h-16 w-28 flex-col items-center justify-center rounded-lg border border-line bg-subtle p-2 text-center shadow-2xs">
                    {isPdf ? (
                      <FileText className="h-5 w-5 text-red-500" />
                    ) : (
                      <FileCode className="h-5 w-5 text-blue-500" />
                    )}
                    <span className="mt-1 truncate max-w-full text-[10px] font-semibold text-ink">
                      {isPdf ? 'Dokumen PDF' : 'Berkas Log/Teks'}
                    </span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => onChange(attachments.filter((_, j) => j !== i))}
                  className="absolute -right-1.5 -top-1.5 rounded-full border border-line bg-panel p-0.5 text-ink-muted hover:text-red-600 shadow-xs transition-colors"
                  aria-label={`Hapus lampiran ${i + 1}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
