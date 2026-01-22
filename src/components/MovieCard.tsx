import React, { useCallback } from 'react';
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
} from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { Movie } from '@/lib/types';
import { SWIPE, COLORS } from '@/lib/constants';
import { PLACEHOLDER_BLUR_HASH, IMAGE_TRANSITION } from '@/lib/image-cache';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ============================================================================
// MOVIE CARD — Pure Poster Component
// ============================================================================
// This component handles ONLY the poster display and swipe gestures.
// Trailer playback is handled by the persistent TrailerPlayer in index.tsx.
// See US-001 through US-008 for new trailer architecture.
// ============================================================================

interface MovieCardProps {
  movie: Movie;
  onSwipe: (direction: 'left' | 'right' | 'up') => void;
  haptic?: boolean;
  // Spelläge blind choice mode
  blindMode?: boolean; // Hide title/year until reveal
  isRevealed?: boolean; // Show title after like/save
  // Gesture callbacks for trailer control (new persistent player system)
  onGestureStart?: () => void;
  onGestureEnd?: () => void;
}

type GestureContext = {
  startX: number;
  startY: number;
};

export function MovieCard({
  movie,
  onSwipe,
  haptic = true,
  blindMode = false,
  isRevealed = false,
  onGestureStart,
  onGestureEnd,
}: MovieCardProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const triggerHaptic = useCallback(() => {
    if (haptic) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [haptic]);

  const handleSwipeComplete = useCallback((direction: 'left' | 'right' | 'up') => {
    triggerHaptic();
    onSwipe(direction);
  }, [triggerHaptic, onSwipe]);

  // ============================================================================
  // PAN GESTURE — Notify parent for trailer control
  // ============================================================================
  
  // Wrapper to call onGestureStart safely
  const handleGestureStart = useCallback(() => {
    onGestureStart?.();
  }, [onGestureStart]);

  // Wrapper to call onGestureEnd safely
  const handleGestureEnd = useCallback(() => {
    onGestureEnd?.();
  }, [onGestureEnd]);

  const gestureHandler = useAnimatedGestureHandler<PanGestureHandlerGestureEvent, GestureContext>({
    onStart: (_, ctx) => {
      ctx.startX = translateX.value;
      ctx.startY = translateY.value;
      // Notify parent to stop trailer
      runOnJS(handleGestureStart)();
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

      // Snap back - gesture ended without swipe, restart autoplay
      translateX.value = withSpring(0, { damping: 25, stiffness: 400 });
      translateY.value = withSpring(0, { damping: 25, stiffness: 400 });
      runOnJS(handleGestureEnd)();
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
