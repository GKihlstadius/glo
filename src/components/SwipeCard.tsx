import React, { useMemo } from 'react';
import { View, Text, Dimensions, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
  runOnJS,
} from 'react-native-reanimated';
import { PanGestureHandler, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { Heart, X, Bookmark, Star } from 'lucide-react-native';
import { Movie } from '@/lib/types';
import { SWIPE, COLORS } from '@/lib/constants';
import { getStreamingOffers } from '@/lib/movies';
import { StreamingRow } from './StreamingIcon';
import { PLACEHOLDER_BLUR_HASH, IMAGE_TRANSITION } from '@/lib/image-cache';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SwipeCardProps {
  movie: Movie;
  onSwipe: (direction: 'left' | 'right' | 'up') => void;
  isTop: boolean;
  haptic?: boolean;
  countryCode?: string;
  showDebug?: boolean;
  debugInfo?: {
    bucket?: string;
    score?: number;
    reason?: string;
  };
  /**
   * Called IMMEDIATELY when gesture starts (before any movement).
   * Used for instant trailer stop integration (US-008).
   */
  onGestureStart?: () => void;
  /**
   * Called when gesture ends (touch released without completing swipe).
   */
  onGestureEnd?: () => void;
}

type GestureContext = {
  startX: number;
  startY: number;
};

export function SwipeCard({
  movie,
  onSwipe,
  isTop,
  haptic = true,
  countryCode = 'US',
  showDebug = false,
  debugInfo,
  onGestureStart,
  onGestureEnd,
}: SwipeCardProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  // Get streaming offers for this movie - max 4 shown
  const offers = useMemo(() => {
    return getStreamingOffers(movie.id, countryCode).slice(0, 4);
  }, [movie.id, countryCode]);

  const triggerHaptic = () => {
    if (haptic) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const handleSwipeComplete = (direction: 'left' | 'right' | 'up') => {
    triggerHaptic();
    onSwipe(direction);
  };

  // Wrapper functions for gesture callbacks to ensure they exist before calling
  const handleGestureStart = () => {
    onGestureStart?.();
  };

  const handleGestureEnd = () => {
    onGestureEnd?.();
  };

  const gestureHandler = useAnimatedGestureHandler<PanGestureHandlerGestureEvent, GestureContext>({
    onStart: (_, ctx) => {
      ctx.startX = translateX.value;
      ctx.startY = translateY.value;
      // CRITICAL: Call onGestureStart IMMEDIATELY for instant trailer stop (US-008)
      // This must happen in the same frame as gesture start (<16ms)
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

      // Snap back - no swipe completed, call gesture end
      runOnJS(handleGestureEnd)();
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

  // Swipe indicators - subtle, only during gesture
  const likeOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, SWIPE.translateThreshold], [0, 1], Extrapolation.CLAMP),
  }));

  const passOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-SWIPE.translateThreshold, 0], [1, 0], Extrapolation.CLAMP),
  }));

  const saveOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(translateY.value, [-SWIPE.translateThreshold, 0], [1, 0], Extrapolation.CLAMP),
  }));

  // No stacked cards - spec says "No stacked cards"
  if (!isTop) {
    return null;
  }

  return (
    <PanGestureHandler onGestureEvent={gestureHandler}>
      <Animated.View className="flex-1" style={cardStyle}>
        <View style={styles.cardContainer}>
          {/* Full-bleed poster - 70-80% of screen */}
          <Image
            source={{ uri: movie.posterUrl }}
            style={styles.posterImage}
            contentFit="cover"
            placeholder={PLACEHOLDER_BLUR_HASH}
            transition={IMAGE_TRANSITION}
            cachePolicy="memory-disk"
          />

          {/* Subtle gradient for text - no heavy overlays */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.85)']}
            locations={[0.55, 0.75, 1]}
            style={styles.gradient}
          />

          {/* Like indicator - green circle */}
          <Animated.View style={[styles.indicatorLeft, likeOpacity]}>
            <View style={[styles.indicatorCircle, { backgroundColor: 'rgba(34, 197, 94, 0.9)' }]}>
              <Heart size={28} color="#fff" fill="#fff" />
            </View>
          </Animated.View>

          {/* Pass indicator - red circle */}
          <Animated.View style={[styles.indicatorRight, passOpacity]}>
            <View style={[styles.indicatorCircle, { backgroundColor: 'rgba(239, 68, 68, 0.9)' }]}>
              <X size={28} color="#fff" strokeWidth={3} />
            </View>
          </Animated.View>

          {/* Save indicator - yellow circle */}
          <Animated.View style={[styles.indicatorTop, saveOpacity]}>
            <View style={[styles.indicatorCircle, { backgroundColor: 'rgba(234, 179, 8, 0.9)' }]}>
              <Bookmark size={28} color="#fff" fill="#fff" />
            </View>
          </Animated.View>

          {/* Rating badge - top right, small */}
          {movie.ratingAvg > 0 && (
            <View style={styles.ratingBadge}>
              <Star size={11} color="#FCD34D" fill="#FCD34D" />
              <Text style={styles.ratingText}>{movie.ratingAvg.toFixed(1)}</Text>
            </View>
          )}

          {/* Debug info - dev only */}
          {showDebug && debugInfo && (
            <View style={styles.debugOverlay}>
              <Text style={styles.debugText}>{debugInfo.bucket} | {debugInfo.score?.toFixed(0)}</Text>
              <Text style={styles.debugText}>{debugInfo.reason}</Text>
            </View>
          )}

          {/* Bottom info: Title + Year only (spec: "Title + year only") */}
          <View style={styles.infoContainer}>
            {/* Title and year */}
            <Text style={styles.title} numberOfLines={2}>
              {movie.title}
            </Text>
            <Text style={styles.yearText}>{movie.year}</Text>

            {/* Streaming icons - non-interactive brand logos */}
            {offers.length > 0 && (
              <View style={styles.providersContainer}>
                <StreamingRow providerIds={offers.map(o => o.providerId)} maxVisible={4} />
              </View>
            )}
          </View>
        </View>
      </Animated.View>
    </PanGestureHandler>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLORS.bgCard,
  },
  posterImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '35%',
  },
  indicatorLeft: {
    position: 'absolute',
    top: 20,
    left: 20,
  },
  indicatorRight: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
  indicatorTop: {
    position: 'absolute',
    top: 20,
    alignSelf: 'center',
  },
  indicatorCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 3,
  },
  ratingText: {
    color: '#FCD34D',
    fontSize: 12,
    fontWeight: '600',
  },
  debugOverlay: {
    position: 'absolute',
    top: 60,
    left: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 6,
    borderRadius: 4,
  },
  debugText: {
    color: '#00FF00',
    fontSize: 9,
    fontFamily: 'monospace',
  },
  infoContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 20,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  yearText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 15,
    marginBottom: 12,
  },
  providersContainer: {
    marginTop: 4,
  },
});
