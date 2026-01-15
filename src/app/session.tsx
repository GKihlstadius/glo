import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { View, Text, Pressable, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInUp,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { X, Sparkles, Clock, Check, Users, Trophy } from 'lucide-react-native';
import { router } from 'expo-router';
import { SwipeCard, SwipeButtons } from '@/components/SwipeCard';
import { Movie } from '@/lib/types';
import { COLORS, MOOD_CARDS, DARE_CARDS } from '@/lib/constants';
import { useGloStore, useCountry, useHapticEnabled, useCurrentSession } from '@/lib/store';
import { getMoviesForCountry, filterMoviesByMood, getRecommendedMovies } from '@/lib/movies';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function SessionScreen() {
  const insets = useSafeAreaInsets();
  const country = useCountry();
  const hapticEnabled = useHapticEnabled();
  const currentSession = useCurrentSession();

  const likeMovie = useGloStore((s) => s.likeMovie);
  const passMovie = useGloStore((s) => s.passMovie);
  const saveMovie = useGloStore((s) => s.saveMovie);
  const incrementConnectionPoints = useGloStore((s) => s.incrementConnectionPoints);
  const setCurrentSession = useGloStore((s) => s.setCurrentSession);
  const likedMovies = useGloStore((s) => s.likedMovies);
  const passedMovies = useGloStore((s) => s.passedMovies);
  const preferredGenres = useGloStore((s) => s.preferredGenres);

  const [movies, setMovies] = useState<Movie[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matches, setMatches] = useState<Movie[]>([]);
  const [showMatch, setShowMatch] = useState<Movie | null>(null);
  const [showDare, setShowDare] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);

  const isGameMode = currentSession?.mode === 'game';
  const moodCard = currentSession?.moodCard;
  const targetMatches = isGameMode ? 3 : 1;

  // Load movies based on country and mood
  useEffect(() => {
    if (country) {
      let allMovies = getMoviesForCountry(country.code);

      // Apply mood filter if in game mode
      if (isGameMode && moodCard) {
        allMovies = filterMoviesByMood(allMovies, moodCard);
      }

      const recommended = getRecommendedMovies(allMovies, likedMovies, passedMovies, preferredGenres);
      setMovies(recommended);
      setCurrentIndex(0);
    }
  }, [country, isGameMode, moodCard]);

  // Ambient animation for game mode
  const glowOpacity = useSharedValue(0.2);

  useEffect(() => {
    if (isGameMode) {
      glowOpacity.value = withRepeat(
        withTiming(0.5, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    }
  }, [isGameMode]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const handleSwipe = useCallback((direction: 'left' | 'right' | 'up') => {
    const currentMovie = movies[currentIndex];
    if (!currentMovie) return;

    if (direction === 'right') {
      likeMovie(currentMovie.id);

      // In a real multiplayer session, we'd check if all participants liked
      // For now, simulate that it's a match
      const newMatches = [...matches, currentMovie];
      setMatches(newMatches);
      incrementConnectionPoints();
      setShowMatch(currentMovie);

      // Check if we've reached target matches
      if (newMatches.length >= targetMatches) {
        setTimeout(() => {
          if (isGameMode && Math.random() > 0.5) {
            setShowDare(true);
          } else {
            setSessionComplete(true);
          }
        }, 2000);
      }
    } else if (direction === 'left') {
      passMovie(currentMovie.id);
    } else if (direction === 'up') {
      saveMovie(currentMovie.id);
      if (hapticEnabled) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }

    setCurrentIndex((prev) => prev + 1);
  }, [movies, currentIndex, matches, targetMatches, isGameMode, likeMovie, passMovie, saveMovie, incrementConnectionPoints, hapticEnabled]);

  const dismissMatch = () => {
    setShowMatch(null);
  };

  const handleDareAccept = () => {
    if (hapticEnabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setShowDare(false);
    setSessionComplete(true);
  };

  const handleDareDecline = () => {
    setShowDare(false);
    setSessionComplete(true);
  };

  const handleEndSession = () => {
    setCurrentSession(null);
    router.replace('/');
  };

  const currentMovie = movies[currentIndex];
  const nextMovie = movies[currentIndex + 1];
  const randomDare = DARE_CARDS[Math.floor(Math.random() * DARE_CARDS.length)];

  return (
    <View className="flex-1" style={{ backgroundColor: COLORS.background }}>
      {/* Game Mode Ambient Glow */}
      {isGameMode && (
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: -100,
              left: -100,
              right: -100,
              height: 400,
              borderRadius: 200,
              backgroundColor: '#7C3AED',
              filter: 'blur(100px)',
            },
            glowStyle,
          ]}
        />
      )}

      {/* Header */}
      <View
        className="flex-row items-center justify-between px-5"
        style={{ paddingTop: insets.top + 8 }}
      >
        <View className="flex-row items-center">
          {isGameMode && moodCard && (
            <View
              className="flex-row items-center px-3 py-1.5 rounded-full mr-2"
              style={{ backgroundColor: 'rgba(124, 58, 237, 0.3)' }}
            >
              <Text className="text-base">{MOOD_CARDS[moodCard].emoji}</Text>
              <Text className="text-sm font-medium ml-1" style={{ color: '#A78BFA' }}>
                {MOOD_CARDS[moodCard].label}
              </Text>
            </View>
          )}
          {currentSession?.participants && currentSession.participants.length > 1 && (
            <View
              className="flex-row items-center px-3 py-1.5 rounded-full"
              style={{ backgroundColor: COLORS.backgroundCard }}
            >
              <Users size={14} color={COLORS.textSecondary} />
              <Text className="text-sm font-medium ml-1" style={{ color: COLORS.textSecondary }}>
                {currentSession.participants.length}
              </Text>
            </View>
          )}
        </View>

        {/* Match Progress */}
        <View className="flex-row items-center">
          {Array.from({ length: targetMatches }).map((_, i) => (
            <View
              key={i}
              className="w-3 h-3 rounded-full mx-1"
              style={{
                backgroundColor: i < matches.length ? COLORS.primary : COLORS.backgroundCard,
              }}
            />
          ))}
        </View>

        <Pressable
          onPress={handleEndSession}
          className="w-10 h-10 rounded-full items-center justify-center"
          style={{ backgroundColor: COLORS.backgroundCard }}
        >
          <X size={20} color={COLORS.textSecondary} />
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
              No more movies
            </Text>
            <Text
              className="text-base text-center mt-2"
              style={{ color: COLORS.textSecondary }}
            >
              You've seen all available options. Try changing your mood or check back later.
            </Text>
          </View>
        ) : (
          <View className="relative" style={{ width: SCREEN_WIDTH - 32 }}>
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
            onPass={() => handleSwipe('left')}
            onLike={() => handleSwipe('right')}
            onSave={() => handleSwipe('up')}
            hapticEnabled={hapticEnabled}
          />
        </View>
      )}

      {/* Match Modal */}
      {showMatch && !sessionComplete && (
        <Animated.View
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(200)}
          className="absolute inset-0 items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.9)' }}
        >
          <Pressable className="absolute inset-0" onPress={dismissMatch} />
          <Animated.View
            entering={SlideInUp.springify().damping(15)}
            className="items-center px-8"
          >
            <Animated.View
              entering={ZoomIn.delay(200).springify()}
              className="w-20 h-20 rounded-full items-center justify-center mb-6"
              style={{ backgroundColor: COLORS.matchGlow }}
            >
              <Sparkles size={40} color={COLORS.match} />
            </Animated.View>
            <Text
              className="text-3xl font-bold text-center mb-2"
              style={{ color: COLORS.textPrimary }}
            >
              {isGameMode ? `Match ${matches.length}/${targetMatches}!` : "That's a match!"}
            </Text>
            <Text
              className="text-xl font-medium text-center mb-4"
              style={{ color: COLORS.primary }}
            >
              {showMatch.title}
            </Text>
            <Pressable
              onPress={dismissMatch}
              className="px-6 py-3 rounded-xl"
              style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
            >
              <Text className="text-base font-medium" style={{ color: COLORS.textPrimary }}>
                {matches.length >= targetMatches ? 'Continue' : 'Keep swiping'}
              </Text>
            </Pressable>
          </Animated.View>
        </Animated.View>
      )}

      {/* Dare Card Modal */}
      {showDare && (
        <Animated.View
          entering={FadeIn.duration(300)}
          className="absolute inset-0 items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.95)' }}
        >
          <Animated.View
            entering={SlideInUp.springify().damping(15)}
            className="items-center px-8"
          >
            <View
              className="w-20 h-20 rounded-full items-center justify-center mb-6"
              style={{ backgroundColor: 'rgba(124, 58, 237, 0.3)' }}
            >
              <Clock size={40} color="#A78BFA" />
            </View>
            <Text
              className="text-sm font-semibold uppercase tracking-wider mb-2"
              style={{ color: '#A78BFA' }}
            >
              Dare Card
            </Text>
            <Text
              className="text-2xl font-bold text-center mb-8"
              style={{ color: COLORS.textPrimary }}
            >
              {randomDare.text}
            </Text>
            <View className="flex-row" style={{ columnGap: 12 }}>
              <Pressable
                onPress={handleDareDecline}
                className="px-6 py-3 rounded-xl"
                style={{ backgroundColor: COLORS.backgroundCard }}
              >
                <Text className="text-base font-medium" style={{ color: COLORS.textSecondary }}>
                  Skip
                </Text>
              </Pressable>
              <Pressable
                onPress={handleDareAccept}
                className="px-6 py-3 rounded-xl"
                style={{ backgroundColor: '#A78BFA' }}
              >
                <Text className="text-base font-medium" style={{ color: '#000' }}>
                  Accept
                </Text>
              </Pressable>
            </View>
          </Animated.View>
        </Animated.View>
      )}

      {/* Session Complete Modal */}
      {sessionComplete && (
        <Animated.View
          entering={FadeIn.duration(300)}
          className="absolute inset-0 items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.95)' }}
        >
          <Animated.View
            entering={SlideInUp.springify().damping(15)}
            className="items-center px-8"
          >
            <Animated.View
              entering={ZoomIn.delay(200).springify()}
              className="w-24 h-24 rounded-full items-center justify-center mb-6"
              style={{ backgroundColor: COLORS.matchGlow }}
            >
              <Trophy size={48} color={COLORS.match} />
            </Animated.View>
            <Text
              className="text-3xl font-bold text-center mb-2"
              style={{ color: COLORS.textPrimary }}
            >
              {isGameMode ? 'Game Complete!' : 'Session Complete'}
            </Text>
            <Text
              className="text-base text-center mb-6"
              style={{ color: COLORS.textSecondary }}
            >
              You found {matches.length} match{matches.length !== 1 ? 'es' : ''} together
            </Text>

            {/* Match List */}
            <View className="w-full mb-8">
              {matches.map((movie, index) => (
                <View
                  key={movie.id}
                  className="flex-row items-center py-3 border-b"
                  style={{ borderBottomColor: 'rgba(255,255,255,0.1)' }}
                >
                  <View
                    className="w-8 h-8 rounded-full items-center justify-center mr-3"
                    style={{ backgroundColor: COLORS.primary }}
                  >
                    <Check size={16} color="#000" strokeWidth={3} />
                  </View>
                  <Text
                    className="text-base font-medium flex-1"
                    style={{ color: COLORS.textPrimary }}
                    numberOfLines={1}
                  >
                    {movie.title}
                  </Text>
                  <Text className="text-sm" style={{ color: COLORS.textMuted }}>
                    {movie.year}
                  </Text>
                </View>
              ))}
            </View>

            <Pressable
              onPress={handleEndSession}
              className="px-8 py-4 rounded-2xl"
              style={{ backgroundColor: COLORS.primary }}
            >
              <Text className="text-lg font-bold" style={{ color: '#000' }}>
                Done
              </Text>
            </Pressable>
          </Animated.View>
        </Animated.View>
      )}
    </View>
  );
}
