import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeId, ThemeOption } from '../types';

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'light',
    name: 'Light (Default)',
    description: 'Clean high-contrast corporate light layout with slate and indigo accents.',
    isDark: false,
    accentLabel: 'Indigo / Slate',
    bgHex: '#f8fafc',
    surfaceHex: '#ffffff',
    accentHex: '#4f46e5',
    secondaryAccentHex: '#0284c7',
    textHex: '#0f172a',
  },
  {
    id: 'dracula',
    name: 'Dracula',
    description: 'A dark theme with vibrant purple and pink accents.',
    isDark: true,
    accentLabel: 'Vibrant Purple & Pink',
    bgHex: '#282a36',
    surfaceHex: '#44475a',
    accentHex: '#bd93f9',
    secondaryAccentHex: '#ff79c6',
    textHex: '#f8f8f2',
  },
  {
    id: 'one-dark-pro',
    name: 'One Dark Pro',
    description: "A classic dark gray theme based on Atom's default dark design.",
    isDark: true,
    accentLabel: 'Classic Gray & Cyan',
    bgHex: '#282c34',
    surfaceHex: '#21252b',
    accentHex: '#61afef',
    secondaryAccentHex: '#98c379',
    textHex: '#abb2bf',
  },
  {
    id: 'nord',
    name: 'Nord',
    description: 'An arctic, north-bluish clean color palette.',
    isDark: true,
    accentLabel: 'Arctic Ice Blue & Frost',
    bgHex: '#2e3440',
    surfaceHex: '#3b4252',
    accentHex: '#88c0d0',
    secondaryAccentHex: '#81a1c1',
    textHex: '#eceff4',
  },
  {
    id: 'tokyo-night',
    name: 'Tokyo Night',
    description: 'A dark theme celebrating the lights of Tokyo at night with deep blues and purples.',
    isDark: true,
    accentLabel: 'Deep Blue & Neon Violet',
    bgHex: '#1a1b26',
    surfaceHex: '#24283b',
    accentHex: '#7aa2f7',
    secondaryAccentHex: '#bb9af7',
    textHex: '#c0caf5',
  },
  {
    id: 'monokai-pro',
    name: 'Monokai Pro',
    description: 'A refined, high-contrast dark theme with sharp, vivid syntax highlighting.',
    isDark: true,
    accentLabel: 'Vivid Yellow & Hot Pink',
    bgHex: '#2d2a2e',
    surfaceHex: '#403e41',
    accentHex: '#ffd866',
    secondaryAccentHex: '#ff6188',
    textHex: '#fcfcfa',
  },
  {
    id: 'gruvbox',
    name: 'Gruvbox',
    description: 'A retro groove color scheme with warm, earthy tones.',
    isDark: true,
    accentLabel: 'Warm Earthy Orange & Gold',
    bgHex: '#282828',
    surfaceHex: '#3c3836',
    accentHex: '#fe8019',
    secondaryAccentHex: '#fabd2f',
    textHex: '#ebdbb2',
  },
  {
    id: 'catppuccin',
    name: 'Catppuccin',
    description: 'A soothing pastel-based dark theme.',
    isDark: true,
    accentLabel: 'Soothing Pastel Mauve & Pink',
    bgHex: '#1e1e2e',
    surfaceHex: '#313244',
    accentHex: '#cba6f7',
    secondaryAccentHex: '#f5c2e7',
    textHex: '#cdd6f4',
  },
];

interface ThemeContextType {
  theme: ThemeId;
  currentThemeOption: ThemeOption;
  setTheme: (theme: ThemeId) => void;
  themes: ThemeOption[];
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'single_digits_app_theme';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeId>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && THEME_OPTIONS.some(t => t.id === saved)) {
        return saved as ThemeId;
      }
    } catch {
      // fallback
    }
    return 'light';
  });

  const currentThemeOption = THEME_OPTIONS.find(t => t.id === theme) || THEME_OPTIONS[0];

  const setTheme = (newTheme: ThemeId) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(STORAGE_KEY, newTheme);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    if (currentThemeOption.isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme, currentThemeOption.isDark]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        currentThemeOption,
        setTheme,
        themes: THEME_OPTIONS,
        isDark: currentThemeOption.isDark,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
