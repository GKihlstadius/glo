import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
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
import { Heart, X, Bookmark } from 'lucide-react-native';
import { Movie } from '@/lib/types';
import { SWIPE, COLORS } from '@/lib/constants';
import { PLACEHOLDER_BLUR_HASH, IMAGE_TRANSITION } from '@/lib/image-cache';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface MovieCardProps {
  movie: Movie;
  onSwipe: (direction: 'left' | 'right' | 'up') => void;
  haptic?: boolean;
}

type GestureContext = {
  startX: number;
  startY: number;
};

export function MovieCard({ movie, onSwipe, haptic = true }: MovieCardProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

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

  return (
    <PanGestureHandler onGestureEvent={gestureHandler}>
      <Animated.View className="flex-1" style={cardStyle}>
        <View style={styles.cardContainer}>
          {/* Full-bleed poster - the film is the only thing you notice */}
          <Image
            source={{ uri: movie.posterUrl }}
            style={styles.posterImage}
            contentFit="cover"
            placeholder={PLACEHOLDER_BLUR_HASH}
            transition={IMAGE_TRANSITION}
            cachePolicy="memory-disk"
          />

          {/* Subtle gradient for title at bottom only */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.95)']}
            locations={[0.6, 0.8, 1]}
            style={styles.gradient}
          />

          {/* Like indicator - appears during right swipe */}
          <Animated.View style={[styles.indicatorRight, likeOpacity]}>
            <View style={[styles.indicatorCircle, { backgroundColor: 'rgba(34, 197, 94, 0.9)' }]}>
              <Heart size={28} color="#fff" fill="#fff" />
            </View>
          </Animated.View>

          {/* Pass indicator - appears during left swipe */}
          <Animated.View style={[styles.indicatorLeft, passOpacity]}>
            <View style={[styles.indicatorCircle, { backgroundColor: 'rgba(239, 68, 68, 0.9)' }]}>
              <X size={28} color="#fff" strokeWidth={3} />
            </View>
          </Animated.View>

          {/* Save indicator - appears during up swipe */}
          <Animated.View style={[styles.indicatorTop, saveOpacity]}>
            <View style={[styles.indicatorCircle, { backgroundColor: 'rgba(234, 179, 8, 0.9)' }]}>
              <Bookmark size={28} color="#fff" fill="#fff" />
            </View>
          </Animated.View>

          {/* Title + Year only - subtle at the bottom of the poster */}
          <View style={styles.infoContainer}>
            <Text style={styles.title} numberOfLines={2}>
              {movie.title}
            </Text>
            <Text style={styles.yearText}>{movie.year}</Text>
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
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '30%',
  },
  indicatorRight: {
    position: 'absolute',
    top: '40%',
    right: 24,
  },
  indicatorLeft: {
    position: 'absolute',
    top: '40%',
    left: 24,
  },
  indicatorTop: {
    position: 'absolute',
    top: '30%',
    alignSelf: 'center',
  },
  indicatorCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: 26,
    fontWeight: '600',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  yearText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 16,
  },
});
