import type { InputHTMLAttributes, ChangeEvent } from 'react';
import { forwardRef } from 'react';
import { Search, X } from 'lucide-react';

interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  label?: string;
  error?: string;
  helperText?: string;
  clearable?: boolean;
  value: string;
  onChange: (value: string) => void;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className = '', label, error, helperText, clearable = false, value, onChange, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-') || 'search';

    return (
      <div className="w-full relative">
        {label && (
          <label htmlFor={inputId} className="sr-only">
            {label}
          </label>
        )}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" aria-hidden="true" />
          <input
            ref={ref}
            id={inputId}
            type="search"
            className={`input pl-10 ${clearable ? 'pr-10' : ''} ${error ? 'border-accent-danger focus:ring-accent-danger/50' : ''} ${className}`}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            {...props}
          />
          {clearable && value && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-secondary transition-colors"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        {error && (
          <p id={`${inputId}-error`} className="mt-1.5 text-xs text-accent-danger" role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${inputId}-helper`} className="mt-1.5 text-xs text-text-tertiary">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

SearchInput.displayName = 'SearchInput';