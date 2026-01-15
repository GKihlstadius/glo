import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { View, Text, Pressable, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { X } from 'lucide-react-native';
import { router } from 'expo-router';
import { SwipeCard } from '@/components/SwipeCard';
import { Movie } from '@/lib/types';
import { COLORS, STREAMING_SERVICES } from '@/lib/constants';
import { useStore } from '@/lib/store';
import { getUnseenMovies, filterByMood, getMovie } from '@/lib/movies';

export default function SessionScreen() {
  const insets = useSafeAreaInsets();
  const country = useStore((s) => s.country);
  const haptic = useStore((s) => s.hapticEnabled);
  const session = useStore((s) => s.currentSession);
  const setSession = useStore((s) => s.setSession);
  const likedMovies = useStore((s) => s.likedMovies);
  const passedMovies = useStore((s) => s.passedMovies);
  const likeMovie = useStore((s) => s.likeMovie);
  const passMovie = useStore((s) => s.passMovie);
  const saveMovie = useStore((s) => s.saveMovie);
  const lang = country.language;

  const [movies, setMovies] = useState<Movie[]>([]);
  const [index, setIndex] = useState(0);
  const [matched, setMatched] = useState<Movie | null>(null);

  // Load movies filtered by mood if applicable
  useEffect(() => {
    let unseen = getUnseenMovies(country.code, likedMovies, passedMovies);

    if (session?.mood) {
      unseen = filterByMood(unseen, session.mood);
    }

    setMovies(unseen);
    setIndex(0);
  }, [country.code, session?.mood, likedMovies.length, passedMovies.length]);

  const handleSwipe = useCallback(
    (direction: 'left' | 'right' | 'up') => {
      const movie = movies[index];
      if (!movie) return;

      if (direction === 'right') {
        likeMovie(movie.id);
        // In session mode, check for match
        if (session) {
          // Simulate match (in real app this would sync with other participants)
          setMatched(movie);
        }
      } else if (direction === 'left') {
        passMovie(movie.id);
      } else if (direction === 'up') {
        saveMovie(movie.id);
        if (haptic) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      setIndex((i) => i + 1);
    },
    [movies, index, likeMovie, passMovie, saveMovie, haptic, session]
  );

  const handleExit = () => {
    setSession(null);
    router.back();
  };

  const current = movies[index];
  const next = movies[index + 1];

  const getServiceName = (id: string) =>
    STREAMING_SERVICES.find((s) => s.id === id)?.name || id;

  return (
    <View className="flex-1" style={{ backgroundColor: COLORS.bg }}>
      {/* Header */}
      <View
        className="flex-row items-center justify-between px-4 pb-4"
        style={{ paddingTop: insets.top + 8 }}
      >
        <View className="flex-row items-center">
          {session?.code ? (
            <Text className="text-sm font-mono" style={{ color: COLORS.textMuted }}>
              {session.code}
            </Text>
          ) : session?.mood ? (
            <Text className="text-sm" style={{ color: COLORS.textMuted }}>
              {session.mood === 'calm'
                ? lang === 'sv'
                  ? 'Lugn'
                  : 'Calm'
                : session.mood === 'fun'
                ? lang === 'sv'
                  ? 'Rolig'
                  : 'Fun'
                : session.mood === 'intense'
                ? lang === 'sv'
                  ? 'Intensiv'
                  : 'Intense'
                : lang === 'sv'
                ? 'Kort'
                : 'Short'}
            </Text>
          ) : null}
        </View>
        <Pressable onPress={handleExit} hitSlop={8}>
          <X size={24} color={COLORS.textMuted} />
        </Pressable>
      </View>

      {/* Card stack */}
      <View
        className="flex-1"
        style={{
          marginBottom: insets.bottom + 8,
          marginHorizontal: 8,
        }}
      >
        {!current ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-base mb-4" style={{ color: COLORS.textMuted }}>
              {lang === 'sv' ? 'Inga fler filmer' : 'No more movies'}
            </Text>
            <Pressable onPress={handleExit} className="px-6 py-3" style={{ backgroundColor: COLORS.bgCard }}>
              <Text style={{ color: COLORS.text }}>
                {lang === 'sv' ? 'Avsluta' : 'Exit'}
              </Text>
            </Pressable>
          </View>
        ) : (
          <View className="flex-1 relative">
            {next && <SwipeCard movie={next} onSwipe={() => {}} isTop={false} haptic={haptic} />}
            <SwipeCard key={current.id} movie={current} onSwipe={handleSwipe} isTop={true} haptic={haptic} />
          </View>
        )}
      </View>

      {/* Match overlay */}
      {matched && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          className="absolute inset-0 items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.95)' }}
        >
          <Pressable className="absolute inset-0" onPress={() => setMatched(null)} />
          <View className="items-center px-8">
            <Text className="text-2xl font-medium mb-2" style={{ color: COLORS.text }}>
              {matched.title}
            </Text>
            <Text className="text-sm mb-8" style={{ color: COLORS.textMuted }}>
              {matched.availability.map((a) => getServiceName(a.serviceId)).join(' · ')}
            </Text>
            <Pressable
              onPress={() => setMatched(null)}
              className="px-6 py-3"
              style={{ backgroundColor: COLORS.bgCard }}
            >
              <Text className="text-sm" style={{ color: COLORS.text }}>
                {lang === 'sv' ? 'Fortsätt' : 'Continue'}
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      )}
    </View>
  );
}
