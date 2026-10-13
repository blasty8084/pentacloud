import type { ReactNode, KeyboardEvent } from 'react';
import { Fragment } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useRef, useEffect } from 'react';
import { Button } from '../Button';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  className?: string;
}

export function Dialog({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  className = '',
}: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      document.body.style.overflow = 'hidden';
      
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && closeOnEscape) {
          onClose();
        }
        
        if (e.key === 'Tab') {
          const focusableElements = dialogRef.current?.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          
          if (focusableElements && focusableElements.length > 0) {
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];
            
            if (document.activeElement === lastElement && !e.shiftKey) {
              e.preventDefault();
              firstElement.focus();
            } else if (document.activeElement === firstElement && e.shiftKey) {
              e.preventDefault();
              lastElement.focus();
            }
          }
        }
      };
      
      const handleKeyDownWrapper = (e: KeyboardEvent) => handleKeyDown(e);
      
      document.addEventListener('keydown', handleKeyDownWrapper);
      
      setTimeout(() => {
        dialogRef.current?.focus();
      }, 0);
      
      return () => {
        document.removeEventListener('keydown', handleKeyDownWrapper);
        document.body.style.overflow = '';
        previousActiveElement.current?.focus();
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[90vw]',
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && closeOnOverlayClick) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'dialog-title' : undefined}
      aria-describedby={description ? 'dialog-description' : undefined}
    >
      <div 
        className="fixed inset-0 bg-black/60 animate-fade-in"
        onClick={closeOnOverlayClick ? onClose : undefined}
        aria-hidden="true"
      />
      <div
        ref={dialogRef}
        className={`w-full ${sizes[size]} card animate-scale-in ${className}`}
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
        role="document"
      >
        {(title || showCloseButton) && (
          <div className="flex items-start justify-between px-6 py-4 border-b border-surface-border">
            <div>
              {title && (
                <h2 id="dialog-title" className="text-lg font-semibold text-text-primary">{title}</h2>
              )}
              {description && (
                <p id="dialog-description" className="text-sm text-text-secondary mt-1">{description}</p>
              )}
            </div>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl text-text-tertiary hover:text-text-primary hover:bg-surface-secondary transition-colors flex-shrink-0"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>,
    document.body
  );
}

interface AlertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  variant?: 'destructive' | 'primary' | 'secondary';
  loading?: boolean;
  className?: string;
}

export function AlertDialog({
  isOpen,
  onClose,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'destructive',
  loading = false,
  className = '',
}: AlertDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const handleCancel = () => {
    onCancel?.();
    onClose();
  };

  const confirmVariants = {
    destructive: 'bg-accent-danger hover:bg-red-700 text-white',
    primary: 'bg-accent-primary hover:bg-accent-primary-hover text-white',
    secondary: 'bg-surface-tertiary hover:bg-surface-border text-text-primary border border-surface-border',
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      className={className}
    >
      <div className="flex flex-col gap-4">
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="ghost" onClick={handleCancel} disabled={loading}>
            {cancelText}
          </Button>
          <Button 
            variant={variant === 'destructive' ? 'danger' : variant === 'primary' ? 'primary' : 'secondary'}
            onClick={handleConfirm}
            loading={loading}
            className={confirmVariants[variant]}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  title = 'Confirm Action',
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'destructive',
  loading = false,
  className = '',
}: AlertDialogProps) {
  return (
    <AlertDialog
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      confirmText={confirmText}
      cancelText={cancelText}
      onConfirm={onConfirm}
      onCancel={onCancel}
      variant={variant}
      loading={loading}
      className={className}
    />
  );
}