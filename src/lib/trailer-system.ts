// ============================================================================
// TRAILER SYSTEM — COMPLETELY DISABLED
// ============================================================================
// TRAILERS ARE DISABLED until the new architecture passes validation.
//
// REASON: YouTube playback is unreliable for inline autoplay:
// - Embeds don't allow reliable muted autoplay
// - iOS blocks playback
// - WebViews unload on re-render
// - Players are mounted/unmounted per card
// - Swipe interrupts lifecycle
// - Error 153 = player config + policy mismatch
//
// CURRENT STATE: Posters only. No autoplay. No long-press. No inline video.
//
// FUTURE: Rebuild with:
// - ONE persistent video player per feed
// - Never mount/unmount per card
// - Only swap the video source
// - Player lives ABOVE the card stack
// - Cards do not own players
// - SOURCE-AGNOSTIC: MP4, HLS, CDN clips, Apple previews, Vimeo, etc.
// ============================================================================

import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================================================
// TYPES
// ============================================================================

export interface TrailerSource {
  id: string;
  type: 'youtube' | 'mp4' | 'hls' | 'vimeo' | 'apple_preview';
  url: string;
  videoId?: string; // For YouTube/Vimeo
  priority: number; // Lower = higher priority
  reliability: number; // 0-1, learned over time
  lastTestedAt?: number;
  lastFailedAt?: number;
  failureCount: number;
}

export interface TrailerPlaybackConfig {
  autoplayDelayMs: number; // 900-1400ms per spec
  muted: boolean; // Always true
  loop: boolean;
  maxDurationSeconds: number;
  previewDurationSeconds: number;
}

// ============================================================================
// DELIVERY GATES
// ============================================================================

export interface GateStatus {
  iconCorrectness: boolean; // Gate A
  trailerStability: boolean; // Gate B
  trailersEnabled: boolean; // Both gates must pass
  lastChecked: number;
  failureReason?: string;
}

// Gate tracking for stability
interface GateMetrics {
  consecutiveIconSuccess: number;
  consecutiveAutoplaySuccess: number;
  consecutiveSwipeStops: number;
  lastIconCheck: number;
  lastAutoplayCheck: number;
}

const GATE_THRESHOLD = 50; // 50 consecutive successes required

let gateMetrics: GateMetrics = {
  consecutiveIconSuccess: 0,
  consecutiveAutoplaySuccess: 0,
  consecutiveSwipeStops: 0,
  lastIconCheck: 0,
  lastAutoplayCheck: 0,
};

// ============================================================================
// SOURCE RELIABILITY LEARNING
// ============================================================================

const SOURCE_RELIABILITY_KEY = 'trailer_source_reliability';
const SESSION_FAILURES_KEY = 'trailer_session_failures';

// Track sources that failed in this session (don't retry)
const sessionFailedSources = new Set<string>();

// Load source reliability from storage
export async function loadSourceReliability(): Promise<Record<string, number>> {
  try {
    const stored = await AsyncStorage.getItem(SOURCE_RELIABILITY_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

// Update source reliability after success/failure
export async function updateSourceReliability(
  sourceId: string,
  success: boolean
): Promise<void> {
  try {
    const reliability = await loadSourceReliability();
    const current = reliability[sourceId] ?? 0.5;

    // Adjust reliability (success increases, failure decreases)
    if (success) {
      reliability[sourceId] = Math.min(1, current + 0.1);
    } else {
      reliability[sourceId] = Math.max(0, current - 0.2);
      // Mark as failed for this session
      sessionFailedSources.add(sourceId);
    }

    await AsyncStorage.setItem(SOURCE_RELIABILITY_KEY, JSON.stringify(reliability));
  } catch {
    // Silent fail
  }
}

// Check if source should be skipped this session
export function isSourceBlockedThisSession(sourceId: string): boolean {
  return sessionFailedSources.has(sourceId);
}

// ============================================================================
// GATE MANAGEMENT
// ============================================================================

export function recordIconSuccess(): void {
  gateMetrics.consecutiveIconSuccess++;
  gateMetrics.lastIconCheck = Date.now();
}

export function recordIconFailure(): void {
  gateMetrics.consecutiveIconSuccess = 0;
  gateMetrics.lastIconCheck = Date.now();
}

export function recordAutoplaySuccess(): void {
  gateMetrics.consecutiveAutoplaySuccess++;
  gateMetrics.lastAutoplayCheck = Date.now();
}

export function recordAutoplayFailure(): void {
  gateMetrics.consecutiveAutoplaySuccess = 0;
  gateMetrics.lastAutoplayCheck = Date.now();
}

export function recordSwipeStopSuccess(): void {
  gateMetrics.consecutiveSwipeStops++;
}

export function recordSwipeStopFailure(): void {
  gateMetrics.consecutiveSwipeStops = 0;
}

export function getGateStatus(): GateStatus {
  const iconCorrectness = gateMetrics.consecutiveIconSuccess >= GATE_THRESHOLD;
  const trailerStability =
    gateMetrics.consecutiveAutoplaySuccess >= GATE_THRESHOLD &&
    gateMetrics.consecutiveSwipeStops >= GATE_THRESHOLD;

  return {
    iconCorrectness,
    trailerStability,
    trailersEnabled: iconCorrectness && trailerStability,
    lastChecked: Date.now(),
    failureReason: !iconCorrectness
      ? 'Icon rendering issues detected'
      : !trailerStability
      ? 'Trailer playback instability detected'
      : undefined,
  };
}

// For initial app state - TRAILERS ARE DISABLED
// Set to false to completely disable all trailer functionality
let gatesAssumedPassing = false; // DISABLED - was true

export function assumeGatesPassing(): void {
  // DISABLED - trailers are off until rebuilt
  gatesAssumedPassing = false;
  gateMetrics.consecutiveIconSuccess = 0;
  gateMetrics.consecutiveAutoplaySuccess = 0;
  gateMetrics.consecutiveSwipeStops = 0;
}

export function areTrailersEnabled(): boolean {
  // DISABLED - always return false until trailer system is rebuilt
  return false;
}

// Call this when any gate check fails
export function markGateFailed(): void {
  gatesAssumedPassing = false;
}

// ============================================================================
// PLAYBACK CONFIG
// ============================================================================

export function getAutoplayDelay(): number {
  // Random delay between 900-1400ms for natural feel
  return 900 + Math.random() * 500;
}

export const DEFAULT_PLAYBACK_CONFIG: TrailerPlaybackConfig = {
  autoplayDelayMs: 1000, // Will be randomized
  muted: true,
  loop: true,
  maxDurationSeconds: 60,
  previewDurationSeconds: 15,
};

// ============================================================================
// SOURCE ELIGIBILITY (per spec)
// ============================================================================

export interface EligibilityResult {
  eligible: boolean;
  reason?: string;
}

export function checkSourceEligibility(source: TrailerSource): EligibilityResult {
  // Source blocked this session
  if (isSourceBlockedThisSession(source.id)) {
    return { eligible: false, reason: 'Source failed earlier this session' };
  }

  // Low reliability sources
  if (source.reliability < 0.3) {
    return { eligible: false, reason: 'Source has low reliability score' };
  }

  // Recent failure (within last hour)
  if (source.lastFailedAt && Date.now() - source.lastFailedAt < 3600000) {
    return { eligible: false, reason: 'Source failed recently' };
  }

  return { eligible: true };
}

// ============================================================================
// AUTOPLAY STATE MACHINE
// ============================================================================

export type AutoplayState =
  | 'idle'           // No card active
  | 'settling'       // Card became active, waiting for delay
  | 'loading'        // Delay passed, loading video
  | 'playing'        // Video is playing
  | 'stopping'       // Swipe detected, stopping playback
  | 'error'          // Playback failed, showing poster
  | 'disabled';      // Gates failed, trailers disabled

export interface AutoplayStateContext {
  state: AutoplayState;
  movieId: string | null;
  sourceId: string | null;
  startTime: number | null;
  error: string | null;
}

export function createInitialAutoplayContext(): AutoplayStateContext {
  return {
    state: areTrailersEnabled() ? 'idle' : 'disabled',
    movieId: null,
    sourceId: null,
    startTime: null,
    error: null,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

// Initialize on app start
export function initializeTrailerSystem(): void {
  // Start with gates assumed passing
  assumeGatesPassing();
}
