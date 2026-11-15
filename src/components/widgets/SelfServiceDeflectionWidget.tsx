import { useState } from 'react';
import { BookOpen, Check, ChevronDown, ChevronUp, Sparkles, ThumbsUp } from 'lucide-react';
import { KB_ARTICLES, type KbArticle } from '../../config/knowledgeBaseData';
import { useToast } from '../../context/ToastContext';

interface Props {
  appId?: string;
  onDeflected?: (articleTitle: string) => void;
  className?: string;
}

export function SelfServiceDeflectionWidget({ appId, onDeflected, className = '' }: Props) {
  const toast = useToast();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [solvedArticles, setSolvedArticles] = useState<string[]>([]);

  // Filter articles matching the application, or fallback to first 4
  const articles: KbArticle[] = appId
    ? KB_ARTICLES.filter((a) => a.appId === appId || a.appId === 'global').concat(
        KB_ARTICLES.filter((a) => a.appId !== appId).slice(0, 2),
      ).slice(0, 4)
    : KB_ARTICLES.slice(0, 4);

  const handleMarkSolved = (art: KbArticle) => {
    setSolvedArticles((prev) => [...prev, art.id]);
    toast.success(`Terima kasih! Solusi "${art.title}" berhasil membantu Anda.`);
    if (onDeflected) {
      onDeflected(art.title);
    }
  };

  if (articles.length === 0) return null;

  return (
    <div className={`rounded-2xl border border-line bg-panel p-5 shadow-card transition-colors ${className}`}>
      <div className="flex items-center justify-between border-b border-line pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <BookOpen className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold tracking-tight text-ink">
              Solusi Mandiri Cepat Tanpa Menunggu Tiket
            </h3>
            <p className="text-[11px] text-ink-muted">
              Kendala umum yang dapat diselesaikan langsung dalam beberapa langkah
            </p>
          </div>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1 rounded bg-subtle px-2 py-0.5 text-[10px] font-medium text-ink-faint">
          <Sparkles className="h-3 w-3 text-amber-500" />
          Instan
        </span>
      </div>

      <div className="mt-3.5 space-y-2.5">
        {articles.map((art) => {
          const isExpanded = expandedId === art.id;
          const isSolved = solvedArticles.includes(art.id);

          return (
            <div
              key={art.id}
              className={`rounded-xl border transition-colors ${
                isSolved
                  ? 'border-emerald-500/30 bg-emerald-500/[0.04]'
                  : isExpanded
                  ? 'border-line-strong bg-subtle/50'
                  : 'border-line bg-subtle/20 hover:border-line-strong hover:bg-subtle/40'
              }`}
            >
              <button
                type="button"
                onClick={() => setExpandedId(isExpanded ? null : art.id)}
                className="flex w-full items-center justify-between gap-3 p-3 text-left"
              >
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-ink leading-snug">
                    {art.title}
                  </p>
                  <p className="mt-0.5 text-[11px] text-ink-muted truncate">
                    {art.summary}
                  </p>
                </div>
                <div className="shrink-0 text-ink-muted">
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-line/60 p-3.5 space-y-3 bg-panel/80 rounded-b-xl animate-fade-in">
                  <ol className="list-decimal space-y-1.5 pl-4 text-xs text-ink leading-relaxed">
                    {art.steps.map((st, i) => (
                      <li key={i}>{st}</li>
                    ))}
                  </ol>

                  <div className="flex items-center justify-between pt-2 border-t border-line/50 text-[11px]">
                    <span className="text-ink-muted">Apakah panduan ini membantu Anda?</span>
                    {isSolved ? (
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                        <Check className="h-3.5 w-3.5" />
                        Kendala Teratasi
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleMarkSolved(art)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-panel px-2.5 py-1 text-xs font-semibold text-ink hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-800 transition-colors shadow-2xs"
                      >
                        <ThumbsUp className="h-3 w-3 text-emerald-600" />
                        Ya, Masalah Selesai
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
