import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { X, Bookmark, Heart, Gamepad2, Sofa, Settings } from 'lucide-react-native';
import { router } from 'expo-router';
import { MovieCard } from '@/components/MovieCard';
import { ProviderRow } from '@/components/ProviderButton';
import { FeedItem } from '@/lib/types';
import { COLORS } from '@/lib/constants';
import { useStore } from '@/lib/store';
import { FeedEngine, createFeedEngine } from '@/lib/feed-engine';
import { getStreamingOffers } from '@/lib/movies';
import { prefetchMovieImages } from '@/lib/image-cache';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const country = useStore((s) => s.country);
  const haptic = useStore((s) => s.hapticEnabled);
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

  // Initialize feed engine
  useEffect(() => {
    feedEngineRef.current = createFeedEngine(
      country.code,
      tasteProfile,
      likedMovies,
      passedMovies,
      savedMovies,
      null
    );

    // Load initial items
    const first = feedEngineRef.current.getNext();
    const second = feedEngineRef.current.getNext();
    setCurrentItem(first);
    setNextItem(second);

    // Prefetch upcoming images
    if (feedEngineRef.current) {
      const upcoming = feedEngineRef.current.prefetch(15);
      prefetchMovieImages(upcoming);
    }
  }, [country.code]);

  // Update feed engine when taste profile changes
  useEffect(() => {
    if (feedEngineRef.current) {
      feedEngineRef.current.updateProfile(tasteProfile);
    }
  }, [tasteProfile]);

  // Prefetch more images when queue runs low
  const prefetchMore = useCallback(() => {
    if (feedEngineRef.current) {
      const upcoming = feedEngineRef.current.prefetch(15);
      prefetchMovieImages(upcoming);
    }
  }, []);

  const handleSwipe = useCallback((direction: 'left' | 'right' | 'up') => {
    if (!currentItem || !feedEngineRef.current) return;

    const movie = currentItem.movie;

    if (direction === 'right') {
      likeMovie(movie.id);
      feedEngineRef.current.recordSwipe(movie.id, 'like');
      // No overlay - instant flow, just like left swipe
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

    // Prefetch more images periodically
    prefetchMore();
  }, [currentItem, nextItem, likeMovie, passMovie, saveMovie, haptic, prefetchMore]);

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
    ? getStreamingOffers(currentItem.movie.id, country.code).slice(0, 4)
    : [];

  return (
    <View className="flex-1" style={{ backgroundColor: COLORS.bg }}>
      {/* TOP AREA: Completely empty - only OS status bar */}
      <View style={{ height: insets.top }} />

      {/* MAIN CONTENT: Full-bleed movie poster */}
      <View style={{ flex: 1, marginHorizontal: 0 }}>
        {!currentItem ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-base" style={{ color: COLORS.textMuted }}>
              {lang === 'sv' ? 'Laddar...' : 'Loading...'}
            </Text>
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

      {/* STREAMING PROVIDERS: Single row above action bar */}
      {currentOffers.length > 0 && (
        <View style={styles.providerSection}>
          <ProviderRow offers={currentOffers} size="medium" haptic={haptic} maxVisible={4} />
        </View>
      )}

      {/* BOTTOM ACTION BAR: Pass / Save / Like */}
      <View style={[styles.actionBar, { paddingBottom: 8 }]}>
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

      {/* SECONDARY NAVIGATION: Spelläge / Couch / Settings */}
      <View style={[styles.secondaryNav, { paddingBottom: insets.bottom + 8 }]}>
        <Pressable
          onPress={() => router.push('/spellage')}
          style={({ pressed }) => [styles.navButton, pressed && { opacity: 0.5 }]}
          hitSlop={12}
        >
          <Gamepad2 size={20} color={COLORS.textMuted} />
        </Pressable>

        <Pressable
          onPress={() => router.push('/couch')}
          style={({ pressed }) => [styles.navButton, pressed && { opacity: 0.5 }]}
          hitSlop={12}
        >
          <Sofa size={20} color={COLORS.textMuted} />
        </Pressable>

        <Pressable
          onPress={() => router.push('/settings')}
          style={({ pressed }) => [styles.navButton, pressed && { opacity: 0.5 }]}
          hitSlop={12}
        >
          <Settings size={20} color={COLORS.textMuted} />
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
  secondaryNav: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 12,
    gap: 48,
  },
  navButton: {
    padding: 8,
  },
});
