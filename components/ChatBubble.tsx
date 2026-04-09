/**
 * OpenLiL AI — Chat Bubble
 * User messages: inverted colors, right-aligned
 * AI messages: surface background, left-aligned, markdown rendered
 */

import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useTheme } from './ThemeContext';
import { Spacing, BorderRadius } from '../constants/spacing';
import { FontFamily } from '../constants/fonts';
import MarkdownMessage from './MarkdownMessage';

interface ChatBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
}

export default function ChatBubble({ role, content, isStreaming }: ChatBubbleProps) {
  const { colors } = useTheme();
  const isUser = role === 'user';
  const [copied, setCopied] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const handleCopy = async () => {
    if (!content && !isUser) return;
    await Clipboard.setStringAsync(content);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    setCopied(true);
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.delay(1500),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => setCopied(false));
  };

  return (
    <View
      style={[
        styles.container,
        isUser ? styles.userContainer : styles.aiContainer,
      ]}
    >
      <Pressable
        onLongPress={handleCopy}
        delayLongPress={400}
        style={({ pressed }) => [
          styles.bubble,
          isUser
            ? {
                backgroundColor: colors.textPrimary,
                borderBottomRightRadius: BorderRadius.chatBubbleTail,
              }
            : {
                backgroundColor: colors.surface,
                borderBottomLeftRadius: BorderRadius.chatBubbleTail,
              },
          pressed && { opacity: 0.8 },
        ]}
      >
        {isUser ? (
          <Text 
            style={[styles.userText, { color: colors.background }]}
            selectable
          >
            {content}
          </Text>
        ) : (
          <MarkdownMessage content={content} />
        )}
        {isStreaming && !content && (
          <TypingDots color={colors.textTertiary} />
        )}

        {copied && (
          <Animated.View 
            style={[
              styles.copiedBadge, 
              { 
                opacity: fadeAnim,
                backgroundColor: isUser ? colors.background : colors.textPrimary,
              }
            ]}
          >
            <Text style={[styles.copiedText, { color: isUser ? colors.textPrimary : colors.background }]}>
              Copied
            </Text>
          </Animated.View>
        )}
      </Pressable>
    </View>
  );
}

function TypingDots({ color }: { color: string }) {
  return (
    <View style={styles.dotsContainer}>
      {[0, 1, 2].map((i) => (
        <View
          key={i}
          style={[styles.dot, { backgroundColor: color, opacity: 0.5 }]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  userContainer: {
    alignItems: 'flex-end',
  },
  aiContainer: {
    alignItems: 'flex-start',
  },
  bubble: {
    borderRadius: BorderRadius.chatBubble,
    paddingVertical: 12,
    paddingHorizontal: Spacing.md,
    maxWidth: '88%',
    position: 'relative',
  },
  userText: {
    fontSize: 15,
    lineHeight: 15 * 1.55,
    fontFamily: FontFamily.primary,
  },
  copiedBadge: {
    position: 'absolute',
    top: -10,
    right: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  copiedText: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 4,
    paddingVertical: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
