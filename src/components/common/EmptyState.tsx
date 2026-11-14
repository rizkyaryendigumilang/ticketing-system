import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center px-6 py-12 text-center select-none ${className}`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-line bg-subtle/60 text-ink-muted shadow-2xs">
        <Icon className="h-6 w-6 stroke-[1.75]" />
      </div>
      <h3 className="mt-3.5 text-sm font-semibold tracking-tight text-ink">
        {title}
      </h3>
      {description && (
        <p className="mt-1 max-w-sm text-xs text-ink-muted leading-relaxed">
          {description}
        </p>
      )}
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-line bg-panel px-3 py-1.5 text-xs font-semibold text-ink shadow-xs hover:border-line-strong hover:bg-subtle active:scale-95 transition-all"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
