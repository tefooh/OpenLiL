/**
 * OpenLiL AI — Input Bar
 * 100% perfectly centered input placeholder, regardless of font metric differences across OS.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from './ThemeContext';
import { Spacing, BorderRadius } from '../constants/spacing';
import { FontFamily } from '../constants/fonts';

interface InputBarProps {
  onSend: (text: string) => void;
  onStop: () => void;
  isGenerating: boolean;
  onFocus?: () => void;
}

export default function InputBar({ onSend, onStop, isGenerating, onFocus }: InputBarProps) {
  const { colors } = useTheme();
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || isSending || isGenerating) return;
    setIsSending(true);
    onSend(trimmed);
    setText('');
    // Short delay to prevent double-press while index.tsx is processing
    setTimeout(() => setIsSending(false), 500);
  }, [text, onSend, isSending, isGenerating]);

  const hasText = text.trim().length > 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.inputRow,
          { backgroundColor: colors.surface },
        ]}
      >
        <TextInput
          style={[styles.textInput, { color: colors.textPrimary }]}
          placeholder="Message"
          placeholderTextColor={colors.textTertiary}
          value={text}
          onChangeText={setText}
          multiline
          maxLength={4096}
          editable={!isGenerating}
          onFocus={onFocus}
          // The critical properties for perfect vertical centering in RN text inputs:
          textAlignVertical="center"
        />

        {isGenerating ? (
          <TouchableOpacity
            onPress={onStop}
            style={[styles.sendButton, { backgroundColor: colors.textPrimary }]}
            activeOpacity={0.7}
          >
            <Ionicons name="stop" size={16} color={colors.background} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handleSend}
            style={[
              styles.sendButton,
              { backgroundColor: hasText && !isSending ? colors.textPrimary : colors.border },
            ]}
            activeOpacity={0.7}
            disabled={!hasText || isSending}
          >
            <Ionicons name="arrow-up" size={18} color={colors.background} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',        // Vertically center everything in the row
    justifyContent: 'center',
    borderRadius: BorderRadius.inputBar,
    paddingLeft: Spacing.md,
    paddingRight: 6,
    minHeight: 48,               // Nice solid minimum height
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: FontFamily.primary,
    textAlignVertical: 'center', // Essential for Android
    // Completely explicit paddings to override native metric weirdness:
    paddingTop: Platform.OS === 'ios' ? 12 : 8,
    paddingBottom: Platform.OS === 'ios' ? 12 : 8,
    maxHeight: 120,              // limit height if it grows too big
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
