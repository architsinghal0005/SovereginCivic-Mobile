import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const lightTheme = {
  primary: '#0072B2',
  primaryHover: '#005A8D',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  text: '#0F172A',
  textSecondary: '#64748B',
  border: '#E2E8F0',
  error: '#D55E00',
  errorBackground: '#FFF0E6',
  success: '#009E73',
  warning: '#E69F00',
  warningBackground: '#FFF9E6',
  disabled: '#94A3B8',
  disabledBackground: '#F1F5F9',
  cardShadow: '#0F172A',
};

export const darkTheme = {
  primary: '#38BDF8', // Lighter blue for dark mode
  primaryHover: '#0EA5E9',
  background: '#0F172A',
  surface: '#1E293B',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  border: '#334155',
  error: '#F87171',
  errorBackground: '#451A1A',
  success: '#34D399',
  warning: '#FBBF24',
  warningBackground: '#45350F',
  disabled: '#475569',
  disabledBackground: '#1E293B',
  cardShadow: '#000000',
};

export type ThemeColors = typeof lightTheme;

interface ThemeContextType {
  isDark: boolean;
  colors: ThemeColors;
  toggleTheme: () => void;
  setTheme: (mode: 'light' | 'dark' | 'system') => void;
  themeMode: 'light' | 'dark' | 'system';
}

const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  colors: lightTheme,
  toggleTheme: () => {},
  setTheme: () => {},
  themeMode: 'system',
});

const THEME_STORAGE_KEY = '@app_theme_mode';

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<'light' | 'dark' | 'system'>('system');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (storedTheme === 'light' || storedTheme === 'dark' || storedTheme === 'system') {
          setThemeModeState(storedTheme);
        }
      } catch (e) {
        console.error('Failed to load theme preference', e);
      } finally {
        setIsReady(true);
      }
    };
    loadTheme();
  }, []);

  const setTheme = async (mode: 'light' | 'dark' | 'system') => {
    setThemeModeState(mode);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (e) {
      console.error('Failed to save theme preference', e);
    }
  };

  const toggleTheme = () => {
    const newMode = isDark ? 'light' : 'dark';
    setTheme(newMode);
  };

  const isDark = themeMode === 'system' ? systemColorScheme === 'dark' : themeMode === 'dark';
  const colors = isDark ? darkTheme : lightTheme;

  if (!isReady) return null; // Or a loading spinner

  return (
    <ThemeContext.Provider value={{ isDark, colors, toggleTheme, setTheme, themeMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
