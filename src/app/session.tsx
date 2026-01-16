import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { X, Bookmark, Heart } from 'lucide-react-native';
import { router } from 'expo-router';
import { MovieCard } from '@/components/MovieCard';
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
        // No overlay - instant flow
        if (haptic) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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

  // Action handlers for bottom bar
  const handlePass = useCallback(() => {
    if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    handleSwipe('left');
  }, [haptic, handleSwipe]);

  const handleSave = useCallback(() => {
    if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    handleSwipe('up');
  }, [haptic, handleSwipe]);

  const handleLike = useCallback(() => {
    if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    handleSwipe('right');
  }, [haptic, handleSwipe]);

  // Get current movie's streaming offers
  const currentOffers = currentItem
    ? getStreamingOffers(currentItem.movie.id, session?.regionCode || country.code).slice(0, 4)
    : [];

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
      {/* Minimal header - only exit button and session info */}
      <View
        className="flex-row items-center justify-between px-4"
        style={{ paddingTop: insets.top + 8, paddingBottom: 4 }}
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
        <Pressable onPress={handleExit} hitSlop={12}>
          <X size={22} color={COLORS.textMuted} />
        </Pressable>
      </View>

      {/* Main content - movie poster */}
      <View style={{ flex: 1, marginHorizontal: 0 }}>
        {!currentItem ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-base mb-4" style={{ color: COLORS.textMuted }}>
              {lang === 'sv' ? 'Inga fler filmer' : 'No more movies'}
            </Text>
            <Pressable
              onPress={handleExit}
              className="px-6 py-3"
              style={{ backgroundColor: COLORS.bgCard, borderRadius: 8 }}
            >
              <Text style={{ color: COLORS.text }}>
                {lang === 'sv' ? 'Avsluta' : 'Exit'}
              </Text>
            </Pressable>
          </View>
        ) : (
          <MovieCard
            key={currentItem.movie.id}
            movie={currentItem.movie}
            onSwipe={handleSwipe}
            haptic={haptic}
          />
        )}
      </View>

      {/* Streaming providers - above action bar */}
      {currentOffers.length > 0 && (
        <View style={styles.providerSection}>
          <ProviderRow offers={currentOffers} size="medium" haptic={haptic} maxVisible={4} />
        </View>
      )}

      {/* Bottom action bar */}
      <View style={[styles.actionBar, { paddingBottom: insets.bottom + 16 }]}>
        {/* Pass */}
        <Pressable
          onPress={handlePass}
          style={({ pressed }) => [
            styles.actionButton,
            styles.passButton,
            pressed && styles.actionButtonPressed,
          ]}
        >
          <X size={28} color="#fff" strokeWidth={2.5} />
        </Pressable>

        {/* Save */}
        <Pressable
          onPress={handleSave}
          style={({ pressed }) => [
            styles.actionButton,
            styles.saveButton,
            pressed && styles.actionButtonPressed,
          ]}
        >
          <Bookmark size={26} color="#fff" fill="#fff" />
        </Pressable>

        {/* Like */}
        <Pressable
          onPress={handleLike}
          style={({ pressed }) => [
            styles.actionButton,
            styles.likeButton,
            pressed && styles.actionButtonPressed,
          ]}
        >
          <Heart size={28} color="#fff" fill="#fff" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  providerSection: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 8,
    gap: 24,
  },
  actionButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonPressed: {
    transform: [{ scale: 0.92 }],
  },
  passButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
  },
  saveButton: {
    backgroundColor: 'rgba(234, 179, 8, 0.9)',
  },
  likeButton: {
    backgroundColor: 'rgba(34, 197, 94, 0.9)',
  },
});
