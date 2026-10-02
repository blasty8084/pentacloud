import type { HTMLAttributes } from 'react';
import { forwardRef } from 'react';

interface DividerProps extends HTMLAttributes<HTMLHRElement> {
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export const Divider = forwardRef<HTMLHRElement, DividerProps>(
  ({ className = '', orientation = 'horizontal', ...props }, ref) => {
    return (
      <hr
        ref={ref}
        className={`divider ${orientation === 'vertical' ? 'h-12 w-px' : ''} ${className}`}
        aria-orientation={orientation}
        {...props}
      />
    );
  }
);

Divider.displayName = 'Divider';