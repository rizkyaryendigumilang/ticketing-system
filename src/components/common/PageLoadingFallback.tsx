import React from 'react';
import { Skeleton } from './Skeleton';

export function PageLoadingFallback() {
  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6 animate-fadeIn">
      {/* Header skeleton */}
      <div className="flex items-center justify-between border-b border-line pb-4">
        <div className="space-y-2">
          <Skeleton className="h-6 w-48 rounded-lg" />
          <Skeleton className="h-3.5 w-72 rounded-md" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-24 rounded-lg" />
          <Skeleton className="h-8 w-28 rounded-lg" />
        </div>
      </div>

      {/* Bento grid skeleton cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border border-line bg-panel p-4 shadow-card space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </div>
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>

      {/* Main content table/panel skeleton */}
      <div className="rounded-xl border border-line bg-panel shadow-card p-5 space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-line">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-8 w-48 rounded-lg" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-line/40">
              <div className="flex items-center gap-3">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-48" />
              </div>
              <Skeleton className="h-4 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
