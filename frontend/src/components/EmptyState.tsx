import type { ReactNode } from 'react';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ 
  icon, 
  title, 
  description, 
  action, 
  secondaryAction, 
  className 
}: EmptyStateProps) {
  return (
    <div className={`empty-state ${className || ''}`}>
      {icon && <div className="empty-state-icon" aria-hidden="true">{icon}</div>}
      <h3 className="text-lg font-semibold text-text-primary mb-1">{title}</h3>
      {description && <p className="text-text-secondary mb-6 max-w-sm">{description}</p>}
      {(action || secondaryAction) && (
        <div className="flex items-center justify-center gap-3 flex-wrap">
          {action && <Button variant={action.variant || 'primary'} onClick={action.onClick}>{action.label}</Button>}
          {secondaryAction && <Button variant="ghost" onClick={secondaryAction.onClick}>{secondaryAction.label}</Button>}
        </div>
      )}
    </div>
  );
}