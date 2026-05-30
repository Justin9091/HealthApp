import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeKey = 'coral' | 'ocean' | 'forest' | 'midnight' | 'sunset' | 'red';

export interface AppTheme {
  key: ThemeKey;
  name: string;
  primary: string;
  primaryLight: string;
  primaryDark: string;
  secondary: string;
  secondaryLight: string;
  accent: string;
  accentLight: string;
  danger: string;
  dangerLight: string;
  background: string;
  surface: string;
  surfaceAlt: string;
  surfaceWarm: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  borderLight: string;
  gradientHero: [string, string];
  isDark: boolean;
}

export const THEMES: Record<ThemeKey, AppTheme> = {
  coral: {
    key: 'coral',
    name: 'Violet',
    primary: '#7C3AED',
    primaryLight: '#EDE9FE',
    primaryDark: '#5B21B6',
    secondary: '#059669',
    secondaryLight: '#D1FAE5',
    accent: '#F59E0B',
    accentLight: '#FEF3C7',
    danger: '#DC2626',
    dangerLight: '#FEE2E2',
    background: '#F5F3FF',
    surface: '#FFFFFF',
    surfaceAlt: '#FAF8FF',
    surfaceWarm: '#FDFCFF',
    text: '#1E1B4B',
    textSecondary: '#6D6899',
    textMuted: '#A5A3C0',
    border: '#DDD6FE',
    borderLight: '#EDE9FE',
    gradientHero: ['#7C3AED', '#5B21B6'],
    isDark: false,
  },
  ocean: {
    key: 'ocean',
    name: 'Oceaan',
    primary: '#0EA5E9',
    primaryLight: '#E0F2FE',
    primaryDark: '#0369A1',
    secondary: '#06B6D4',
    secondaryLight: '#CFFAFE',
    accent: '#F97316',
    accentLight: '#FFEDD5',
    danger: '#DC2626',
    dangerLight: '#FEE2E2',
    background: '#F0F9FF',
    surface: '#FFFFFF',
    surfaceAlt: '#F7FBFF',
    surfaceWarm: '#FAFCFF',
    text: '#0C1A2E',
    textSecondary: '#4B6B8A',
    textMuted: '#94AFC6',
    border: '#BAE6FD',
    borderLight: '#E0F2FE',
    gradientHero: ['#0EA5E9', '#0369A1'],
    isDark: false,
  },
  forest: {
    key: 'forest',
    name: 'Emerald',
    primary: '#059669',
    primaryLight: '#D1FAE5',
    primaryDark: '#047857',
    secondary: '#84CC16',
    secondaryLight: '#ECFCCB',
    accent: '#F59E0B',
    accentLight: '#FEF3C7',
    danger: '#DC2626',
    dangerLight: '#FEE2E2',
    background: '#F0FDF4',
    surface: '#FFFFFF',
    surfaceAlt: '#F7FDF9',
    surfaceWarm: '#FBFEF9',
    text: '#052E16',
    textSecondary: '#3D7A56',
    textMuted: '#86B89A',
    border: '#A7F3D0',
    borderLight: '#D1FAE5',
    gradientHero: ['#059669', '#047857'],
    isDark: false,
  },
  midnight: {
    key: 'midnight',
    name: 'Nacht',
    primary: '#818CF8',
    primaryLight: '#1E1B4B',
    primaryDark: '#6366F1',
    secondary: '#34D399',
    secondaryLight: '#064E3B',
    accent: '#FBBF24',
    accentLight: '#292524',
    danger: '#F87171',
    dangerLight: '#450A0A',
    background: '#0F0F1A',
    surface: '#1A1A2E',
    surfaceAlt: '#232340',
    surfaceWarm: '#1E1E38',
    text: '#EEF2FF',
    textSecondary: '#A5B4FC',
    textMuted: '#6366F1',
    border: '#312E81',
    borderLight: '#1E1B4B',
    gradientHero: ['#818CF8', '#6366F1'],
    isDark: true,
  },
  sunset: {
    key: 'sunset',
    name: 'Zonsondergang',
    primary: '#EC4899',
    primaryLight: '#FCE7F3',
    primaryDark: '#BE185D',
    secondary: '#F97316',
    secondaryLight: '#FFEDD5',
    accent: '#A855F7',
    accentLight: '#F3E8FF',
    danger: '#DC2626',
    dangerLight: '#FEE2E2',
    background: '#FFF1F5',
    surface: '#FFFFFF',
    surfaceAlt: '#FFF8FA',
    surfaceWarm: '#FFFBFC',
    text: '#1A0A12',
    textSecondary: '#7B3A58',
    textMuted: '#C084A0',
    border: '#FBCFE8',
    borderLight: '#FCE7F3',
    gradientHero: ['#EC4899', '#A855F7'],
    isDark: false,
  },
  red: {
    key: 'red',
    name: 'Rood',
    primary: '#EF4444',
    primaryLight: '#FEE2E2',
    primaryDark: '#B91C1C',
    secondary: '#F97316',
    secondaryLight: '#FFEDD5',
    accent: '#FBBF24',
    accentLight: '#FEF3C7',
    danger: '#DC2626',
    dangerLight: '#FEE2E2',
    background: '#FFF5F5',
    surface: '#FFFFFF',
    surfaceAlt: '#FFF8F8',
    surfaceWarm: '#FFFCFC',
    text: '#1C0606',
    textSecondary: '#7B3030',
    textMuted: '#C08080',
    border: '#FECACA',
    borderLight: '#FEE2E2',
    gradientHero: ['#EF4444', '#B91C1C'],
    isDark: false,
  },
};

// Donkere overrides per thema-key (voor light themes in dark mode)
const DARK_OVERRIDES: Record<ThemeKey, Partial<AppTheme>> = {
  coral: {
    background: '#0D0B1A', surface: '#17152B', surfaceAlt: '#1F1C36',
    surfaceWarm: '#1A1830', text: '#EEF2FF', textSecondary: '#A5A3C0',
    textMuted: '#6B6894', border: '#2E2B4A', borderLight: '#1F1C36', isDark: true,
  },
  ocean: {
    background: '#070E18', surface: '#0D1A28', surfaceAlt: '#132233',
    surfaceWarm: '#101E2E', text: '#E0F2FE', textSecondary: '#7DB4D0',
    textMuted: '#4B7A99', border: '#1A3A52', borderLight: '#0D2438', isDark: true,
  },
  forest: {
    background: '#031A0D', surface: '#072616', surfaceAlt: '#0C3020',
    surfaceWarm: '#0A2C1C', text: '#DCFCE7', textSecondary: '#6DBF8A',
    textMuted: '#3D7A56', border: '#145232', borderLight: '#0C3A24', isDark: true,
  },
  midnight: {},
  sunset: {
    background: '#180510', surface: '#240A1C', surfaceAlt: '#2E1026',
    surfaceWarm: '#280D20', text: '#FCE7F3', textSecondary: '#D08AA8',
    textMuted: '#8B4D6A', border: '#4A1A36', borderLight: '#300E26', isDark: true,
  },
  red: {
    background: '#1A0505', surface: '#270A0A', surfaceAlt: '#321010',
    surfaceWarm: '#2C0D0D', text: '#FEE2E2', textSecondary: '#D08888',
    textMuted: '#8B4A4A', border: '#4A1A1A', borderLight: '#321010', isDark: true,
  },
};

const STORAGE_KEY = 'app_theme';
const DARK_MODE_KEY = 'app_dark_mode';

interface ThemeContextValue {
  theme: AppTheme;
  themeKey: ThemeKey;
  darkMode: boolean;
  setTheme: (key: ThemeKey) => void;
  setDarkMode: (enabled: boolean) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: THEMES.coral,
  themeKey: 'coral',
  darkMode: false,
  setTheme: () => {},
  setDarkMode: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeKey, setThemeKey] = useState<ThemeKey>('coral');
  const [darkMode, setDarkModeState] = useState(false);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(STORAGE_KEY),
      AsyncStorage.getItem(DARK_MODE_KEY),
    ]).then(([savedKey, savedDark]) => {
      if (savedKey && savedKey in THEMES) setThemeKey(savedKey as ThemeKey);
      if (savedDark === 'true') setDarkModeState(true);
    });
  }, []);

  const setTheme = (key: ThemeKey) => {
    setThemeKey(key);
    AsyncStorage.setItem(STORAGE_KEY, key);
  };

  const setDarkMode = (enabled: boolean) => {
    setDarkModeState(enabled);
    AsyncStorage.setItem(DARK_MODE_KEY, String(enabled));
  };

  const theme = useMemo<AppTheme>(() => {
    const base = THEMES[themeKey];
    if (!darkMode || base.isDark) return base;
    return { ...base, ...DARK_OVERRIDES[themeKey] } as AppTheme;
  }, [themeKey, darkMode]);

  return (
    <ThemeContext.Provider value={{ theme, themeKey, darkMode, setTheme, setDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
