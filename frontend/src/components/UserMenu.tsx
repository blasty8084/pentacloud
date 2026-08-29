import { useAuth } from '../context/AuthContext';
import { Menu, MenuItem, MenuTrigger } from './Menu';
import { User, LogOut, Settings } from 'lucide-react';

interface UserMenuProps {
  user: { name?: string; email: string } | null;
  onLogout: () => void;
}

export function UserMenu({ user, onLogout }: UserMenuProps) {
  const { t } = useTheme();

  const displayName = user?.name || user?.email || 'User';
  const initials = displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Menu>
      <MenuTrigger asChild>
        <button className="flex items-center gap-2 p-1 rounded-lg hover:bg-surface-secondary transition-colors">
          <div className="w-8 h-8 rounded-full bg-accent-primary-light flex items-center justify-center font-medium text-accent-primary text-sm">
            {initials}
          </div>
        </button>
      </MenuTrigger>
      <MenuItem onClick={() => {}} className="flex items-center gap-2 px-3 py-2" disabled>
        <div className="w-8 h-8 rounded-full bg-accent-primary-light flex items-center justify-center font-medium text-accent-primary text-sm">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-text-primary truncate">{displayName}</p>
          <p className="text-xs text-text-tertiary truncate">{user?.email}</p>
        </div>
      </MenuItem>
      <MenuItem className="dropdown-divider" />
      <MenuItem onClick={() => {}} className="flex items-center gap-2">
        <Settings className="w-4 h-4" />
        <span>{t('Settings')}</span>
      </MenuItem>
      <MenuItem onClick={onLogout} className="flex items-center gap-2 text-accent-danger">
        <LogOut className="w-4 h-4" />
        <span>{t('Sign Out')}</span>
      </MenuItem>
    </Menu>
  );
}