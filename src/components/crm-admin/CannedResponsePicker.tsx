import { useState, useRef, useEffect } from 'react';
import { MessageSquareQuote, ChevronDown } from 'lucide-react';
import { CANNED_RESPONSES } from '../../config/vpsAppsConfig';

interface Props {
  onSelect: (content: string) => void;
}

export function CannedResponsePicker({ onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded border border-line bg-subtle px-2.5 py-1 text-xs font-medium text-ink hover:border-line-strong"
      >
        <MessageSquareQuote className="h-3.5 w-3.5 text-ink-muted" />
        Template Balasan Cepat
        <ChevronDown className="h-3 w-3 text-ink-muted" />
      </button>

      {open && (
        <div className="absolute bottom-full left-0 z-30 mb-1.5 w-80 rounded border border-line-strong bg-panel shadow-lg">
          <div className="border-b border-line bg-subtle/60 px-3 py-2 text-[11px] font-semibold text-ink-muted">
            Pilih template jawaban (1 klik)
          </div>
          <div className="max-h-64 divide-y divide-line overflow-y-auto">
            {CANNED_RESPONSES.map((cr) => (
              <button
                key={cr.id}
                type="button"
                onClick={() => {
                  onSelect(cr.content);
                  setOpen(false);
                }}
                className="block w-full px-3 py-2 text-left transition-colors hover:bg-subtle"
              >
                <div className="text-xs font-semibold text-ink">{cr.title}</div>
                <p className="mt-0.5 line-clamp-2 text-[11px] text-ink-muted">
                  {cr.content}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
