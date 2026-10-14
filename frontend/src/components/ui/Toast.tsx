import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { createPortal } from 'react-dom';
import { Button } from '../Button';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  clearAll: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = { ...toast, id };
    setToasts(prev => [...prev, newToast]);
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearAll }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  if (toasts.length === 0) return null;

  return createPortal(
    <div className="fixed bottom-6 right-6 z-[600] flex flex-col gap-3 w-full max-w-sm sm:max-w-md pointer-events-none">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>,
    document.body
  );
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const duration = toast.duration ?? (toast.type === 'error' ? 8000 : 5000);
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onRemove(toast.id), 200);
    }, duration);
    return () => clearTimeout(timer);
  }, [toast, onRemove]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-accent-success" />,
    error: <AlertCircle className="w-5 h-5 text-accent-danger" />,
    warning: <AlertTriangle className="w-5 h-5 text-accent-warning" />,
    info: <Info className="w-5 h-5 text-accent-info" />,
  };

  const borderColors = {
    success: 'border-l-4 border-accent-success',
    error: 'border-l-4 border-accent-danger',
    warning: 'border-l-4 border-accent-warning',
    info: 'border-l-4 border-accent-info',
  };

  const bgColors = {
    success: 'bg-accent-success/5',
    error: 'bg-accent-danger/5',
    warning: 'bg-accent-warning/5',
    info: 'bg-accent-info/5',
  };

  if (!visible) return null;

  return (
    <div 
      className={`pointer-events-auto animate-slide-in-right flex items-start gap-3 ${borderColors[toast.type]} ${bgColors[toast.type]} rounded-xl`} 
      role="alert"
      aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
    >
      <div className="flex-shrink-0 mt-0.5 p-1">{icons[toast.type]}</div>
      <div className="flex-1 min-w-0 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary">{toast.title}</p>
            {toast.message && <p className="text-sm text-text-secondary mt-0.5">{toast.message}</p>}
          </div>
          <button
            onClick={() => { setVisible(false); setTimeout(() => onRemove(toast.id), 200); }}
            className="flex-shrink-0 p-1 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-secondary/50 transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {toast.action && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => { toast.action?.onClick(); onRemove(toast.id); }}
            className="mt-2 mr-4 self-end"
          >
            {toast.action.label}
          </Button>
        )}
      </div>
    </div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export function useToastHelpers() {
  const { addToast, removeToast, clearAll } = useToast();
  
  return {
    success: (title: string, message?: string, options?: { duration?: number; action?: { label: string; onClick: () => void } }) => 
      addToast({ type: 'success', title, message, duration: options?.duration, action: options?.action }),
    error: (title: string, message?: string, options?: { duration?: number; action?: { label: string; onClick: () => void } }) => 
      addToast({ type: 'error', title, message, duration: options?.duration, action: options?.action }),
    warning: (title: string, message?: string, options?: { duration?: number; action?: { label: string; onClick: () => void } }) => 
      addToast({ type: 'warning', title, message, duration: options?.duration, action: options?.action }),
    info: (title: string, message?: string, options?: { duration?: number; action?: { label: string; onClick: () => void } }) => 
      addToast({ type: 'info', title, message, duration: options?.duration, action: options?.action }),
    remove: removeToast,
    clear: clearAll,
  };
}