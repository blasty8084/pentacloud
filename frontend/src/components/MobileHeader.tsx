import { useState, useRef, useEffect } from 'react';
import { 
  Search, Menu, X, Bell, Moon, Sun, Monitor, 
  ChevronDown, LayoutDashboard, Grid, List,
  MoreHorizontal, Download, Upload, Settings,
  User, LogOut, Palette, Globe, HelpCircle,
  ChevronLeft
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { SearchBar } from './SearchBar';
import { Button } from './Button';
import { accentOptions } from '../design/tokens';

interface MobileHeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  onMenuClick?: () => void;
  onSearchClick?: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  t: (key: string) => string;
}

export function MobileHeader({
  title,
  showBack = false,
  onBack,
  onMenuClick,
  onSearchClick,
  searchQuery,
  onSearchChange,
  t,
}: MobileHeaderProps) {
  const { themeMode, setThemeMode, resolvedTheme, accent, setAccent, language, setLanguage } = useTheme();
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showAccentMenu, setShowAccentMenu] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const themeMenuRef = useRef<HTMLDivElement>(null);
  const accentMenuRef = useRef<HTMLDivElement>(null);
  const langMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
      if (themeMenuRef.current && !themeMenuRef.current.contains(e.target as Node)) {
        setShowThemeMenu(false);
      }
      if (accentMenuRef.current && !accentMenuRef.current.contains(e.target as Node)) {
        setShowAccentMenu(false);
      }
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setShowLanguageMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const accents = ['blue', 'emerald', 'violet', 'amber', 'rose', 'cyan'] as const;
  const languages = [
    { code: 'en' as const, label: 'English', flag: '🇺🇸' },
    { code: 'hi' as const, label: 'हिन्दी', flag: '🇮🇳' },
  ];

  return (
    <header className="sticky top-0 z-40 h-[56px] bg-surface/80 backdrop-blur-xl border-b border-surface-border flex-shrink-0 md:hidden">
      <div className="flex items-center justify-between h-full px-4">
        {/* Left: Back/Menu + Title */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {showBack ? (
            <button
              onClick={onBack}
              className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors"
              aria-label="Go back"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          ) : onMenuClick ? (
            <button
              onClick={onMenuClick}
              className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          ) : (
            <div className="w-10" />
          )}
          
          {title && (
            <h1 className="text-lg font-semibold text-text-primary truncate flex-1">
              {title}
            </h1>
          )}
        </div>

        {/* Right: Search + User Menu */}
        <div className="flex items-center gap-1">
          {/* Search */}
          <button
            onClick={onSearchClick}
            className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors"
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* User Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-surface-secondary transition-colors"
              aria-label="User menu"
            >
              <div className="w-8 h-8 rounded-xl bg-accent-primary-light flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-accent-primary" />
              </div>
              <ChevronDown className="w-4 h-4 text-text-tertiary" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 card animate-scale-in shadow-xl overflow-hidden">
                <div className="px-3 py-2 border-b border-surface-border">
                  <p className="text-sm font-medium text-text-primary">{user?.name || 'User'}</p>
                  <p className="text-xs text-text-tertiary">{user?.email || 'user@example.com'}</p>
                </div>
                <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors">
                  <User className="w-4 h-4" />
                  <span>{t('Profile')}</span>
                </button>
                <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors">
                  <Settings className="w-4 h-4" />
                  <span>{t('Settings')}</span>
                </button>
                <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors">
                  <HelpCircle className="w-4 h-4" />
                  <span>{t('Help & Support')}</span>
                </button>
                <div className="border-t border-surface-border" />
                <button 
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-accent-danger hover:bg-surface-secondary transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{t('Sign Out')}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}