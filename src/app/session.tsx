import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { X } from 'lucide-react-native';
import { router } from 'expo-router';
import { SwipeCard } from '@/components/SwipeCard';
import { ProviderRow } from '@/components/ProviderButton';
import { FeedItem } from '@/lib/types';
import { COLORS } from '@/lib/constants';
import { useStore } from '@/lib/store';
import { FeedEngine, createFeedEngine } from '@/lib/feed-engine';
import { getStreamingOffers } from '@/lib/movies';

export default function SessionScreen() {
  const insets = useSafeAreaInsets();
  const country = useStore((s) => s.country);
  const haptic = useStore((s) => s.hapticEnabled);
  const session = useStore((s) => s.currentSession);
  const setSession = useStore((s) => s.setSession);
  const likedMovies = useStore((s) => s.likedMovies);
  const passedMovies = useStore((s) => s.passedMovies);
  const savedMovies = useStore((s) => s.savedMovies);
  const tasteProfile = useStore((s) => s.tasteProfile);
  const likeMovie = useStore((s) => s.likeMovie);
  const passMovie = useStore((s) => s.passMovie);
  const saveMovie = useStore((s) => s.saveMovie);
  const lang = country.language;

  const [currentItem, setCurrentItem] = useState<FeedItem | null>(null);
  const [nextItem, setNextItem] = useState<FeedItem | null>(null);
  const [matched, setMatched] = useState<FeedItem | null>(null);

  // Feed engine reference
  const feedEngineRef = useRef<FeedEngine | null>(null);

  // Initialize feed engine with mood filter
  useEffect(() => {
    feedEngineRef.current = createFeedEngine(
      session?.regionCode || country.code,
      tasteProfile,
      likedMovies,
      passedMovies,
      savedMovies,
      session?.mood || null
    );

    // Load initial items
    const first = feedEngineRef.current.getNext();
    const second = feedEngineRef.current.getNext();
    setCurrentItem(first);
    setNextItem(second);
  }, [session?.regionCode, session?.mood, country.code]);

  const handleSwipe = useCallback(
    (direction: 'left' | 'right' | 'up') => {
      if (!currentItem || !feedEngineRef.current) return;

      const movie = currentItem.movie;

      if (direction === 'right') {
        likeMovie(movie.id);
        feedEngineRef.current.recordSwipe(movie.id, 'like');
        // In session mode, show match
        setMatched(currentItem);
      } else if (direction === 'left') {
        passMovie(movie.id);
        feedEngineRef.current.recordSwipe(movie.id, 'pass');
      } else if (direction === 'up') {
        saveMovie(movie.id);
        feedEngineRef.current.recordSwipe(movie.id, 'save');
        if (haptic) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // Advance queue
      setCurrentItem(nextItem);
      const newNext = feedEngineRef.current.getNext();
      setNextItem(newNext);
    },
    [currentItem, nextItem, likeMovie, passMovie, saveMovie, haptic]
  );

  const handleExit = () => {
    setSession(null);
    router.back();
  };

  // Get streaming offers for matched movie
  const matchedOffers = useMemo(() => {
    if (!matched) return [];
    return getStreamingOffers(matched.movie.id, session?.regionCode || country.code);
  }, [matched, session?.regionCode, country.code]);

  const getMoodLabel = (mood: string) => {
    switch (mood) {
      case 'calm': return lang === 'sv' ? 'Lugn' : 'Calm';
      case 'fun': return lang === 'sv' ? 'Rolig' : 'Fun';
      case 'intense': return lang === 'sv' ? 'Intensiv' : 'Intense';
      case 'short': return lang === 'sv' ? 'Kort' : 'Short';
      default: return mood;
    }
  };

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
              {getMoodLabel(session.mood)}
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
        {!currentItem ? (
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
            {nextItem && (
              <SwipeCard
                movie={nextItem.movie}
                onSwipe={() => {}}
                isTop={false}
                haptic={haptic}
                countryCode={session?.regionCode || country.code}
              />
            )}
            <SwipeCard
              key={currentItem.movie.id}
              movie={currentItem.movie}
              onSwipe={handleSwipe}
              isTop={true}
              haptic={haptic}
              countryCode={session?.regionCode || country.code}
            />
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
              {matched.movie.title}
            </Text>
            <Text className="text-sm mb-6" style={{ color: COLORS.textMuted }}>
              {matched.movie.year} · {matched.movie.runtime} min
            </Text>

            {/* Provider buttons */}
            {matchedOffers.length > 0 && (
              <View className="mb-8">
                <ProviderRow offers={matchedOffers} size="medium" haptic={haptic} />
              </View>
            )}

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
