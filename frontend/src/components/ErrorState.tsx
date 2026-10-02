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
}

export function ErrorState({ 
  title = 'Something went wrong', 
  message, 
  icon, 
  onRetry, 
  onGoHome, 
  showHomeLink = true,
  className 
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
          <Button variant="primary" onClick={onRetry}>
            <RefreshCw className="w-4 h-4" />
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