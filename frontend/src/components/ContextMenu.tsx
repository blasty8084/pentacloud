import type { ReactNode } from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Download, Edit, Trash2, Share2, Eye, Star, Folder, File, Move } from 'lucide-react';

interface ContextMenuItem {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  dividerAfter?: boolean;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  isOpen: boolean;
  onClose: () => void;
}

export function ContextMenu({ x, y, items, isOpen, onClose }: ContextMenuProps) {
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
      return () => document.removeEventListener('keydown', handleKeyDown);
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

interface ContextMenuProviderProps {
  children: ReactNode;
}

interface ContextMenuState {
  x: number;
  y: number;
  items: ContextMenuItem[];
  isOpen: boolean;
  targetId: string | null;
  targetType: 'file' | 'folder' | null;
}

const Context = createContext<{
  state: ContextMenuState;
  open: (x: number, y: number, items: ContextMenuItem[], targetId: string, targetType: 'file' | 'folder') => void;
  close: () => void;
} | null>(null);

export function ContextMenuProvider({ children }: ContextMenuProviderProps) {
  const [state, setState] = useState<ContextMenuState>({
    x: 0,
    y: 0,
    items: [],
    isOpen: false,
    targetId: null,
    targetType: null,
  });

  const open = useCallback((x: number, y: number, items: ContextMenuItem[], targetId: string, targetType: 'file' | 'folder') => {
    setState({
      x,
      y,
      items,
      isOpen: true,
      targetId,
      targetType,
    });
  }, []);

  const close = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: false, targetId: null, targetType: null }));
  }, []);

  return (
    <Context.Provider value={{ state, open, close }}>
      {children}
      {isOpen && (
        <div className="fixed inset-0 z-50" onClick={close} onContextMenu={(e) => e.preventDefault()}>
          <div className="absolute z-50" style={{ left: state.x, top: state.y }}>
            {/* Context menu will be rendered by a separate component */}
          </div>
        </div>
      )}
    </Context.Provider>
  );
}

export function useContextMenu() {
  const context = useContext(Context);
  if (!context) {
    throw new Error('useContextMenu must be used within a ContextMenuProvider');
  }
  return context;
}

interface FileContextMenuProps {
  file: {
    id: string;
    name: string;
    mime_type: string;
    size: number;
    folder_id: string | null;
    isStarred?: boolean;
  };
  onOpen: () => void;
  onDownload: () => void;
  onRename: () => void;
  onMove: () => void;
  onShare: () => void;
  onDelete: () => void;
  onToggleStar: () => void;
}

export function FileContextMenu({ file, onOpen, onDownload, onRename, onMove, onShare, onDelete, onToggleStar }: FileContextMenuProps) {
  const { open, close } = useContextMenu();
  const isStarred = file.isStarred;

  const items = [
    { label: 'Open', icon: <Eye className="w-4 h-4" />, onClick: onOpen },
    { label: 'Download', icon: <Download className="w-4 h-4" />, onClick: onDownload },
    { label: 'Rename', icon: <Edit className="w-4 h-4" />, onClick: onRename },
    { label: 'Move', icon: <Move className="w-4 h-4" />, onClick: onMove },
    { label: 'Share', icon: <Share2 className="w-4 h-4" />, onClick: onShare },
    { label: isStarred ? 'Remove from Starred' : 'Add to Starred', icon: isStarred ? <Star className="w-4 h-4 fill-yellow-400" /> : <Star className="w-4 h-4" />, onClick: onToggleStar },
    { dividerBefore: true },
    { label: 'Delete', icon: <Trash2 className="w-4 h-4" />, onClick: onDelete, danger: true },
  ];

  return (
    <div onContextMenu={(e) => {
      e.preventDefault();
      e.stopPropagation();
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      open(e.clientX, e.clientY, [
        { label: 'Open', icon: <Eye className="w-4 h-4" />, onClick: onOpen },
        { label: 'Download', icon: <Download className="w-4 h-4" />, onClick: onDownload },
        { label: 'Rename', icon: <Edit className="w-4 h-4" />, onClick: onRename },
        { label: 'Move', icon: <Move className="w-4 h-4" />, onClick: onMove },
        { label: 'Share', icon: <Share2 className="w-4 h-4" />, onClick: onShare },
        { label: isStarred ? 'Remove from Starred' : 'Add to Starred', icon: isStarred ? <Star className="w-4 h-4 fill-yellow-400" /> : <Star className="w-4 h-4" />, onClick: onToggleStar },
        { dividerBefore: true },
        { label: 'Delete', icon: <Trash2 className="w-4 h-4" />, onClick: onDelete, danger: true },
      ]);
    }}>
      <div onClick={onOpen} className="group relative">
        {children}
      </div>
    </div>
  );
}