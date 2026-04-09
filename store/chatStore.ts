/**
 * OpenLiL AI — Chat Store
 * Manages: conversations, messages, active chat, persistence
 */

import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { saveChats, loadChats } from '../lib/storage';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface Chat {
  id: string;
  title: string;
  modelId: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

interface ChatState {
  chats: Chat[];
  activeChatId: string | null;
  isHydrated: boolean;

  // Actions
  hydrate: () => Promise<void>;
  createChat: (modelId: string) => string;
  selectChat: (chatId: string) => void;
  deleteChat: (chatId: string) => void;
  addMessage: (chatId: string, role: 'user' | 'assistant', content: string) => string;
  updateMessage: (chatId: string, messageId: string, content: string) => void;
  appendToMessage: (chatId: string, messageId: string, token: string) => void;
  getActiveChat: () => Chat | undefined;
  persist: () => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  chats: [],
  activeChatId: null,
  isHydrated: false,

  hydrate: async () => {
    const data = await loadChats<{ chats: Chat[]; activeChatId: string | null }>();
    if (data) {
      set({
        chats: data.chats || [],
        activeChatId: data.activeChatId,
        isHydrated: true,
      });
    } else {
      set({ isHydrated: true });
    }
  },

  createChat: (modelId) => {
    const id = uuidv4();
    const now = Date.now();
    const newChat: Chat = {
      id,
      title: 'New Chat',
      modelId,
      messages: [],
      createdAt: now,
      updatedAt: now,
    };

    set((state) => ({
      chats: [newChat, ...state.chats],
      activeChatId: id,
    }));

    get().persist();
    return id;
  },

  selectChat: (chatId) => {
    set({ activeChatId: chatId });
    get().persist();
  },

  deleteChat: (chatId) => {
    set((state) => {
      const chats = state.chats.filter((c) => c.id !== chatId);
      const activeChatId =
        state.activeChatId === chatId
          ? chats.length > 0
            ? chats[0].id
            : null
          : state.activeChatId;
      return { chats, activeChatId };
    });
    get().persist();
  },

  addMessage: (chatId, role, content) => {
    const messageId = uuidv4();
    const message: Message = {
      id: messageId,
      role,
      content,
      timestamp: Date.now(),
    };

    set((state) => ({
      chats: state.chats.map((chat) => {
        if (chat.id !== chatId) return chat;

        // Auto-title from first user message
        const title =
          chat.messages.length === 0 && role === 'user'
            ? content.slice(0, 40) + (content.length > 40 ? '…' : '')
            : chat.title;

        return {
          ...chat,
          title,
          messages: [...chat.messages, message],
          updatedAt: Date.now(),
        };
      }),
    }));

    get().persist();
    return messageId;
  },

  updateMessage: (chatId, messageId, content) => {
    set((state) => ({
      chats: state.chats.map((chat) => {
        if (chat.id !== chatId) return chat;
        return {
          ...chat,
          messages: chat.messages.map((m) =>
            m.id === messageId ? { ...m, content } : m,
          ),
          updatedAt: Date.now(),
        };
      }),
    }));
  },

  appendToMessage: (chatId, messageId, token) => {
    set((state) => ({
      chats: state.chats.map((chat) => {
        if (chat.id !== chatId) return chat;
        return {
          ...chat,
          messages: chat.messages.map((m) =>
            m.id === messageId ? { ...m, content: m.content + token } : m,
          ),
          updatedAt: Date.now(),
        };
      }),
    }));
  },

  getActiveChat: () => {
    const { chats, activeChatId } = get();
    return chats.find((c) => c.id === activeChatId);
  },

  persist: async () => {
    const { chats, activeChatId } = get();
    await saveChats({ chats, activeChatId });
  },
}));
