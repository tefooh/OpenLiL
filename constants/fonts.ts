/**
 * OpenLiL AI — Font System
 *
 * Primary: SF Pro (system font) — UI labels, body text, chat
 * Secondary: Lexend Deca — titles, branding, section headers
 *   → uses -20% letter spacing (negative tracking)
 *
 * On Android, SF Pro falls back to Roboto (system default).
 */

import { Platform } from 'react-native';

// Primary font — system SF Pro
export const FontFamily = {
  primary: Platform.select({
    ios: '-apple-system',
    android: 'Roboto',
    default: '-apple-system',
  }) as string,
  // Secondary — Lexend Deca (loaded via expo-font)
  secondary: 'LexendDeca_400Regular',
  secondaryMedium: 'LexendDeca_500Medium',
  secondarySemiBold: 'LexendDeca_600SemiBold',
  secondaryBold: 'LexendDeca_700Bold',
  // Mono — for code blocks
  mono: Platform.select({
    ios: 'SF Mono',
    android: 'monospace',
    default: 'monospace',
  }) as string,
};

/**
 * Lexend Deca letter spacing: -10% of font size
 * Use this helper to compute the letter spacing for any given fontSize
 */
export function lexendSpacing(fontSize: number): number {
  return fontSize * -0.05;
}
