import React from 'react';
import { View, Dimensions } from 'react-native';
import { Image } from 'expo-image';
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
import { SWIPE } from '@/lib/constants';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SwipeCardProps {
  movie: Movie;
  onSwipe: (direction: 'left' | 'right' | 'up') => void;
  isTop: boolean;
  haptic?: boolean;
}

type GestureContext = {
  startX: number;
  startY: number;
};

export function SwipeCard({ movie, onSwipe, isTop, haptic = true }: SwipeCardProps) {
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

  // Card behind - static, no interaction
  if (!isTop) {
    return (
      <View
        className="absolute w-full h-full"
        style={{ transform: [{ scale: 0.95 }], opacity: 0.5 }}
      >
        <Image
          source={{ uri: movie.posterUrl }}
          style={{ width: '100%', height: '100%', borderRadius: 2 }}
          contentFit="cover"
        />
      </View>
    );
  }

  return (
    <PanGestureHandler onGestureEvent={gestureHandler}>
      <Animated.View className="absolute w-full h-full" style={cardStyle}>
        {/* Full-bleed poster - edge to edge */}
        <Image
          source={{ uri: movie.posterUrl }}
          style={{ width: '100%', height: '100%', borderRadius: 2 }}
          contentFit="cover"
        />

        {/* Like indicator - icon only, appears while swiping right */}
        <Animated.View
          className="absolute top-8 left-6"
          style={likeOpacity}
        >
          <Heart size={40} color="#fff" fill="#fff" />
        </Animated.View>

        {/* Pass indicator - icon only, appears while swiping left */}
        <Animated.View
          className="absolute top-8 right-6"
          style={passOpacity}
        >
          <X size={40} color="#fff" strokeWidth={3} />
        </Animated.View>

        {/* Save indicator - icon only, appears while swiping up */}
        <Animated.View
          className="absolute top-8 self-center"
          style={saveOpacity}
        >
          <Bookmark size={40} color="#fff" fill="#fff" />
        </Animated.View>

        {/* Title + year at bottom - minimal, dark scrim */}
        <View
          className="absolute bottom-0 left-0 right-0 px-4 py-3"
          style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
        >
          <Animated.Text className="text-white text-lg font-medium" numberOfLines={1}>
            {movie.title}
          </Animated.Text>
          <Animated.Text className="text-white/50 text-sm">
            {movie.year}
          </Animated.Text>
        </View>
      </Animated.View>
    </PanGestureHandler>
  );
}
