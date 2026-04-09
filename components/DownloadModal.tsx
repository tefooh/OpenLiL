/**
 * OpenLiL AI — Download/Loading Modal
 * Fade-in centered modal showing model download or loading progress
 */

import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from './ThemeContext';
import { Spacing, BorderRadius } from '../constants/spacing';
import { FontFamily } from '../constants/fonts';

interface DownloadModalProps {
  visible: boolean;
  modelName: string;
  progress: number;
  status: string;
}

export default function DownloadModal({ visible, modelName, progress, status }: DownloadModalProps) {
  const { colors } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <ActivityIndicator size="large" color={colors.textPrimary} />
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {status === 'loading' ? 'Loading Model' : 'Downloading Model'}
          </Text>
          <Text style={[styles.modelName, { color: colors.textSecondary }]}>
            {modelName}
          </Text>

          {status === 'downloading' && (
            <>
              <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                <View
                  style={[
                    styles.progressFill,
                    { backgroundColor: colors.textPrimary, width: `${Math.round(progress * 100)}%` },
                  ]}
                />
              </View>
              <Text style={[styles.progressText, { color: colors.textTertiary }]}>
                {Math.round(progress * 100)}%
              </Text>
            </>
          )}

          {status === 'loading' && (
            <Text style={[styles.progressText, { color: colors.textTertiary }]}>
              Initializing…
            </Text>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 300,
    borderRadius: BorderRadius.card,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: Spacing.sm,
    fontFamily: FontFamily.primary,
  },
  modelName: {
    fontSize: 14,
    fontFamily: FontFamily.primary,
  },
  progressBar: {
    width: '100%',
    height: 4,
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: Spacing.sm,
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: FontFamily.primary,
  },
});
