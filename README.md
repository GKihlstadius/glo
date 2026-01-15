# Glo - Pick Together

A swipe-first movie decision app that helps people quickly and fairly choose what to watch.

## Core Promise
Every movie shown can actually be watched in the country you live in. No US-only Netflix results shown to EU users. No guessing. No disappointment.

## Design Philosophy
- **Invisible UI**: The movie IS the interface. Poster-first, everything else fades away.
- **No onboarding**: App launches straight into swipe. Country auto-detected from device.
- **One-time purchase**: Everything unlocked. No premium tiers, no paywalls.
- **Swedish for Sweden**: Full localization when detected.

## Features

### Quick Swipe (Default)
- Swipe right to like, left to pass, up to save for later
- Physics-based gestures with haptic feedback
- Country-accurate streaming availability
- Minimal match overlay

### Couch Mode
- Create a session and share a 6-character code
- Join with a code to swipe together
- Hidden choices revealed on match

### Spelläge / Game Mode
- Pick a mood: Calm, Fun, Intense, Short
- Filtered movie selection based on mood
- Perfect for date nights or group decisions

## Tech Stack
- Expo SDK 53 with React Native 0.76.7
- NativeWind + Tailwind CSS for styling
- React Native Reanimated for animations
- React Native Gesture Handler for swipes
- Zustand for state management
- React Query for async state

## File Structure
```
src/
├── app/
│   ├── _layout.tsx      # Root layout with navigation
│   ├── index.tsx        # Home screen (Quick Swipe)
│   ├── settings.tsx     # Settings modal
│   ├── saved.tsx        # Saved movies grid
│   ├── couch.tsx        # Couch Mode setup
│   ├── spellage.tsx     # Game Mode mood picker
│   └── session.tsx      # Active swiping session
├── components/
│   └── SwipeCard.tsx    # Main swipe card component
└── lib/
    ├── types.ts         # TypeScript interfaces
    ├── constants.ts     # App constants and config
    ├── store.ts         # Zustand store with persistence
    ├── movies.ts        # Movie data and filtering
    └── cn.ts            # ClassName utility
```

## Monetization
One-time App Store purchase. Everything unlocked.
- No subscriptions
- No ads
- No tracking

## Supported Countries
Sweden, USA, UK, Germany, France, Norway, Denmark, Finland, Netherlands, Australia, Canada
