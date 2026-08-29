import { useTheme } from '../context/ThemeContext';
import { Menu, MenuItem, MenuTrigger } from './Menu';
import { Palette } from 'lucide-react';
import { accentOptions, type AccentKey } from '../design/tokens';

export function AccentSelector({ currentAccent, onChange }: { currentAccent: AccentKey; onChange: (accent: AccentKey) => void }) {
  const { t } = useTheme();

  return (
    <Menu>
      <MenuTrigger asChild>
        <button className="btn-ghost btn-sm flex items-center gap-1.5" aria-label={t('Change accent color')}>
          <Palette className="w-4 h-4" />
        </button>
      </MenuTrigger>
      {Object.entries(accentOptions).map(([key, option]) => (
        <MenuItem
          key={key}
          onClick={() => onChange(key as AccentKey)}
          className={`flex items-center gap-2 ${currentAccent === key ? 'text-accent-primary font-medium' : ''}`}
        >
          <div
            className="w-3 h-3 rounded-full border border-surface-border"
            style={{ backgroundColor: option.primary }}
          />
          <span>{option.name}</span>
          {currentAccent === key && <span className="ml-auto text-accent-primary">✓</span>}
        </MenuItem>
      ))}
    </Menu>
  );
}