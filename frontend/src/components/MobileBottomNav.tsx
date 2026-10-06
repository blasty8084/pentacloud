import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, Share2, Settings, MoreHorizontal,
  ChevronLeft, Search, Menu, X, Database
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Button } from './Button';
import { navigationConfig, useNavigationState, type NavItemId } from '../navigation/NavigationConfig';

interface MobileBottomNavProps {
  className?: string;
  onNavigate?: (path: string) => void;
}

export function MobileBottomNav({ className, onNavigate }: MobileBottomNavProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { themeMode, setThemeMode, accent, setAccent, language, setLanguage } = useTheme();
  const { isActive, navigateTo } = useNavigationState(location.pathname, null, () => {});
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement | null>(null);

  const availableNavItems = navigationConfig.filter(item => item.availability === 'available');
  const mainItems = availableNavItems.slice(0, 3);
  const moreItems = availableNavItems.slice(3);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setShowMoreMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavClick = (itemId: NavItemId) => {
    navigateTo(itemId);
    if (onNavigate) onNavigate(itemId);
    setShowMoreMenu(false);
  };

  const handleLogout = () => {
    logout();
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
          {mainItems.map((item) => {
            const active = isActive(item.id);
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`flex flex-col items-center justify-center gap-1 py-2.5 px-2 transition-colors min-h-[56px] ${
                  active
                    ? 'text-accent-primary'
                    : 'text-text-tertiary hover:text-text-primary'
                }`}
                aria-current={active ? 'page' : undefined}
                aria-label={item.label}
              >
                <span aria-hidden="true">{item.icon}</span>
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
              <MoreHorizontal className="w-6 h-6" aria-hidden="true" />
              <span className="text-xs font-medium">More</span>
            </button>
            
            {showMoreMenu && (
              <div 
                className="absolute bottom-full right-0 mb-2 w-56 card animate-scale-in shadow-xl overflow-hidden"
                role="menu"
                aria-label="More options"
              >
                <div className="p-2 border-b border-surface-border">
                  <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider px-3 py-1">More</h3>
                </div>
                <div className="py-1" role="menu">
                  {moreItems.map(item => (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors"
                      role="menuitem"
                    >
                      <span aria-hidden="true">{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  ))}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-accent-danger hover:bg-surface-secondary transition-colors"
                    role="menuitem"
                  >
                    <Settings className="w-5 h-5" aria-hidden="true" />
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