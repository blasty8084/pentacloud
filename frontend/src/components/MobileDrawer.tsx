import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Home, Share2, Settings, Database, User, LogOut, HelpCircle, ChevronLeft } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { navigationConfig, type NavItemId } from '../navigation/NavigationConfig';
import { Button } from './Button';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeNav?: string | null;
  onNavigate?: (itemId: string) => void;
}

export function MobileDrawer({ isOpen, onClose, activeNav, onNavigate }: MobileDrawerProps) {
  const { themeMode, setThemeMode, accent, setAccent, language, setLanguage } = useTheme();
  const { user, logout } = useAuth();
  const drawerRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  const availableNavItems = navigationConfig.filter(item => item.availability === 'available');

  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      document.body.style.overflow = 'hidden';
      
      // Focus the drawer or first focusable element
      setTimeout(() => {
        drawerRef.current?.focus();
      }, 0);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';
        previousActiveElement.current?.focus();
      };
    }
  }, [isOpen, onClose]);

  const handleNavClick = (itemId: NavItemId) => {
    if (onNavigate) {
      onNavigate(itemId);
    }
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 md:hidden">
      <div 
        className="absolute inset-0 bg-black/50 animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={drawerRef}
        className="absolute top-0 right-0 h-full w-[280px] max-w-full bg-surface border-l border-surface-border animate-slide-in-right flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        tabIndex={-1}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between h-[64px] px-4 border-b border-surface-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-accent-primary-light flex items-center justify-center flex-shrink-0">
              <Home className="w-5 h-5 text-accent-primary" />
            </div>
            <span className="text-xl font-bold text-text-primary truncate">PENTACLOUD</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1" aria-label="Main navigation">
          {navigationConfig
            .filter(item => item.availability === 'available')
            .map(item => {
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`group flex items-center gap-3 w-full px-3 py-3 rounded-xl text-base font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-accent-primary-light text-accent-primary font-semibold'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span className="flex-shrink-0" aria-hidden="true">{item.icon}</span>
                  <span className="truncate flex-1">{item.label}</span>
                </button>
              );
            })}
        </nav>

        {/* User Section */}
        <div className="border-t border-surface-border px-3 py-3 space-y-2">
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-surface-secondary">
            <div className="w-10 h-10 rounded-xl bg-accent-primary-light flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-accent-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-text-tertiary truncate">{user?.email || 'user@example.com'}</p>
            </div>
          </div>

          <button 
            onClick={() => { handleNavClick('settings'); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors"
          >
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </button>

          <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors">
            <HelpCircle className="w-5 h-5" />
            <span>Help & Support</span>
          </button>

          <div className="border-t border-surface-border" />

          <button 
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-accent-danger hover:bg-surface-secondary transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}