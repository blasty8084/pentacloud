import { useTheme } from '../context/ThemeContext';
import { Globe } from 'lucide-react';

export function LanguageToggle({ currentLang, onChange }: { currentLang: 'en' | 'hi'; onChange: (lang: 'en' | 'hi') => void }) {
  const { t } = useTheme();

  return (
    <div className="relative">
      <button
        onClick={() => onChange(currentLang === 'en' ? 'hi' : 'en')}
        className="btn-ghost btn-sm flex items-center gap-1.5"
        aria-label={currentLang === 'en' ? 'Switch to Hindi' : 'Switch to English'}
      >
        <Globe className="w-4 h-4" />
        <span className="hidden sm:inline font-medium">{currentLang === 'en' ? 'EN' : 'हि'}</span>
      </button>
    </div>
  );
}