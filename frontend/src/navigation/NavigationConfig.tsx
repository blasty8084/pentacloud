import type { ReactNode } from 'react';
import { Home, Share2, Settings, Database, BarChart2 } from 'lucide-react';

export type NavItemId = 'files' | 'shared' | 'storage' | 'settings';

export interface NavItemConfig {
  id: NavItemId;
  label: string;
  icon: ReactNode;
  href: string;
  exact?: boolean;
  matchPaths?: string[];
  isProtected: boolean;
  availability: 'available' | 'unavailable';
}

export const navigationConfig: NavItemConfig[] = [
  {
    id: 'files',
    label: 'My Files',
    icon: <Home className="w-5 h-5" />,
    href: '/dashboard',
    exact: true,
    matchPaths: ['/dashboard'],
    isProtected: true,
    availability: 'available',
  },
  {
    id: 'shared',
    label: 'Shared',
    icon: <Share2 className="w-5 h-5" />,
    href: '/dashboard',
    exact: false,
    matchPaths: ['/dashboard'],
    isProtected: true,
    availability: 'available',
  },
  {
    id: 'storage',
    label: 'Storage',
    icon: <Database className="w-5 h-5" />,
    href: '/dashboard',
    exact: false,
    matchPaths: ['/dashboard'],
    isProtected: true,
    availability: 'available',
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: <Settings className="w-5 h-5" />,
    href: '/settings',
    exact: true,
    matchPaths: ['/settings'],
    isProtected: true,
    availability: 'available',
  },
];

export function useNavigationState(
  pathname: string,
  activeNav: string | null,
  setActiveNav: (id: NavItemId) => void
) {
  return {
    isActive: (itemId: NavItemId): boolean => {
      const config = navigationConfig.find(c => c.id === itemId);
      if (!config) return false;

      if (config.id === 'shared') {
        return activeNav === 'shared';
      }
      if (config.id === 'storage') {
        return activeNav === 'storage';
      }
      if (config.id === 'files') {
        return activeNav === 'files' || activeNav === null;
      }
      if (config.id === 'settings') {
        return pathname.startsWith('/settings');
      }
      return false;
    },
    navigateTo: (itemId: NavItemId) => {
      const config = navigationConfig.find(c => c.id === itemId);
      if (!config) return;

      if (config.id === 'settings') {
        window.location.href = config.href;
      } else {
        setActiveNav(config.id);
      }
    },
  };
}

export function getActiveNavFromPath(pathname: string, currentActiveNav: string | null): string {
  if (pathname.startsWith('/settings')) {
    return 'settings';
  }
  if (pathname.startsWith('/dashboard')) {
    if (currentActiveNav === 'shared' || currentActiveNav === 'storage') {
      return currentActiveNav;
    }
    return 'files';
  }
  return 'files';
}

export const navItemsByAvailability = {
  available: navigationConfig.filter(item => item.availability === 'available'),
  unavailable: navigationConfig.filter(item => item.availability === 'unavailable'),
};