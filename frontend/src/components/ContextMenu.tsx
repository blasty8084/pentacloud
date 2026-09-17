import type { ReactNode } from 'react';
import { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import { X, Download, Edit, Trash2, Share2, Eye, Star, Folder, File, Move, ChevronRight } from 'lucide-react';

export interface ContextMenuItem {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  dividerBefore?: boolean;
  dividerAfter?: boolean;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: Array<{
    label: string;
    icon?: ReactNode;
    onClick: () => void;
    disabled?: boolean;
    danger?: boolean;
    dividerBefore?: boolean;
    dividerAfter?: boolean;
  }>;
  isOpen: boolean;
  onClose: () => void;
}

export function ContextMenu({ x, y, items, isOpen, onClose }: {
  x: number;
  y: number;
  items: Array<{
    label: string;
    icon?: ReactNode;
    onClick: () => void;
    disabled?: boolean;
    danger?: boolean;
    dividerBefore?: boolean;
    dividerAfter?: boolean;
  }>;
  isOpen: boolean;
  onClose: () => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          onClose();
        }
      };
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 min-w-[180px] py-1 animate-fade-in"
      style={{ left: x, top: y }}
      role="menu"
      aria-orientation="vertical"
    >
      {items.map((item, index) => (
        <div key={index}>
          {item.dividerBefore && <hr className="my-1 border-gray-200 dark:border-slate-700" />}
          {!item.dividerBefore && index > 0 && items[index - 1]?.dividerAfter && (
            <hr className="my-1 border-gray-200 dark:border-slate-700" />
          )}
          <button
            onClick={() => {
              item.onClick();
              onClose();
            }}
            disabled={item.disabled}
            className={`w-full px-3 py-2 text-sm flex items-center gap-2 text-left transition-colors ${
              item.danger
                ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
                : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
            } ${item.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            role="menuitem"
            disabled={item.disabled}
          >
            {item.icon && <span className="w-4 h-4 flex-shrink-0">{item.icon}</span>}
            <span className="flex-1">{item.label}</span>
          </button>
        )}
        {item.dividerAfter && <hr className="my-1 border-gray-200 dark:border-slate-700" />}
      ))}
    </div>
  );
}

interface ContextMenuState {
  x: number;
  y: number;
  items: Array<{
    label: string;
    icon?: ReactNode;
    onClick: () => void;
    disabled?: boolean;
    danger?: boolean;
    dividerBefore?: boolean;
    dividerAfter?: boolean;
  }>;
  isOpen: boolean;
  targetId: string | null;
  targetType: 'file' | 'folder' | null;
}

interface ContextMenuContextType {
  state: {
    x: number;
    y: number;
    items: Array<{
      label: string;
      icon?: React.ReactNode;
      onClick: () => void;
      disabled?: boolean;
      danger?: boolean;
      dividerBefore?: boolean;
      dividerAfter?: boolean;
    }>;
    isOpen: boolean;
    targetId: string | null;
    targetType: 'file' | 'folder' | null;
  };
  open: (x: number, y: number, items: Array<{
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    disabled?: boolean;
    danger?: boolean;
    dividerBefore?: boolean;
    dividerAfter?: boolean;
  }>, targetId: string, targetType: 'file' | 'folder') => void;
  close: () => void;
}

const ContextMenuContext = createContext<{
  state: {
    x: number;
    y: number;
    items: Array<{
      label: string;
      icon?: React.ReactNode;
      onClick: () => void;
      disabled?: boolean;
      danger?: boolean;
      dividerBefore?: boolean;
      dividerAfter?: boolean;
    }>;
    isOpen: boolean;
    targetId: string | null;
    targetType: 'file' | 'folder' | null;
  };
  open: (x: number, y: number, items: Array<{
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    disabled?: boolean;
    danger?: boolean;
    dividerBefore?: boolean;
    dividerAfter?: boolean;
  }>, targetId: string, targetType: 'file' | 'folder') => void;
  close: () => void;
} | null>(null);

export function ContextMenuProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<{
    x: number;
    y: number;
    items: Array<{
      label: string;
      icon?: React.ReactNode;
      onClick: () => void;
      disabled?: boolean;
      danger?: boolean;
      dividerBefore?: boolean;
      dividerAfter?: boolean;
    }>;
    isOpen: boolean;
    targetId: string | null;
    targetType: 'file' | 'folder' | null;
  }>({
    x: 0,
    y: 0,
    items: [],
    isOpen: false,
    targetId: null,
    targetType: null,
  });

  const open = useCallback((x: number, y: number, items: Array<{
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    disabled?: boolean;
    danger?: boolean;
    dividerBefore?: boolean;
    dividerAfter?: boolean;
  }>, targetId: string, targetType: 'file' | 'folder') => {
    setState({
      x,
      y,
      items: items.map(item => ({ ...item, dividerBefore: false, dividerAfter: false })),
      isOpen: true,
      targetId,
      targetType,
    });
  }, []);

  const close = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: false, targetId: null, targetType: null }));
  }, []);

  return (
    <ContextMenuContext.Provider value={{ state: { x: 0, y: 0, items: [], isOpen: false, targetId: null, targetType: null }, open, close }}>
      {children}
    </ContextMenuContext.Provider>
  );
}

export function useContextMenu() {
  const context = useContext(ContextMenuContext);
  if (!context) {
    throw new Error('useContextMenu must be used within a ContextMenuProvider');
  }
  return context;
}