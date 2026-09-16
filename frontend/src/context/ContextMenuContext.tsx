import type { ReactNode } from 'react';
import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

export interface ContextMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  dividerBefore?: boolean;
  dividerAfter?: boolean;
}

interface ContextMenuState {
  x: number;
  y: number;
  items: Array<ContextMenuItem & { dividerBefore?: boolean }>;
  isOpen: boolean;
  targetId: string | null;
  targetType: 'file' | 'folder' | null;
}

interface ContextMenuContextType {
  state: ContextMenuState;
  open: (x: number, y: number, items: Array<ContextMenuItem & { dividerBefore?: boolean }>, targetId: string, targetType: 'file' | 'folder') => void;
  close: () => void;
}

const ContextMenuContext = createContext<ContextMenuContextType | null>(null);

export function ContextMenuProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<{
    x: number;
    y: number;
    items: Array<{ label: string; icon?: React.ReactNode; onClick: () => void; disabled?: boolean; danger?: boolean; dividerBefore?: boolean; dividerAfter?: boolean }>;
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

  const open = useCallback((x: number, y: number, items: Array<{ label: string; icon?: React.ReactNode; onClick: () => void; disabled?: boolean; danger?: boolean; dividerBefore?: boolean; dividerAfter?: boolean }>, targetId: string, targetType: 'file' | 'folder') => {
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

  const value = { state: { x: 0, y: 0, items: [], isOpen: false, targetId: null, targetType: null }, open, close };

  return (
    <ContextMenuContext.Provider value={value}>
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