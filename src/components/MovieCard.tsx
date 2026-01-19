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
import { YouTubePlayer } from './YouTubePlayer';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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

  // Trailer preview state
  const [isPreviewingTrailer, setIsPreviewingTrailer] = useState(false);
  const [trailer, setTrailer] = useState<TrailerInfo | null>(null);
  const [trailerError, setTrailerError] = useState(false);
  const previewStartTime = useRef<number>(0);
  const previewTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load trailer data on mount
  React.useEffect(() => {
    getTrailer(movie).then(setTrailer).catch(() => setTrailer(null));
  }, [movie.id]);

  // Auto-play trailer for match reveal (Spelläge Together)
  React.useEffect(() => {
    if (showTrailerOnWin && trailer && !trailerError) {
      setIsPreviewingTrailer(true);
      if (haptic) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      // Auto-stop after preview duration
      previewTimeoutRef.current = setTimeout(() => {
        setIsPreviewingTrailer(false);
      }, PREVIEW_DURATION * 1000);
    }

    return () => {
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
      }
    };
  }, [showTrailerOnWin, trailer, trailerError, haptic]);

  const triggerHaptic = useCallback(() => {
    if (haptic) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [haptic]);

  const handleSwipeComplete = useCallback((direction: 'left' | 'right' | 'up') => {
    // Stop trailer preview if active
    if (isPreviewingTrailer) {
      setIsPreviewingTrailer(false);
    }
    triggerHaptic();
    onSwipe(direction);
  }, [isPreviewingTrailer, triggerHaptic, onSwipe]);

  // Start trailer preview (long press)
  const startTrailerPreview = useCallback(() => {
    if (!trailer || trailerError) return;

    previewStartTime.current = Date.now();
    setIsPreviewingTrailer(true);

    if (haptic) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // Auto-stop after preview duration
    previewTimeoutRef.current = setTimeout(() => {
      setIsPreviewingTrailer(false);
      const duration = Date.now() - previewStartTime.current;
      onTrailerEngagement?.(duration);
    }, PREVIEW_DURATION * 1000);
  }, [trailer, trailerError, haptic, onTrailerEngagement]);

  // Stop trailer preview (release)
  const stopTrailerPreview = useCallback(() => {
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current);
    }
    setIsPreviewingTrailer(false);

    if (previewStartTime.current > 0) {
      const duration = Date.now() - previewStartTime.current;
      onTrailerEngagement?.(duration);
      previewStartTime.current = 0;
    }
  }, [onTrailerEngagement]);

  // Handle trailer errors silently - just show poster
  const handleTrailerError = useCallback((error: number) => {
    console.log('Trailer error (silent):', error);
    setTrailerError(true);
    setIsPreviewingTrailer(false);
    // No error UI - poster remains visible
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

  // Pan gesture handler
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

      // Snap back - immediate, physical feel
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
  // In blind mode: only show if explicitly revealed
  // In normal mode: always show
  const showTitle = !blindMode || isRevealed;

  return (
    <LongPressGestureHandler
      onHandlerStateChange={onLongPressStateChange}
      minDurationMs={LONG_PRESS_THRESHOLD}
      enabled={!!trailer && !trailerError}
    >
      <Animated.View style={{ flex: 1 }}>
        <PanGestureHandler onGestureEvent={gestureHandler}>
          <Animated.View className="flex-1" style={cardStyle}>
            <View style={styles.cardContainer}>
              {/* Movie poster - the hero, always primary */}
              <Image
                source={{ uri: movie.posterUrl }}
                style={styles.posterImage}
                contentFit="cover"
                placeholder={PLACEHOLDER_BLUR_HASH}
                transition={IMAGE_TRANSITION}
                cachePolicy="memory-disk"
              />

              {/* Inline trailer preview using YouTube IFrame Player API */}
              {isPreviewingTrailer && trailer && !trailerError && (
                <View style={styles.trailerOverlay}>
                  <YouTubePlayer
                    videoId={trailer.videoId}
                    autoplay={true}
                    muted={true}
                    startSeconds={0}
                    endSeconds={PREVIEW_DURATION}
                    loop={true}
                    onError={handleTrailerError}
                  />
                </View>
              )}

              {/* Subtle gradient for title at bottom only - only when showing title */}
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
