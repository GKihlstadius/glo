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
- Quality-filtered buckets: trending, top-rated, popular, new releases, hidden gems
- Never runs out - multiple fallback levels ensure continuous content
- Learns from likes, passes, and saves in real-time
- Diversity constraints prevent genre/director streaks

### Quick Swipe (Default)
- Swipe right to like, left to pass, up to save for later
- Physics-based gestures with haptic feedback
- Star rating badge on each card
- Full movie metadata: year, runtime, genre
- Country-accurate streaming availability

### Streaming Provider Integration
- **Real provider icons**: Netflix, Prime, Disney+, Max, Apple TV+, Viaplay, SVT, Hulu
- **Deep linking**: Opens streaming app directly to the movie
- **Fallback chain**: Universal link → URL scheme → Web browser
- **Provider sorting**: Stream offers first, then rent, then buy

### Image Pipeline
- High-quality movie posters (800x1200)
- Image prefetching for smooth scrolling
- Memory + disk caching via expo-image
- Placeholder blur hash during loading

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

### Dev Debug Mode
- Toggle with bug icon in header (dev builds only)
- Shows feed bucket source, score, and reason
- Queue length and history tracking
- Fallback level indicator
- Bucket distribution ratios

## Tech Stack
- Expo SDK 53 with React Native 0.76.7
- NativeWind + Tailwind CSS for styling
- React Native Reanimated for animations
- React Native Gesture Handler for swipes
- Zustand for state management with persistence
- expo-image for optimized image loading
- react-native-svg for provider icons

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
│   ├── SwipeCard.tsx    # Main swipe card with gradients
│   ├── ProviderButton.tsx # Streaming provider row
│   ├── ProviderIcon.tsx # SVG provider icons
│   └── InviteSheet.tsx  # Room sharing sheet
└── lib/
    ├── types.ts         # TypeScript interfaces
    ├── constants.ts     # App constants and config
    ├── store.ts         # Zustand store with taste profile
    ├── movies.ts        # Movie data with availability
    ├── feed-engine.ts   # Recommendation algorithm
    ├── candidate-store.ts # Quality-filtered buckets
    ├── streaming.ts     # Provider deep linking
    ├── image-cache.ts   # Image prefetch utilities
    ├── tmdb.ts          # TMDB API types and helpers
    ├── room.ts          # Room invite utilities
    └── cn.ts            # ClassName utility
```

## Feed Algorithm

The FeedEngine uses a multi-bucket candidate store with quality filters:

### Candidate Buckets
- **Trending**: High popularity, recent attention
- **Top Rated**: Rating ≥7.0, ≥1000 votes
- **Popular**: High popularity score + decent ratings
- **New & Noteworthy**: Released within 365 days, good ratings
- **Hidden Gems**: Rating ≥7.5, <5000 votes
- **Personalized**: Scored by taste profile

### Bucket Distribution
- 50% Personalized picks
- 15% Trending
- 15% Top Rated
- 10% Popular
- 5% New Releases
- 5% Hidden Gems

### Taste Profile Learning
- **Genres**: Weighted affinities (like +0.15, save +0.25, pass -0.08)
- **Directors/Cast**: Strong signals from likes/saves
- **Moods**: Calm, fun, intense preferences
- **Runtime**: Running average of liked movies
- **Era**: Classic, modern, recent preferences

### Diversity Rules
- Max 3 same-genre in a row
- Max 2 same-director in a row
- Max 4 same-era in a row

### Fallback Ladder
1. Fresh candidates (not seen, not in history)
2. All unswiped movies (ignore history window)
3. Previously swiped (except saved)
4. Any movie in region (ultimate fallback)

## Supported Countries
Sweden, USA, UK, Germany, France, Norway, Denmark, Finland, Netherlands, Australia, Canada

## Monetization
One-time App Store purchase. Everything unlocked.
- No subscriptions
- No ads
- No tracking
