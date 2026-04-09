/**
 * OpenLiL AI — AsyncStorage Helpers
 * Persist and load chat history locally.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const CHATS_KEY = '@openlil:chats';

export async function saveChats(chats: unknown): Promise<void> {
  try {
    const json = JSON.stringify(chats);
    await AsyncStorage.setItem(CHATS_KEY, json);
  } catch (e) {
    console.error('Failed to save chats:', e);
  }
}

export async function loadChats<T>(): Promise<T | null> {
  try {
    const json = await AsyncStorage.getItem(CHATS_KEY);
    if (json) {
      return JSON.parse(json) as T;
    }
    return null;
  } catch (e) {
    console.error('Failed to load chats:', e);
    return null;
  }
}

export async function clearChats(): Promise<void> {
  try {
    await AsyncStorage.removeItem(CHATS_KEY);
  } catch (e) {
    console.error('Failed to clear chats:', e);
  }
}
