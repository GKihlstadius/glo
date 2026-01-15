# Glo - Pick Together

A swipe-first movie decision app that helps people quickly and fairly choose what to watch.

## Core Promise
Every movie shown can actually be watched in the country you live in. No US-only Netflix results shown to EU users. No guessing. No disappointment.

## Features

### Quick Swipe (Default)
- Swipe right to like, left to pass, up to save for later
- Physics-based gestures with haptic feedback
- Country-accurate streaming availability
- One match ends the session

### Couch Mode (Premium)
- Create a session and share a 6-character code
- Multiple participants swipe independently
- Hidden choices revealed on match
- Real-time participant joining

### Spelläge / Game Mode (Premium)
- Mood cards: Calm, Fun, Deep, Unexpected, Short
- Best-of-3 matches before deciding
- Dare cards for commitment challenges
- Connection Points tracking

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
│   ├── onboarding.tsx   # Country selection
│   ├── settings.tsx     # Settings modal
│   ├── saved.tsx        # Saved movies list
│   ├── purchase.tsx     # Premium unlock
│   ├── couch.tsx        # Couch Mode setup
│   ├── game.tsx         # Game Mode setup
│   └── session.tsx      # Active swiping session
├── components/
│   └── SwipeCard.tsx    # Main swipe card component
└── lib/
    ├── types.ts         # TypeScript interfaces
    ├── constants.ts     # App constants and config
    ├── store.ts         # Zustand store
    ├── movies.ts        # Movie data and filtering
    └── cn.ts            # ClassName utility
```

## Monetization
One-time purchase: 39 SEK
- No subscriptions
- No ads
- No tracking

## Supported Countries
Sweden, USA, UK, Germany, France, Spain, Italy, Netherlands, Norway, Denmark, Finland, Australia, Canada, Japan, Brazil, Mexico, India
