/**
 * OpenLiL AI — Root Layout
 * Theme provider + font loading + splash screen + global slot
 */

import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Slot } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, LexendDeca_400Regular, LexendDeca_500Medium, LexendDeca_600SemiBold, LexendDeca_700Bold } from '@expo-google-fonts/lexend-deca';
import { ThemeProvider, useTheme } from '../components/ThemeContext';
import { useChatStore } from '../store/chatStore';
import { useModelStore } from '../store/modelStore';

// Keep splashscreen visible while we load data + fonts
SplashScreen.preventAutoHideAsync();

function RootContent() {
  const { isDark } = useTheme();
  const hydrate = useChatStore((s) => s.hydrate);
  const isHydrated = useChatStore((s) => s.isHydrated);
  const checkDownloadStates = useModelStore((s) => s.checkDownloadStates);

  const [fontsLoaded] = useFonts({
    LexendDeca_400Regular,
    LexendDeca_500Medium,
    LexendDeca_600SemiBold,
    LexendDeca_700Bold,
  });

  useEffect(() => {
    hydrate();
    checkDownloadStates();
  }, [hydrate, checkDownloadStates]);

  useEffect(() => {
    if (isHydrated && fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [isHydrated, fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={styles.root}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Slot />
    </View>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <ThemeProvider>
        <RootContent />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
