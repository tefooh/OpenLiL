# OpenLiL AI — Build Plan
**Target: 3-hour vibe-code sprint**

---

## What We're Building

A React Native (Expo) mobile app that:
- Runs **small AI models locally** on-device (< 1B parameters)
- Has a clean chat interface with **markdown rendering**
- Lets users **switch models** from a dropdown in the input bar
- Has a **chat history sidebar**
- Works on **iOS and Android**
- Requires **zero sign-up, zero API keys, zero subscription**

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Expo SDK 52+ (bare workflow)** | Best native + cross-platform DX |
| Language | **TypeScript** | Catch bugs fast in a sprint |
| On-device AI | **llama.rn** (`react-native-llama`) | Runs GGUF models natively via llama.cpp |
| Markdown | **react-native-marked** or **react-native-markdown-display** | Renders AI output cleanly |
| Storage | **AsyncStorage** (chat history) | Simple, no setup |
| State | **Zustand** | Minimal boilerplate |
| Navigation | **Expo Router v3** | File-based, fast |
| Gestures | **react-native-gesture-handler** | Sidebar swipe |

---

## Models to Bundle / Download

All models are **< 1B parameters**, **GGUF format**, run via llama.rn.

| Model | Params | Source | Notes |
|---|---|---|---|
| **Qwen 2.5 0.5B Instruct** (Q4_K_M) | 0.5B | Alibaba / HuggingFace | Fastest, smallest — default |
| **Qwen 2.5 1B Instruct** (Q4_K_M) | 1B | Alibaba / HuggingFace | Better quality |
| **SmolLM2 360M Instruct** (Q4_K_M) | 360M | HuggingFace | Ultra-light |
| **Llama 3.2 1B Instruct** (Q4_K_M) | 1B | Meta / HuggingFace | Best reasoning at 1B |
| **Phi-3.5 Mini** (Q4_K_M) | ~3.8B | Microsoft | Optional — heavier but smarter |

> **Strategy**: Don't bundle models in the app binary (too large for App Store). Download on first use from HuggingFace CDN or a self-hosted R2 bucket. Cache locally in `expo-file-system` documents directory.

---

## App Structure

```
app/
├── (drawer)/
│   ├── _layout.tsx          ← Drawer navigator (sidebar)
│   └── index.tsx            ← Main chat screen
├── _layout.tsx              ← Root layout, theme provider
└── +not-found.tsx

components/
├── ChatBubble.tsx           ← User + AI message bubbles
├── InputBar.tsx             ← Text input + model picker + send
├── ModelPicker.tsx          ← Bottom sheet model selector
├── Sidebar.tsx              ← Chat history list
├── TypingIndicator.tsx      ← 3-dot animation
├── MarkdownMessage.tsx      ← Renders AI markdown output
└── DownloadModal.tsx        ← Model download progress

store/
├── chatStore.ts             ← Zustand: messages, active chat
└── modelStore.ts            ← Zustand: selected model, loaded models

lib/
├── llm.ts                   ← llama.rn wrapper (load, infer, stop)
├── modelConfig.ts           ← Model list, URLs, metadata
└── storage.ts               ← AsyncStorage helpers

constants/
├── theme.ts                 ← Light/dark color tokens
└── spacing.ts               ← Spacing scale
```

---

## Hour-by-Hour Sprint Plan

### Hour 1 — Foundation (0:00–1:00)

**Goal: App runs, theme works, navigation works**

- [ ] `npx create-expo-app openlil --template expo-template-blank-typescript`
- [ ] Install dependencies:
  ```bash
  npx expo install expo-router react-native-gesture-handler react-native-reanimated
  npx expo install @react-native-async-storage/async-storage expo-file-system
  npm install zustand react-native-markdown-display
  npm install llama.rn   # or react-native-llama.cpp
  ```
- [ ] Set up `constants/theme.ts` — full light/dark token system
- [ ] Set up `constants/spacing.ts`
- [ ] Build `app/_layout.tsx` with `useColorScheme` theme provider
- [ ] Build skeleton `Sidebar.tsx` (static list, no data yet)
- [ ] Build skeleton `InputBar.tsx` (no logic, just UI)
- [ ] Build `ChatBubble.tsx` (user + AI variants)
- [ ] Get drawer/sidebar navigation working

**Checkpoint**: App opens, sidebar swipes, chat bubbles render statically ✓

---

### Hour 2 — AI Integration (1:00–2:00)

**Goal: Models download and run on device**

- [ ] Build `lib/modelConfig.ts`:
  ```ts
  export const MODELS = [
    { id: 'qwen-0.5b', name: 'Qwen 0.5B', shortName: 'Qwen 0.5B', url: '...', size: '400MB' },
    { id: 'qwen-1b',   name: 'Qwen 1B',   shortName: 'Qwen 1B',   url: '...', size: '700MB' },
    { id: 'smollm-360m', ... },
    { id: 'llama-1b', ... },
  ]
  ```
- [ ] Build `lib/llm.ts`:
  - `downloadModel(model)` — expo-file-system download with progress
  - `loadModel(modelPath)` — llama.rn init
  - `runInference(prompt, onToken)` — streaming token callback
  - `stopInference()` — cancel generation
- [ ] Build `store/modelStore.ts` — selected model, download state, loaded instance
- [ ] Build `DownloadModal.tsx` — progress bar, model info, no blur/shadows
- [ ] Wire `ModelPicker.tsx` bottom sheet — list of models, download status badges
- [ ] Connect `InputBar.tsx` send → `llm.ts` → stream tokens into chat bubble
- [ ] Build `TypingIndicator.tsx` — show while model is loading/generating

**Checkpoint**: Type a message, model runs, streaming tokens appear in chat ✓

---

### Hour 3 — Polish + Chat History (2:00–3:00)

**Goal: Full app loop, feels finished**

- [ ] Build `store/chatStore.ts`:
  - Multiple conversations
  - `createChat()`, `addMessage()`, `selectChat()`, `deleteChat()`
- [ ] Wire `Sidebar.tsx` to real chat history from Zustand + AsyncStorage
- [ ] Persist chats to AsyncStorage on every message
- [ ] Load chats from AsyncStorage on app start
- [ ] Build `MarkdownMessage.tsx` — style markdown tokens with theme colors
- [ ] Add "New Chat" button to sidebar bottom
- [ ] Add stop generation button (×) in input bar while generating
- [ ] Auto-scroll to bottom on new message
- [ ] Empty state for new chat ("Choose a model and start chatting")
- [ ] Model not downloaded state — show download prompt inline
- [ ] Test on iOS Simulator + Android Emulator
- [ ] Fix any layout/keyboard issues

**Checkpoint**: Full loop — create chat, pick model, send message, history persists, sidebar works ✓

---

## Key Implementation Details

### Streaming Tokens
```ts
// lib/llm.ts
await context.completion({ 
  messages: conversationHistory,
  n_predict: 512,
}, (data) => {
  // data.token is each new token
  onToken(data.token)
  if (data.stop) onComplete()
})
```

### Model Storage Path
```ts
import * as FileSystem from 'expo-file-system'
const modelDir = `${FileSystem.documentDirectory}models/`
const modelPath = `${modelDir}${model.id}.gguf`
```

### Chat Prompt Format (Qwen / LLaMA instruct)
```ts
// Use ChatML format for Qwen
const prompt = messages.map(m => 
  `<|im_start|>${m.role}\n${m.content}<|im_end|>`
).join('\n') + '\n<|im_start|>assistant\n'
```

### Zustand Store Pattern
```ts
// Keep it flat, no nested reducers
const useChatStore = create(persist((set, get) => ({
  chats: [] as Chat[],
  activeChatId: null as string | null,
  addMessage: (chatId, message) => set(state => ({ ... })),
}), { name: 'chats', storage: createJSONStorage(() => AsyncStorage) }))
```

---

## What's NOT in v1 (intentionally cut)

- ❌ User accounts / auth
- ❌ Cloud sync
- ❌ Settings screen (dark mode is auto)
- ❌ Image input (vision models)
- ❌ Voice input
- ❌ Share / export chat
- ❌ Search in history
- ❌ Phi-3.5 (too large for first launch)
- ❌ In-app model store browsing (just the curated list)

All of these are **v2**. Ship the core loop first.

---

## Open Source Notes

- License: **MIT**
- README should include: model sources, llama.rn attribution, build instructions
- Models are downloaded from HuggingFace — users must accept HF model licenses
- No telemetry, no analytics, no tracking of any kind

---

## Repo Structure

```
openlil/
├── app/
├── components/
├── store/
├── lib/
├── constants/
├── assets/
│   └── icon.png            ← Monochrome "OL" mark
├── DESIGN_GUIDELINES.md
├── PLAN.md
├── CONSTRAINTS.md
├── README.md
└── package.json
```
