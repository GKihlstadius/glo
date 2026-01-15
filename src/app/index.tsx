import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, Pressable, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Settings, Users, Gamepad2, Bookmark, Sparkles } from 'lucide-react-native';
import { router } from 'expo-router';
import { SwipeCard, SwipeButtons } from '@/components/SwipeCard';
import { Movie } from '@/lib/types';
import { COLORS } from '@/lib/constants';
import { useGloStore, useCountry, useHapticEnabled, useHasPurchased } from '@/lib/store';
import { getMoviesForCountry, getRecommendedMovies } from '@/lib/movies';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const country = useCountry();
  const hapticEnabled = useHapticEnabled();
  const hasPurchased = useHasPurchased();

  const likeMovie = useGloStore((s) => s.likeMovie);
  const passMovie = useGloStore((s) => s.passMovie);
  const saveMovie = useGloStore((s) => s.saveMovie);
  const likedMovies = useGloStore((s) => s.likedMovies);
  const passedMovies = useGloStore((s) => s.passedMovies);
  const preferredGenres = useGloStore((s) => s.preferredGenres);

  const [movies, setMovies] = useState<Movie[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matchedMovie, setMatchedMovie] = useState<Movie | null>(null);

  // Ambient animation for the glow effect
  const glowOpacity = useSharedValue(0.3);

  useEffect(() => {
    glowOpacity.value = withRepeat(
      withTiming(0.6, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  // Load movies based on country
  useEffect(() => {
    if (country) {
      const allMovies = getMoviesForCountry(country.code);
      const recommended = getRecommendedMovies(allMovies, likedMovies, passedMovies, preferredGenres);
      setMovies(recommended);
      setCurrentIndex(0);
    }
  }, [country, likedMovies.length, passedMovies.length]);

  const handleSwipe = useCallback((direction: 'left' | 'right' | 'up') => {
    const currentMovie = movies[currentIndex];
    if (!currentMovie) return;

    if (direction === 'right') {
      likeMovie(currentMovie.id);
      // For Quick Swipe mode, a "like" is essentially a match
      setMatchedMovie(currentMovie);
    } else if (direction === 'left') {
      passMovie(currentMovie.id);
    } else if (direction === 'up') {
      saveMovie(currentMovie.id);
      if (hapticEnabled) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }

    setCurrentIndex((prev) => prev + 1);
  }, [movies, currentIndex, likeMovie, passMovie, saveMovie, hapticEnabled]);

  const handleButtonSwipe = useCallback((direction: 'left' | 'right' | 'up') => {
    handleSwipe(direction);
  }, [handleSwipe]);

  const dismissMatch = () => {
    setMatchedMovie(null);
  };

  const currentMovie = movies[currentIndex];
  const nextMovie = movies[currentIndex + 1];

  return (
    <View className="flex-1" style={{ backgroundColor: COLORS.background }}>
      {/* Ambient Glow */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: -100,
            left: -100,
            right: -100,
            height: 400,
            borderRadius: 200,
            backgroundColor: COLORS.primary,
            filter: 'blur(100px)',
          },
          glowStyle,
        ]}
      />

      {/* Header */}
      <View
        className="flex-row items-center justify-between px-5"
        style={{ paddingTop: insets.top + 8 }}
      >
        <View>
          <Text className="text-3xl font-bold" style={{ color: COLORS.textPrimary }}>
            Glo
          </Text>
          <Text className="text-sm" style={{ color: COLORS.textMuted }}>
            {country?.flag} {country?.name}
          </Text>
        </View>
        <View className="flex-row items-center" style={{ columnGap: 12 }}>
          <Pressable
            onPress={() => router.push('/saved')}
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: COLORS.backgroundCard }}
          >
            <Bookmark size={20} color={COLORS.textSecondary} />
          </Pressable>
          <Pressable
            onPress={() => router.push('/settings')}
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: COLORS.backgroundCard }}
          >
            <Settings size={20} color={COLORS.textSecondary} />
          </Pressable>
        </View>
      </View>

      {/* Mode Buttons */}
      <View className="flex-row px-5 mt-4" style={{ columnGap: 8 }}>
        <Pressable
          onPress={() => {
            if (!hasPurchased) {
              router.push('/purchase');
            } else {
              router.push('/couch');
            }
          }}
          className="flex-1 flex-row items-center justify-center py-3 rounded-xl active:opacity-80"
          style={{ backgroundColor: COLORS.backgroundCard }}
        >
          <Users size={18} color={COLORS.primary} />
          <Text className="text-sm font-medium ml-2" style={{ color: COLORS.textPrimary }}>
            Couch Mode
          </Text>
        </Pressable>
        <Pressable
          onPress={() => {
            if (!hasPurchased) {
              router.push('/purchase');
            } else {
              router.push('/game');
            }
          }}
          className="flex-1 flex-row items-center justify-center py-3 rounded-xl active:opacity-80"
          style={{ backgroundColor: COLORS.backgroundCard }}
        >
          <Gamepad2 size={18} color={COLORS.primary} />
          <Text className="text-sm font-medium ml-2" style={{ color: COLORS.textPrimary }}>
            Spelläge
          </Text>
        </Pressable>
      </View>

      {/* Card Stack */}
      <View
        className="flex-1 items-center justify-center mt-4"
        style={{ paddingHorizontal: 16 }}
      >
        {movies.length === 0 || currentIndex >= movies.length ? (
          <View className="items-center px-8">
            <Sparkles size={48} color={COLORS.primary} />
            <Text
              className="text-2xl font-bold mt-4 text-center"
              style={{ color: COLORS.textPrimary }}
            >
              All caught up!
            </Text>
            <Text
              className="text-base text-center mt-2"
              style={{ color: COLORS.textSecondary }}
            >
              You've seen all available movies. Check back later for more.
            </Text>
          </View>
        ) : (
          <View className="relative" style={{ width: SCREEN_WIDTH - 32 }}>
            {/* Next card (behind) */}
            {nextMovie && (
              <View
                className="absolute"
                style={{
                  transform: [{ scale: 0.95 }, { translateY: 10 }],
                  opacity: 0.6,
                }}
              >
                <SwipeCard
                  movie={nextMovie}
                  onSwipe={() => {}}
                  isFirst={false}
                  hapticEnabled={hapticEnabled}
                />
              </View>
            )}

            {/* Current card */}
            {currentMovie && (
              <SwipeCard
                key={currentMovie.id}
                movie={currentMovie}
                onSwipe={handleSwipe}
                isFirst={true}
                hapticEnabled={hapticEnabled}
              />
            )}
          </View>
        )}
      </View>

      {/* Action Buttons */}
      {currentMovie && (
        <View style={{ paddingBottom: insets.bottom + 8 }}>
          <SwipeButtons
            onPass={() => handleButtonSwipe('left')}
            onLike={() => handleButtonSwipe('right')}
            onSave={() => handleButtonSwipe('up')}
            hapticEnabled={hapticEnabled}
          />
        </View>
      )}

      {/* Match Modal */}
      {matchedMovie && (
        <Animated.View
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(200)}
          className="absolute inset-0 items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.9)' }}
        >
          <Pressable
            className="absolute inset-0"
            onPress={dismissMatch}
          />
          <Animated.View
            entering={SlideInUp.springify().damping(15)}
            className="items-center px-8"
          >
            <View
              className="w-20 h-20 rounded-full items-center justify-center mb-6"
              style={{ backgroundColor: COLORS.matchGlow }}
            >
              <Sparkles size={40} color={COLORS.match} />
            </View>
            <Text
              className="text-3xl font-bold text-center mb-2"
              style={{ color: COLORS.textPrimary }}
            >
              Great choice
            </Text>
            <Text
              className="text-xl font-medium text-center mb-6"
              style={{ color: COLORS.primary }}
            >
              {matchedMovie.title}
            </Text>
            <Text
              className="text-base text-center mb-8"
              style={{ color: COLORS.textSecondary }}
            >
              {matchedMovie.availability.filter(a => a.type === 'stream').length > 0
                ? `Available on ${matchedMovie.availability.filter(a => a.type === 'stream').map(a => a.service.name).join(', ')}`
                : 'Available to rent or buy'}
            </Text>
            <Pressable
              onPress={dismissMatch}
              className="px-8 py-4 rounded-2xl"
              style={{ backgroundColor: COLORS.primary }}
            >
              <Text className="text-lg font-bold" style={{ color: '#000' }}>
                Keep swiping
              </Text>
            </Pressable>
          </Animated.View>
        </Animated.View>
      )}
    </View>
  );
}
