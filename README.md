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
- **Poster-first**: Beautiful movie posters are the primary experience. Trailers disabled until rebuilt.

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
- **Poster-only**: Trailers disabled until system is rebuilt

### Streaming Providers (above actions)
- Single horizontal row
- **Icons from sprite sheet only** (public/image-2.png)
- Raw brand logos, no containers/pills/backgrounds
- Netflix, Prime, HBO Max, Hulu, Disney+, Apple TV+, MUBI, Crunchyroll, etc.
- **Non-interactive**: Icons are passive availability signals only
- Max 4 icons shown
- If icon not in sprite sheet → not shown

### Bottom Action Bar
Three actions (left to right):
1. Pass (red X)
2. Save (yellow bookmark)
3. Like (green heart)
Icons only. Haptic feedback on press.

### Secondary Navigation
Below action bar, always visible:
- Spelläge (game mode)
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

### Trailer System (DISABLED)
Trailers are completely disabled until the system is rebuilt with proper architecture.

**Why disabled:**
- YouTube embeds don't allow reliable muted autoplay
- iOS blocks playback in many scenarios
- WebViews unload on re-render causing instant stops
- Error 153 = player config + policy mismatch

**Current state:** Posters only. No autoplay. No long-press. No inline video.

**Future rebuild will use:**
- ONE persistent video player per feed (not per card)
- Source-agnostic: MP4, HLS, CDN clips, Apple previews, Vimeo
- Player lives ABOVE card stack, only source swaps
- Validation gate: 50 consecutive autoplay successes required

### Streaming Provider Icons
- **Sprite sheet icons only**: All icons from public/image-2.png (9x3 grid)
- **Raw brand images**: No containers, pills, backgrounds, or overlays
- **Non-interactive**: Icons are passive availability signals, not buttons
- **Brand fidelity**: Original colors, shapes, aspect ratios preserved
- **Available providers**: Netflix, Prime Video, HBO Max, Hulu, Disney+, Apple TV+, CBS, AMC, Showtime, MUBI, Crunchyroll, Rakuten TV, Acorn TV, Plex, and more
- **Regional accuracy**: Only show icons if movie is confirmed available in user's region

### Image Pipeline
- Official TMDB movie posters (w500 = 500px wide)
- Image prefetching for smooth scrolling
- Memory + disk caching via expo-image
- Placeholder blur hash during loading
- Pure black background (#000000)

### Spelläge (Game Mode) - Premium Feature
The ONLY premium feature in Glo. Contains two modes:

#### Solo Mode
- Pick a mood: Calm, Fun, Intense, Short, or Surprise Me
- **Blind choice**: Movie titles hidden until you like/save
- Filtered movie selection based on mood
- After 5 likes, a random winner is dramatically revealed
- Winner auto-plays trailer inline

#### Together Mode
- Same as Solo, but with a shareable room code
- Join with a 6-character code
- Both participants swipe blind (titles hidden)
- Match confirmation when both like the same movie
- Winner revealed with cinematic trailer

### My Library (Settings)
- **Saved Movies**: Grid view of all saved movies
- **Liked Movies**: Grid view of all liked movies
- Tap to view details with streaming providers
- Quick save/remove actions
- Same posters as main feed

## Tech Stack
- Expo SDK 53 with React Native 0.76.7
- NativeWind + Tailwind CSS for styling
- React Native Reanimated for animations
- React Native Gesture Handler for swipes
- Zustand for state management with persistence
- expo-image for optimized image loading
- react-native-webview for inline trailer playback (YouTube IFrame API)

## File Structure
```
src/
├── app/
│   ├── _layout.tsx      # Root layout with navigation
│   ├── index.tsx        # Home screen (Quick Swipe)
│   ├── settings.tsx     # Settings modal with My Library
│   ├── saved.tsx        # Saved movies grid
│   ├── liked.tsx        # Liked movies grid
│   ├── spellage.tsx     # Spelläge mode picker (Solo/Together)
│   └── session.tsx      # Active game session with blind choice
├── components/
│   ├── MovieCard.tsx    # Main card with swipe + hold-to-preview + blind mode
│   ├── StreamingIcon.tsx # Sprite sheet icons + deep links
│   └── YouTubePlayer.tsx # IFrame Player API component
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
    └── cn.ts            # ClassName utility
```

## Trailer System Details (DISABLED)

Trailers are currently disabled. This section documents the planned architecture for when they are re-enabled.

### Future Architecture
- ONE persistent video player per feed
- Never mount/unmount per card
- Only swap video source
- Player lives ABOVE card stack
- Cards do not own players
- Source-agnostic: MP4, HLS, CDN clips, Apple previews, Vimeo, etc.

### Re-enable Criteria (ALL must pass)
- 50 consecutive autoplay attempts succeed
- 0 instant stops
- 0 silent failures
- 0 blocking swipes
- 0 UI regressions

### Delivery Gates (Future)
Trailers are ONLY enabled when both gates pass:

**Gate A — Icon Correctness**
- Raw brand logos
- No wrappers/pills/backgrounds
- Non-interactive
- Matches reference exactly

**Gate B — Trailer Stability**
- Autoplay works reliably
- No blink-start-stop
- No silent failures
- Playback always stops instantly on swipe

If either gate fails → trailers disabled, poster-only experience

### YouTube IFrame Player API
- Uses official YouTube IFrame Player API for reliable playback
- Fixes Error 153 that occurs with direct embedding
- WebView configured with:
  - `allowsInlineMediaPlayback={true}`
  - `mediaPlaybackRequiresUserAction={false}`
  - Proper origin and playsinline parameters

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
