import type { HTMLAttributes } from 'react';
import { forwardRef } from 'react';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
  size?: 'sm' | 'md';
  dot?: boolean;
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className = '', variant = 'neutral', size = 'md', dot, children, ...props }, ref) => {
    const variants = {
      primary: 'badge-primary',
      success: 'badge-success',
      warning: 'badge-warning',
      danger: 'badge-danger',
      neutral: 'badge-neutral',
    };

    const sizes = {
      sm: 'px-1.5 py-0.5 text-[0.625rem]',
      md: 'px-2 py-0.5 text-xs',
    };

    return (
      <span
        ref={ref}
        className={`inline-flex items-center gap-1.5 font-medium rounded-full ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {dot && <span className={`w-1.5 h-1.5 rounded-full ${dot === true ? 'bg-current' : ''}`} />}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';