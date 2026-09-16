import type { ReactNode } from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'card' | 'row' | 'text' | 'circular';
}

export function Skeleton({ className = '', variant = 'card' }: SkeletonProps) {
  const baseClass = 'animate-pulse bg-slate-200 dark:bg-slate-700';
  
  const variants = {
    card: 'h-40 w-full rounded-lg',
    row: 'h-12 w-full',
    text: 'h-4 w-3/4',
    circular: 'h-10 w-10 rounded-full',
  };

  return (
    <div className={`${baseClass} ${variants[variant]} ${className}`} aria-hidden="true" />
  );
}

export function FileGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
      role="list"
      aria-label="Files"
      aria-busy="true"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="group bg-white border border-gray-200 rounded-xl p-3 animate-pulse"
        >
          <div className="aspect-square bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center justify-center mb-3">
            <div className="w-12 h-12 mx-auto bg-slate-300 dark:bg-slate-600 rounded-lg animate-pulse" />
          </div>
          <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-700 rounded mb-1 animate-pulse" />
          <div className="h-3 w-1/2 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
          <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-slate-700">
            <div className="h-3 w-1/4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}