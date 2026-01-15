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

### Infinite Smart-Random Feed
- Personalized recommendations based on your taste profile
- 60% exploit (matches your taste), 30% explore (something different), 10% wildcard
- Never runs out - multiple fallback levels ensure continuous content
- Learns from likes, passes, and saves

### Quick Swipe (Default)
- Swipe right to like, left to pass, up to save for later
- Physics-based gestures with haptic feedback
- Country-accurate streaming availability
- Tap provider icons to open streaming apps directly

### Streaming Provider Deep Links
- Netflix, Prime Video, Disney+, Max, Apple TV+, Viaplay, SVT Play, Hulu
- Tappable provider icons on each movie card
- Opens the streaming app directly on the movie title
- Falls back to web if app not installed

### Couch Mode
- Create a session and share via:
  - Share link (native share sheet)
  - Copy link (for messaging)
  - Show code (for someone next to you)
- Join with a 6-character code
- Secure tokens with 2-hour expiry

### Spelläge / Game Mode
- Pick a mood: Calm, Fun, Intense, Short
- Filtered movie selection based on mood
- Perfect for date nights or group decisions

## Tech Stack
- Expo SDK 53 with React Native 0.76.7
- NativeWind + Tailwind CSS for styling
- React Native Reanimated for animations
- React Native Gesture Handler for swipes
- Zustand for state management with persistence
- Custom FeedEngine for recommendation algorithm

## File Structure
```
src/
├── app/
│   ├── _layout.tsx      # Root layout with navigation
│   ├── index.tsx        # Home screen (Quick Swipe)
│   ├── settings.tsx     # Settings modal
│   ├── saved.tsx        # Saved movies grid
│   ├── couch.tsx        # Couch Mode setup with invite sheet
│   ├── spellage.tsx     # Game Mode mood picker
│   └── session.tsx      # Active swiping session
├── components/
│   ├── SwipeCard.tsx    # Main swipe card with provider icons
│   ├── ProviderButton.tsx # Streaming provider icons
│   └── InviteSheet.tsx  # Room sharing sheet
└── lib/
    ├── types.ts         # TypeScript interfaces
    ├── constants.ts     # App constants and config
    ├── store.ts         # Zustand store with taste profile
    ├── movies.ts        # Movie data with deep links
    ├── feed-engine.ts   # Recommendation algorithm
    ├── streaming.ts     # Provider deep linking
    ├── room.ts          # Room invite utilities
    └── cn.ts            # ClassName utility
```

## Monetization
One-time App Store purchase. Everything unlocked.
- No subscriptions
- No ads
- No tracking

## Supported Countries
Sweden, USA, UK, Germany, France, Norway, Denmark, Finland, Netherlands, Australia, Canada

## Feed Algorithm

The FeedEngine uses a taste profile that learns from user behavior:

- **Genres**: Weighted affinities for drama, comedy, action, etc.
- **Moods**: Preferences for calm, fun, or intense content
- **Runtime**: Average preferred movie length
- **Era**: Classic, modern, or recent preferences

Bucket distribution:
- 60% Exploit (top 30% of scored movies)
- 30% Explore (middle 40% of scored movies)
- 10% Wildcard (random from entire pool)

Dynamic adjustments:
- More exploration early on when taste is unknown
- Explore boost after 5+ consecutive passes
- Decay factor to prevent stale preferences
