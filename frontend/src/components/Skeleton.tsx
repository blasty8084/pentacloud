import type { HTMLAttributes } from 'react';

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'title' | 'avatar' | 'card' | 'circle' | 'rect';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({ className = '', variant = 'rect', width, height, ...props }: SkeletonProps) {
  const variants = {
    text: 'h-4 w-full',
    title: 'h-6 w-3/4',
    avatar: 'w-10 h-10 rounded-full',
    card: 'min-h-[200px] rounded-xl',
    circle: 'rounded-full',
    rect: 'rounded-md',
  };

  const baseStyles = 'skeleton';

  return (
    <div
      className={`${baseStyles} ${variants[variant]} ${className}`}
      style={{ width, height }}
      aria-hidden="true"
      {...props}
    />
  );
}

export function FileCardSkeleton() {
  return (
    <div className="card-hover group relative bg-surface border border-surface-border rounded-2xl p-4 transition-all duration-300 hover:border-surface-border-hover hover:shadow-lg hover:-translate-y-1 cursor-pointer animate-shimmer">
      <div className="aspect-square bg-surface-tertiary rounded-xl flex items-center justify-center mb-4 relative overflow-hidden">
        <Skeleton variant="rect" className="w-full h-full" />
      </div>
      <div className="space-y-2">
        <Skeleton variant="title" />
        <Skeleton variant="text" style={{ width: '60%' }} />
        <Skeleton variant="text" style={{ width: '40%' }} />
      </div>
    </div>
  );
}

export function FileRowSkeleton() {
  return (
    <div className="card-hover group flex items-center gap-4 p-4 animate-shimmer">
      <div className="w-12 h-12 rounded-xl bg-surface-tertiary flex items-center justify-center flex-shrink-0">
        <Skeleton variant="circle" className="w-6 h-6" />
      </div>
      <div className="flex-1 min-w-0 space-y-1">
        <Skeleton variant="title" style={{ width: '50%' }} />
        <Skeleton variant="text" style={{ width: '30%' }} />
      </div>
      <Skeleton variant="rect" className="w-20 h-8" />
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <tr className="animate-shimmer">
      <td className="px-4 py-3"><Skeleton variant="text" /></td>
      <td className="px-4 py-3"><Skeleton variant="text" style={{ width: '80%' }} /></td>
      <td className="px-4 py-3"><Skeleton variant="text" style={{ width: '60%' }} /></td>
      <td className="px-4 py-3"><Skeleton variant="text" style={{ width: '50%' }} /></td>
    </tr>
  );
}