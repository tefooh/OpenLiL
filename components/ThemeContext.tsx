/**
 * OpenLiL AI — Theme Context
 * Provides theme colors based on system or user preference
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTheme, ThemeColors } from '../constants/theme';

export type ThemeMode = 'system' | 'light' | 'dark';

interface ThemeContextType {
  colors: ThemeColors;
  isDark: boolean;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  colors: getTheme('light'),
  isDark: false,
  themeMode: 'light',
  setThemeMode: () => {},
});

const THEME_STORAGE_KEY = '@openlil_theme_preference';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const scheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('light'); // Default to light
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function loadTheme() {
      try {
        const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (stored === 'light' || stored === 'dark' || stored === 'system') {
          setThemeModeState(stored as ThemeMode);
        }
      } catch (e) {
        // silently fallback
      } finally {
        setIsReady(true);
      }
    }
    loadTheme();
  }, []);

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (e) {
      // ignore
    }
  };

  const activeIsDark =
    themeMode === 'system' ? scheme === 'dark' : themeMode === 'dark';

  const colors = getTheme(activeIsDark ? 'dark' : 'light');

  if (!isReady) {
    return null; // hide until theme is loaded to prevent flash
  }

  return (
    <ThemeContext.Provider value={{ colors, isDark: activeIsDark, themeMode, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  return useContext(ThemeContext);
}
