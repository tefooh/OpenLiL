/**
 * OpenLiL AI — Sidebar
 * Chat history list. No borders/dividers anywhere.
 */

import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, ThemeMode } from './ThemeContext';
import { Spacing, BorderRadius } from '../constants/spacing';
import { FontFamily } from '../constants/fonts';
import { useChatStore, Chat } from '../store/chatStore';

const logoLight = require('../assets/logo-light.png');
const logoDark = require('../assets/logo-dark.png');

interface SidebarProps {
  onNewChat: () => void;
  onSelectChat: (chatId: string) => void;
  onDeleteChat: (chatId: string) => void;
  onClose: () => void;
}

function getRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

export default function Sidebar({
  onNewChat,
  onSelectChat,
  onDeleteChat,
  onClose,
}: SidebarProps) {
  const { colors, isDark, themeMode, setThemeMode } = useTheme();
  const chats = useChatStore((s) => s.chats);
  const activeChatId = useChatStore((s) => s.activeChatId);

  const toggleTheme = () => {
    const nextMode: ThemeMode = themeMode === 'light' ? 'dark' : (themeMode === 'dark' ? 'system' : 'light');
    setThemeMode(nextMode);
  };

  const getThemeIcon = () => {
    if (themeMode === 'light') return 'sunny' as const;
    if (themeMode === 'dark') return 'moon' as const;
    return 'phone-portrait' as const;
  };

  const getThemeText = (): string => {
    if (themeMode === 'light') return 'Light';
    if (themeMode === 'dark') return 'Dark';
    return 'System';
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header — no border */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image
            source={isDark ? logoDark : logoLight}
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            OpenLiL
          </Text>
        </View>
        <TouchableOpacity onPress={onClose} activeOpacity={0.7} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="close" size={26} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Chat List */}
      <ScrollView
        style={styles.chatList}
        contentContainerStyle={styles.chatListContent}
        showsVerticalScrollIndicator={false}
      >
        {chats.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
              No conversations yet
            </Text>
          </View>
        ) : (
          chats.map((chat) => (
            <ChatListItem
              key={chat.id}
              chat={chat}
              isActive={chat.id === activeChatId}
              colors={colors}
              onSelect={() => {
                onSelectChat(chat.id);
                // No close here so user can delete or see history easily?
                // User asked for "Why i cannot delete chats" - I'll let them pick
                onClose();
              }}
              onDelete={() => onDeleteChat(chat.id)}
            />
          ))
        )}
      </ScrollView>

      {/* Footer AREA — no border */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.themeButton} onPress={toggleTheme} activeOpacity={0.7}>
          <Ionicons name={getThemeIcon()} size={20} color={colors.textSecondary} />
          <Text style={[styles.themeText, { color: colors.textSecondary }]}>
            {getThemeText()}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.newChatButton, { backgroundColor: colors.surface }]}
          onPress={onNewChat}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={20} color={colors.textPrimary} />
          <Text style={[styles.newChatText, { color: colors.textPrimary }]}>
            New Chat
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

interface ChatListItemProps {
  chat: Chat;
  isActive: boolean;
  colors: Record<string, string>;
  onSelect: () => void;
  onDelete: () => void;
}

function ChatListItem({ chat, isActive, colors, onSelect, onDelete }: ChatListItemProps) {
  return (
    <View style={styles.chatItemOuter}>
      <TouchableOpacity
        style={[
          styles.chatItem,
          { backgroundColor: isActive ? colors.surface : 'transparent' },
        ]}
        onPress={onSelect}
        onLongPress={onDelete}
        activeOpacity={0.7}
      >
        <View style={styles.chatItemLeft}>
          <Text style={[styles.chatTitle, { color: colors.textPrimary }]} numberOfLines={1}>
            {chat.title}
          </Text>
          <Text style={[styles.chatMeta, { color: colors.textTertiary }]} numberOfLines={1}>
            {getRelativeTime(chat.updatedAt)}
          </Text>
        </View>
        
        {/* Visible trash icon only if active FOR CLEAR DELETEING */}
        {isActive && (
          <TouchableOpacity 
            onPress={onDelete} 
            style={styles.trashCircle}
            activeOpacity={0.5}
          >
            <Ionicons name="trash-outline" size={16} color={colors.textPrimary} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: 280,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 20,
    // NO border
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerLogo: {
    width: 52,   // 43 * 1.2 ≈ 51.6 -> 52
    height: 52,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800', // extra bold
    fontFamily: FontFamily.primary,
  },
  chatList: {
    flex: 1,
  },
  chatListContent: {
    padding: Spacing.sm,
  },
  chatItemOuter: {
    marginBottom: 4,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.buttonSmall,
  },
  chatItemLeft: {
    flex: 1,
  },
  chatTitle: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: FontFamily.primary,
  },
  chatMeta: {
    fontSize: 13,
    marginTop: 3,
    fontFamily: FontFamily.primary,
  },
  trashCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  emptyState: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    fontFamily: FontFamily.primary,
  },
  footer: {
    padding: Spacing.md,
    gap: Spacing.md,
    // NO border
  },
  themeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  themeText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FontFamily.primary,
  },
  newChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: 15,
    borderRadius: 999,
  },
  newChatText: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: FontFamily.primary,
  },
});
