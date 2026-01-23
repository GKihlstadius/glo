import React, { useCallback, useRef, useState, useEffect } from 'react';
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
  Easing,
} from 'react-native-reanimated';
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
} from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { Movie } from '@/lib/types';
import { SWIPE, COLORS } from '@/lib/constants';
import { PLACEHOLDER_BLUR_HASH, IMAGE_TRANSITION } from '@/lib/image-cache';
import { getTrailer, TrailerInfo } from '@/lib/trailer';
import { YouTubePlayer, YouTubePlayerRef, YT_PLAYER_STATE } from './YouTubePlayer';
import {
  areTrailersEnabled,
  recordAutoplaySuccess,
  recordAutoplayFailure,
  recordSwipeStopSuccess,
  markGateFailed,
  DEFAULT_PLAYBACK_CONFIG,
} from '@/lib/trailer-system';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ============================================================================
// TRAILER PLAYBACK — DISABLED
// ============================================================================
// Trailers are completely disabled until the system is rebuilt.
// Posters only. No autoplay. No inline video.
// ============================================================================

// Autoplay delay range per spec
const AUTOPLAY_DELAY_MIN = 900;
const AUTOPLAY_DELAY_MAX = 1400;

// Preview duration
const PREVIEW_DURATION = DEFAULT_PLAYBACK_CONFIG.previewDurationSeconds;

interface MovieCardProps {
  movie: Movie;
  onSwipe: (direction: 'left' | 'right' | 'up') => void;
  haptic?: boolean;
  isActive?: boolean; // Is this the top card (should autoplay)?
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
  isActive = true,
  showTrailerOnWin = false,
  onTrailerEngagement,
  blindMode = false,
  isRevealed = false,
}: MovieCardProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  // Reveal animation for blind mode
  const revealOpacity = useSharedValue(blindMode && !isRevealed ? 0 : 1);

  // Animate reveal when isRevealed changes from false to true
  useEffect(() => {
    if (blindMode && isRevealed) {
      // Animate title reveal with smooth fade-in
      revealOpacity.value = withTiming(1, {
        duration: 400,
        easing: Easing.out(Easing.ease),
      });
    } else if (!blindMode) {
      // Not in blind mode, always visible
      revealOpacity.value = 1;
    }
  }, [isRevealed, blindMode]);

  // Player ref for synchronous control
  const playerRef = useRef<YouTubePlayerRef>(null);

  // Trailer state
  const [trailer, setTrailer] = useState<TrailerInfo | null>(null);
  const [trailerError, setTrailerError] = useState(false);
  const [isPlayerMounted, setIsPlayerMounted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [trailersEnabled, setTrailersEnabled] = useState(areTrailersEnabled());

  // Autoplay tracking
  const autoplayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previewTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playbackStartTime = useRef<number>(0);
  const hasAutoplayedRef = useRef(false);

  // Check if trailers are enabled via delivery gates
  useEffect(() => {
    setTrailersEnabled(areTrailersEnabled());
  }, []);

  // Load trailer data on mount (pre-fetch for readiness)
  useEffect(() => {
    console.log('[TRAILER] Loading trailer for movie:', movie.id, movie.title, 'trailersEnabled:', trailersEnabled);
    if (!trailersEnabled) {
      console.log('[TRAILER] Trailers disabled, skipping');
      return;
    }

    getTrailer(movie).then((t) => {
      console.log('[TRAILER] Got trailer data:', t?.videoId || 'null');
      setTrailer(t);
      // Mount player immediately after getting trailer info
      if (t) {
        console.log('[TRAILER] Mounting player for video:', t.videoId);
        setIsPlayerMounted(true);
      }
    }).catch((err) => {
      console.log('[TRAILER] Error loading trailer:', err);
      setTrailer(null);
      setTrailerError(true);
    });
  }, [movie.id, trailersEnabled]);

  // ============================================================================
  // NETFLIX-STYLE AUTOPLAY: Delayed autoplay when card becomes active
  // ============================================================================
  useEffect(() => {
    // Only autoplay if:
    // - Card is active (top of stack)
    // - Trailers are enabled (gates pass)
    // - We have a trailer
    // - Player is mounted and ready
    // - Haven't already autoplayed for this card
    // - Not in Spelläge win mode (different trigger)
    console.log('[TRAILER] Autoplay check - isActive:', isActive, 'trailersEnabled:', trailersEnabled, 'trailer:', !!trailer, 'trailerError:', trailerError, 'isPlayerMounted:', isPlayerMounted, 'hasAutoplayed:', hasAutoplayedRef.current);

    if (
      !isActive ||
      !trailersEnabled ||
      !trailer ||
      trailerError ||
      !isPlayerMounted ||
      hasAutoplayedRef.current ||
      showTrailerOnWin
    ) {
      console.log('[TRAILER] Autoplay conditions not met, skipping');
      return;
    }

    console.log('[TRAILER] Starting autoplay sequence for:', trailer.videoId);

    // Wait for player to be ready, then start autoplay delay
    const checkAndAutoplay = () => {
      const isReady = playerRef.current?.isReady();
      console.log('[TRAILER] Checking if player ready:', isReady);

      if (!isReady) {
        // Player not ready, retry in 100ms
        autoplayTimeoutRef.current = setTimeout(checkAndAutoplay, 100);
        return;
      }

      // Calculate random delay (900-1400ms)
      const delay = AUTOPLAY_DELAY_MIN + Math.random() * (AUTOPLAY_DELAY_MAX - AUTOPLAY_DELAY_MIN);
      console.log('[TRAILER] Player ready, scheduling autoplay with delay:', delay);

      // Schedule autoplay
      autoplayTimeoutRef.current = setTimeout(() => {
        // Final check before playing
        if (!playerRef.current?.isReady() || hasAutoplayedRef.current) {
          console.log('[TRAILER] Final check failed, not playing');
          return;
        }

        console.log('[TRAILER] Playing trailer now!');
        // Start playback
        playerRef.current.play();
        hasAutoplayedRef.current = true;
        playbackStartTime.current = Date.now();
        setIsPlaying(true);
        recordAutoplaySuccess();

        // Auto-stop after preview duration
        previewTimeoutRef.current = setTimeout(() => {
          stopPlayback();
        }, PREVIEW_DURATION * 1000);
      }, delay);
    };

    // Small initial delay to ensure card is "settled"
    autoplayTimeoutRef.current = setTimeout(checkAndAutoplay, 100);

    return () => {
      if (autoplayTimeoutRef.current) {
        clearTimeout(autoplayTimeoutRef.current);
      }
    };
  }, [isActive, trailersEnabled, trailer, trailerError, isPlayerMounted, showTrailerOnWin]);

  // Spelläge match reveal - play trailer when showTrailerOnWin becomes true
  useEffect(() => {
    if (showTrailerOnWin && trailer && !trailerError && playerRef.current?.isReady()) {
      const timer = setTimeout(() => {
        playerRef.current?.play();
        setIsPlaying(true);
        playbackStartTime.current = Date.now();

        if (haptic) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        // Auto-stop after preview duration
        previewTimeoutRef.current = setTimeout(() => {
          stopPlayback();
        }, PREVIEW_DURATION * 1000);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [showTrailerOnWin, trailer, trailerError, haptic]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoplayTimeoutRef.current) {
        clearTimeout(autoplayTimeoutRef.current);
      }
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
      }
      // Stop playback cleanly when card unmounts
      playerRef.current?.stop();
    };
  }, []);

  // ============================================================================
  // STOP PLAYBACK — Must be INSTANT
  // ============================================================================
  const stopPlayback = useCallback(() => {
    // Clear any pending timeouts
    if (autoplayTimeoutRef.current) {
      clearTimeout(autoplayTimeoutRef.current);
      autoplayTimeoutRef.current = null;
    }
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current);
      previewTimeoutRef.current = null;
    }

    // Stop player immediately
    playerRef.current?.stop();

    // Track engagement
    if (playbackStartTime.current > 0) {
      const duration = Date.now() - playbackStartTime.current;
      onTrailerEngagement?.(duration);
      playbackStartTime.current = 0;
    }

    // Record successful stop for gate metrics
    if (isPlaying) {
      recordSwipeStopSuccess();
    }

    setIsPlaying(false);
  }, [isPlaying, onTrailerEngagement]);

  const triggerHaptic = useCallback(() => {
    if (haptic) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [haptic]);

  const handleSwipeComplete = useCallback((direction: 'left' | 'right' | 'up') => {
    // STOP TRAILER IMMEDIATELY on swipe
    stopPlayback();
    triggerHaptic();
    onSwipe(direction);
  }, [stopPlayback, triggerHaptic, onSwipe]);

  // Handle trailer errors silently - just show poster
  const handleTrailerError = useCallback(() => {
    setTrailerError(true);
    setIsPlaying(false);
    recordAutoplayFailure();
    markGateFailed();
    // No error UI - poster remains visible
  }, []);

  // Handle playback blocked (geo/embed restrictions)
  const handlePlaybackBlocked = useCallback(() => {
    setTrailerError(true);
    setIsPlaying(false);
    recordAutoplayFailure();
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

  // Handle player ready
  const handlePlayerReady = useCallback(() => {
    // Player is ready - autoplay logic handles the rest
  }, []);

  // ============================================================================
  // PAN GESTURE — Stop trailer on ANY gesture start
  // ============================================================================
  const gestureHandler = useAnimatedGestureHandler<PanGestureHandlerGestureEvent, GestureContext>({
    onStart: (_, ctx) => {
      ctx.startX = translateX.value;
      ctx.startY = translateY.value;
      // STOP TRAILER IMMEDIATELY on swipe start
      runOnJS(stopPlayback)();
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

  // Determine if title should be shown (in blind mode, show after reveal starts)
  const showTitle = !blindMode || isRevealed;

  // Animated style for reveal transition
  const revealAnimatedStyle = useAnimatedStyle(() => ({
    opacity: revealOpacity.value,
  }));

  // Can show trailer overlay when playing
  const showTrailerOverlay = isPlaying && trailer && !trailerError;

  return (
    <PanGestureHandler onGestureEvent={gestureHandler}>
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
            <Animated.View style={[styles.gradient, blindMode && revealAnimatedStyle]}>
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.9)']}
                locations={[0.55, 0.75, 1]}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
          )}

          {/* Title + Year - hidden in blind mode until revealed with fade animation */}
          {showTitle && (
            <Animated.View style={[styles.infoContainer, blindMode && revealAnimatedStyle]}>
              <Text style={styles.title} numberOfLines={2}>
                {movie.title}
              </Text>
              <Text style={styles.yearText}>{movie.year}</Text>
            </Animated.View>
          )}
        </View>
      </Animated.View>
    </PanGestureHandler>
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
    overflow: 'hidden',
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
