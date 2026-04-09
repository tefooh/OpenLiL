/**
 * OpenLiL AI — Model Picker
 * Redesigned for absolute iOS minimalism.
 * Removed handle, reduced extra padding, cleaner typography.
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from './ThemeContext';
import { Spacing, BorderRadius } from '../constants/spacing';
import { FontFamily } from '../constants/fonts';
import { MODELS, ModelInfo } from '../lib/modelConfig';
import { useModelStore } from '../store/modelStore';

interface ModelPickerProps {
  visible: boolean;
  onClose: () => void;
  onDownload: (model: ModelInfo) => void;
  onSelect: (model: ModelInfo) => void;
}

export default function ModelPicker({
  visible,
  onClose,
  onDownload,
  onSelect,
}: ModelPickerProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const selectedModelId = useModelStore((s) => s.selectedModel.id);
  const loadedModelId = useModelStore((s) => s.loadedModelId);
  const downloadStates = useModelStore((s) => s.downloadStates);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.modalContainer, { backgroundColor: colors.surface }]}>
        {/* Minimal Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Models
          </Text>
          <TouchableOpacity 
            onPress={onClose} 
            hitSlop={12} 
            style={[styles.closeBtn, { backgroundColor: colors.border }]}
          >
            <Ionicons name="close" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.list}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.sectionSubtitle, { color: colors.textTertiary }]}>
            Select a model to run locally on your device.
          </Text>

          <View style={styles.itemsWrapper}>
            {MODELS.map((model, index) => {
              const state = downloadStates[model.id] || { status: 'idle', progress: 0 };
              const isSelected = model.id === selectedModelId;
              const isLoaded = model.id === loadedModelId;

              return (
                <ModelItem
                  key={model.id}
                  model={model}
                  state={state}
                  isSelected={isSelected}
                  isLoaded={isLoaded}
                  isLast={index === MODELS.length - 1}
                  colors={colors}
                  onDownload={() => onDownload(model)}
                  onSelect={() => onSelect(model)}
                />
              );
            })}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

interface ModelItemProps {
  model: ModelInfo;
  state: any;
  isSelected: boolean;
  isLoaded: boolean;
  isLast: boolean;
  colors: Record<string, string>;
  onDownload: () => void;
  onSelect: () => void;
}

function ModelItem({
  model,
  state,
  isSelected,
  isLoaded,
  isLast,
  colors,
  onDownload,
  onSelect,
}: ModelItemProps) {
  const canSelect = state.status === 'downloaded' || state.status === 'ready';
  const isDownloading = state.status === 'downloading';
  const isLoading = state.status === 'loading';

  return (
    <View>
      <TouchableOpacity
        style={[styles.item]}
        onPress={canSelect ? onSelect : onDownload}
        disabled={isDownloading || isLoading}
        activeOpacity={0.6}
      >
        <View style={styles.itemLeft}>
          <Text style={[styles.itemName, { color: colors.textPrimary }]}>
            {model.name}
          </Text>
          <Text style={[styles.itemDetail, { color: colors.textTertiary }]}>
            {model.size} • {model.params} params
          </Text>
          
          {isDownloading && (
            <View style={styles.progressRow}>
              <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                <View
                  style={[
                    styles.progressFill,
                    { backgroundColor: colors.textPrimary, width: `${Math.round(state.progress * 100)}%` },
                  ]}
                />
              </View>
            </View>
          )}
        </View>

        <View style={styles.itemRight}>
          {isLoaded ? (
            <View style={[styles.activeDot, { backgroundColor: colors.textPrimary }]} />
          ) : isSelected && canSelect ? (
            <Ionicons name="checkmark" size={22} color={colors.textPrimary} />
          ) : state.status === 'idle' ? (
            <Ionicons name="download-outline" size={20} color={colors.textTertiary} />
          ) : (isDownloading || isLoading) ? (
            <ActivityIndicator size="small" color={colors.textPrimary} />
          ) : null}
        </View>
      </TouchableOpacity>
      {!isLast && <View style={[styles.separator, { backgroundColor: colors.border }]} />}
    </View>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    fontFamily: FontFamily.primary,
    letterSpacing: -0.5,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 24,
  },
  sectionSubtitle: {
    fontSize: 15,
    fontFamily: FontFamily.primary,
    marginBottom: 32,
    lineHeight: 22,
    opacity: 0.8,
  },
  itemsWrapper: {
    // No wrapper needed for minimalist list
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
  },
  itemLeft: {
    flex: 1,
  },
  itemName: {
    fontSize: 17,
    fontWeight: '600',
    fontFamily: FontFamily.primary,
    marginBottom: 2,
  },
  itemDetail: {
    fontSize: 14,
    fontFamily: FontFamily.primary,
  },
  itemRight: {
    marginLeft: 16,
    width: 24,
    alignItems: 'center',
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
    opacity: 0.5,
  },
  progressRow: {
    marginTop: 10,
    width: '100%',
  },
  progressBar: {
    height: 3,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
});
