// ============================================================================
// USE SWIPE STOP — SWIPE-STOP INTEGRATION (US-008)
// ============================================================================
// Handles instant trailer stopping when swipe gestures start.
// Key requirements:
// - Stop must happen in <16ms (same frame)
// - No audio bleed after stop
// - Record success/failure to gate
// - Failure if stop takes >100ms
//
// This hook bridges the gesture system with the TrailerPlayer.
// ============================================================================

import { useCallback, useRef } from 'react';
import { recordSuccess, recordFailure } from './trailer-gate';
import type { TrailerPlayerRef } from '@/components/TrailerPlayer';

// ============================================================================
// CONSTANTS
// ============================================================================

/** Maximum time for stop to complete before recording as failure (ms) */
const STOP_FAILURE_THRESHOLD_MS = 100;

/** Target stop time for optimal UX (ms) */
const STOP_TARGET_MS = 16;

// ============================================================================
// TYPES
// ============================================================================

export interface UseSwipeStopOptions {
  /** Reference to the TrailerPlayer */
  playerRef: React.RefObject<TrailerPlayerRef | null>;
  /** Optional callback after stop completes */
  onStopped?: () => void;
  /** Enable debug logging */
  debug?: boolean;
}

export interface UseSwipeStopResult {
  /**
   * Call this IMMEDIATELY when gesture starts (in onStart handler).
   * This must be called synchronously, not after any await.
   * Use runOnJS from reanimated to call from worklet.
   */
  onSwipeStart: () => void;

  /**
   * Call when swipe completes successfully
   */
  onSwipeComplete: () => void;

  /**
   * Check if trailer is currently playing
   */
  isTrailerPlaying: () => boolean;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook to handle instant trailer stopping on swipe gestures
 *
 * @example
 * ```tsx
 * const playerRef = useRef<TrailerPlayerRef>(null);
 * const swipeStop = useSwipeStop({ playerRef });
 *
 * // In gesture handler (using runOnJS from reanimated):
 * const gestureHandler = useAnimatedGestureHandler({
 *   onStart: () => {
 *     runOnJS(swipeStop.onSwipeStart)();
 *   },
 * });
 * ```
 */
export function useSwipeStop(options: UseSwipeStopOptions): UseSwipeStopResult {
  const { playerRef, onStopped, debug = false } = options;

  // Track timing for success/failure recording
  const stopStartTimeRef = useRef<number | null>(null);
  const wasPlayingRef = useRef(false);

  /**
   * Called IMMEDIATELY when gesture starts.
   * Must be synchronous - no awaits!
   */
  const onSwipeStart = useCallback(() => {
    const player = playerRef.current;
    if (!player) {
      return;
    }

    // Check if actually playing
    const isPlaying = player.isPlaying();
    wasPlayingRef.current = isPlaying;

    if (!isPlaying) {
      // Nothing to stop - don't record success/failure
      return;
    }

    // Record start time BEFORE calling stop
    stopStartTimeRef.current = performance.now();

    // Call stop - this should be instant (<16ms)
    // The TrailerPlayer.stop() is designed to not await
    player.stop();

    // Measure how long stop took
    const stopDuration = performance.now() - stopStartTimeRef.current;

    if (debug) {
      console.log(`[SwipeStop] Stop took ${stopDuration.toFixed(2)}ms`);
    }

    // Record success/failure based on timing
    if (stopDuration > STOP_FAILURE_THRESHOLD_MS) {
      // Stop took too long - failure
      if (debug) {
        console.log(`[SwipeStop] FAILURE: Stop took ${stopDuration.toFixed(2)}ms (threshold: ${STOP_FAILURE_THRESHOLD_MS}ms)`);
      }
      recordFailure('swipeStop');
    } else {
      // Success!
      if (debug && stopDuration > STOP_TARGET_MS) {
        console.log(`[SwipeStop] Success but slow: ${stopDuration.toFixed(2)}ms (target: ${STOP_TARGET_MS}ms)`);
      }
      recordSuccess('swipeStop');
    }

    // Reset timing ref
    stopStartTimeRef.current = null;

    // Call callback
    onStopped?.();
  }, [playerRef, onStopped, debug]);

  /**
   * Called when swipe completes
   */
  const onSwipeComplete = useCallback(() => {
    // Reset state for next swipe
    wasPlayingRef.current = false;
    stopStartTimeRef.current = null;
  }, []);

  /**
   * Check if trailer is currently playing
   */
  const isTrailerPlaying = useCallback(() => {
    return playerRef.current?.isPlaying() ?? false;
  }, [playerRef]);

  return {
    onSwipeStart,
    onSwipeComplete,
    isTrailerPlaying,
  };
}
