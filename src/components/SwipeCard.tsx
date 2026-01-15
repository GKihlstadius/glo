import React, { useMemo, useEffect } from 'react';
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
import { ProviderRow } from './ProviderButton';
import { PLACEHOLDER_BLUR_HASH, IMAGE_TRANSITION, prefetchImage } from '@/lib/image-cache';

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
}: SwipeCardProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  // Get streaming offers for this movie
  const offers = useMemo(() => {
    return getStreamingOffers(movie.id, countryCode);
  }, [movie.id, countryCode]);

  // Prefetch poster if it's an Unsplash URL
  useEffect(() => {
    if (movie.posterUrl) {
      prefetchImage(movie.posterUrl);
    }
  }, [movie.posterUrl]);

  const triggerHaptic = () => {
    if (haptic) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const handleSwipeComplete = (direction: 'left' | 'right' | 'up') => {
    triggerHaptic();
    onSwipe(direction);
  };

  const gestureHandler = useAnimatedGestureHandler<PanGestureHandlerGestureEvent, GestureContext>({
    onStart: (_, ctx) => {
      ctx.startX = translateX.value;
      ctx.startY = translateY.value;
    },
    onActive: (event, ctx) => {
      translateX.value = ctx.startX + event.translationX;
      translateY.value = ctx.startY + event.translationY;
    },
    onEnd: (event) => {
      // Swipe up for save
      if (translateY.value < -SWIPE.translateThreshold && event.velocityY < 0) {
        translateY.value = withTiming(-SCREEN_HEIGHT, { duration: 250 });
        runOnJS(handleSwipeComplete)('up');
        return;
      }

      // Swipe right for like
      if (translateX.value > SWIPE.translateThreshold || event.velocityX > SWIPE.velocityThreshold) {
        translateX.value = withTiming(SCREEN_WIDTH * 1.5, { duration: 250 });
        runOnJS(handleSwipeComplete)('right');
        return;
      }

      // Swipe left for pass
      if (translateX.value < -SWIPE.translateThreshold || event.velocityX < -SWIPE.velocityThreshold) {
        translateX.value = withTiming(-SCREEN_WIDTH * 1.5, { duration: 250 });
        runOnJS(handleSwipeComplete)('left');
        return;
      }

      // Snap back
      translateX.value = withSpring(0, { damping: 20 });
      translateY.value = withSpring(0, { damping: 20 });
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

  // Icons only appear while swiping - then disappear
  const likeOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, SWIPE.translateThreshold], [0, 1], Extrapolation.CLAMP),
  }));

  const passOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-SWIPE.translateThreshold, 0], [1, 0], Extrapolation.CLAMP),
  }));

  const saveOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(translateY.value, [-SWIPE.translateThreshold, 0], [1, 0], Extrapolation.CLAMP),
  }));

  // Format runtime
  const formatRuntime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  // Card behind - static, no interaction
  if (!isTop) {
    return (
      <View
        className="absolute w-full h-full"
        style={{ transform: [{ scale: 0.95 }], opacity: 0.5 }}
      >
        <Image
          source={{ uri: movie.posterUrl }}
          style={styles.posterImage}
          contentFit="cover"
          placeholder={PLACEHOLDER_BLUR_HASH}
          transition={IMAGE_TRANSITION}
        />
      </View>
    );
  }

  return (
    <PanGestureHandler onGestureEvent={gestureHandler}>
      <Animated.View className="absolute w-full h-full" style={cardStyle}>
        {/* Full-bleed poster - edge to edge with rounded corners */}
        <View style={styles.cardContainer}>
          <Image
            source={{ uri: movie.posterUrl }}
            style={styles.posterImage}
            contentFit="cover"
            placeholder={PLACEHOLDER_BLUR_HASH}
            transition={IMAGE_TRANSITION}
            cachePolicy="memory-disk"
          />

          {/* Gradient overlay for text readability */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.9)']}
            locations={[0.5, 0.7, 1]}
            style={styles.gradient}
          />

          {/* Like indicator */}
          <Animated.View style={[styles.indicatorLeft, likeOpacity]}>
            <View style={styles.indicatorCircle}>
              <Heart size={32} color="#fff" fill="#fff" />
            </View>
          </Animated.View>

          {/* Pass indicator */}
          <Animated.View style={[styles.indicatorRight, passOpacity]}>
            <View style={[styles.indicatorCircle, { backgroundColor: 'rgba(239, 68, 68, 0.9)' }]}>
              <X size={32} color="#fff" strokeWidth={3} />
            </View>
          </Animated.View>

          {/* Save indicator */}
          <Animated.View style={[styles.indicatorTop, saveOpacity]}>
            <View style={[styles.indicatorCircle, { backgroundColor: 'rgba(234, 179, 8, 0.9)' }]}>
              <Bookmark size={32} color="#fff" fill="#fff" />
            </View>
          </Animated.View>

          {/* Rating badge - top right */}
          {movie.ratingAvg > 0 && (
            <View style={styles.ratingBadge}>
              <Star size={12} color="#FCD34D" fill="#FCD34D" />
              <Text style={styles.ratingText}>{movie.ratingAvg.toFixed(1)}</Text>
            </View>
          )}

          {/* Debug info - dev only */}
          {showDebug && debugInfo && (
            <View style={styles.debugOverlay}>
              <Text style={styles.debugText}>Bucket: {debugInfo.bucket}</Text>
              <Text style={styles.debugText}>Score: {debugInfo.score?.toFixed(1)}</Text>
              <Text style={styles.debugText}>Why: {debugInfo.reason}</Text>
            </View>
          )}

          {/* Title + metadata + providers at bottom */}
          <View style={styles.infoContainer}>
            <View style={styles.titleRow}>
              <View style={styles.titleContainer}>
                <Text style={styles.title} numberOfLines={2}>
                  {movie.title}
                </Text>
                <View style={styles.metaRow}>
                  <Text style={styles.metaText}>{movie.year}</Text>
                  <Text style={styles.metaDot}>·</Text>
                  <Text style={styles.metaText}>{formatRuntime(movie.runtime)}</Text>
                  {movie.genres?.[0] && (
                    <>
                      <Text style={styles.metaDot}>·</Text>
                      <Text style={styles.metaText} numberOfLines={1}>
                        {movie.genres[0].charAt(0).toUpperCase() + movie.genres[0].slice(1)}
                      </Text>
                    </>
                  )}
                </View>
              </View>
              {/* Provider icons - tappable to open streaming app */}
              {offers.length > 0 && (
                <View style={styles.providersContainer}>
                  <ProviderRow offers={offers} size="small" haptic={haptic} maxVisible={3} />
                </View>
              )}
            </View>
          </View>
        </View>
      </Animated.View>
    </PanGestureHandler>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: COLORS.bgCard,
  },
  posterImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '40%',
  },
  indicatorLeft: {
    position: 'absolute',
    top: 24,
    left: 24,
  },
  indicatorRight: {
    position: 'absolute',
    top: 24,
    right: 24,
  },
  indicatorTop: {
    position: 'absolute',
    top: 24,
    alignSelf: 'center',
  },
  indicatorCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(34, 197, 94, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  ratingBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  ratingText: {
    color: '#FCD34D',
    fontSize: 13,
    fontWeight: '600',
  },
  debugOverlay: {
    position: 'absolute',
    top: 60,
    left: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 8,
    borderRadius: 8,
  },
  debugText: {
    color: '#00FF00',
    fontSize: 10,
    fontFamily: 'monospace',
  },
  infoContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  metaText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
  },
  metaDot: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 14,
    marginHorizontal: 6,
  },
  providersContainer: {
    flexShrink: 0,
  },
});
