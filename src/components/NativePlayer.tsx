import React, {
  useRef,
  useCallback,
  useState,
  useImperativeHandle,
  forwardRef,
  useEffect,
} from 'react';
import { View, StyleSheet } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import {
  updateSourceReliability,
  recordAutoplaySuccess,
  recordAutoplayFailure,
  recordSwipeStopSuccess,
} from '@/lib/trailer-system';

// ============================================================================
// NATIVE VIDEO PLAYER — AUTOPLAY TRAILER SYSTEM
// ============================================================================
// This player is for MP4/HLS sources (non-YouTube)
// Follows strict autoplay rules:
// - Always muted
// - No external app redirects
// - Silent failure (poster remains)
// - Instant stop on swipe
// ============================================================================

export interface NativePlayerRef {
  play: () => Promise<void>;
  stop: () => Promise<void>;
  pause: () => Promise<void>;
  isReady: () => boolean;
  isPlaying: () => boolean;
}

interface NativePlayerProps {
  sourceUrl: string;
  sourceId: string;
  loop?: boolean;
  onReady?: () => void;
  onError?: () => void;
  onPlaybackStart?: () => void;
  onPlaybackEnd?: () => void;
}

export const NativePlayer = forwardRef<NativePlayerRef, NativePlayerProps>(
  function NativePlayer(
    { sourceUrl, sourceId, loop = true, onReady, onError, onPlaybackStart, onPlaybackEnd },
    ref
  ) {
    const videoRef = useRef<Video>(null);
    const [isPlayerReady, setIsPlayerReady] = useState(false);
    const [isCurrentlyPlaying, setIsCurrentlyPlaying] = useState(false);
    const hasErrored = useRef(false);

    // Track if we've started playback (for reliability metrics)
    const playbackStarted = useRef(false);

    useImperativeHandle(ref, () => ({
      play: async () => {
        if (!isPlayerReady || hasErrored.current) return;
        try {
          await videoRef.current?.playAsync();
          playbackStarted.current = true;
          recordAutoplaySuccess();
        } catch {
          recordAutoplayFailure();
          hasErrored.current = true;
          onError?.();
        }
      },
      stop: async () => {
        try {
          await videoRef.current?.stopAsync();
          await videoRef.current?.setPositionAsync(0);
          setIsCurrentlyPlaying(false);

          // Only record success if we were actually playing
          if (playbackStarted.current) {
            recordSwipeStopSuccess();
            // Mark source as reliable
            updateSourceReliability(sourceId, true);
          }
        } catch {
          // Silent fail on stop
        }
      },
      pause: async () => {
        try {
          await videoRef.current?.pauseAsync();
        } catch {
          // Silent fail
        }
      },
      isReady: () => isPlayerReady && !hasErrored.current,
      isPlaying: () => isCurrentlyPlaying,
    }));

    const handlePlaybackStatusUpdate = useCallback(
      (status: AVPlaybackStatus) => {
        if (!status.isLoaded) {
          if ('error' in status && status.error) {
            hasErrored.current = true;
            updateSourceReliability(sourceId, false);
            recordAutoplayFailure();
            onError?.();
          }
          return;
        }

        if (status.isPlaying && !isCurrentlyPlaying) {
          setIsCurrentlyPlaying(true);
          onPlaybackStart?.();
        } else if (!status.isPlaying && isCurrentlyPlaying) {
          setIsCurrentlyPlaying(false);
        }

        if (status.didJustFinish && !loop) {
          onPlaybackEnd?.();
        }
      },
      [isCurrentlyPlaying, loop, sourceId, onError, onPlaybackStart, onPlaybackEnd]
    );

    const handleLoad = useCallback(() => {
      setIsPlayerReady(true);
      onReady?.();
    }, [onReady]);

    const handleError = useCallback(() => {
      hasErrored.current = true;
      updateSourceReliability(sourceId, false);
      recordAutoplayFailure();
      onError?.();
    }, [sourceId, onError]);

    return (
      <View style={styles.container}>
        <Video
          ref={videoRef}
          source={{ uri: sourceUrl }}
          style={styles.video}
          resizeMode={ResizeMode.COVER}
          shouldPlay={false}
          isLooping={loop}
          isMuted={true} // ALWAYS muted
          onLoad={handleLoad}
          onError={handleError}
          onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
          useNativeControls={false}
          progressUpdateIntervalMillis={500}
        />
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  video: {
    flex: 1,
  },
});
