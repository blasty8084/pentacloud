import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, FolderOpen, Share2, Settings, MoreHorizontal,
  ChevronLeft, Search, Menu, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Button } from './Button';
import { formatBytes } from '../utils/format';

interface MobileBottomNavProps {
  className?: string;
}

export function MobileBottomNav({ className }: MobileBottomNavProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { themeMode, setThemeMode, accent, setAccent, language, setLanguage } = useTheme();
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement | null>(null);

  const navItems = [
    { path: '/dashboard', label: 'Files', icon: Home, exact: true },
    { path: '/dashboard/shared', label: 'Shared', icon: Share2, exact: false },
  ];

  // Current path matching
  const currentPath = location.pathname;
  const isShared = currentPath.startsWith('/dashboard/shared');

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setShowMoreMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavClick = (path: string) => {
    navigate(path);
    setShowMoreMenu(false);
  };

  return (
    <>
      {/* Bottom Navigation Bar */}
      <nav 
        className={`fixed bottom-0 left-0 right-0 z-50 bg-surface/95 backdrop-blur-xl border-t border-surface-border md:hidden ${className || ''}`}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="grid grid-cols-5">
          {navItems.map((item, index) => {
            const isActive = item.exact 
              ? currentPath === item.path 
              : currentPath.startsWith(item.path);
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => handleNavClick(item.path)}
                className={`flex flex-col items-center justify-center gap-1 py-2.5 px-2 transition-colors min-h-[56px] ${
                  isActive
                    ? 'text-accent-primary'
                    : 'text-text-tertiary hover:text-text-primary'
                }`}
                aria-current={isActive ? 'page' : undefined}
                aria-label={item.label}
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          })}
          
          {/* More Menu */}
          <div className="relative" ref={moreMenuRef}>
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className={`flex flex-col items-center justify-center gap-1 py-2.5 px-2 transition-colors min-h-[56px] ${
                showMoreMenu
                  ? 'text-accent-primary'
                  : 'text-text-tertiary hover:text-text-primary'
              }`}
              aria-label="More options"
              aria-expanded={showMoreMenu}
              aria-haspopup="true"
            >
              <MoreHorizontal className="w-6 h-6" />
              <span className="text-xs font-medium">More</span>
            </button>
            
            {showMoreMenu && (
              <div className="absolute bottom-full right-0 mb-2 w-56 card animate-scale-in shadow-xl overflow-hidden">
                <div className="p-2 border-b border-surface-border">
                  <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider px-3 py-1">More</h3>
                </div>
                <div className="py-1">
                  <button
                    onClick={() => handleNavClick('/dashboard/storage')}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors"
                  >
                    <Settings className="w-5 h-5" />
                    <span>Storage</span>
                  </button>
                  <button
                    onClick={() => handleNavClick('/settings')}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors"
                  >
                    <Settings className="w-5 h-5" />
                    <span>Settings</span>
                  </button>
                </div>
                <div className="border-t border-surface-border pt-1">
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-accent-danger hover:bg-surface-secondary transition-colors"
                  >
                    <Settings className="w-5 h-5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Bottom spacing for content */}
      <div className="md:hidden h-20" aria-hidden="true" />
    </>
  );
}