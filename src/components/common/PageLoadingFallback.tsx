import React from 'react';
import { Loader2 } from 'lucide-react';

export function PageLoadingFallback() {
  return (
    <div className="flex min-h-[50vh] w-full flex-col items-center justify-center gap-3 p-8 text-ink-muted">
      <Loader2 className="h-6 w-6 animate-spin text-ink" />
      <span className="text-xs font-medium">Memuat halaman...</span>
    </div>
  );
}
