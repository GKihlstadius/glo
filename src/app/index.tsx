import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, Pressable, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Settings, Users, Bookmark, Gamepad2 } from 'lucide-react-native';
import { router } from 'expo-router';
import { SwipeCard } from '@/components/SwipeCard';
import { Movie } from '@/lib/types';
import { COLORS, STREAMING_SERVICES } from '@/lib/constants';
import { useStore } from '@/lib/store';
import { getUnseenMovies } from '@/lib/movies';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const country = useStore((s) => s.country);
  const haptic = useStore((s) => s.hapticEnabled);
  const likedMovies = useStore((s) => s.likedMovies);
  const passedMovies = useStore((s) => s.passedMovies);
  const likeMovie = useStore((s) => s.likeMovie);
  const passMovie = useStore((s) => s.passMovie);
  const saveMovie = useStore((s) => s.saveMovie);

  const [movies, setMovies] = useState<Movie[]>([]);
  const [index, setIndex] = useState(0);
  const [matched, setMatched] = useState<Movie | null>(null);

  // Load movies - no onboarding, just start
  useEffect(() => {
    const unseen = getUnseenMovies(country.code, likedMovies, passedMovies);
    setMovies(unseen);
    setIndex(0);
  }, [country.code, likedMovies.length, passedMovies.length]);

  const handleSwipe = useCallback((direction: 'left' | 'right' | 'up') => {
    const movie = movies[index];
    if (!movie) return;

    if (direction === 'right') {
      likeMovie(movie.id);
      setMatched(movie);
    } else if (direction === 'left') {
      passMovie(movie.id);
    } else if (direction === 'up') {
      saveMovie(movie.id);
      if (haptic) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    setIndex((i) => i + 1);
  }, [movies, index, likeMovie, passMovie, saveMovie, haptic]);

  const current = movies[index];
  const next = movies[index + 1];

  // Get streaming service name
  const getServiceName = (id: string) =>
    STREAMING_SERVICES.find((s) => s.id === id)?.name || id;

  return (
    <View className="flex-1" style={{ backgroundColor: COLORS.bg }}>
      {/* Minimal header - region indicator + icons */}
      <View
        className="flex-row items-center justify-between px-4"
        style={{ paddingTop: insets.top + 4 }}
      >
        <Text className="text-sm" style={{ color: COLORS.textMuted }}>
          {country.flag} {country.name}
        </Text>
        <View className="flex-row" style={{ columnGap: 16 }}>
          <Pressable onPress={() => router.push('/spellage')} hitSlop={8}>
            <Gamepad2 size={20} color={COLORS.textMuted} />
          </Pressable>
          <Pressable onPress={() => router.push('/couch')} hitSlop={8}>
            <Users size={20} color={COLORS.textMuted} />
          </Pressable>
          <Pressable onPress={() => router.push('/saved')} hitSlop={8}>
            <Bookmark size={20} color={COLORS.textMuted} />
          </Pressable>
          <Pressable onPress={() => router.push('/settings')} hitSlop={8}>
            <Settings size={20} color={COLORS.textMuted} />
          </Pressable>
        </View>
      </View>

      {/* Card stack - full screen, the movie IS the interface */}
      <View
        className="flex-1"
        style={{
          marginTop: 8,
          marginBottom: insets.bottom + 8,
          marginHorizontal: 8,
        }}
      >
        {!current ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-base" style={{ color: COLORS.textMuted }}>
              {country.language === 'sv' ? 'Inga fler filmer' : 'No more movies'}
            </Text>
          </View>
        ) : (
          <View className="flex-1 relative">
            {next && <SwipeCard movie={next} onSwipe={() => {}} isTop={false} haptic={haptic} />}
            <SwipeCard key={current.id} movie={current} onSwipe={handleSwipe} isTop={true} haptic={haptic} />
          </View>
        )}
      </View>

      {/* Match overlay - minimal, calm */}
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
                {country.language === 'sv' ? 'Fortsätt' : 'Continue'}
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      )}
    </View>
  );
}
