import React, { type ReactNode, type ReactElement, type MouseEvent, type KeyboardEvent } from 'react';
import { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface MenuProps {
  children: ReactNode;
}

interface MenuItemProps {
  children: ReactNode;
  onClick: () => void;
  className?: string;
  disabled?: boolean;
  icon?: ReactNode;
  destructive?: boolean;
  separator?: boolean;
}

interface MenuTriggerProps {
  children: ReactNode;
  asChild?: boolean;
}

interface MenuSeparatorProps {}

interface MenuContextValue {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}

const MenuContext = createContext<MenuContextValue | null>(null);

export function Menu({ children }: MenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(prev => !prev), []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        if (triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
          close();
        }
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close();
      }
    };

    const handleClickOutsideWrapper = (event: MouseEvent) => handleClickOutside(event);
    const handleKeyDownWrapper = (event: KeyboardEvent) => handleKeyDown(event);

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutsideWrapper as unknown as EventListener);
      document.addEventListener('keydown', handleKeyDownWrapper as unknown as EventListener);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutsideWrapper as unknown as EventListener);
      document.removeEventListener('keydown', handleKeyDownWrapper as unknown as EventListener);
    };
  }, [isOpen, close]);

  return (
    <MenuContext.Provider value={{ isOpen, setIsOpen, triggerRef }}>
      <div className="relative" ref={menuRef}>
        {children}
        {isOpen && createPortal(
          <div className="fixed z-50 inset-0" onClick={close} aria-hidden="true" />
        , document.body)}
      </div>
    </MenuContext.Provider>
  );
}

function useMenuContext() {
  const context = useContext(MenuContext);
  if (!context) {
    throw new Error('Menu components must be used within Menu');
  }
  return context;
}

export function MenuTrigger({ children, asChild }: MenuTriggerProps) {
  const { isOpen, setIsOpen, triggerRef } = useMenuContext();
  const child = React.Children.only(children) as ReactElement<any>;

  if (asChild) {
    return React.cloneElement(child, {
      ref: triggerRef,
      onClick: (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsOpen(!isOpen);
        if (child.props.onClick) child.props.onClick(e);
      },
    });
  }

  return (
    <button
      ref={triggerRef}
      onClick={(e) => {
        e.stopPropagation();
        setIsOpen(!isOpen);
      }}
      className="p-1 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-secondary transition-colors"
      aria-haspopup="true"
      aria-expanded={isOpen}
    >
      {children}
    </button>
  );
}

export function MenuItem({ 
  children, 
  onClick, 
  className = '', 
  disabled = false, 
  icon,
  destructive = false,
  separator = false 
}: MenuItemProps) {
  const { isOpen, setIsOpen } = useMenuContext();

  if (separator) {
    return (
      <hr className="divider my-1" role="separator" aria-orientation="horizontal" />
    );
  }

  if (!isOpen) return null;

  const handleClick = useCallback(() => {
    if (!disabled) {
      setIsOpen(false);
      onClick();
    }
  }, [disabled, onClick, setIsOpen]);

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`w-full px-3 py-2 text-sm flex items-center gap-2 text-left transition-colors ${
        disabled 
          ? 'opacity-50 cursor-not-allowed' 
          : destructive
            ? 'text-accent-danger hover:bg-accent-danger/10'
            : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary'
      } ${className}`}
      role="menuitem"
      aria-disabled={disabled}
    >
      {icon && <span className="flex-shrink-0" aria-hidden="true">{icon}</span>}
      <span className="truncate flex-1">{children}</span>
    </button>
  );
}

export function MenuSeparator() {
  return <hr className="divider my-1" role="separator" aria-orientation="horizontal" />;
}

interface MenuContentProps {
  children: ReactNode;
  className?: string;
  align?: 'start' | 'end';
  offset?: number;
}

export function MenuContent({ children, className = '', align = 'end', offset = 4 }: MenuContentProps) {
  const { isOpen } = useMenuContext();

  if (!isOpen) return null;

  return createPortal(
    <div
      className={`fixed z-50 mt-${offset} min-w-[180px] card animate-scale-in shadow-xl ${className}`}
      role="menu"
      style={{ [align]: 0 }}
    >
      <div className="py-1">{children}</div>
    </div>,
    document.body
  );
}