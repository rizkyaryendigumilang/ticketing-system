import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Clipboard, ImagePlus, Trash2, ZoomIn, X } from 'lucide-react';

interface Props {
  attachments: string[];
  onChange: (attachments: string[]) => void;
  maxFiles?: number;
  compact?: boolean;
  enableGlobalPaste?: boolean;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function ScreenshotUploader({
  attachments,
  onChange,
  maxFiles = 5,
  compact = false,
  enableGlobalPaste = false,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [pasteNotice, setPasteNotice] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const addFiles = useCallback(
    async (files: File[]) => {
      const images = files.filter((f) => f.type.startsWith('image/'));
      if (images.length === 0) return;
      const slots = Math.max(0, maxFiles - attachments.length);
      if (slots === 0) return;
      const encoded = await Promise.all(images.slice(0, slots).map(fileToDataUrl));
      onChange([...attachments, ...encoded]);
      setPasteNotice(`${encoded.length} screenshot dilampirkan`);
      setTimeout(() => setPasteNotice(null), 2500);
    },
    [attachments, maxFiles, onChange],
  );

  useEffect(() => {
    if (!enableGlobalPaste) return;
    const onWindowPaste = (e: ClipboardEvent) => {
      const items = Array.from(e.clipboardData?.items ?? []);
      const imgFiles = items
        .filter((item) => item.type.startsWith('image/'))
        .map((item) => item.getAsFile())
        .filter((f): f is File => f !== null);
      if (imgFiles.length > 0) {
        addFiles(imgFiles);
      }
    };
    window.addEventListener('paste', onWindowPaste);
    return () => window.removeEventListener('paste', onWindowPaste);
  }, [enableGlobalPaste, addFiles]);

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items);
    const imgFiles = items
      .filter((item) => item.type.startsWith('image/'))
      .map((item) => item.getAsFile())
      .filter((f): f is File => f !== null);
    if (imgFiles.length > 0) {
      await addFiles(imgFiles);
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    await addFiles(files);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    await addFiles(Array.from(e.dataTransfer.files));
  };

  const removeAt = (idx: number) => {
    onChange(attachments.filter((_, i) => i !== idx));
  };

  const isFull = attachments.length >= maxFiles;

  return (
    <div className="space-y-2.5" onPaste={handlePaste}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileInput}
      />

      {!isFull && (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`cursor-pointer rounded border border-dashed transition-colors ${
            compact ? 'px-3 py-2' : 'px-4 py-3.5'
          } ${
            isDragging
              ? 'border-ink bg-subtle'
              : 'border-line-strong bg-panel hover:border-ink/50 hover:bg-subtle/60'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-ink-muted">
            <span className="inline-flex items-center gap-2 font-medium text-ink">
              <ImagePlus className="h-4 w-4 text-ink-muted" />
              Pilih gambar screenshot atau tarik ke sini
            </span>
            <span className="inline-flex items-center gap-1 rounded bg-subtle px-2 py-0.5 font-mono text-[11px] text-ink-muted">
              <Clipboard className="h-3 w-3" />
              Paste Ctrl+V aktif ({attachments.length}/{maxFiles})
            </span>
          </div>
        </div>
      )}

      {pasteNotice && (
        <p className="text-xs font-medium text-emerald-700">{pasteNotice}</p>
      )}

      {attachments.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {attachments.map((src, idx) => (
            <div
              key={idx}
              className="group relative overflow-hidden rounded border border-line bg-subtle"
            >
              <img
                src={src}
                alt={`Lampiran ${idx + 1}`}
                className="h-20 w-full object-cover cursor-pointer"
                onClick={() => setPreviewUrl(src)}
              />
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/65 px-2 py-1 text-[11px] text-white opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => setPreviewUrl(src)}
                  className="inline-flex items-center gap-1 hover:underline"
                >
                  <ZoomIn className="h-3 w-3" />
                  Perbesar
                </button>
                <button
                  type="button"
                  onClick={() => removeAt(idx)}
                  className="text-red-300 hover:text-red-200"
                  title="Hapus screenshot"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {previewUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setPreviewUrl(null)}
        >
          <div className="relative max-h-[90vh] max-w-4xl">
            <button
              type="button"
              onClick={() => setPreviewUrl(null)}
              className="absolute -top-9 right-0 inline-flex items-center gap-1 text-xs text-white/90 hover:text-white"
            >
              <X className="h-4 w-4" /> Tutup
            </button>
            <img
              src={previewUrl}
              alt="Preview screenshot"
              className="max-h-[85vh] max-w-full rounded border border-white/20 object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
