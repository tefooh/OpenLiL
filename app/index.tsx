/**
 * OpenLiL AI — Main Chat Screen
 * 
 * KEY BEHAVIOR:
 * 1. Input bar slides up FIRST, then keyboard pops up underneath.
 * 2. Tapping background dismisses keyboard.
 * 3. Model picker uses native iOS page sheet modal.
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Platform,
  Text,
  TouchableOpacity,
  Animated,
  Pressable,
  Alert,
  Keyboard,
  KeyboardEvent,
  TouchableWithoutFeedback,
  LayoutAnimation,
  UIManager,
  Dimensions,
} from 'react-native';
import { 
  PanGestureHandler, 
  State, 
  PanGestureHandlerStateChangeEvent,
  PanGestureHandlerGestureEvent,
} from 'react-native-gesture-handler';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../components/ThemeContext';
import { Spacing } from '../constants/spacing';
import { FontFamily } from '../constants/fonts';
import ChatBubble from '../components/ChatBubble';
import InputBar from '../components/InputBar';
import ModelPicker from '../components/ModelPicker';
import DownloadModal from '../components/DownloadModal';
import TypingIndicator from '../components/TypingIndicator';
import EmptyState from '../components/EmptyState';
import Sidebar from '../components/Sidebar';
import { useChatStore, Message } from '../store/chatStore';
import { useModelStore } from '../store/modelStore';
import { runInference, stopInference, ChatMessage } from '../lib/llm';
import { ModelInfo } from '../lib/modelConfig';
import {
  processUserMessage,
  retrieveRelevantMemories,
  buildMemoryContext,
} from '../lib/memory';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const SIDEBAR_WIDTH = 280;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
// Estimated keyboard height — used for the "move up first" pre-animation
const ESTIMATED_KB_HEIGHT = 320;

export default function ChatScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const activeChatId = useChatStore((s) => s.activeChatId);
  const createChat = useChatStore((s) => s.createChat);
  const selectChat = useChatStore((s) => s.selectChat);
  const deleteChat = useChatStore((s) => s.deleteChat);
  const addMessage = useChatStore((s) => s.addMessage);
  const appendToMessage = useChatStore((s) => s.appendToMessage);
  const getActiveChat = useChatStore((s) => s.getActiveChat);
  const persist = useChatStore((s) => s.persist);

  const selectedModel = useModelStore((s) => s.selectedModel);
  const loadedModelId = useModelStore((s) => s.loadedModelId);
  const isGenerating = useModelStore((s) => s.isGenerating);
  const setGenerating = useModelStore((s) => s.setGenerating);
  const downloadStates = useModelStore((s) => s.downloadStates);
  const downloadModel = useModelStore((s) => s.downloadModel);
  const loadModel = useModelStore((s) => s.loadModel);
  const selectModel = useModelStore((s) => s.selectModel);

  const [showModelPicker, setShowModelPicker] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadingModelName, setDownloadingModelName] = useState('');
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadStatus, setDownloadStatus] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Bottom spacing state — this is what moves the input bar up/down
  const [bottomSpacing, setBottomSpacing] = useState(0);
  const [isSidebarFullyOpen, setIsSidebarFullyOpen] = useState(false);

  const flatListRef = useRef<FlatList<Message>>(null);
  
  // sidebarAnim goes from 0 to SIDEBAR_WIDTH
  const sidebarAnim = useRef(new Animated.Value(0)).current;
  const lastOffset = useRef(0);

  const activeChat = getActiveChat();
  const messages = activeChat?.messages || [];

  // Listen for actual keyboard height to refine the spacing
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = (e: KeyboardEvent) => {
      // Once we know the real height, snap to it
      setBottomSpacing(e.endCoordinates.height);
    };

    const onHide = () => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setBottomSpacing(0);
    };

    const s1 = Keyboard.addListener(showEvent, onShow);
    const s2 = Keyboard.addListener(hideEvent, onHide);
    return () => { s1.remove(); s2.remove(); };
  }, []);

  // Called when user TAPS the input — BEFORE the keyboard starts appearing
  const handleInputFocus = useCallback(() => {
    // Move up instantly with a spring animation
    LayoutAnimation.configureNext({
      duration: 200, // fast — finishes before kb appears
      create: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
      update: { type: LayoutAnimation.Types.easeInEaseOut },
    });
    setBottomSpacing(ESTIMATED_KB_HEIGHT);
  }, []);

  const openSidebar = useCallback(() => {
    Keyboard.dismiss();
    Animated.spring(sidebarAnim, {
      toValue: SIDEBAR_WIDTH,
      useNativeDriver: true,
      bounciness: 0,
    }).start(() => {
      setIsSidebarFullyOpen(true);
      lastOffset.current = SIDEBAR_WIDTH;
    });
  }, [sidebarAnim]);

  const closeSidebar = useCallback(() => {
    Animated.spring(sidebarAnim, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 0,
    }).start(() => {
      setIsSidebarFullyOpen(false);
      lastOffset.current = 0;
    });
  }, [sidebarAnim]);

  // Gesture handling
  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: sidebarAnim } }],
    { useNativeDriver: true }
  );

  const onHandlerStateChange = (event: PanGestureHandlerStateChangeEvent) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      const { translationX, velocityX } = event.nativeEvent;
      const totalTranslation = lastOffset.current + translationX;

      // Determine if we should snap open or closed
      // If velocity is high, use that. Otherwise use position.
      const shouldOpen = velocityX > 500 || (velocityX > -500 && totalTranslation > SIDEBAR_WIDTH / 2);

      if (shouldOpen) {
        openSidebar();
      } else {
        closeSidebar();
      }
    } else if (event.nativeEvent.state === State.BEGAN) {
      // Don't do anything here, Animated.event handles the live update
    }
  };

  // We need to offset the sideBarAnim because PanGestureHandler translation starts from 0 each time
  // But we want it to work with our existing offset.
  // Actually, a simpler way for Animated is to use sidebarAnim directly with an offset if needed,
  // but let's use a simpler approach: use a second animated value for the translation.
  const dragX = useRef(new Animated.Value(0)).current;
  const gestureTranslationX = useRef(new Animated.Value(0)).current;
  
  const combinedAnim = Animated.add(sidebarAnim, gestureTranslationX);
  
  // NOTE: For simplicity in this edit, I'll use the spring/timing approach for button clicks
  // and handle the gesture as a direct manipulation.
  
  const translateX = sidebarAnim.interpolate({
    inputRange: [0, SIDEBAR_WIDTH],
    outputRange: [0, SIDEBAR_WIDTH],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length, messages[messages.length - 1]?.content]);

  const handleNewChat = useCallback(() => {
    createChat(selectedModel.id);
    closeSidebar();
  }, [createChat, selectedModel.id, closeSidebar]);

  const handleSend = useCallback(
    async (text: string) => {
      let chatId = activeChatId;
      if (!chatId) {
        chatId = createChat(selectedModel.id);
      }

      if (loadedModelId !== selectedModel.id) {
        const state = downloadStates[selectedModel.id];
        if (!state || state.status === 'idle') {
          Alert.alert('Model Not Downloaded', `Download ${selectedModel.shortName} first.`);
          return;
        }
        if (state.status === 'downloaded') {
          try {
            setDownloadingModelName(selectedModel.name);
            setDownloadStatus('loading');
            setShowDownloadModal(true);
            await loadModel(selectedModel);
            setShowDownloadModal(false);
          } catch (e) {
            setShowDownloadModal(false);
            return;
          }
        }
      }

      addMessage(chatId, 'user', text);
      let assistantMessageId: string | null = null;

      // Smart Memory: extract facts from user message (async, fire-and-forget)
      processUserMessage(text).catch(() => {});

      const chat = useChatStore.getState().chats.find((c) => c.id === chatId);
      if (!chat) return;

      // Smart Memory: retrieve relevant memories for context
      let memoryContext = '';
      try {
        const relevantMemories = await retrieveRelevantMemories(text);
        memoryContext = buildMemoryContext(relevantMemories);
      } catch (e) {
        console.warn('[Memory] Failed to retrieve memories:', e);
      }

      const systemPrompt = 'You are a helpful, concise AI assistant. Respond naturally and helpfully.' + memoryContext;

      const conversationMessages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        ...chat.messages
          .filter((m) => m.content.length > 0)
          .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      ];

      setGenerating(true);
      try {
        await runInference(
          conversationMessages,
          (token) => {
            if (!assistantMessageId) {
              assistantMessageId = addMessage(chatId!, 'assistant', token);
            } else {
              appendToMessage(chatId!, assistantMessageId, token);
            }
          },
          () => { setGenerating(false); persist(); },
        );
      } catch (error) {
        setGenerating(false);
        persist();
      }
    },
    [activeChatId, createChat, selectedModel, loadedModelId, downloadStates, loadModel, addMessage, appendToMessage, setGenerating, persist],
  );

  const handleStop = useCallback(() => {
    stopInference();
    setGenerating(false);
  }, [setGenerating]);

  const handleDownloadModel = useCallback(
    async (model: ModelInfo) => {
      setShowModelPicker(false);
      setDownloadingModelName(model.name);
      setDownloadStatus('downloading');
      setDownloadProgress(0);
      setShowDownloadModal(true);
      try {
        await downloadModel(model);
        setDownloadStatus('loading');
        await loadModel(model);
        setShowDownloadModal(false);
      } catch (error) {
        setShowDownloadModal(false);
      }
    },
    [downloadModel, loadModel],
  );

  const handleSelectModel = useCallback(
    async (model: ModelInfo) => {
      setShowModelPicker(false);
      selectModel(model);
      const state = downloadStates[model.id];
      if (state?.status === 'downloaded') {
        setDownloadingModelName(model.name);
        setDownloadStatus('loading');
        setShowDownloadModal(true);
        try {
          await loadModel(model);
          setShowDownloadModal(false);
        } catch (error) {
          setShowDownloadModal(false);
        }
      }
    },
    [selectModel, downloadStates, loadModel],
  );

  const keyExtractor = useCallback((item: Message) => item.id, []);

  return (
    <PanGestureHandler
      onGestureEvent={onGestureEvent}
      onHandlerStateChange={onHandlerStateChange}
      activeOffsetX={[-20, 20]} // Allow small horizontal movement before taking over
      failOffsetY={[-20, 20]}    // Fail if moving vertically (scrolling)
    >
      <View style={[styles.outerContainer, { backgroundColor: colors.background }]}>
        <Animated.View 
          style={[
            styles.flex, 
            { 
              transform: [{ translateX }],
              flexDirection: 'row',
              width: SCREEN_WIDTH + SIDEBAR_WIDTH,
              marginLeft: -SIDEBAR_WIDTH,
            }
          ]}
        >
          {/* Sidebar */}
          <View style={[styles.sidebarContainer, { backgroundColor: colors.background }]}>
            <Sidebar
              onNewChat={handleNewChat}
              onSelectChat={(id) => { selectChat(id); closeSidebar(); }}
              onDeleteChat={(id) => {
                Alert.alert(
                  'Delete Chat',
                  'Delete this conversation?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: () => deleteChat(id) },
                  ],
                  { cancelable: true }
                );
              }}
              onClose={closeSidebar}
            />
          </View>

          {/* Main Content Area */}
          <View style={{ width: SCREEN_WIDTH, height: '100%' }}>
            <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
              {/* Header */}
              <View style={[styles.header, { backgroundColor: colors.background }]}>
                <TouchableOpacity onPress={openSidebar} activeOpacity={0.7} hitSlop={12}>
                  <Ionicons name="menu" size={26} color={colors.textPrimary} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.headerCenter}
                  onPress={() => setShowModelPicker(true)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
                    {selectedModel.shortName}
                  </Text>
                  <Ionicons name="chevron-down" size={14} color={colors.textSecondary} style={{ marginTop: 2 }} />
                </TouchableOpacity>

                <TouchableOpacity onPress={handleNewChat} activeOpacity={0.7} hitSlop={12}>
                  <Ionicons name="create-outline" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Chat area */}
              {messages.length === 0 ? (
                <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                  <View style={styles.flex}>
                    <EmptyState />
                  </View>
                </TouchableWithoutFeedback>
              ) : (
                <FlatList
                  ref={flatListRef}
                  data={messages}
                  renderItem={({ item }) => (
                    <ChatBubble
                      role={item.role}
                      content={item.content}
                      isStreaming={isGenerating && item.id === messages[messages.length - 1]?.id}
                    />
                  )}
                  keyExtractor={keyExtractor}
                  style={styles.flex}
                  contentContainerStyle={styles.messageList}
                  showsVerticalScrollIndicator={true}
                  keyboardShouldPersistTaps="handled"
                  keyboardDismissMode="interactive"
                  onScrollBeginDrag={Keyboard.dismiss}
                  ListFooterComponent={
                    isGenerating && (messages.length === 0 || messages[messages.length - 1].role === 'user') ? (
                      <TypingIndicator />
                    ) : null
                  }
                />
              )}

              {/* Input Bar */}
              <InputBar
                onSend={handleSend}
                onStop={handleStop}
                isGenerating={isGenerating}
                onFocus={handleInputFocus}
              />

              {/* Bottom spacing — this is what pushes the input bar up */}
              <View style={{ height: Math.max(0, bottomSpacing - insets.bottom) }} />
            </SafeAreaView>
          </View>
        </Animated.View>

        {/* Semi-transparent overlay when sidebar is open to capture taps and dim content */}
        <Animated.View 
          style={[
            styles.overlay, 
            { 
              opacity: translateX.interpolate({
                inputRange: [0, SIDEBAR_WIDTH],
                outputRange: [0, 1],
              }),
              pointerEvents: isSidebarFullyOpen ? 'auto' : 'none',
            }
          ]}
        >
          <Pressable style={styles.flex} onPress={closeSidebar} />
        </Animated.View>

        {/* Model Picker — uses native Modal internally */}
        <ModelPicker
          visible={showModelPicker}
          onClose={() => setShowModelPicker(false)}
          onDownload={handleDownloadModel}
          onSelect={handleSelectModel}
        />

        {/* Download / Loading Modal */}
        <DownloadModal
          visible={showDownloadModal}
          modelName={downloadingModelName}
          progress={downloadStates[selectedModel.id]?.progress || 0}
          status={downloadStates[selectedModel.id]?.status === 'downloading' ? 'downloading' : 'loading'}
        />
      </View>
    </PanGestureHandler>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: FontFamily.primary,
  },
  messageList: {
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xl,
    flexGrow: 1,
  },
  sidebarContainer: {
    width: SIDEBAR_WIDTH,
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 10,
  },
});
