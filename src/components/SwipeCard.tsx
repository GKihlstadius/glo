import React from 'react';
import { View, Text, Pressable, Dimensions } from 'react-native';
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
import { Heart, X, Bookmark, Clock, Star } from 'lucide-react-native';
import { Movie } from '@/lib/types';
import { COLORS, SWIPE_CONFIG } from '@/lib/constants';
import { cn } from '@/lib/cn';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 32;
const CARD_HEIGHT = SCREEN_HEIGHT * 0.68;

interface SwipeCardProps {
  movie: Movie;
  onSwipe: (direction: 'left' | 'right' | 'up') => void;
  isFirst: boolean;
  hapticEnabled?: boolean;
}

type GestureContext = {
  startX: number;
  startY: number;
};

export function SwipeCard({ movie, onSwipe, isFirst, hapticEnabled = true }: SwipeCardProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const triggerHaptic = (type: 'light' | 'medium' | 'heavy') => {
    if (!hapticEnabled) return;
    switch (type) {
      case 'light':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'medium':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'heavy':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
    }
  };

  const handleSwipeComplete = (direction: 'left' | 'right' | 'up') => {
    triggerHaptic('medium');
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
      const velocityX = event.velocityX;
      const velocityY = event.velocityY;

      // Swipe up for save
      if (translateY.value < -SWIPE_CONFIG.translateThreshold && velocityY < 0) {
        translateY.value = withTiming(-SCREEN_HEIGHT, { duration: SWIPE_CONFIG.swipeOutDuration });
        runOnJS(handleSwipeComplete)('up');
        return;
      }

      // Swipe right for like
      if (
        translateX.value > SWIPE_CONFIG.translateThreshold ||
        velocityX > SWIPE_CONFIG.velocityThreshold
      ) {
        translateX.value = withTiming(SCREEN_WIDTH * 1.5, { duration: SWIPE_CONFIG.swipeOutDuration });
        runOnJS(handleSwipeComplete)('right');
        return;
      }

      // Swipe left for pass
      if (
        translateX.value < -SWIPE_CONFIG.translateThreshold ||
        velocityX < -SWIPE_CONFIG.velocityThreshold
      ) {
        translateX.value = withTiming(-SCREEN_WIDTH * 1.5, { duration: SWIPE_CONFIG.swipeOutDuration });
        runOnJS(handleSwipeComplete)('left');
        return;
      }

      // Snap back
      translateX.value = withSpring(0, { damping: 15, stiffness: 150 });
      translateY.value = withSpring(0, { damping: 15, stiffness: 150 });
    },
  });

  const cardStyle = useAnimatedStyle(() => {
    const rotation = interpolate(
      translateX.value,
      [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
      [-SWIPE_CONFIG.rotationRange, 0, SWIPE_CONFIG.rotationRange],
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

  const likeOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, SWIPE_CONFIG.translateThreshold], [0, 1], Extrapolation.CLAMP),
  }));

  const passOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-SWIPE_CONFIG.translateThreshold, 0], [1, 0], Extrapolation.CLAMP),
  }));

  const saveOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(translateY.value, [-SWIPE_CONFIG.translateThreshold, 0], [1, 0], Extrapolation.CLAMP),
  }));

  const formatRuntime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const streamingServices = movie.availability.filter((a) => a.type === 'stream');
  const rentBuyOptions = movie.availability.filter((a) => a.type !== 'stream');

  if (!isFirst) {
    return (
      <View
        className="absolute rounded-3xl overflow-hidden"
        style={{
          width: CARD_WIDTH,
          height: CARD_HEIGHT,
          backgroundColor: COLORS.backgroundCard,
        }}
      >
        <Image
          source={{ uri: movie.posterUrl }}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
        />
      </View>
    );
  }

  return (
    <PanGestureHandler onGestureEvent={gestureHandler}>
      <Animated.View
        className="absolute rounded-3xl overflow-hidden"
        style={[
          {
            width: CARD_WIDTH,
            height: CARD_HEIGHT,
            backgroundColor: COLORS.backgroundCard,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.4,
            shadowRadius: 16,
            elevation: 10,
          },
          cardStyle,
        ]}
      >
        {/* Movie Poster */}
        <Image
          source={{ uri: movie.posterUrl }}
          style={{ width: '100%', height: '100%', position: 'absolute' }}
          contentFit="cover"
        />

        {/* Gradient Overlay */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.95)']}
          locations={[0.3, 0.6, 1]}
          style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%' }}
        />

        {/* Like Indicator */}
        <Animated.View
          className="absolute top-8 left-6 px-4 py-2 rounded-xl border-2"
          style={[
            {
              borderColor: COLORS.like,
              backgroundColor: COLORS.likeBg,
              transform: [{ rotate: '-20deg' }],
            },
            likeOpacity,
          ]}
        >
          <Text className="text-2xl font-bold" style={{ color: COLORS.like }}>
            LIKE
          </Text>
        </Animated.View>

        {/* Pass Indicator */}
        <Animated.View
          className="absolute top-8 right-6 px-4 py-2 rounded-xl border-2"
          style={[
            {
              borderColor: COLORS.pass,
              backgroundColor: COLORS.passBg,
              transform: [{ rotate: '20deg' }],
            },
            passOpacity,
          ]}
        >
          <Text className="text-2xl font-bold" style={{ color: COLORS.pass }}>
            NOPE
          </Text>
        </Animated.View>

        {/* Save Indicator */}
        <Animated.View
          className="absolute top-8 self-center px-4 py-2 rounded-xl border-2"
          style={[
            {
              borderColor: COLORS.save,
              backgroundColor: COLORS.saveBg,
            },
            saveOpacity,
          ]}
        >
          <Text className="text-2xl font-bold" style={{ color: COLORS.save }}>
            SAVE
          </Text>
        </Animated.View>

        {/* Movie Info */}
        <View className="absolute bottom-0 left-0 right-0 p-5">
          {/* Title & Year */}
          <Text
            className="text-3xl font-bold mb-1"
            style={{ color: COLORS.textPrimary }}
            numberOfLines={2}
          >
            {movie.title}
          </Text>

          {/* Meta Info */}
          <View className="flex-row items-center mb-3 flex-wrap">
            <Text className="text-base mr-3" style={{ color: COLORS.textSecondary }}>
              {movie.year}
            </Text>
            <View className="flex-row items-center mr-3">
              <Clock size={14} color={COLORS.textSecondary} />
              <Text className="text-base ml-1" style={{ color: COLORS.textSecondary }}>
                {formatRuntime(movie.runtime)}
              </Text>
            </View>
            <View className="flex-row items-center">
              <Star size={14} color={COLORS.primary} fill={COLORS.primary} />
              <Text className="text-base ml-1" style={{ color: COLORS.primary }}>
                {movie.rating.toFixed(1)}
              </Text>
            </View>
          </View>

          {/* Genres */}
          <View className="flex-row flex-wrap mb-3">
            {movie.genres.slice(0, 3).map((genre, index) => (
              <View
                key={genre}
                className="px-3 py-1 rounded-full mr-2 mb-1"
                style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
              >
                <Text className="text-sm" style={{ color: COLORS.textPrimary }}>
                  {genre}
                </Text>
              </View>
            ))}
          </View>

          {/* Availability */}
          <View className="pt-3 border-t" style={{ borderTopColor: 'rgba(255,255,255,0.1)' }}>
            {streamingServices.length > 0 && (
              <View className="flex-row items-center mb-2 flex-wrap">
                <View
                  className="w-2 h-2 rounded-full mr-2"
                  style={{ backgroundColor: COLORS.available }}
                />
                <Text className="text-sm mr-2" style={{ color: COLORS.textSecondary }}>
                  Stream on
                </Text>
                {streamingServices.map((s, i) => (
                  <Text key={s.service.id} className="text-sm font-medium" style={{ color: COLORS.textPrimary }}>
                    {s.service.name}
                    {i < streamingServices.length - 1 ? ', ' : ''}
                  </Text>
                ))}
              </View>
            )}
            {rentBuyOptions.length > 0 && (
              <View className="flex-row items-center flex-wrap">
                <View
                  className="w-2 h-2 rounded-full mr-2"
                  style={{ backgroundColor: COLORS.rent }}
                />
                <Text className="text-sm" style={{ color: COLORS.textSecondary }}>
                  {rentBuyOptions.map((r) => `${r.type === 'rent' ? 'Rent' : 'Buy'} on ${r.service.name}`).join(' • ')}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Animated.View>
    </PanGestureHandler>
  );
}

// Action buttons for accessibility and alternative interaction
interface SwipeButtonsProps {
  onPass: () => void;
  onLike: () => void;
  onSave: () => void;
  hapticEnabled?: boolean;
}

export function SwipeButtons({ onPass, onLike, onSave, hapticEnabled = true }: SwipeButtonsProps) {
  const triggerHaptic = () => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  return (
    <View className="flex-row items-center justify-center py-4" style={{ columnGap: 20 }}>
      <Pressable
        onPress={() => {
          triggerHaptic();
          onPass();
        }}
        className="w-14 h-14 rounded-full items-center justify-center active:scale-90"
        style={{ backgroundColor: COLORS.passBg, borderWidth: 2, borderColor: COLORS.pass }}
      >
        <X size={28} color={COLORS.pass} />
      </Pressable>

      <Pressable
        onPress={() => {
          triggerHaptic();
          onSave();
        }}
        className="w-12 h-12 rounded-full items-center justify-center active:scale-90"
        style={{ backgroundColor: COLORS.saveBg, borderWidth: 2, borderColor: COLORS.save }}
      >
        <Bookmark size={22} color={COLORS.save} />
      </Pressable>

      <Pressable
        onPress={() => {
          triggerHaptic();
          onLike();
        }}
        className="w-14 h-14 rounded-full items-center justify-center active:scale-90"
        style={{ backgroundColor: COLORS.likeBg, borderWidth: 2, borderColor: COLORS.like }}
      >
        <Heart size={28} color={COLORS.like} fill={COLORS.like} />
      </Pressable>
    </View>
  );
}
