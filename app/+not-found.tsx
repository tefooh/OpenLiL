import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../components/ThemeContext';
import { Spacing, BorderRadius } from '../constants/spacing';
import { FontFamily, lexendSpacing } from '../constants/fonts';

export default function NotFoundScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>
        Page not found
      </Text>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.surface }]}
        onPress={() => router.replace('/')}
        activeOpacity={0.7}
      >
        <Text style={[styles.buttonText, { color: colors.textPrimary }]}>
          Go to chat
        </Text>
      </TouchableOpacity>
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
  title: {
    fontSize: 20,
    fontFamily: FontFamily.secondarySemiBold,
    letterSpacing: lexendSpacing(20),
    marginBottom: Spacing.lg,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.buttonFull,
  },
  buttonText: {
    fontSize: 15,
    fontFamily: FontFamily.secondaryMedium,
    letterSpacing: lexendSpacing(15),
  },
});
