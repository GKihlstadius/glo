// ============================================================================
// USE POSTER FALLBACK — POSTER FALLBACK BEHAVIOR (US-009)
// ============================================================================
// Handles graceful fallback to poster when trailers fail or are unavailable.
// Key behaviors:
// - If trailer source is null, show poster only
// - If trailer fails to load, hide player and show poster
// - If trailer stops within 2 seconds of starting, record as blink-stop failure
// - No error UI, no retry buttons, no loading spinners longer than 500ms
// - Poster is ALWAYS visible underneath player (player overlays poster)
//
// This hook tracks playback state and handles all failure modes silently.
// ============================================================================

import { useCallback, useRef, useState, useEffect } from 'react';
import { recordBlinkStop } from './trailer-gate';

// ============================================================================
// CONSTANTS
// ============================================================================

/** Time threshold for blink-stop detection (ms) - video stopping within this is a failure */
const BLINK_STOP_THRESHOLD_MS = 2000;

/** Maximum time to show loading state (ms) */
const MAX_LOADING_TIME_MS = 500;

// ============================================================================
// TYPES
// ============================================================================

export interface PosterFallbackState {
  /** Whether to show the poster (always true - poster is base layer) */
  showPoster: true;
  /** Whether the trailer player should be visible (false = show poster only) */
  showPlayer: boolean;
  /** Whether we're in a loading state (capped at 500ms display) */
  isLoading: boolean;
  /** Whether a blink-stop was detected (for debugging) */
  hadBlinkStop: boolean;
  /** Whether trailer failed to load */
  hadLoadError: boolean;
}

export interface UsePosterFallbackOptions {
  /** Whether a trailer source is available */
  hasTrailerSource: boolean;
  /** Movie ID for tracking */
  movieId: string | null;
  /** Enable debug logging */
  debug?: boolean;
}

export interface UsePosterFallbackResult {
  /** Current fallback state */
  state: PosterFallbackState;
  /** Call when trailer playback starts */
  onPlaybackStart: () => void;
  /** Call when trailer playback stops (naturally or forced) */
  onPlaybackStop: () => void;
  /** Call when trailer fails to load */
  onLoadError: () => void;
  /** Call when trailer is being loaded */
  onLoadStart: () => void;
  /** Call when trailer has loaded successfully */
  onLoadComplete: () => void;
  /** Reset state for a new movie */
  reset: () => void;
  /** Check if player should be shown */
  shouldShowPlayer: () => boolean;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook to manage poster fallback behavior for trailers
 *
 * @example
 * ```tsx
 * const fallback = usePosterFallback({
 *   hasTrailerSource: !!source,
 *   movieId: movie.id,
 * });
 *
 * // Trailer player with fallback:
 * <View>
 *   {/ Poster ALWAYS visible as base layer /}
 *   <Image source={movie.posterUrl} />
 *
 *   {/ Player overlays poster, controlled by fallback /}
 *   {fallback.state.showPlayer && (
 *     <TrailerPlayer
 *       onPlaybackStart={fallback.onPlaybackStart}
 *       onPlaybackEnd={fallback.onPlaybackStop}
 *       onError={fallback.onLoadError}
 *     />
 *   )}
 * </View>
 * ```
 */
export function usePosterFallback(options: UsePosterFallbackOptions): UsePosterFallbackResult {
  const { hasTrailerSource, movieId, debug = false } = options;

  // State
  const [state, setState] = useState<PosterFallbackState>({
    showPoster: true, // Poster is ALWAYS visible (base layer)
    showPlayer: false, // Player visibility controlled by trailer state
    isLoading: false,
    hadBlinkStop: false,
    hadLoadError: false,
  });

  // Refs for timing
  const playbackStartTimeRef = useRef<number | null>(null);
  const loadingStartTimeRef = useRef<number | null>(null);
  const loadingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentMovieRef = useRef<string | null>(null);

  // ========================================================================
  // UTILITY: Clear loading timeout
  // ========================================================================
  const clearLoadingTimeout = useCallback(() => {
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
  }, []);

  // ========================================================================
  // CALLBACKS
  // ========================================================================

  /**
   * Call when trailer starts loading
   */
  const onLoadStart = useCallback(() => {
    loadingStartTimeRef.current = Date.now();
    setState(s => ({ ...s, isLoading: true }));

    // Cap loading state at MAX_LOADING_TIME_MS
    clearLoadingTimeout();
    loadingTimeoutRef.current = setTimeout(() => {
      if (debug) {
        console.log('[PosterFallback] Loading timeout - hiding loading state');
      }
      setState(s => ({ ...s, isLoading: false }));
    }, MAX_LOADING_TIME_MS);
  }, [debug, clearLoadingTimeout]);

  /**
   * Call when trailer has loaded successfully
   */
  const onLoadComplete = useCallback(() => {
    clearLoadingTimeout();
    setState(s => ({ ...s, isLoading: false, showPlayer: true }));

    if (debug) {
      const loadTime = loadingStartTimeRef.current
        ? Date.now() - loadingStartTimeRef.current
        : 0;
      console.log(`[PosterFallback] Load complete in ${loadTime}ms`);
    }
  }, [debug, clearLoadingTimeout]);

  /**
   * Call when trailer playback starts
   */
  const onPlaybackStart = useCallback(() => {
    playbackStartTimeRef.current = Date.now();
    clearLoadingTimeout();
    setState(s => ({
      ...s,
      showPlayer: true,
      isLoading: false,
    }));

    if (debug) {
      console.log('[PosterFallback] Playback started');
    }
  }, [debug, clearLoadingTimeout]);

  /**
   * Call when trailer playback stops (naturally or forced)
   */
  const onPlaybackStop = useCallback(() => {
    // Check for blink-stop (video stopping within 2 seconds of starting)
    if (playbackStartTimeRef.current) {
      const playDuration = Date.now() - playbackStartTimeRef.current;

      if (playDuration < BLINK_STOP_THRESHOLD_MS) {
        // BLINK-STOP DETECTED - record as failure
        if (debug) {
          console.log(`[PosterFallback] BLINK-STOP detected: ${playDuration}ms < ${BLINK_STOP_THRESHOLD_MS}ms`);
        }
        recordBlinkStop();
        setState(s => ({
          ...s,
          showPlayer: false,
          hadBlinkStop: true,
        }));
      } else {
        // Normal stop - just hide player
        if (debug) {
          console.log(`[PosterFallback] Normal stop after ${playDuration}ms`);
        }
        setState(s => ({ ...s, showPlayer: false }));
      }
    } else {
      // Playback never started - just hide player
      setState(s => ({ ...s, showPlayer: false }));
    }

    playbackStartTimeRef.current = null;
  }, [debug]);

  /**
   * Call when trailer fails to load
   */
  const onLoadError = useCallback(() => {
    clearLoadingTimeout();
    playbackStartTimeRef.current = null;

    if (debug) {
      console.log('[PosterFallback] Load error - falling back to poster');
    }

    // Hide player, show poster (poster is always showing anyway)
    setState(s => ({
      ...s,
      showPlayer: false,
      isLoading: false,
      hadLoadError: true,
    }));

    // No error UI, no retry - just silent fallback to poster
  }, [debug, clearLoadingTimeout]);

  /**
   * Reset state for a new movie
   */
  const reset = useCallback(() => {
    clearLoadingTimeout();
    playbackStartTimeRef.current = null;
    loadingStartTimeRef.current = null;

    setState({
      showPoster: true,
      showPlayer: false,
      isLoading: false,
      hadBlinkStop: false,
      hadLoadError: false,
    });
  }, [clearLoadingTimeout]);

  /**
   * Check if player should be shown
   * Helper method for convenience
   */
  const shouldShowPlayer = useCallback(() => {
    return state.showPlayer && hasTrailerSource && !state.hadLoadError && !state.hadBlinkStop;
  }, [state.showPlayer, hasTrailerSource, state.hadLoadError, state.hadBlinkStop]);

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

  // Handle no trailer source - poster only
  useEffect(() => {
    if (!hasTrailerSource) {
      setState(s => ({
        ...s,
        showPlayer: false,
        isLoading: false,
      }));
    }
  }, [hasTrailerSource]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearLoadingTimeout();
    };
  }, [clearLoadingTimeout]);

  // ========================================================================
  // RETURN
  // ========================================================================

  return {
    state,
    onPlaybackStart,
    onPlaybackStop,
    onLoadError,
    onLoadStart,
    onLoadComplete,
    reset,
    shouldShowPlayer,
  };
}
