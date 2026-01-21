// ============================================================================
// TRAILER PLAYER — PERSISTENT PLAYER ARCHITECTURE (US-001)
// ============================================================================
// This is the SINGLE persistent video player that lives ABOVE the card stack.
// It is NEVER unmounted during feed usage. Visibility is controlled via opacity.
//
// Architecture:
// - ONE video player instance per feed
// - Player swaps sources, never remounts
// - Poster is always underneath (player overlays poster)
// - Instant stop on swipe (<16ms target)
// ============================================================================

import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  useCallback,
} from 'react';
import { View, StyleSheet } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';

// ============================================================================
// TYPES
// ============================================================================

export interface TrailerSource {
  type: 'native' | 'youtube' | 'apple';
  uri: string;
  startTime?: number;
  endTime?: number;
}

export interface TrailerPlayerRef {
  /**
   * Start playing from a source. If already playing, stops first then plays new source.
   */
  play: (source: TrailerSource) => void;

  /**
   * Stop playback immediately. Must complete in <16ms.
   */
  stop: () => void;

  /**
   * Control player visibility via opacity. Does NOT affect playback state.
   * @param visible - true = opacity 1, false = opacity 0
   */
  setVisible: (visible: boolean) => void;

  /**
   * Check if player is ready for playback
   */
  isReady: () => boolean;

  /**
   * Check if player is currently playing
   */
  isPlaying: () => boolean;
}

interface TrailerPlayerProps {
  /**
   * Called when video playback starts successfully
   */
  onPlaybackStart?: () => void;

  /**
   * Called when playback ends (naturally or stopped)
   */
  onPlaybackEnd?: () => void;

  /**
   * Called when an error occurs (silent - no UI shown)
   */
  onError?: (error: string) => void;

  /**
   * Called when player becomes ready
   */
  onReady?: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const TrailerPlayer = forwardRef<TrailerPlayerRef, TrailerPlayerProps>(
  function TrailerPlayer({ onPlaybackStart, onPlaybackEnd, onError, onReady }, ref) {
    // Player state
    const videoRef = useRef<Video>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isPlayingState, setIsPlayingState] = useState(false);
    const currentSourceRef = useRef<TrailerSource | null>(null);

    // Ready state tracking
    const isReadyRef = useRef(false);

    // ========================================================================
    // PLAYBACK HANDLERS
    // ========================================================================

    const handlePlaybackStatusUpdate = useCallback(
      (status: AVPlaybackStatus) => {
        if (!status.isLoaded) {
          // Video unloaded or error
          if ('error' in status && status.error) {
            onError?.(status.error);
          }
          setIsLoaded(false);
          setIsPlayingState(false);
          return;
        }

        // Video is loaded
        if (!isLoaded) {
          setIsLoaded(true);
          isReadyRef.current = true;
          onReady?.();
        }

        // Track playing state
        const wasPlaying = isPlayingState;
        const nowPlaying = status.isPlaying;

        if (!wasPlaying && nowPlaying) {
          onPlaybackStart?.();
        }

        if (wasPlaying && !nowPlaying && !status.isBuffering) {
          onPlaybackEnd?.();
        }

        setIsPlayingState(nowPlaying);

        // Handle end of video
        if (status.didJustFinish) {
          onPlaybackEnd?.();
        }
      },
      [isLoaded, isPlayingState, onPlaybackStart, onPlaybackEnd, onError, onReady]
    );

    const handleError = useCallback(
      (error: string) => {
        isReadyRef.current = false;
        setIsLoaded(false);
        setIsPlayingState(false);
        onError?.(error);
      },
      [onError]
    );

    // ========================================================================
    // IMPERATIVE API
    // ========================================================================

    useImperativeHandle(
      ref,
      () => ({
        play: async (source: TrailerSource) => {
          if (!videoRef.current) return;

          // Only support native sources for now (MP4/HLS)
          if (source.type !== 'native') {
            onError?.(`Unsupported source type: ${source.type}`);
            return;
          }

          try {
            currentSourceRef.current = source;

            // Load and play the video
            await videoRef.current.unloadAsync();
            await videoRef.current.loadAsync(
              { uri: source.uri },
              {
                shouldPlay: true,
                isMuted: true, // Always muted per spec
                isLooping: false,
                positionMillis: (source.startTime ?? 0) * 1000,
              }
            );

            // Make visible
            setIsVisible(true);
          } catch (err) {
            handleError(err instanceof Error ? err.message : 'Failed to load video');
          }
        },

        stop: () => {
          // INSTANT stop - this must be <16ms
          // Use sync-style call without awaiting
          videoRef.current?.stopAsync().catch(() => {});
          setIsPlayingState(false);
          setIsVisible(false);
          currentSourceRef.current = null;
        },

        setVisible: (visible: boolean) => {
          setIsVisible(visible);
        },

        isReady: () => isReadyRef.current,

        isPlaying: () => isPlayingState,
      }),
      [isPlayingState, onError, handleError]
    );

    // ========================================================================
    // RENDER
    // ========================================================================

    return (
      <View
        style={[styles.container, { opacity: isVisible ? 1 : 0 }]}
        pointerEvents={isVisible ? 'auto' : 'none'}
      >
        <Video
          ref={videoRef}
          style={styles.video}
          resizeMode={ResizeMode.COVER}
          onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
          onError={() => handleError('Video playback error')}
          isMuted={true}
          shouldPlay={false}
          useNativeControls={false}
        />
      </View>
    );
  }
);

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100, // Above card stack
    backgroundColor: '#000',
  },
  video: {
    flex: 1,
  },
});
