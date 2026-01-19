# Glo - Pick Together

A swipe-first movie decision app that helps people quickly and fairly choose what to watch.

## Core Promise
Every movie shown can actually be watched in the country you live in. No US-only Netflix results shown to EU users. No guessing. No disappointment.

## Design Philosophy
- **Zero UI at top**: Nothing may appear at the top of screen. Only OS status bar exists.
- **Film dominates**: The poster IS the interface. ~80% of screen is the movie poster.
- **Bottom-driven interaction**: All controls at bottom, thumb-reachable.
- **Spotify-level calm**: Few choices, no explanation needed, content first.
- **No AI smell**: Real TMDB posters, quality-gated content, no generated art.
- **Trailers as rewards**: Hold-to-preview inline trailers, never leave the app.

## Screen Structure

### Top Area
- Completely empty (only OS status bar)
- No icons, buttons, navigation, or labels
- This area is silent

### Main Content (~80%)
- Full-bleed official movie poster
- Title + year only, subtle at bottom
- No metadata, ratings, or debug overlays
- Gesture-responsive (swipe left/right/up)
- **Hold-to-preview**: Long press (450ms) to play inline trailer

### Streaming Providers (above actions)
- Single horizontal row
- **Official icons only** (from verified CDN sources)
- Netflix, Prime, Disney+, Max, Apple TV+, Hulu, MUBI, Criterion
- Tap opens exact movie in provider app (deep link)
- Max 4 icons shown
- If icon not verified → not shown

### Bottom Action Bar
Three actions (left to right):
1. Pass (red X)
2. Save (yellow bookmark)
3. Like (green heart)
Icons only. Haptic feedback on press.

### Secondary Navigation
Below action bar, always visible:
- Spelläge (game mode)
- Soffläge (couch mode)
- Settings

## Data Quality Rules (NON-NEGOTIABLE)
- All movies use official TMDB poster paths
- No stock images, no placeholders, no AI-generated art
- Movies must pass quality gate: rating_count >= 1000 AND rating_avg >= 6.5
- Hidden gems exception: rating_avg >= 8.0 with 500+ votes
- If poster fails to load, movie is removed from feed
- Feed NEVER ends - fallback ladder ensures continuous content

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
- Bottom action buttons as alternative to swipes
- Title + year only on cards
- Country-accurate streaming availability

### Trailer System
- **Hold-to-preview**: Long press (450ms) on poster to play inline trailer
- **Muted by default**: Trailers play silently, never interrupt
- **10-15 second loops**: Short, cinematic previews
- **Never leaves app**: Inline WebView playback, no YouTube redirect
- **Official sources only**: Strict query strategy for studio/distributor trailers
- **Regional caching**: Trailers cached per movie + region + language

### Streaming Provider Integration
- **Verified icons only**: Netflix, Prime, Disney+, Max, Apple TV+, Hulu, MUBI, Criterion
- **Deep linking**: Opens streaming app directly to the movie
- **Fallback chain**: Universal link → URL scheme → Web browser
- **Provider sorting**: Stream offers first, then rent, then buy

### Image Pipeline
- Official TMDB movie posters (w500 = 500px wide)
- Image prefetching for smooth scrolling
- Memory + disk caching via expo-image
- Placeholder blur hash during loading
- Pure black background (#000000)

### Soffläge (Couch Mode)
- Create a session and share via:
  - Share link (native share sheet)
  - Copy link (for messaging)
  - Show code (for someone next to you)
- Join with a 6-character code
- Secure tokens with 2-hour expiry
- Match confirmation with brief trailer preview

### Spelläge (Game Mode)
- Pick a mood: Calm, Fun, Intense, Short
- Filtered movie selection based on mood
- **Winner reveal**: After 5 likes, a random winner is dramatically revealed
- **Cinematic trailer**: Winner auto-plays trailer inline
- Perfect for date nights or group decisions

### Saved Movies Library
- Grid view of all saved movies
- Tap to view details with streaming providers
- Quick remove with trash icon
- Same posters as main feed

## Tech Stack
- Expo SDK 53 with React Native 0.76.7
- NativeWind + Tailwind CSS for styling
- React Native Reanimated for animations
- React Native Gesture Handler for swipes
- Zustand for state management with persistence
- expo-image for optimized image loading
- react-native-webview for inline trailer playback

## File Structure
```
src/
├── app/
│   ├── _layout.tsx      # Root layout with navigation
│   ├── index.tsx        # Home screen (Quick Swipe)
│   ├── settings.tsx     # Settings modal
│   ├── saved.tsx        # Saved movies grid with detail modal
│   ├── couch.tsx        # Soffläge setup with invite sheet
│   ├── spellage.tsx     # Spelläge mood picker
│   └── session.tsx      # Active swiping session with winner reveal
├── components/
│   ├── MovieCard.tsx    # Main card with swipe + hold-to-preview
│   ├── StreamingIcon.tsx # Verified streaming icons + deep links
│   ├── ProviderButton.tsx # Legacy provider row
│   ├── ProviderIcon.tsx # Legacy SVG icons
│   └── InviteSheet.tsx  # Room sharing sheet
└── lib/
    ├── types.ts         # TypeScript interfaces
    ├── constants.ts     # App constants and config
    ├── store.ts         # Zustand store with taste profile
    ├── movies.ts        # Movie data with availability
    ├── feed-engine.ts   # Recommendation algorithm
    ├── candidate-store.ts # Quality-filtered buckets
    ├── trailer.ts       # YouTube trailer system + cache
    ├── streaming.ts     # Provider deep linking
    ├── image-cache.ts   # Image prefetch utilities
    ├── tmdb.ts          # TMDB API types and helpers
    ├── room.ts          # Room invite utilities
    └── cn.ts            # ClassName utility
```

## Trailer System Details

### YouTube Query Strategy (Priority Order)
1. **Official/Studio** (top priority): `"{title} {year} official trailer"`
2. **Distributor/Platform**: `"{title} trailer {year}"`
3. **Trusted channels** (last resort): Known trailer aggregators

### Validation Rules
- Duration: 45-240 seconds
- Must contain "trailer" or "teaser" in title
- Blacklist: reactions, breakdowns, fan edits, scene clips
- Verified channels: Warner Bros, Universal, Sony, Disney, etc.

### Cache System
- Key: `trailer_{movieId}_{region}_{language}`
- TTL: 7 days
- Fallback: Poster-only experience is acceptable

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
- **Trailers**: Engagement refines taste (minor weight)

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
