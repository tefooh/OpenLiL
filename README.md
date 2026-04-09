# OpenLiL AI

**Run AI locally. No accounts. No subscriptions. No internet (after model download).**

OpenLiL is a minimal, open-source mobile app that runs small language models (< 1B parameters) entirely on your device. No servers. No tracking. No cost.

## Features

- 🧠 **100% on-device AI** — All inference runs locally via llama.cpp
- 🔒 **Zero accounts** — No login, no signup, no email
- 💰 **Zero cost** — No subscriptions, no in-app purchases
- 📡 **Offline-capable** — Works without internet after model download
- 🎨 **Minimal monochrome UI** — Clean, distraction-free interface
- 📝 **Markdown rendering** — AI responses rendered beautifully
- 💬 **Chat history** — Persisted locally on device
- 🔄 **Multiple models** — Switch between Qwen, Llama, SmolLM

## Models

| Model | Parameters | Size (Q4_K_M) |
|---|---|---|
| SmolLM2 360M Instruct | 360M | ~250 MB |
| Qwen 2.5 0.5B Instruct | 0.5B | ~400 MB |
| Qwen 2.5 1B Instruct | 1B | ~700 MB |
| Llama 3.2 1B Instruct | 1B | ~750 MB |

All models use GGUF format with Q4_K_M quantization, run via [llama.rn](https://github.com/mybigday/llama.rn).

## Tech Stack

- **Framework**: React Native (Expo SDK 52+, bare workflow)
- **Language**: TypeScript
- **AI Runtime**: llama.rn (llama.cpp bindings)
- **State**: Zustand
- **Storage**: AsyncStorage
- **Navigation**: Expo Router

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npx expo start

# Run on iOS
npx expo run:ios

# Run on Android
npx expo run:android
```

## Model Licenses

- **Qwen 2.5**: Qwen License (Apache-compatible for personal use)
- **Llama 3.2 1B**: Meta Llama 3.2 Community License
- **SmolLM2**: Apache 2.0

## License

MIT — fully open source. See [LICENSE](LICENSE).

---

*Built with ❤️ and llama.rn*
