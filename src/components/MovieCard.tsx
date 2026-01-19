import React, { useCallback, useRef, useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
  runOnJS,
  useAnimatedGestureHandler,
} from 'react-native-reanimated';
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
  LongPressGestureHandler,
  LongPressGestureHandlerGestureEvent,
  State,
} from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { Movie } from '@/lib/types';
import { SWIPE, COLORS } from '@/lib/constants';
import { PLACEHOLDER_BLUR_HASH, IMAGE_TRANSITION } from '@/lib/image-cache';
import { getTrailer, TrailerInfo } from '@/lib/trailer';
import { YouTubePlayer, YouTubePlayerRef, YT_PLAYER_STATE } from './YouTubePlayer';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ============================================================================
// TRAILER PLAYBACK RULES (STRICT)
// ============================================================================
// Playback may ONLY start as a direct, synchronous result of a user gesture.
//
// SEQUENCE:
// 1. Player is mounted and idle (pre-loaded)
// 2. User performs long-press gesture
// 3. Player receives play command SYNCHRONOUSLY
// 4. Trailer plays
//
// FEED SAFETY:
// - While trailer is playing, swipe gestures are DISABLED
// - Card is locked during playback
// - If feed moves → playback stops cleanly
//
// FAILURE:
// - Silent, no retry, no error UI, poster remains
// ============================================================================

// Long press threshold for trailer preview (400-500ms per spec)
const LONG_PRESS_THRESHOLD = 450;

// Trailer preview duration (10-20 seconds)
const PREVIEW_DURATION = 15;

interface MovieCardProps {
  movie: Movie;
  onSwipe: (direction: 'left' | 'right' | 'up') => void;
  haptic?: boolean;
  showTrailerOnWin?: boolean; // For Spelläge match reveal
  onTrailerEngagement?: (duration: number) => void;
  // Spelläge blind choice mode
  blindMode?: boolean; // Hide title/year until reveal
  isRevealed?: boolean; // Show title after like/save
}

type GestureContext = {
  startX: number;
  startY: number;
};

export function MovieCard({
  movie,
  onSwipe,
  haptic = true,
  showTrailerOnWin = false,
  onTrailerEngagement,
  blindMode = false,
  isRevealed = false,
}: MovieCardProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  // Player ref for synchronous control
  const playerRef = useRef<YouTubePlayerRef>(null);

  // Trailer state
  const [trailer, setTrailer] = useState<TrailerInfo | null>(null);
  const [trailerError, setTrailerError] = useState(false);
  const [isPlayerMounted, setIsPlayerMounted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const previewStartTime = useRef<number>(0);
  const previewTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load trailer data on mount (pre-fetch for readiness)
  React.useEffect(() => {
    getTrailer(movie).then((t) => {
      setTrailer(t);
      // Mount player immediately after getting trailer info
      if (t) setIsPlayerMounted(true);
    }).catch(() => {
      setTrailer(null);
      setTrailerError(true);
    });
  }, [movie.id]);

  // Spelläge match reveal - play trailer when showTrailerOnWin becomes true
  // This is the ONLY exception to user-gesture rule
  React.useEffect(() => {
    if (showTrailerOnWin && trailer && !trailerError && playerRef.current?.isReady()) {
      // Small delay to ensure player is fully ready
      const timer = setTimeout(() => {
        playerRef.current?.play();
        setIsPlaying(true);
        if (haptic) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        // Auto-stop after preview duration
        previewTimeoutRef.current = setTimeout(() => {
          playerRef.current?.stop();
          setIsPlaying(false);
        }, PREVIEW_DURATION * 1000);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [showTrailerOnWin, trailer, trailerError, haptic]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
      }
      // Stop playback cleanly when card unmounts (feed moves)
      playerRef.current?.stop();
    };
  }, []);

  const triggerHaptic = useCallback(() => {
    if (haptic) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [haptic]);

  const handleSwipeComplete = useCallback((direction: 'left' | 'right' | 'up') => {
    // Stop trailer if playing
    if (isPlaying) {
      playerRef.current?.stop();
      setIsPlaying(false);
    }
    triggerHaptic();
    onSwipe(direction);
  }, [isPlaying, triggerHaptic, onSwipe]);

  // Start trailer preview - SYNCHRONOUS play command on gesture
  const startTrailerPreview = useCallback(() => {
    if (!trailer || trailerError) return;
    if (!playerRef.current?.isReady()) return;

    // SYNCHRONOUS play command - directly from gesture handler
    playerRef.current.play();
    previewStartTime.current = Date.now();
    setIsPlaying(true);

    if (haptic) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // Auto-stop after preview duration
    previewTimeoutRef.current = setTimeout(() => {
      playerRef.current?.stop();
      setIsPlaying(false);
      const duration = Date.now() - previewStartTime.current;
      onTrailerEngagement?.(duration);
    }, PREVIEW_DURATION * 1000);
  }, [trailer, trailerError, haptic, onTrailerEngagement]);

  // Stop trailer preview
  const stopTrailerPreview = useCallback(() => {
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current);
    }

    playerRef.current?.stop();
    setIsPlaying(false);

    if (previewStartTime.current > 0) {
      const duration = Date.now() - previewStartTime.current;
      onTrailerEngagement?.(duration);
      previewStartTime.current = 0;
    }
  }, [onTrailerEngagement]);

  // Handle player ready - player is now initialized and idle
  const handlePlayerReady = useCallback(() => {
    // Player is ready, waiting for gesture
  }, []);

  // Handle trailer errors silently - just show poster
  const handleTrailerError = useCallback(() => {
    setTrailerError(true);
    setIsPlaying(false);
    // No error UI - poster remains visible
  }, []);

  // Handle playback blocked (geo/embed restrictions)
  const handlePlaybackBlocked = useCallback(() => {
    setTrailerError(true);
    setIsPlaying(false);
    // Trailer skipped, poster remains, no placeholder
  }, []);

  // Handle player state changes
  const handleStateChange = useCallback((state: number) => {
    if (state === YT_PLAYER_STATE.PLAYING) {
      setIsPlaying(true);
    } else if (state === YT_PLAYER_STATE.ENDED || state === YT_PLAYER_STATE.PAUSED) {
      setIsPlaying(false);
    }
  }, []);

  // Long press handler for trailer preview
  const onLongPressStateChange = useCallback((event: LongPressGestureHandlerGestureEvent) => {
    if (event.nativeEvent.state === State.ACTIVE) {
      startTrailerPreview();
    } else if (
      event.nativeEvent.state === State.END ||
      event.nativeEvent.state === State.CANCELLED ||
      event.nativeEvent.state === State.FAILED
    ) {
      stopTrailerPreview();
    }
  }, [startTrailerPreview, stopTrailerPreview]);

  // Pan gesture handler - DISABLED while trailer is playing
  const gestureHandler = useAnimatedGestureHandler<PanGestureHandlerGestureEvent, GestureContext>({
    onStart: (_, ctx) => {
      ctx.startX = translateX.value;
      ctx.startY = translateY.value;
      // Cancel trailer preview on swipe start
      runOnJS(stopTrailerPreview)();
    },
    onActive: (event, ctx) => {
      translateX.value = ctx.startX + event.translationX;
      translateY.value = ctx.startY + event.translationY;
    },
    onEnd: (event) => {
      // Swipe up for save
      if (translateY.value < -SWIPE.translateThreshold && event.velocityY < 0) {
        translateY.value = withTiming(-SCREEN_HEIGHT, { duration: 200 });
        runOnJS(handleSwipeComplete)('up');
        return;
      }

      // Swipe right for like
      if (translateX.value > SWIPE.translateThreshold || event.velocityX > SWIPE.velocityThreshold) {
        translateX.value = withTiming(SCREEN_WIDTH * 1.5, { duration: 200 });
        runOnJS(handleSwipeComplete)('right');
        return;
      }

      // Swipe left for pass
      if (translateX.value < -SWIPE.translateThreshold || event.velocityX < -SWIPE.velocityThreshold) {
        translateX.value = withTiming(-SCREEN_WIDTH * 1.5, { duration: 200 });
        runOnJS(handleSwipeComplete)('left');
        return;
      }

      // Snap back
      translateX.value = withSpring(0, { damping: 25, stiffness: 400 });
      translateY.value = withSpring(0, { damping: 25, stiffness: 400 });
    },
  });

  const cardStyle = useAnimatedStyle(() => {
    const rotation = interpolate(
      translateX.value,
      [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
      [-SWIPE.rotation, 0, SWIPE.rotation],
      Extrapolation.CLAMP
    );

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotation}deg` },
      ],
    };
  });

  // Determine if title should be shown
  const showTitle = !blindMode || isRevealed;

  // Can show trailer overlay when playing
  const showTrailerOverlay = isPlaying && trailer && !trailerError;

  return (
    <LongPressGestureHandler
      onHandlerStateChange={onLongPressStateChange}
      minDurationMs={LONG_PRESS_THRESHOLD}
      enabled={!!trailer && !trailerError && !isPlaying}
    >
      <Animated.View style={{ flex: 1 }}>
        {/* Pan gesture disabled while trailer is playing */}
        <PanGestureHandler onGestureEvent={gestureHandler} enabled={!isPlaying}>
          <Animated.View className="flex-1" style={cardStyle}>
            <View style={styles.cardContainer}>
              {/* Movie poster - always present as base layer */}
              <Image
                source={{ uri: movie.posterUrl }}
                style={styles.posterImage}
                contentFit="cover"
                placeholder={PLACEHOLDER_BLUR_HASH}
                transition={IMAGE_TRANSITION}
                cachePolicy="memory-disk"
              />

              {/* Pre-mounted YouTube player (hidden until playing) */}
              {isPlayerMounted && trailer && !trailerError && (
                <View style={[styles.trailerOverlay, { opacity: showTrailerOverlay ? 1 : 0 }]}>
                  <YouTubePlayer
                    ref={playerRef}
                    videoId={trailer.videoId}
                    startSeconds={0}
                    endSeconds={PREVIEW_DURATION}
                    loop
                    onReady={handlePlayerReady}
                    onError={handleTrailerError}
                    onStateChange={handleStateChange}
                    onPlaybackBlocked={handlePlaybackBlocked}
                  />
                </View>
              )}

              {/* Subtle gradient for title at bottom only */}
              {showTitle && (
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.9)']}
                  locations={[0.55, 0.75, 1]}
                  style={styles.gradient}
                />
              )}

              {/* Title + Year - hidden in blind mode until revealed */}
              {showTitle && (
                <View style={styles.infoContainer}>
                  <Text style={styles.title} numberOfLines={2}>
                    {movie.title}
                  </Text>
                  <Text style={styles.yearText}>{movie.year}</Text>
                </View>
              )}
            </View>
          </Animated.View>
        </PanGestureHandler>
      </Animated.View>
    </LongPressGestureHandler>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: COLORS.bgCard,
  },
  posterImage: {
    width: '100%',
    height: '100%',
  },
  trailerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '35%',
  },
  infoContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 24,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '600',
    letterSpacing: -0.5,
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  yearText: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 16,
    fontWeight: '400',
  },
});
