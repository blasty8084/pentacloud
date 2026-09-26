import { useState, useRef, useEffect } from 'react';
import { 
  Search, Menu, X, Bell, Moon, Sun, Monitor, 
  ChevronDown, LayoutDashboard, Grid, List,
  MoreHorizontal, Download, Upload, Settings,
  User, LogOut, Palette, Globe, HelpCircle
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { SearchBar } from './SearchBar';
import { Button } from './Button';

interface HeaderProps {
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;
  sortBy: 'name' | 'size' | 'date';
  setSortBy: (by: 'name' | 'size' | 'date') => void;
  sortOrder: 'asc' | 'desc';
  setSortOrder: (order: 'asc' | 'desc') => void;
  onNewFolder: () => void;
  onUpload: () => void;
  uploads: { fileId: string; status: string }[];
  t: (key: string) => string;
}

export function Header({
  sidebarCollapsed,
  onToggleSidebar,
  searchQuery,
  onSearchChange,
  viewMode,
  setViewMode,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  onNewFolder,
  onUpload,
  uploads,
  t,
}: HeaderProps) {
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
  const uploading = uploads.some(u => u.status === 'uploading');

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
    { code: 'es' as const, label: 'Español', flag: '🇪🇸' },
    { code: 'fr' as const, label: 'Français', flag: '🇫🇷' },
    { code: 'de' as const, label: 'Deutsch', flag: '🇩🇪' },
    { code: 'zh' as const, label: '中文', flag: '🇨🇳' },
    { code: 'ja' as const, label: '日本語', flag: '🇯🇵' },
  ];

  return (
    <header className="sticky top-0 z-40 h-[64px] bg-surface/80 backdrop-blur-xl border-b border-surface-border flex-shrink-0">
      <div className="flex items-center justify-between h-full px-4 sm:px-6 lg:px-8">
        {/* Left: Menu + Search */}
        <div className="flex items-center gap-3 lg:gap-4 flex-1">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-all duration-200 lg:hidden"
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
          </button>

          <div className="relative flex-1 max-w-xl lg:max-w-2xl hidden sm:block">
            <SearchBar
              value={searchQuery}
              onChange={onSearchChange}
              placeholder={t('Search files, folders...')}
              className="w-full"
            />
          </div>
        </div>

        {/* Right: Actions + User Menu */}
        <div className="flex items-center gap-2">
          {/* View Mode */}
          <div className="hidden sm:flex items-center gap-1 border border-surface-border rounded-xl p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all duration-200 ${
                viewMode === 'grid' 
                  ? 'bg-accent-primary-light text-accent-primary' 
                  : 'text-text-tertiary hover:text-text-primary hover:bg-surface-secondary'
              }`}
              aria-label={t('Grid view')}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all duration-200 ${
                viewMode === 'list' 
                  ? 'bg-accent-primary-light text-accent-primary' 
                  : 'text-text-tertiary hover:text-text-primary hover:bg-surface-secondary'
              }`}
              aria-label={t('List view')}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Sort */}
          <div className="hidden sm:flex items-center gap-2 border border-surface-border rounded-xl px-2 py-1">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent border-none text-sm font-medium text-text-secondary focus:outline-none cursor-pointer"
              aria-label={t('Sort by')}
            >
              <option value="date">{t('Date Modified')}</option>
              <option value="name">{t('Name')}</option>
              <option value="size">{t('Size')}</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-secondary transition-colors"
              aria-label={sortOrder === 'asc' ? t('Sort descending') : t('Sort ascending')}
            >
              <ChevronDown className={`w-4 h-4 transition-transform ${sortOrder === 'asc' ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Theme Selector */}
          <div className="relative hidden sm:block">
            <button
              onClick={() => setShowThemeMenu(!showThemeMenu)}
              className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors"
              aria-label="Theme"
            >
              {themeMode === 'light' && <Sun className="w-5 h-5" />}
              {themeMode === 'dark' && <Moon className="w-5 h-5" />}
              {themeMode === 'system' && <Monitor className="w-5 h-5" />}
            </button>
            {showThemeMenu && (
              <div 
                ref={themeMenuRef}
                className="absolute right-0 mt-2 w-40 card animate-scale-in shadow-xl"
              >
                {(['light', 'dark', 'system'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => { setThemeMode(mode); setShowThemeMenu(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors ${
                      themeMode === mode
                        ? 'bg-accent-primary-light text-accent-primary'
                        : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary'
                    }`}
                  >
                    {mode === 'light' && <Sun className="w-5 h-5" />}
                    {mode === 'dark' && <Moon className="w-5 h-5" />}
                    {mode === 'system' && <Monitor className="w-5 h-5" />}
                    <span>{mode.charAt(0).toUpperCase() + mode.slice(1)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Accent Color */}
          <div className="relative hidden sm:block">
            <button
              onClick={() => setShowAccentMenu(!showAccentMenu)}
              className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors"
              aria-label="Accent color"
            >
              <Palette className="w-5 h-5" />
            </button>
            {showAccentMenu && (
              <div 
                ref={accentMenuRef}
                className="absolute right-0 mt-2 w-44 card animate-scale-in shadow-xl p-2"
              >
                <div className="grid grid-cols-3 gap-1.5">
                  {accents.map(color => (
                    <button
                      key={color}
                      onClick={() => { setAccent(color); setShowAccentMenu(false); }}
                      className={`p-2 rounded-lg transition-all duration-200 border-2 ${
                        accent === color
                          ? 'border-accent-primary scale-105'
                          : 'border-transparent hover:border-surface-border'
                      }`}
                      aria-label={color}
                    >
                      <div 
                        className="w-full h-6 rounded-md"
                        style={{ backgroundColor: `var(--color-accent-primary)` }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Language */}
          <div className="relative hidden sm:block">
            <button
              onClick={() => setShowLanguageMenu(!showLanguageMenu)}
              className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors"
              aria-label="Language"
            >
              <Globe className="w-5 h-5" />
            </button>
            {showLanguageMenu && (
              <div 
                ref={langMenuRef}
                className="absolute right-0 mt-2 w-44 card animate-scale-in shadow-xl"
              >
                {languages.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => { setLanguage(lang.code); setShowLanguageMenu(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors ${
                      language === lang.code
                        ? 'bg-accent-primary-light text-accent-primary'
                        : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary'
                    }`}
                  >
                    <span>{lang.flag}</span>
                    <span>{lang.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notifications */}
          <button className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors relative" aria-label="Notifications">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-accent-danger rounded-full" />
          </button>

          {/* Quick Actions */}
          <div className="hidden lg:flex items-center gap-1 border border-surface-border rounded-xl px-1">
            <Button variant="ghost" size="sm" onClick={onNewFolder} aria-label={t('New folder')}>
              <div className="w-5 h-5 flex items-center justify-center">
                <span className="w-4 h-4" />
              </div>
            </Button>
            <Button variant="primary" size="sm" onClick={onUpload} disabled={uploading} aria-label={t('Upload files')}>
              <Upload className="w-4 h-4" />
              {!uploading && <span className="hidden sm:inline">{t('Upload')}</span>}
            </Button>
          </div>

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
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-text-primary truncate max-w-[140px]">
                  {user?.name || 'User'}
                </p>
                <p className="text-xs text-text-tertiary truncate max-w-[140px]">
                  {user?.email || 'user@example.com'}
                </p>
              </div>
              <ChevronDown className="w-4 h-4 text-text-tertiary hidden sm:block" />
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

          {/* Mobile Actions */}
          <div className="flex lg:hidden items-center gap-1">
            <Button variant="primary" size="sm" onClick={onUpload} disabled={uploading} aria-label={t('Upload files')}>
              <Upload className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onNewFolder} aria-label={t('New folder')}>
              <LayoutDashboard className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}