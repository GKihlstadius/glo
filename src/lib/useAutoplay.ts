// ============================================================================
// USE AUTOPLAY — AUTOPLAY DELAY & TRIGGER LOGIC (US-007)
// ============================================================================
// Controls when trailers should autoplay based on:
// - Card stability (900-1400ms delay after becoming top card)
// - Gate status (only if gate has passed)
// - Gesture state (cancel if swiping)
// - Debounce for rapid swiping
//
// This hook does NOT play the trailer itself - it signals WHEN to play.
// The actual playback is handled by TrailerPlayer.
// ============================================================================

import { useRef, useEffect, useCallback, useState } from 'react';
import { isGatePassed, recordSuccess, recordFailure } from './trailer-gate';

// ============================================================================
// CONSTANTS
// ============================================================================

/** Minimum delay before autoplay triggers (ms) */
const AUTOPLAY_DELAY_MIN = 900;

/** Maximum delay before autoplay triggers (ms) */
const AUTOPLAY_DELAY_MAX = 1400;

/** Debounce time after swipe before autoplay can trigger again (ms) */
const SWIPE_DEBOUNCE_MS = 300;

/** Minimum time card must be stable before autoplay (ms) */
const CARD_SETTLE_TIME = 50;

// ============================================================================
// TYPES
// ============================================================================

export interface AutoplayState {
  /** Whether autoplay should trigger right now */
  shouldPlay: boolean;
  /** Whether a gesture is currently active */
  isGestureActive: boolean;
  /** Whether we're in the delay period before autoplay */
  isWaiting: boolean;
  /** Whether the autoplay was cancelled by a gesture */
  wasCancelled: boolean;
  /** Whether gate check passed */
  gatePassed: boolean;
}

export interface UseAutoplayOptions {
  /** Whether this card is the top (active) card in the stack */
  isTopCard: boolean;
  /** Movie ID for tracking */
  movieId: string | null;
  /** Whether a trailer source is available */
  hasTrailerSource: boolean;
  /** Called when autoplay should start */
  onShouldPlay?: () => void;
  /** Called when autoplay was cancelled */
  onCancelled?: () => void;
  /** Disable autoplay entirely */
  disabled?: boolean;
}

export interface UseAutoplayResult {
  /** Current autoplay state */
  state: AutoplayState;
  /** Call when gesture starts (touch down) - cancels autoplay immediately */
  onGestureStart: () => void;
  /** Call when gesture ends (touch up) */
  onGestureEnd: () => void;
  /** Call when card is swiped away */
  onSwipeComplete: () => void;
  /** Record that autoplay started successfully */
  recordAutoplayStarted: () => void;
  /** Record that autoplay failed */
  recordAutoplayFailed: () => void;
  /** Reset autoplay state (e.g., after card changes) */
  reset: () => void;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook to control trailer autoplay timing and triggering
 *
 * @example
 * ```tsx
 * const autoplay = useAutoplay({
 *   isTopCard: true,
 *   movieId: movie.id,
 *   hasTrailerSource: !!trailerSource,
 *   onShouldPlay: () => trailerPlayer.play(trailerSource),
 * });
 *
 * // In gesture handler:
 * gestureHandler.onStart = () => autoplay.onGestureStart();
 * gestureHandler.onEnd = () => autoplay.onGestureEnd();
 * ```
 */
export function useAutoplay(options: UseAutoplayOptions): UseAutoplayResult {
  const {
    isTopCard,
    movieId,
    hasTrailerSource,
    onShouldPlay,
    onCancelled,
    disabled = false,
  } = options;

  // State
  const [state, setState] = useState<AutoplayState>({
    shouldPlay: false,
    isGestureActive: false,
    isWaiting: false,
    wasCancelled: false,
    gatePassed: false,
  });

  // Refs for timeout management
  const autoplayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track whether autoplay already fired for this card
  const hasAutoplayedRef = useRef(false);

  // Track last swipe time for debounce
  const lastSwipeTimeRef = useRef(0);

  // Track card settle time
  const cardSettleTimeRef = useRef(0);

  // Track current movie to detect changes
  const currentMovieRef = useRef<string | null>(null);

  // ========================================================================
  // UTILITY: Clear all timeouts
  // ========================================================================
  const clearTimeouts = useCallback(() => {
    if (autoplayTimeoutRef.current) {
      clearTimeout(autoplayTimeoutRef.current);
      autoplayTimeoutRef.current = null;
    }
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }
  }, []);

  // ========================================================================
  // UTILITY: Generate random delay
  // ========================================================================
  const getRandomDelay = useCallback(() => {
    return AUTOPLAY_DELAY_MIN + Math.random() * (AUTOPLAY_DELAY_MAX - AUTOPLAY_DELAY_MIN);
  }, []);

  // ========================================================================
  // START AUTOPLAY SEQUENCE
  // ========================================================================
  const startAutoplaySequence = useCallback(() => {
    // Don't start if already triggered or disabled
    if (hasAutoplayedRef.current || disabled) {
      return;
    }

    // Check gate status
    const gatePassed = isGatePassed();
    setState(s => ({ ...s, gatePassed }));

    if (!gatePassed) {
      return;
    }

    // Check debounce - don't autoplay if recently swiped
    const timeSinceSwipe = Date.now() - lastSwipeTimeRef.current;
    if (timeSinceSwipe < SWIPE_DEBOUNCE_MS) {
      // Schedule retry after debounce period
      debounceTimeoutRef.current = setTimeout(() => {
        startAutoplaySequence();
      }, SWIPE_DEBOUNCE_MS - timeSinceSwipe);
      return;
    }

    // Mark as waiting
    setState(s => ({ ...s, isWaiting: true }));

    // Schedule autoplay with random delay
    const delay = getRandomDelay();
    autoplayTimeoutRef.current = setTimeout(() => {
      // Final checks before triggering
      if (hasAutoplayedRef.current || state.isGestureActive) {
        setState(s => ({ ...s, isWaiting: false }));
        return;
      }

      // Check gate again (could have failed during delay)
      if (!isGatePassed()) {
        setState(s => ({ ...s, isWaiting: false, gatePassed: false }));
        return;
      }

      // Trigger autoplay!
      hasAutoplayedRef.current = true;
      setState(s => ({
        ...s,
        shouldPlay: true,
        isWaiting: false,
      }));
      onShouldPlay?.();
    }, delay);
  }, [disabled, getRandomDelay, onShouldPlay, state.isGestureActive]);

  // ========================================================================
  // CANCEL AUTOPLAY
  // ========================================================================
  const cancelAutoplay = useCallback(() => {
    clearTimeouts();

    if (state.isWaiting || state.shouldPlay) {
      setState(s => ({
        ...s,
        isWaiting: false,
        wasCancelled: true,
      }));
      onCancelled?.();
    }
  }, [clearTimeouts, state.isWaiting, state.shouldPlay, onCancelled]);

  // ========================================================================
  // GESTURE HANDLERS
  // ========================================================================

  /**
   * Call when gesture starts (touch down)
   * This IMMEDIATELY cancels any pending autoplay
   */
  const onGestureStart = useCallback(() => {
    setState(s => ({ ...s, isGestureActive: true }));
    cancelAutoplay();
  }, [cancelAutoplay]);

  /**
   * Call when gesture ends (touch up without completing swipe)
   * This restarts the autoplay sequence if conditions are met
   */
  const onGestureEnd = useCallback(() => {
    setState(s => ({ ...s, isGestureActive: false }));

    // Only restart autoplay if:
    // - Card is still top
    // - Haven't already autoplayed
    // - Have trailer source
    if (isTopCard && !hasAutoplayedRef.current && hasTrailerSource) {
      cardSettleTimeRef.current = Date.now();

      // Small delay to ensure card is "settled" after gesture
      setTimeout(() => {
        // Only proceed if card hasn't moved since settle started
        if (Date.now() - cardSettleTimeRef.current >= CARD_SETTLE_TIME) {
          startAutoplaySequence();
        }
      }, CARD_SETTLE_TIME);
    }
  }, [isTopCard, hasTrailerSource, startAutoplaySequence]);

  /**
   * Call when card is swiped away
   */
  const onSwipeComplete = useCallback(() => {
    lastSwipeTimeRef.current = Date.now();
    cancelAutoplay();
    setState(s => ({
      ...s,
      isGestureActive: false,
      shouldPlay: false,
    }));
  }, [cancelAutoplay]);

  // ========================================================================
  // RECORDING SUCCESS/FAILURE
  // ========================================================================

  /**
   * Record that autoplay started successfully
   */
  const recordAutoplayStarted = useCallback(() => {
    recordSuccess('autoplay');
  }, []);

  /**
   * Record that autoplay failed
   */
  const recordAutoplayFailed = useCallback(() => {
    recordFailure('autoplay');
    setState(s => ({ ...s, shouldPlay: false }));
  }, []);

  // ========================================================================
  // RESET
  // ========================================================================

  /**
   * Reset autoplay state (call when movie changes)
   */
  const reset = useCallback(() => {
    clearTimeouts();
    hasAutoplayedRef.current = false;
    cardSettleTimeRef.current = 0;
    setState({
      shouldPlay: false,
      isGestureActive: false,
      isWaiting: false,
      wasCancelled: false,
      gatePassed: isGatePassed(),
    });
  }, [clearTimeouts]);

  // ========================================================================
  // EFFECTS
  // ========================================================================

  // Reset when movie changes
  useEffect(() => {
    if (movieId !== currentMovieRef.current) {
      currentMovieRef.current = movieId;
      reset();
    }
  }, [movieId, reset]);

  // Start autoplay when card becomes top and conditions are met
  useEffect(() => {
    // Clear any existing timeouts first
    clearTimeouts();

    // Skip if conditions not met
    if (!isTopCard || !hasTrailerSource || disabled || !movieId) {
      return;
    }

    // Skip if already autoplayed or gesture active
    if (hasAutoplayedRef.current || state.isGestureActive) {
      return;
    }

    // Mark card as settled
    cardSettleTimeRef.current = Date.now();

    // Start autoplay sequence
    startAutoplaySequence();

    // Cleanup on unmount or deps change
    return () => {
      clearTimeouts();
    };
  }, [isTopCard, hasTrailerSource, disabled, movieId, state.isGestureActive, startAutoplaySequence, clearTimeouts]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimeouts();
    };
  }, [clearTimeouts]);

  // ========================================================================
  // RETURN
  // ========================================================================

  return {
    state,
    onGestureStart,
    onGestureEnd,
    onSwipeComplete,
    recordAutoplayStarted,
    recordAutoplayFailed,
    reset,
  };
}
