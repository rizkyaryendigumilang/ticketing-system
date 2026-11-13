import React from 'react';

interface Props {
  text: string;
  className?: string;
}

/**
 * Safely renders simple markdown formatting (bold, italic, inline code, code blocks, quotes, lists)
 * into a pure React element tree without dangerouslySetInnerHTML.
 */
export function FormattedMessage({ text, className = '' }: Props) {
  if (!text) return null;

  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBlockLines: string[] = [];

  const parseInline = (line: string): React.ReactNode[] => {
    // Tokens for inline parsing: `code`, **bold**, *italic*
    const parts: React.ReactNode[] = [];
    const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(line)) !== null) {
      if (match.index > lastIndex) {
        parts.push(line.slice(lastIndex, match.index));
      }
      const token = match[0];
      if (token.startsWith('`') && token.endsWith('`')) {
        parts.push(
          <code
            key={match.index}
            className="rounded bg-subtle px-1 py-0.5 font-mono text-[11px] text-ink border border-line/60"
          >
            {token.slice(1, -1)}
          </code>,
        );
      } else if (token.startsWith('**') && token.endsWith('**')) {
        parts.push(<strong key={match.index} className="font-semibold text-ink">{token.slice(2, -2)}</strong>);
      } else if (token.startsWith('*') && token.endsWith('*')) {
        parts.push(<em key={match.index} className="italic text-ink">{token.slice(1, -1)}</em>);
      }
      lastIndex = match.index + token.length;
    }

    if (lastIndex < line.length) {
      parts.push(line.slice(lastIndex));
    }

    return parts;
  };

  lines.forEach((line, idx) => {
    // Code block start / end
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <pre
            key={`code-${idx}`}
            className="my-1.5 overflow-x-auto rounded border border-line bg-subtle/80 p-2 font-mono text-[11px] text-ink"
          >
            <code>{codeBlockLines.join('\n')}</code>
          </pre>,
        );
        codeBlockLines = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      return;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      return;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      elements.push(
        <blockquote
          key={`quote-${idx}`}
          className="my-1 border-l-2 border-line-strong pl-2.5 italic text-ink-muted"
        >
          {parseInline(line.slice(2))}
        </blockquote>,
      );
      return;
    }

    // Bullet List
    if (line.startsWith('- ') || line.startsWith('* ')) {
      elements.push(
        <div key={`bullet-${idx}`} className="flex items-start gap-2 pl-2">
          <span className="text-ink-muted">•</span>
          <span>{parseInline(line.slice(2))}</span>
        </div>,
      );
      return;
    }

    // Numbered list
    const numMatch = line.match(/^(\d+)\.\s+(.*)$/);
    if (numMatch) {
      elements.push(
        <div key={`num-${idx}`} className="flex items-start gap-1.5 pl-2 font-mono text-xs">
          <span className="text-ink-muted">{numMatch[1]}.</span>
          <span className="font-sans">{parseInline(numMatch[2])}</span>
        </div>,
      );
      return;
    }

    // Normal paragraph line
    elements.push(
      <span key={`p-${idx}`}>
        {parseInline(line)}
        {idx < lines.length - 1 && <br />}
      </span>,
    );
  });

  return <div className={`leading-relaxed ${className}`}>{elements}</div>;
}
