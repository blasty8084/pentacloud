import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { createPortal } from 'react-dom';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { ...toast, id }]);
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
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
    const duration = toast.duration ?? 5000;
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

  if (!visible) return null;

  return (
    <div className={`pointer-events-auto toast animate-slide-in-right ${borderColors[toast.type]} flex items-start gap-3`} role="alert">
      <div className="flex-shrink-0 mt-0.5">{icons[toast.type]}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary">{toast.title}</p>
        {toast.message && <p className="text-sm text-text-secondary mt-0.5">{toast.message}</p>}
      </div>
      <button
        onClick={() => { setVisible(false); setTimeout(() => onRemove(toast.id), 200); }}
        className="flex-shrink-0 p-1 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-secondary transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
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