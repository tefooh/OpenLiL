/**
 * OpenLiL AI — Theme Tokens
 * Monochrome only. No hue-based colors.
 */

export const LightTheme = {
  background: '#FFFFFF',
  surface: '#F5F5F5',
  surfaceElevated: '#EBEBEB',
  border: '#E0E0E0',
  textPrimary: '#0A0A0A',
  textSecondary: '#6B6B6B',
  textTertiary: '#A3A3A3',
  accent: '#0A0A0A',
  destructive: '#1A1A1A',
};

export const DarkTheme = {
  background: '#0A0A0A',
  surface: '#141414',
  surfaceElevated: '#1E1E1E',
  border: '#2A2A2A',
  textPrimary: '#F5F5F5',
  textSecondary: '#8C8C8C',
  textTertiary: '#4A4A4A',
  accent: '#F5F5F5',
  destructive: '#EBEBEB',
};

export type ThemeColors = typeof LightTheme;

export function getTheme(scheme: 'light' | 'dark'): ThemeColors {
  return scheme === 'dark' ? DarkTheme : LightTheme;
}
