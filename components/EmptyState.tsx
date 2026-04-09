/**
 * OpenLiL AI — Empty State
 * Solid logo positioned behind the title as a bold watermark.
 */

import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useTheme } from './ThemeContext';
import { Spacing } from '../constants/spacing';
import { FontFamily } from '../constants/fonts';

const logoLight = require('../assets/logo-light.png');
const logoDark = require('../assets/logo-dark.png');

export default function EmptyState() {
  const { colors, isDark } = useTheme();

  return (
    <View style={styles.container}>
      {/* 
        Logo — positioned behind the text. 
        "Full transparency" interpreted as full opacity / solid color, 
        making it a strong visual element behind the branding.
      */}
      <Image
        source={isDark ? logoDark : logoLight}
        style={styles.logo}
        resizeMode="contain"
      />
      
      <Text style={[styles.title, { color: colors.textPrimary }]}>
        OpenLiL
      </Text>
      <Text style={[styles.subtitle, { color: colors.textTertiary }]}>
        Your AI, on your device.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  logo: {
    position: 'absolute',
    width: 140,
    height: 140,
    opacity: 1.0,   // Full, solid presence
    zIndex: -1,     // Sits BEHIND the text
    top: '46%',
    marginTop: -75, // Moved up 5px from -70
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    fontFamily: FontFamily.primary,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    fontFamily: FontFamily.primary,
    marginTop: Spacing.xs,
  },
});
