/**
 * OpenLiL AI — Smooth Modal
 * Bulletproof fade/scale Modal overlay.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Pressable,
  Easing,
  Modal,
  Platform,
} from 'react-native';
import { useTheme } from './ThemeContext';
import { BorderRadius } from '../constants/spacing';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SmoothModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxHeight?: number | 'auto' | `${number}%`;
}

export default function SmoothModal({
  visible,
  onClose,
  children,
  maxHeight = '85%',
}: SmoothModalProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [shouldRender, setShouldRender] = useState(visible);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Render purely with opacity and scale so layout bounds are perfectly preserved
  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
        easing: Easing.in(Easing.cubic),
      }).start(() => setShouldRender(false));
    }
  }, [visible, fadeAnim]);

  if (!shouldRender) return null;

  return (
    <Modal
      visible={shouldRender}
      transparent
      animationType="none" // Custom React Native Animated handles it
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.backdrop,
            { opacity: fadeAnim, backgroundColor: 'rgba(0,0,0,0.5)' },
          ]}
        >
          <Pressable style={styles.flex} onPress={onClose} />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surface,
              maxHeight: maxHeight,
              // Fixed padding guarantee it never gets chopped off by bottom Android bars
              paddingBottom: Platform.OS === 'android' ? 48 : (insets.bottom > 0 ? insets.bottom + 10 : 30),
              opacity: fadeAnim,
              transform: [
                { scale: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) }
              ],
            },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  flex: {
    flex: 1,
  },
  sheet: {
    width: '100%',
    borderTopLeftRadius: BorderRadius.modalSheet,
    borderTopRightRadius: BorderRadius.modalSheet,
    overflow: 'hidden',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
    opacity: 0.5,
  },
});
