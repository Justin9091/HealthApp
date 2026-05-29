import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeKey = 'coral' | 'ocean' | 'forest' | 'midnight' | 'sunset';

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
    name: 'Koraal',
    primary: '#FF6B6B',
    primaryLight: '#FFF0F0',
    primaryDark: '#E04E4E',
    secondary: '#4CAF82',
    secondaryLight: '#E8F8F0',
    accent: '#F5A623',
    accentLight: '#FEF6E7',
    background: '#F2F4F7',
    surface: '#FFFFFF',
    surfaceAlt: '#F7F9FC',
    surfaceWarm: '#FAFBFD',
    text: '#111827',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',
    border: '#E5E7EB',
    borderLight: '#F3F4F6',
    gradientHero: ['#FF6B6B', '#E04E4E'],
    isDark: false,
  },
  ocean: {
    key: 'ocean',
    name: 'Oceaan',
    primary: '#2196F3',
    primaryLight: '#E3F2FD',
    primaryDark: '#1565C0',
    secondary: '#00BCD4',
    secondaryLight: '#E0F7FA',
    accent: '#FF9800',
    accentLight: '#FFF3E0',
    background: '#EEF2F7',
    surface: '#FFFFFF',
    surfaceAlt: '#F5F8FC',
    surfaceWarm: '#FAFCFF',
    text: '#0D1B2A',
    textSecondary: '#5A7184',
    textMuted: '#94A8B8',
    border: '#D9E4EE',
    borderLight: '#EEF3F8',
    gradientHero: ['#2196F3', '#1565C0'],
    isDark: false,
  },
  forest: {
    key: 'forest',
    name: 'Bos',
    primary: '#4CAF50',
    primaryLight: '#E8F5E9',
    primaryDark: '#2E7D32',
    secondary: '#8BC34A',
    secondaryLight: '#F1F8E9',
    accent: '#FF8F00',
    accentLight: '#FFF8E1',
    background: '#F1F4F0',
    surface: '#FFFFFF',
    surfaceAlt: '#F6F8F5',
    surfaceWarm: '#FAFBF9',
    text: '#1B2E1C',
    textSecondary: '#5A7259',
    textMuted: '#90A48E',
    border: '#D8E4D6',
    borderLight: '#EBF0EA',
    gradientHero: ['#4CAF50', '#2E7D32'],
    isDark: false,
  },
  midnight: {
    key: 'midnight',
    name: 'Nacht',
    primary: '#7C4DFF',
    primaryLight: '#2A1F4A',
    primaryDark: '#5B2EE8',
    secondary: '#00E5FF',
    secondaryLight: '#00263A',
    accent: '#FF6D00',
    accentLight: '#2A1500',
    background: '#0F1117',
    surface: '#1A1D2E',
    surfaceAlt: '#212438',
    surfaceWarm: '#1E2132',
    text: '#F0F2FF',
    textSecondary: '#8B93C4',
    textMuted: '#5A6090',
    border: '#2C3155',
    borderLight: '#1F2340',
    gradientHero: ['#7C4DFF', '#5B2EE8'],
    isDark: true,
  },
  sunset: {
    key: 'sunset',
    name: 'Zonsondergang',
    primary: '#FF7043',
    primaryLight: '#FBE9E7',
    primaryDark: '#E64A19',
    secondary: '#AB47BC',
    secondaryLight: '#F3E5F5',
    accent: '#FFD600',
    accentLight: '#FFFDE7',
    background: '#F5F0EE',
    surface: '#FFFFFF',
    surfaceAlt: '#FAF6F4',
    surfaceWarm: '#FDFBFA',
    text: '#1A0F0A',
    textSecondary: '#6E4B3F',
    textMuted: '#A67C6E',
    border: '#EDD9D3',
    borderLight: '#F5EBE8',
    gradientHero: ['#FF7043', '#AB47BC'],
    isDark: false,
  },
};

const STORAGE_KEY = 'app_theme';

interface ThemeContextValue {
  theme: AppTheme;
  setTheme: (key: ThemeKey) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: THEMES.coral,
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeKey, setThemeKey] = useState<ThemeKey>('coral');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(val => {
      if (val && val in THEMES) setThemeKey(val as ThemeKey);
    });
  }, []);

  const setTheme = (key: ThemeKey) => {
    setThemeKey(key);
    AsyncStorage.setItem(STORAGE_KEY, key);
  };

  return (
    <ThemeContext.Provider value={{ theme: THEMES[themeKey], setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
