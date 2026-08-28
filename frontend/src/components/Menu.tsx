import type { ReactNode } from 'react';
import { useState, useRef, useEffect } from 'react';

interface MenuProps {
  children: ReactNode;
}

interface MenuItemProps {
  children: ReactNode;
  onClick: () => void;
  className?: string;
}

interface MenuTriggerProps {
  children: ReactNode;
  asChild?: boolean;
}

interface MenuContextValue {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const MenuContext = createContext<MenuContextValue | null>(null);

function createContext<T>(defaultValue: T) {
  return React.createContext(defaultValue);
}

import React from 'react';

export function Menu({ children }: MenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <MenuContext.Provider value={{ isOpen, setIsOpen }}>
      <div className="relative" ref={menuRef}>
        {children}
      </div>
    </MenuContext.Provider>
  );
}

function useMenuContext() {
  const context = React.useContext(MenuContext);
  if (!context) {
    throw new Error('Menu components must be used within Menu');
  }
  return context;
}

export function MenuTrigger({ children, asChild }: MenuTriggerProps) {
  const { isOpen, setIsOpen } = useMenuContext();
  const child = React.Children.only(children);

  if (asChild) {
    return React.cloneElement(child as React.ReactElement<any>, {
      onClick: (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsOpen(!isOpen);
        if (child.props.onClick) child.props.onClick(e);
      },
    });
  }

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        setIsOpen(!isOpen);
      }}
      className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
    >
      {children}
    </button>
  );
}

export function MenuItem({ children, onClick, className }: MenuItemProps) {
  const { isOpen, setIsOpen } = useMenuContext();

  if (!isOpen) return null;

  return (
    <div className="fixed z-50 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 animate-fade-in">
      <button
        onClick={() => {
          onClick();
          setIsOpen(false);
        }}
        className={`w-full px-3 py-2 text-sm flex items-center gap-2 text-left ${className || 'text-gray-700 hover:bg-gray-100'}`}
      >
        {children}
      </button>
    </div>
  );
}