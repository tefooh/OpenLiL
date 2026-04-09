# OpenLiL AI — Design Guidelines

## Philosophy

**One rule above all: If it doesn't need to be there, remove it.**

OpenLiL is an app that gets out of the way. The AI is the product. The UI is the shell. Every pixel earns its place or gets cut.

---

## Typography

| Role | Font | Weight | Size |
|---|---|---|---|
| UI Labels | SF Pro Display | 500 | 13–15pt |
| Body / Chat | SF Pro Text | 400 | 15–16pt |
| Code blocks | SF Mono | 400 | 13pt |
| Section headers | SF Pro Display | 600 | 12pt (uppercase, tracked) |
| Model name (pill) | SF Pro Text | 500 | 12pt |

- Use `-apple-system, "SF Pro Display", "SF Pro Text", BlinkMacSystemFont, sans-serif` as the font stack in React Native / CSS
- **No custom fonts loaded from network.** System font only.
- Letter-spacing for uppercase labels: `+0.06em`
- Line height for chat messages: `1.55`

---

## Color System

### Light Theme

```
Background:       #FFFFFF
Surface:          #F5F5F5
Surface Elevated: #EBEBEB
Border:           #E0E0E0
Text Primary:     #0A0A0A
Text Secondary:   #6B6B6B
Text Tertiary:    #A3A3A3
Accent:           #0A0A0A   ← same as text; monochrome accent
Destructive:      #1A1A1A
```

### Dark Theme

```
Background:       #0A0A0A
Surface:          #141414
Surface Elevated: #1E1E1E
Border:           #2A2A2A
Text Primary:     #F5F5F5
Text Secondary:   #8C8C8C
Text Tertiary:    #4A4A4A
Accent:           #F5F5F5   ← same as text; monochrome accent
Destructive:      #EBEBEB
```

> **Zero color accents.** No blues, purples, greens. Black on white / white on black. That's it. If you're tempted to add a tint color — don't.

---

## Spacing System

Base unit: `4pt`

| Token | Value |
|---|---|
| `xs` | 4pt |
| `sm` | 8pt |
| `md` | 16pt |
| `lg` | 24pt |
| `xl` | 32pt |
| `2xl` | 48pt |

Use multiples of 4. No `13pt`, no `22pt`, no odd values.

---

## Border Radius

Everything should feel rounded. No sharp corners anywhere.

| Element | Radius |
|---|---|
| Buttons (full-width) | `16pt` |
| Buttons (inline / small) | `12pt` |
| Input bar | `20pt` |
| Chat bubbles (user) | `20pt` with `4pt` on bottom-right |
| Chat bubbles (AI) | `20pt` with `4pt` on bottom-left |
| Model selector pill | `999pt` (fully rounded) |
| Cards / surfaces | `16pt` |
| Sidebar | `0pt` (full edge) |
| Modal sheets | `24pt` top corners only |
| Icons (container) | `12pt` |

---

## Shadows

**None. Zero. Do not add shadows.**

Depth is communicated through background color difference only (Surface vs Background). Never `box-shadow`, never `elevation`, never `shadowColor`.

---

## Components

### Chat Bubble — User
```
Background: Text Primary color
Text color: Background color (inverted)
Align: right
Max width: 75% of screen
Padding: 12pt 16pt
Border radius: 20pt, 4pt bottom-right
```

### Chat Bubble — AI
```
Background: Surface
Text color: Text Primary
Align: left
Max width: 88% of screen
Padding: 12pt 16pt
Border radius: 20pt, 4pt bottom-left
Markdown rendered inline
```

### Input Bar
```
Background: Surface
Border: 1pt Border color
Border radius: 20pt
Padding: 12pt 16pt
Layout: [Model Pill ▾] [Text input — flex] [Send button]
Send button: circle, 32pt, filled with Text Primary when text present, Border color when empty
```

### Model Selector Pill (inside input bar)
```
Background: Surface Elevated
Border radius: 999pt
Padding: 6pt 12pt
Text: model short-name (e.g. "Qwen 0.5B")
Chevron: ▾ 10pt, Text Secondary
Tap opens bottom sheet selector
```

### Sidebar
```
Width: 280pt
Background: Background
Right border: 1pt Border
Chat list items:
  - Padding: 12pt 16pt
  - Border radius: 12pt (inside list)
  - Active: Surface background
  - Text: Text Primary, 14pt, 1 line truncated
  - Subtext: Text Tertiary, 12pt (e.g. model used, relative time)
New Chat button: bottom of sidebar, full-width, Surface bg
```

### Navigation / Header
```
Height: 48pt (below status bar)
Title: "OpenLiL" — SF Pro Display, 600, 17pt, center
Left: hamburger (≡) or back — 24pt icon
Right: new chat icon or model info
Background: Background (no blur, no border — use spacing)
```

---

## Iconography

- Use **SF Symbols** exclusively on iOS (via `expo-symbols` or `@expo/vector-icons/Ionicons` as fallback on Android)
- Icon size: `20pt` standard, `16pt` small, `24pt` large
- Icon color: always `Text Secondary` unless interactive (then `Text Primary`)
- No icon backgrounds or containers unless required for a button

---

## Motion

Minimal. Purposeful. Never decorative.

| Interaction | Animation |
|---|---|
| Message appear | Fade in + 4pt slide up, 180ms ease-out |
| Sidebar open/close | Translate X, 220ms ease-in-out |
| Bottom sheet open | Translate Y, 260ms spring (gentle) |
| Button tap | Scale 0.96, 100ms |
| Theme switch | No animation (instant) |
| Typing indicator | 3 dots, opacity pulse 600ms staggered |

---

## Do / Don't

| ✅ Do | ❌ Don't |
|---|---|
| Use grey hierarchy for depth | Use any hue-based color |
| Round every edge aggressively | Use sharp 0pt corners anywhere |
| Use white space generously | Crowd elements together |
| Let markdown render cleanly | Style markdown with custom colors |
| Keep header minimal | Add tabs, badges, notifications |
| Label models with short names | Use full model IDs in UI |
| One font family (SF Pro) | Mix fonts |
| Flat surfaces | Shadows, gradients, blurs |

---

## Responsive / Platform Notes

- **iOS**: Use `SafeAreaView`, respect notch + home indicator
- **Android**: Use `StatusBar` with `translucent`, match background
- Input bar: always pinned above keyboard (`KeyboardAvoidingView`)
- Sidebar: gesture-driven swipe to open on both platforms
- Dark mode: auto-detect via `useColorScheme()`, override available in settings (future)
