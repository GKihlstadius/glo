import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { X, Bookmark, Heart, Gamepad2, Settings } from 'lucide-react-native';
import { router } from 'expo-router';
import { MovieCard } from '@/components/MovieCard';
import { StreamingRow } from '@/components/StreamingIcon';
import { TrailerPlayer, TrailerPlayerRef } from '@/components/TrailerPlayer';
import { FeedItem } from '@/lib/types';
import { COLORS } from '@/lib/constants';
import { useStore } from '@/lib/store';
import { FeedEngine, createFeedEngine } from '@/lib/feed-engine';
import { getStreamingOffers } from '@/lib/movies';
import { prefetchMovieImages } from '@/lib/image-cache';
import { useTrailerSource } from '@/lib/useTrailerSource';
import { useAutoplay } from '@/lib/useAutoplay';
import { useSwipeStop } from '@/lib/useSwipeStop';
import { isGatePassed } from '@/lib/trailer-gate';

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

  const [currentItem, setCurrentItem] = useState<FeedItem | null>(null);
  const [nextItem, setNextItem] = useState<FeedItem | null>(null);

  // Feed engine reference
  const feedEngineRef = useRef<FeedEngine | null>(null);

  // ========================================================================
  // TRAILER SYSTEM
  // ========================================================================
  const trailerPlayerRef = useRef<TrailerPlayerRef>(null);
  
  // Get trailer source for current movie
  const { source: trailerSource, isLoading: trailerLoading } = useTrailerSource(
    currentItem?.movie ?? null
  );

  // Swipe-stop integration - stops trailer instantly when swiping
  const swipeStop = useSwipeStop({
    playerRef: trailerPlayerRef,
    onStopped: () => {
      // Trailer stopped by swipe
    },
  });

  // Autoplay control - handles timing and gate checks
  const autoplay = useAutoplay({
    isTopCard: true,
    movieId: currentItem?.movie?.id ?? null,
    hasTrailerSource: !!trailerSource && !trailerLoading,
    onShouldPlay: () => {
      // Time to play trailer!
      if (trailerSource && trailerPlayerRef.current) {
        trailerPlayerRef.current.play(trailerSource);
        autoplay.recordAutoplayStarted();
      }
    },
    onCancelled: () => {
      // Autoplay was cancelled (gesture started)
    },
    disabled: !isGatePassed(), // Disable if gate hasn't passed
  });

  // Handle trailer playback callbacks
  const handleTrailerPlaybackStart = useCallback(() => {
    // Trailer started playing
  }, []);

  const handleTrailerPlaybackEnd = useCallback(() => {
    // Trailer finished
  }, []);

  const handleTrailerError = useCallback((error: string) => {
    // Trailer failed - silently fall back to poster
    console.log('[Trailer] Error:', error);
    autoplay.recordAutoplayFailed();
  }, [autoplay]);

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

    // Stop trailer immediately on swipe
    swipeStop.onSwipeStart();
    autoplay.onSwipeComplete();

    const movie = currentItem.movie;

    if (direction === 'right') {
      likeMovie(movie.id);
      feedEngineRef.current.recordSwipe(movie.id, 'like');
      if (haptic) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (direction === 'left') {
      passMovie(movie.id);
      feedEngineRef.current.recordSwipe(movie.id, 'pass');
    } else if (direction === 'up') {
      saveMovie(movie.id);
      feedEngineRef.current.recordSwipe(movie.id, 'save');
      if (haptic) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    // Advance queue - instant, no pause
    setCurrentItem(nextItem);
    const newNext = feedEngineRef.current.getNext();
    setNextItem(newNext);

    // Reset autoplay for new card
    autoplay.reset();

    // Prefetch more images periodically
    prefetchMore();
  }, [currentItem, nextItem, likeMovie, passMovie, saveMovie, haptic, prefetchMore, swipeStop, autoplay]);

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

  // Get current movie's streaming provider IDs
  const currentProviderIds = currentItem
    ? getStreamingOffers(currentItem.movie.id, country.code)
        .slice(0, 4)
        .map(offer => offer.providerId)
    : [];

  return (
    <View className="flex-1" style={{ backgroundColor: COLORS.bg }}>
      {/* TOP AREA: Empty - nothing appears at the top per spec */}
      <View style={{ height: insets.top }} />

      {/* MAIN CONTENT: Full-bleed movie poster - the HERO */}
      <View style={styles.cardArea}>
        {!currentItem ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-base" style={{ color: COLORS.textMuted }}>
              Loading...
            </Text>
          </View>
        ) : (
          <>
            <MovieCard
              key={currentItem.movie.id}
              movie={currentItem.movie}
              onSwipe={handleSwipe}
              haptic={haptic}
              onGestureStart={autoplay.onGestureStart}
              onGestureEnd={autoplay.onGestureEnd}
            />
            {/* Trailer Player - only renders when trailer source is available and gate passed */}
            {trailerSource && isGatePassed() && autoplay.state.shouldPlay && (
              <View style={styles.trailerContainer}>
                <TrailerPlayer
                  ref={trailerPlayerRef}
                  onPlaybackStart={handleTrailerPlaybackStart}
                  onPlaybackEnd={handleTrailerPlaybackEnd}
                  onError={handleTrailerError}
                />
              </View>
            )}
          </>
        )}
      </View>

      {/* BOTTOM SECTION: All actions live at the bottom */}
      <View style={[styles.bottomSection, { paddingBottom: insets.bottom + 8 }]}>
        {/* Streaming providers - single row, max 4, original icons only */}
        {currentProviderIds.length > 0 && (
          <View style={styles.providerSection}>
            <StreamingRow
              providerIds={currentProviderIds}
              maxVisible={4}
            />
          </View>
        )}

        {/* Primary action bar: Pass / Save / Like */}
        <View style={styles.actionBar}>
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

          <Pressable
            onPress={handleSave}
            style={({ pressed }) => [
              styles.actionButton,
              styles.saveButton,
              pressed && styles.actionButtonPressed,
            ]}
          >
            <Bookmark size={24} color="#fff" fill="#fff" />
          </Pressable>

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

        {/* Secondary navigation: Spelläge / Settings */}
        <View style={styles.secondaryNav}>
          <Pressable
            onPress={() => router.push('/spellage')}
            style={({ pressed }) => [styles.navButton, pressed && { opacity: 0.5 }]}
            hitSlop={12}
          >
            <Gamepad2 size={20} color={COLORS.textMuted} />
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
    </View>
  );
}

const styles = StyleSheet.create({
  cardArea: {
    flex: 1,
    marginHorizontal: 8,
    marginTop: 4,
  },
  trailerContainer: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
    overflow: 'hidden',
  },
  bottomSection: {
    paddingTop: 8,
  },
  providerSection: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 8,
    gap: 28,
  },
  actionButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
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
    paddingTop: 10,
    gap: 48,
  },
  navButton: {
    padding: 8,
  },
});
