import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Bookmark, Bug } from 'lucide-react-native';
import { router } from 'expo-router';
import { SwipeCard } from '@/components/SwipeCard';
import { ProviderRow } from '@/components/ProviderButton';
import { FeedItem } from '@/lib/types';
import { COLORS } from '@/lib/constants';
import { useStore } from '@/lib/store';
import { FeedEngine, createFeedEngine } from '@/lib/feed-engine';
import { getStreamingOffers } from '@/lib/movies';
import { prefetchMovieImages } from '@/lib/image-cache';

// Dev mode flag
const DEV_MODE = __DEV__;

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
  const [matched, setMatched] = useState<FeedItem | null>(null);
  const [showDebug, setShowDebug] = useState(false);

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

    // Prefetch more images periodically
    prefetchMore();
  }, [currentItem, nextItem, likeMovie, passMovie, saveMovie, haptic, prefetchMore]);

  // Get streaming offers for matched movie
  const matchedOffers = useMemo(() => {
    if (!matched) return [];
    return getStreamingOffers(matched.movie.id, country.code);
  }, [matched, country.code]);

  // Get feed stats for debug
  const feedStats = useMemo(() => {
    if (!feedEngineRef.current) return null;
    return feedEngineRef.current.getStats();
  }, [currentItem]);

  return (
    <View className="flex-1" style={{ backgroundColor: COLORS.bg }}>
      {/* Minimal header - just region flag and saved */}
      <View
        className="flex-row items-center justify-between px-4"
        style={{ paddingTop: insets.top + 8, paddingBottom: 4 }}
      >
        <Pressable
          onPress={() => router.push('/settings')}
          hitSlop={12}
        >
          <Text style={{ fontSize: 18 }}>
            {country.flag}
          </Text>
        </Pressable>
        <View className="flex-row items-center" style={{ gap: 20 }}>
          {DEV_MODE && (
            <Pressable onPress={() => setShowDebug(!showDebug)} hitSlop={12}>
              <Bug size={18} color={showDebug ? '#00FF00' : COLORS.textMuted} />
            </Pressable>
          )}
          <Pressable onPress={() => router.push('/saved')} hitSlop={12}>
            <Bookmark size={20} color={COLORS.textMuted} />
          </Pressable>
        </View>
      </View>

      {/* Debug overlay */}
      {showDebug && feedStats && (
        <View style={styles.feedDebugOverlay}>
          <Text style={styles.feedDebugText}>Q: {feedStats.queueLength} | H: {feedStats.historySize}</Text>
          <Text style={styles.feedDebugText}>Fallback: L{feedStats.fallbackLevel}</Text>
          <Text style={styles.feedDebugText}>
            E{(feedStats.bucketRatios.exploit * 100).toFixed(0)}%
            X{(feedStats.bucketRatios.explore * 100).toFixed(0)}%
            W{(feedStats.bucketRatios.wildcard * 100).toFixed(0)}%
          </Text>
        </View>
      )}

      {/* Single card - full bleed, no stack visible */}
      <View
        className="flex-1"
        style={{
          marginTop: 4,
          marginBottom: insets.bottom + 4,
          marginHorizontal: 4,
        }}
      >
        {!currentItem ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-base" style={{ color: COLORS.textMuted }}>
              {lang === 'sv' ? 'Laddar...' : 'Loading...'}
            </Text>
          </View>
        ) : (
          <SwipeCard
            key={currentItem.movie.id}
            movie={currentItem.movie}
            onSwipe={handleSwipe}
            isTop={true}
            haptic={haptic}
            countryCode={country.code}
            showDebug={showDebug}
            debugInfo={{
              bucket: currentItem.bucket,
              score: currentItem.score,
              reason: currentItem.reason,
            }}
          />
        )}
      </View>

      {/* Match overlay - minimal, shows streaming providers */}
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

            {/* Provider buttons - tap to open app */}
            {matchedOffers.length > 0 && (
              <View className="mb-8">
                <ProviderRow offers={matchedOffers} size="medium" haptic={haptic} />
              </View>
            )}

            <Pressable
              onPress={() => setMatched(null)}
              className="px-6 py-3"
              style={{ backgroundColor: COLORS.bgCard, borderRadius: 8 }}
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

const styles = StyleSheet.create({
  feedDebugOverlay: {
    position: 'absolute',
    top: 100,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    padding: 8,
    borderRadius: 6,
    zIndex: 100,
  },
  feedDebugText: {
    color: '#00FF00',
    fontSize: 9,
    fontFamily: 'monospace',
  },
});
