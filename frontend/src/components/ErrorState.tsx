import type { ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from './Button';

interface ErrorStateProps {
  title?: string;
  message: string;
  icon?: ReactNode;
  onRetry?: () => void;
  onGoHome?: () => void;
  showHomeLink?: boolean;
  className?: string;
  retryLoading?: boolean;
}

export function ErrorState({ 
  title = 'Something went wrong', 
  message, 
  icon, 
  onRetry, 
  onGoHome, 
  showHomeLink = true,
  className,
  retryLoading = false
}: ErrorStateProps) {
  return (
    <div className={`empty-state ${className || ''}`}>
      <div className="empty-state-icon text-accent-danger" aria-hidden="true">
        {icon || <AlertCircle className="w-12 h-12" />}
      </div>
      <h3 className="text-lg font-semibold text-text-primary mb-2">{title}</h3>
      <p className="text-text-secondary mb-6 max-w-sm">{message}</p>
      <div className="flex items-center justify-center gap-3 flex-wrap">
        {onRetry && (
          <Button variant="primary" onClick={onRetry} loading={retryLoading}>
            {retryLoading ? (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Try Again
          </Button>
        )}
        {showHomeLink && onGoHome && (
          <Button variant="ghost" onClick={onGoHome}>
            <Home className="w-4 h-4" />
            Go Home
          </Button>
        )}
      </div>
    </div>
  );
}