# OpenLiL AI — Constraints

Hard rules. If you break these, you're building a different app.

---

## Product Constraints

### No accounts. Ever.
- No sign up screen
- No login screen
- No email, phone, OAuth, nothing
- No user ID, no device fingerprinting
- App opens → you're in the chat. Full stop.

### No subscriptions. No payments.
- No paywall
- No "Pro" tier
- No in-app purchases
- No Stripe, RevenueCat, or any payment SDK

### No internet required after model download.
- All inference runs 100% on-device
- No API calls to any AI backend (OpenAI, Anthropic, Groq, etc.)
- Network is only used to download the model file once
- After that: fully offline-capable

### No telemetry. No analytics.
- No Firebase, Mixpanel, Amplitude, Sentry, PostHog — nothing
- No crash reporting that phones home
- No usage tracking of any kind
- Users' conversations never leave the device

### No ads.
- No AdMob
- No banner ads
- No sponsored models
- No promoted anything

---

## Technical Constraints

### Models must be < 1B parameters (soft) / < 1.5B (hard)
- Default model: Qwen 2.5 0.5B — always available first
- Maximum allowed: 1B parameters (Llama 3.2 1B, Qwen 2.5 1B)
- Phi-3.5 (3.8B) is optional and clearly labeled "heavy"
- Reason: must run in real-time on a mid-range 2022+ iPhone/Android

### GGUF format only, Q4_K_M quantization
- Q4_K_M is the sweet spot: good quality, half the size of FP16
- Do not bundle Q8 or FP16 models — too large
- Use llama.rn (llama.cpp binding) for all inference

### Model files are not bundled in the app binary
- App Store limit: 4GB IPA, but we target < 50MB binary
- Models downloaded on demand to `expo-file-system` documents directory
- Models persist across app launches
- User can delete models from within the app to free storage

### React Native / Expo only
- No Flutter, no native Swift/Kotlin app, no web wrapper
- Expo bare workflow (not managed) — needed for native llama.rn module
- Expo SDK 52+
- TypeScript throughout

### No `react-native-web`
- This is a mobile-only app
- Do not add web support or responsive web breakpoints
- Don't import anything web-only

---

## Design Constraints

### Monochrome. No exceptions.
- Zero hue-based accent colors in the UI
- The only colors are: white, black, and greys
- If a PR adds `#3B82F6` or any named color that isn't a grey — reject it

### No shadows. No blur. No gradients.
- `shadowColor`, `elevation`, `box-shadow` — all banned
- No `backdrop-filter: blur`
- No linear or radial gradients in the UI layer
- Depth via background color difference only

### SF Pro font system only
- `-apple-system` / `SF Pro` stack
- No Google Fonts, no Expo Google Fonts, no custom font files
- On Android this naturally falls back to Roboto — acceptable

### Border radius minimum: 12pt
- No element in the app should have a corner radius below 12pt
- Fully rounded pills (`borderRadius: 999`) are encouraged for chips/badges

### No tabs. No bottom tab bar.
- Navigation is: sidebar (drawer) + stack within
- No `<Tabs>` navigator at any level

---

## Scope Constraints (for the 3-hour build)

### In scope — v1
- Chat interface (send/receive, streaming)
- Model selector (dropdown in input bar)
- Model downloader (progress modal)
- Chat history sidebar (persisted locally)
- Light + dark theme (auto)
- Markdown rendering in AI messages
- Stop generation button
- New chat button

### Out of scope — do not build
- Settings screen
- Onboarding / tutorial
- Search through chat history
- Voice input or output
- Image input
- Export / share chat
- Haptic feedback (nice to have, not now)
- Push notifications
- Widgets / extensions
- iPad layout optimization
- Landscape orientation support
- Any cloud feature of any kind

> If you find yourself building something not on the "In scope" list — stop. Ship the core loop first.

---

## File Size Constraints

| Asset | Limit |
|---|---|
| App binary (IPA/APK) | < 50 MB |
| App icon | Monochrome, single mark — no gradient |
| Splash screen | White (light) / Black (dark), text only |
| Bundled assets | < 5 MB total |

---

## Performance Constraints

| Metric | Target |
|---|---|
| Cold start to chat ready | < 2 seconds |
| Time to first token (model loaded) | < 500ms |
| Token generation speed | ≥ 5 tok/s on iPhone 13 / Pixel 6 |
| Memory usage (0.5B model active) | < 600 MB RAM |
| Memory usage (1B model active) | < 1.1 GB RAM |
| Model download (0.5B Q4) | ~350–450 MB |
| Model download (1B Q4) | ~650–750 MB |

---

## Legal / License Constraints

- App license: **MIT** — fully open source
- Model licenses:
  - Qwen 2.5: Qwen License (Apache-compatible for personal use)
  - Llama 3.2 1B: Meta Llama 3.2 Community License
  - SmolLM2: Apache 2.0
- Must include model license acknowledgment in README
- Must not claim ownership over model weights
- App name "OpenLiL AI" — do not use any model vendor branding in the app name or icon

---

## What Makes This App OpenLiL and Not Something Else

1. It runs locally. If inference goes to a server, it's not OpenLiL.
2. It's free. If anything costs money, it's not OpenLiL.
3. It's minimal. If the UI is complex, it's not OpenLiL.
4. It's open. The code is MIT. No proprietary layers.

That's the whole thing.
