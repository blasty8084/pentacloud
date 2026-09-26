import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { defaultAccent, type AccentKey, type Language, t } from '../design/tokens';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  accent: AccentKey;
  setAccent: (accent: AccentKey) => void;
  language: Language;
  setLanguage: (language: Language) => void;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  resolvedTheme: 'light' | 'dark';
  t: (key: string) => string;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [accent, setAccent] = useState<AccentKey>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('pentacloud-accent') as AccentKey) || defaultAccent;
    }
    return defaultAccent;
  });

  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('pentacloud-lang') as Language) || 'en';
    }
    return 'en';
  });

  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('pentacloud-theme') as ThemeMode) || 'system';
    }
    return 'system';
  });

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark');

  // Handle system theme detection
  useEffect(() => {
    const updateResolvedTheme = () => {
      if (themeMode === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setResolvedTheme(prefersDark ? 'dark' : 'light');
      } else {
        setResolvedTheme(themeMode);
      }
    };

    updateResolvedTheme();

    if (themeMode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', updateResolvedTheme);
      return () => mediaQuery.removeEventListener('change', updateResolvedTheme);
    }
  }, [themeMode]);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', resolvedTheme);
    
    const accentOptions = {
      blue: { primary: '#3B82F6', primaryHover: '#2563EB', primaryLight: '#1E3A5F' },
      emerald: { primary: '#10B981', primaryHover: '#059669', primaryLight: '#064E3B' },
      violet: { primary: '#8B5CF6', primaryHover: '#7C3AED', primaryLight: '#3B0764' },
      amber: { primary: '#F59E0B', primaryHover: '#D97706', primaryLight: '#78350F' },
      rose: { primary: '#F43F5E', primaryHover: '#E11D48', primaryLight: '#881337' },
      cyan: { primary: '#06B6D4', primaryHover: '#0891B2', primaryLight: '#164E63' },
    };
    const colors = accentOptions[accent];
    root.style.setProperty('--color-accent-primary', colors.primary);
    root.style.setProperty('--color-accent-primary-hover', colors.primaryHover);
    root.style.setProperty('--color-accent-primary-light', colors.primaryLight);
    localStorage.setItem('pentacloud-accent', accent);
  }, [accent, resolvedTheme]);

  useEffect(() => {
    localStorage.setItem('pentacloud-lang', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('pentacloud-theme', themeMode);
  }, [themeMode]);

  const translate = useCallback((key: string) => t(key, language), [language]);

  return (
    <ThemeContext.Provider value={{ 
      accent, setAccent, 
      language, setLanguage, 
      themeMode, setThemeMode,
      resolvedTheme,
      t: translate 
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}