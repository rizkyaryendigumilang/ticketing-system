import React from 'react';
import {
  Bold,
  Code,
  FileCode,
  Italic,
  List,
  ListOrdered,
  Quote,
} from 'lucide-react';

interface Props {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  value: string;
  onChange: (val: string) => void;
  className?: string;
}

export function MessageToolbar({ textareaRef, value, onChange, className = '' }: Props) {
  const insertFormat = (type: 'bold' | 'italic' | 'inlineCode' | 'codeBlock' | 'bullet' | 'numbered' | 'quote') => {
    const el = textareaRef.current;
    if (!el) return;

    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    const selected = value.slice(start, end);

    let replacement = '';
    let cursorOffset = 0;

    switch (type) {
      case 'bold':
        replacement = `**${selected || 'teks tebal'}**`;
        cursorOffset = selected ? replacement.length : 2;
        break;
      case 'italic':
        replacement = `*${selected || 'teks miring'}*`;
        cursorOffset = selected ? replacement.length : 1;
        break;
      case 'inlineCode':
        replacement = `\`${selected || 'kode'}\``;
        cursorOffset = selected ? replacement.length : 1;
        break;
      case 'codeBlock':
        replacement = `\n\`\`\`\n${selected || '// kode di sini'}\n\`\`\`\n`;
        cursorOffset = selected ? replacement.length : 5;
        break;
      case 'bullet':
        replacement = `\n- ${selected || 'item'}`;
        cursorOffset = replacement.length;
        break;
      case 'numbered':
        replacement = `\n1. ${selected || 'langkah'}`;
        cursorOffset = replacement.length;
        break;
      case 'quote':
        replacement = `\n> ${selected || 'kutipan catatan'}`;
        cursorOffset = replacement.length;
        break;
    }

    const nextValue = value.slice(0, start) + replacement + value.slice(end);
    onChange(nextValue);

    // Refocus and place cursor
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + cursorOffset, start + cursorOffset);
    }, 10);
  };

  return (
    <div className={`flex items-center gap-0.5 border-b border-line bg-subtle/40 px-2 py-1 text-xs ${className}`}>
      <button
        type="button"
        title="Tebal (Bold) **teks**"
        onClick={() => insertFormat('bold')}
        className="rounded p-1 text-ink-muted hover:bg-subtle hover:text-ink transition-colors"
      >
        <Bold className="h-3.5 w-3.5" />
      </button>

      <button
        type="button"
        title="Miring (Italic) *teks*"
        onClick={() => insertFormat('italic')}
        className="rounded p-1 text-ink-muted hover:bg-subtle hover:text-ink transition-colors"
      >
        <Italic className="h-3.5 w-3.5" />
      </button>

      <div className="mx-1 h-3.5 w-px bg-line" />

      <button
        type="button"
        title="Kode Inline `kode`"
        onClick={() => insertFormat('inlineCode')}
        className="rounded p-1 text-ink-muted hover:bg-subtle hover:text-ink transition-colors"
      >
        <Code className="h-3.5 w-3.5" />
      </button>

      <button
        type="button"
        title="Blok Kode ```kode```"
        onClick={() => insertFormat('codeBlock')}
        className="rounded p-1 text-ink-muted hover:bg-subtle hover:text-ink transition-colors"
      >
        <FileCode className="h-3.5 w-3.5" />
      </button>

      <div className="mx-1 h-3.5 w-px bg-line" />

      <button
        type="button"
        title="Daftar Bullet (- item)"
        onClick={() => insertFormat('bullet')}
        className="rounded p-1 text-ink-muted hover:bg-subtle hover:text-ink transition-colors"
      >
        <List className="h-3.5 w-3.5" />
      </button>

      <button
        type="button"
        title="Daftar Berurutan (1. langkah)"
        onClick={() => insertFormat('numbered')}
        className="rounded p-1 text-ink-muted hover:bg-subtle hover:text-ink transition-colors"
      >
        <ListOrdered className="h-3.5 w-3.5" />
      </button>

      <button
        type="button"
        title="Kutipan (> catatan)"
        onClick={() => insertFormat('quote')}
        className="rounded p-1 text-ink-muted hover:bg-subtle hover:text-ink transition-colors"
      >
        <Quote className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
