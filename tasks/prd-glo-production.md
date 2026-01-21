# PRD: Glo Production Release

## Introduction

Glo is a movie discovery app that makes "What should we watch tonight?" feel effortless, calm, and fun. This PRD defines the production-ready implementation of three core systems:

1. **Trailer System** (release-blocking) — Netflix-like inline previews
2. **Spelläge** (premium feature) — Fun, social movie-picking game
3. **Feed Algorithm** — Fresh, intelligent, never-ending recommendations

This is a consumer-grade product. Nothing ships half-working.

## Goals

- Deliver flawless, Netflix-like trailer autoplay experience
- Make Spelläge genuinely fun, rewarding, and worth paying for
- Ensure the feed never feels repetitive or exhausted
- Maintain calm, effortless UX throughout
- Zero "AI-built" or technical feeling

## Priority Order

1. **Phase 1: Trailer System** (release-blocking)
2. **Phase 2: Spelläge Rebuild**
3. **Phase 3: Algorithm Refinement**

---

# PHASE 1: TRAILER SYSTEM (Release-Blocking)

The trailer system must be completely rebuilt with a persistent player architecture. All current trailer code remains disabled until the new system passes the acceptance gate.

---

### US-001: Persistent Video Player Architecture

**Description:** As a developer, I need a single persistent video player that lives above the card stack so that we can swap sources without mount/unmount cycles.

**Acceptance Criteria:**
- [ ] Create `TrailerPlayer` component that renders ONE video player instance
- [ ] Player is positioned absolute, above card stack in z-index
- [ ] Player visibility controlled via opacity (0 = hidden, 1 = visible)
- [ ] Player is NEVER unmounted during feed usage
- [ ] Export imperative API: `play(source)`, `stop()`, `setVisible(bool)`
- [ ] Player works with expo-av Video component
- [ ] Typecheck passes

**Priority:** 1

---

### US-002: Source-Agnostic Video Loader

**Description:** As a developer, I need a unified video source interface so that any source (MP4, HLS, YouTube, Apple) can be loaded the same way.

**Acceptance Criteria:**
- [ ] Create `TrailerSource` type: `{ type: 'native' | 'youtube' | 'apple', uri: string, startTime?: number, endTime?: number }`
- [ ] Create `useTrailerSource(movieId)` hook that returns best available source
- [ ] Hook checks all source types and returns the first valid one
- [ ] Sources are cached per movie (7-day TTL)
- [ ] If no source available, returns `null` (triggers poster fallback)
- [ ] Typecheck passes

**Priority:** 2

---

### US-003: Autoplay Gate System

**Description:** As a developer, I need an autoplay gate that tracks success/failure so trailers only enable when proven stable.

**Acceptance Criteria:**
- [ ] Create `TrailerGate` module in `src/lib/trailer-gate.ts`
- [ ] Track metrics: `autoplaySuccesses`, `autoplayFailures`, `swipeStopSuccesses`, `swipeStopFailures`, `blinkStopCount`
- [ ] Gate passes when: 50 consecutive autoplay successes AND 50 consecutive swipe stops AND 0 blink-stops
- [ ] Gate fails permanently for session if ANY failure occurs
- [ ] Export `isGatePassed()`, `recordSuccess(type)`, `recordFailure(type)`, `resetGate()`
- [ ] Metrics persisted to AsyncStorage (reset on app update)
- [ ] Typecheck passes

**Priority:** 3

---

### US-004: Native Video Source Integration (MP4/HLS)

**Description:** As a user, I want trailers to play from native video sources (MP4/HLS) so I get the smoothest possible experience.

**Acceptance Criteria:**
- [ ] Create `getNativeTrailerSource(movie)` function
- [ ] Check TMDB for video files (if API provides direct URLs)
- [ ] Check known CDN patterns for movie trailers
- [ ] Validate source plays correctly before returning
- [ ] Return `null` if no valid native source found
- [ ] Typecheck passes

**Priority:** 4

---

### US-005: YouTube Source Integration

**Description:** As a developer, I need YouTube as a fallback trailer source with proper embed handling.

**Acceptance Criteria:**
- [ ] Create `getYouTubeTrailerSource(movie)` function
- [ ] Search YouTube for official trailer (priority: studio channels)
- [ ] Use youtube-nocookie.com embed URL
- [ ] Configure for: `autoplay=1`, `mute=1`, `playsinline=1`, `controls=0`
- [ ] Validate video is embeddable before returning
- [ ] Return `null` if blocked or unavailable
- [ ] Typecheck passes

**Priority:** 5

---

### US-006: Apple Movie Previews Integration

**Description:** As a developer, I need Apple Movie Previews as a trailer source option.

**Acceptance Criteria:**
- [ ] Create `getAppleTrailerSource(movie)` function
- [ ] Query Apple iTunes API for movie preview URLs
- [ ] Extract HLS stream URL from response
- [ ] Validate stream is playable
- [ ] Return `null` if not available
- [ ] Typecheck passes

**Priority:** 6

---

### US-007: Autoplay Delay & Trigger Logic

**Description:** As a user, I want trailers to autoplay after a short delay when I'm viewing a movie card, so the experience feels calm and intentional.

**Acceptance Criteria:**
- [ ] Autoplay triggers 900-1400ms after card becomes stable (random within range)
- [ ] Autoplay ONLY triggers if: card is top of stack, no gesture active, gate passed
- [ ] Autoplay cancels immediately if swipe gesture starts
- [ ] Autoplay cancels if card loses focus
- [ ] No autoplay during rapid swiping (debounce)
- [ ] Record success/failure to gate after each attempt
- [ ] Typecheck passes

**Priority:** 7

---

### US-008: Swipe-Stop Integration

**Description:** As a user, I want the trailer to stop INSTANTLY when I start swiping, so video never interferes with gestures.

**Acceptance Criteria:**
- [ ] Hook into PanGestureHandler `onStart` event
- [ ] Call `TrailerPlayer.stop()` synchronously on gesture start
- [ ] Stop must happen in <16ms (same frame)
- [ ] No audio bleed after stop
- [ ] Record swipe-stop success/failure to gate
- [ ] If stop takes >100ms, record as failure
- [ ] Typecheck passes

**Priority:** 8

---

### US-009: Poster Fallback Behavior

**Description:** As a user, I want to see the movie poster if trailer fails, with no error messages or broken states.

**Acceptance Criteria:**
- [ ] If trailer source is `null`, show poster only (current behavior)
- [ ] If trailer fails to load, hide player and show poster
- [ ] If trailer stops within 2 seconds of starting, record as blink-stop failure
- [ ] No error UI, no retry buttons, no loading spinners longer than 500ms
- [ ] Poster is ALWAYS visible underneath player (player overlays poster)
- [ ] Typecheck passes

**Priority:** 9

---

### US-010: Trailer System Integration Test

**Description:** As a developer, I need to verify the entire trailer system works end-to-end before enabling it.

**Acceptance Criteria:**
- [ ] Create test script that simulates 50 autoplay cycles
- [ ] Verify all 50 succeed without blink-stops
- [ ] Simulate 50 swipe-stop events
- [ ] Verify all 50 stop instantly
- [ ] Only enable trailer system if ALL tests pass
- [ ] Log results to `expo.log` for debugging
- [ ] Typecheck passes

**Priority:** 10

---

# PHASE 2: SPELLÄGE REBUILD

Spelläge is the only premium feature. It must feel like a shared ritual, not a utility.

---

### US-011: Spelläge Entry Flow Redesign

**Description:** As a user, I want a beautiful entry screen for Spelläge that makes me excited to play.

**Acceptance Criteria:**
- [ ] Redesign `/spellage` screen with two clear options: Solo / Together
- [ ] Each option has icon, title, and one-line description
- [ ] Visual design feels premium and fun (not utilitarian)
- [ ] Smooth entrance animation
- [ ] Typecheck passes
- [ ] Verify in browser

**Priority:** 11

---

### US-012: Together Mode - Session Creation

**Description:** As a user, I want to create a Together session and get a shareable code/link.

**Acceptance Criteria:**
- [ ] "Together" button creates new session with unique 6-character code
- [ ] Session stored in Zustand with: `id`, `code`, `hostDeviceId`, `participants[]`, `movies[]`, `currentRound`, `totalRounds`
- [ ] Generate shareable link: `glo://join/{code}` (deep link)
- [ ] Generate QR code for the link
- [ ] Show waiting screen with code prominently displayed
- [ ] Typecheck passes
- [ ] Verify in browser

**Priority:** 12

---

### US-013: Together Mode - Join via Link/QR

**Description:** As a user, I want to join a friend's session by scanning QR or tapping a link.

**Acceptance Criteria:**
- [ ] Handle deep link `glo://join/{code}`
- [ ] Manual code entry as fallback
- [ ] Validate code exists and session is waiting
- [ ] Add device to session participants
- [ ] Navigate to session screen when joined
- [ ] Show error if code invalid or session full/started
- [ ] Typecheck passes
- [ ] Verify in browser

**Priority:** 13

---

### US-014: Together Mode - Synchronized Feed

**Description:** As a user in Together mode, I want to see the exact same movies in the same order as my partner.

**Acceptance Criteria:**
- [ ] Session stores pre-generated movie list (7 movies for 7 rounds)
- [ ] Movie list generated when session created (host's region)
- [ ] All participants receive same list in same order
- [ ] Swipes are independent (each player swipes their own copy)
- [ ] Sync swipe results to session state
- [ ] Typecheck passes

**Priority:** 14

---

### US-015: Blind Choice UI

**Description:** As a user in Spelläge, I want movie titles hidden so I judge purely by poster/trailer.

**Acceptance Criteria:**
- [ ] MovieCard accepts `blindMode` prop
- [ ] When `blindMode=true`: hide title, year, and all metadata
- [ ] Show only: poster, streaming icons, action buttons
- [ ] Reveal animation when round ends (title fades in)
- [ ] Typecheck passes
- [ ] Verify in browser

**Priority:** 15

---

### US-016: Round-Based Gameplay

**Description:** As a user, I want Spelläge to have clear rounds (5-7) with progress indication.

**Acceptance Criteria:**
- [ ] Session has `totalRounds` (default 7) and `currentRound`
- [ ] Progress indicator shows "Round X of Y"
- [ ] Each round = one movie to swipe
- [ ] Round advances when all participants have swiped
- [ ] Game ends after final round
- [ ] Typecheck passes
- [ ] Verify in browser

**Priority:** 16

---

### US-017: Match Detection & Celebration

**Description:** As a user, I want to see a celebration when my partner and I both like the same movie.

**Acceptance Criteria:**
- [ ] Detect match: both participants swiped "like" on same movie
- [ ] Show match celebration overlay (confetti, animation)
- [ ] Display matched movie with title revealed
- [ ] Play haptic feedback (success pattern)
- [ ] Match can happen on any round (game continues)
- [ ] Typecheck passes
- [ ] Verify in browser

**Priority:** 17

---

### US-018: End Game Results Screen

**Description:** As a user, I want to see final results after all rounds complete.

**Acceptance Criteria:**
- [ ] Show all matched movies (if any)
- [ ] Show each player's likes
- [ ] If 1+ match: show "Winner" with trailer autoplay (if gate passes)
- [ ] If no matches: show encouraging message + closest picks
- [ ] "Play Again" and "Exit" buttons
- [ ] Typecheck passes
- [ ] Verify in browser

**Priority:** 18

---

### US-019: Solo Mode Update

**Description:** As a user, I want Solo mode to use the same round-based, blind-choice mechanics.

**Acceptance Criteria:**
- [ ] Solo mode uses same 7-round structure
- [ ] Blind choice enabled
- [ ] After 7 rounds, randomly select winner from likes
- [ ] Show winner with cinematic reveal
- [ ] Play trailer if gate passes
- [ ] Typecheck passes
- [ ] Verify in browser

**Priority:** 19

---

# PHASE 3: ALGORITHM REFINEMENT

The feed must feel fresh, intelligent, and infinite.

---

### US-020: Exposure Memory Enhancement

**Description:** As a user, I don't want to see movies I've already swiped on.

**Acceptance Criteria:**
- [ ] Never show liked movies again in regular feed
- [ ] Never show saved movies again in regular feed
- [ ] Strong cooldown on passed movies (24-hour minimum)
- [ ] Hard avoidance of immediate repeats (last 50 movies)
- [ ] Exposure data persisted across sessions
- [ ] Typecheck passes

**Priority:** 20

---

### US-021: Taste Signal Refinement

**Description:** As a developer, I need to improve how taste signals influence recommendations.

**Acceptance Criteria:**
- [ ] Likes: strong positive signal for genre, director, cast
- [ ] Saves: stronger signal than likes (intent to watch)
- [ ] Passes: weak negative signal (don't over-penalize)
- [ ] Trailer engagement: minor positive signal if watched >10s
- [ ] Spelläge matches: strongest signal (shared preference)
- [ ] Decay old signals over time (30-day half-life)
- [ ] Typecheck passes

**Priority:** 21

---

### US-022: Freshness Scoring

**Description:** As a user, I want to see fresh content mixed into my feed.

**Acceptance Criteria:**
- [ ] Boost score for: released in last 90 days
- [ ] Boost score for: recently added to streaming in user's region
- [ ] Boost score for: trending in user's region
- [ ] Freshness contributes 15-20% of final score
- [ ] Typecheck passes

**Priority:** 22

---

### US-023: Diversity Control Enhancement

**Description:** As a user, I don't want to see the same type of movie repeatedly.

**Acceptance Criteria:**
- [ ] Max 2 same primary genre in a row
- [ ] Max 3 same era in a row
- [ ] Max 2 same director in a row
- [ ] Penalty for same mood back-to-back
- [ ] Diversity applied after scoring, before final selection
- [ ] Typecheck passes

**Priority:** 23

---

### US-024: Infinite Feed Guarantee

**Description:** As a user, I never want to see "no more movies" or an empty feed.

**Acceptance Criteria:**
- [ ] Fallback ladder: fresh → cooldown-expired → all-time → any
- [ ] If all movies exhausted: reset exposure memory for lowest-priority bucket
- [ ] Feed ALWAYS returns a movie (even if repeated)
- [ ] Log fallback level for analytics
- [ ] Typecheck passes

**Priority:** 24

---

# PHASE 4: POLISH & VERIFICATION

---

### US-025: Streaming Icons Verification

**Description:** As a developer, I need to verify streaming icons match the spec exactly.

**Acceptance Criteria:**
- [ ] Icons are raw brand logos (no wrappers, pills, backgrounds)
- [ ] Icons are non-interactive (no onPress handlers)
- [ ] Icons only shown if movie confirmed available in region
- [ ] Uses existing streaming data (no changes needed)
- [ ] Typecheck passes
- [ ] Verify in browser matches reference image

**Priority:** 25

---

### US-026: Final UX Audit

**Description:** As a user, I want the entire app to feel calm, effortless, and polished.

**Acceptance Criteria:**
- [ ] No loading spinners visible for more than 300ms
- [ ] All animations feel smooth (60fps)
- [ ] No janky transitions between screens
- [ ] All text is readable and well-spaced
- [ ] No debug logs visible in production
- [ ] Error states are graceful (no crashes, no ugly messages)
- [ ] Typecheck passes
- [ ] Full app walkthrough in browser

**Priority:** 26

---

## Functional Requirements

### Trailer System
- FR-1: Single persistent video player, never unmounted during feed usage
- FR-2: Source-agnostic loading (MP4, HLS, YouTube, Apple)
- FR-3: Autoplay after 900-1400ms delay when card stable
- FR-4: Instant stop (<16ms) on swipe gesture start
- FR-5: Autoplay gate: 50 successes required before enabling
- FR-6: Silent fallback to poster on any failure

### Spelläge
- FR-7: Solo and Together modes with distinct entry flows
- FR-8: Together mode: 6-character code, QR, deep link join
- FR-9: Synchronized movie feed for all participants
- FR-10: Blind choice: titles hidden until reveal
- FR-11: 7-round gameplay with progress indicator
- FR-12: Match detection and celebration animation
- FR-13: End game results with trailer for winner

### Algorithm
- FR-14: Never show liked/saved movies in feed
- FR-15: 24-hour cooldown on passed movies
- FR-16: Taste signals: likes, saves, engagement, matches
- FR-17: Freshness boost for new releases and trending
- FR-18: Diversity control: max 2 same genre in a row
- FR-19: Infinite feed guarantee with fallback ladder

### Streaming
- FR-20: Raw brand icons only, no wrappers
- FR-21: Non-interactive (informational only)
- FR-22: Show only if confirmed available in region

---

## Non-Goals (Out of Scope)

- No audio controls (always muted)
- No fullscreen trailer mode
- No external links to streaming services
- No social features beyond Spelläge Together
- No user accounts or cloud sync
- No push notifications
- No in-app purchases UI (handled by App Store)
- No trailer source preference settings

---

## Technical Considerations

- **Video Player:** Use `expo-av` Video component for native sources, WebView for YouTube fallback
- **State:** Zustand for local state, no server required for MVP
- **Deep Links:** Configure in `app.json` for `glo://` scheme
- **QR Generation:** Use `react-native-qrcode-svg` or similar
- **Testing:** Manual testing via browser tools + automated gate validation

---

## Success Metrics

- Trailer autoplay works flawlessly OR is completely disabled
- Spelläge completion rate >70% (users finish the game)
- Feed feels fresh after 100+ swipes in testing
- Zero crashes in 1-hour usage session
- App feels "premium" in user feedback

---

## Open Questions

- Should Spelläge have sound effects for match celebration?
- Should we track analytics for trailer engagement?
- What's the monetization trigger for Spelläge? (paywall before or after first game)

---

## Acceptance Gate (SHIP / NO SHIP)

The app may ONLY ship if:

1. **Trailer:** 50 consecutive autoplay successes + 50 swipe-stops + 0 blink-stops, OR trailers completely disabled
2. **Spelläge:** Together mode works end-to-end with 2 devices
3. **Feed:** No repeats in 50 consecutive swipes
4. **Stability:** Zero crashes in 30-minute session
5. **UX:** Nothing feels technical or broken

If ANY gate fails → fix or disable the feature. Poster-only + basic Spelläge is acceptable. Broken features are not.
