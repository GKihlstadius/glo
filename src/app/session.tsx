import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { X, Bookmark, Heart, Trophy } from 'lucide-react-native';
import { router } from 'expo-router';
import { MovieCard } from '@/components/MovieCard';
import { StreamingRow } from '@/components/StreamingIcon';
import { FeedItem, Movie } from '@/lib/types';
import { COLORS } from '@/lib/constants';
import { useStore } from '@/lib/store';
import { FeedEngine, createFeedEngine } from '@/lib/feed-engine';
import { getStreamingOffers, getMovie } from '@/lib/movies';

// Spelläge game config
const ROUNDS_TO_WIN = 5; // First to get 5 likes wins

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

  // Spelläge game state
  const [sessionLikes, setSessionLikes] = useState<string[]>([]);
  const [winner, setWinner] = useState<Movie | null>(null);
  const [showWinnerReveal, setShowWinnerReveal] = useState(false);

  // Blind choice: track which movies have been revealed (liked/saved)
  const [revealedMovies, setRevealedMovies] = useState<Set<string>>(new Set());

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

  // Check for winner in Spelläge mode
  useEffect(() => {
    if (session?.mode === 'spellage' && sessionLikes.length >= ROUNDS_TO_WIN) {
      // Pick a random liked movie as the winner
      const winnerIdx = Math.floor(Math.random() * sessionLikes.length);
      const winnerId = sessionLikes[winnerIdx];
      const winnerMovie = getMovie(winnerId, country.code);

      if (winnerMovie) {
        setWinner(winnerMovie);
        setShowWinnerReveal(true);
        if (haptic) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    }
  }, [sessionLikes.length, session?.mode, country.code, haptic]);

  const handleSwipe = useCallback(
    (direction: 'left' | 'right' | 'up') => {
      if (!currentItem || !feedEngineRef.current) return;

      const movie = currentItem.movie;

      if (direction === 'right') {
        likeMovie(movie.id);
        feedEngineRef.current.recordSwipe(movie.id, 'like');
        // Track session likes for Spelläge
        setSessionLikes(prev => [...prev, movie.id]);
        // Reveal movie title in blind mode after like
        if (session?.blindChoice) {
          setRevealedMovies(prev => new Set(prev).add(movie.id));
        }
        if (haptic) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (direction === 'left') {
        passMovie(movie.id);
        feedEngineRef.current.recordSwipe(movie.id, 'pass');
      } else if (direction === 'up') {
        saveMovie(movie.id);
        feedEngineRef.current.recordSwipe(movie.id, 'save');
        // Also count saves as likes for Spelläge
        setSessionLikes(prev => [...prev, movie.id]);
        // Reveal movie title in blind mode after save
        if (session?.blindChoice) {
          setRevealedMovies(prev => new Set(prev).add(movie.id));
        }
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

  // Get current movie's streaming provider IDs
  const currentProviderIds = currentItem
    ? getStreamingOffers(currentItem.movie.id, session?.regionCode || country.code)
        .slice(0, 4)
        .map(offer => offer.providerId)
    : [];

  // Winner provider IDs
  const winnerProviderIds = winner
    ? getStreamingOffers(winner.id, session?.regionCode || country.code)
        .slice(0, 4)
        .map(offer => offer.providerId)
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

  // Winner reveal screen (Spelläge dramatic reveal)
  if (showWinnerReveal && winner) {
    return (
      <View className="flex-1" style={{ backgroundColor: COLORS.bg }}>
        <View style={{ height: insets.top }} />

        {/* Winner header */}
        <View style={styles.winnerHeader}>
          <Trophy size={24} color="#EAB308" />
          <Text style={styles.winnerTitle}>
            {lang === 'sv' ? 'Vinnare!' : 'Winner!'}
          </Text>
        </View>

        {/* Winner movie card with auto-playing trailer */}
        <View style={styles.cardArea}>
          <MovieCard
            movie={winner}
            onSwipe={() => {}} // Disable swipe on winner
            haptic={haptic}
            showTrailerOnWin={true} // Dramatic trailer reveal
          />
        </View>

        {/* Bottom section */}
        <View style={[styles.bottomSection, { paddingBottom: insets.bottom + 16 }]}>
          {/* Streaming providers */}
          {winnerProviderIds.length > 0 && (
            <View style={styles.providerSection}>
              <StreamingRow
                providerIds={winnerProviderIds}
                movieId={winner.id}
                maxVisible={4}
              />
            </View>
          )}

          {/* Watch now / Exit buttons */}
          <View style={styles.winnerActions}>
            <Pressable
              onPress={handleExit}
              style={({ pressed }) => [
                styles.winnerButton,
                styles.winnerExitButton,
                pressed && { opacity: 0.8 },
              ]}
            >
              <Text style={styles.winnerButtonText}>
                {lang === 'sv' ? 'Avsluta' : 'Exit'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: COLORS.bg }}>
      {/* Top area - absolute minimal: only X to exit */}
      <View style={{ height: insets.top }} />
      <View style={styles.exitRow}>
        <Pressable onPress={handleExit} hitSlop={12} style={styles.exitButton}>
          <X size={22} color={COLORS.textMuted} />
        </Pressable>
      </View>

      {/* Main content - movie poster */}
      <View style={styles.cardArea}>
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
            blindMode={session?.blindChoice ?? false}
            isRevealed={revealedMovies.has(currentItem.movie.id)}
          />
        )}
      </View>

      {/* Bottom section */}
      <View style={[styles.bottomSection, { paddingBottom: insets.bottom + 16 }]}>
        {/* Streaming providers */}
        {currentProviderIds.length > 0 && (
          <View style={styles.providerSection}>
            <StreamingRow
              providerIds={currentProviderIds}
              movieId={currentItem?.movie.id}
              maxVisible={4}
            />
          </View>
        )}

        {/* Action bar */}
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  exitRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  exitButton: {
    padding: 4,
  },
  cardArea: {
    flex: 1,
    marginHorizontal: 8,
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
    paddingTop: 8,
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
  // Winner reveal styles
  winnerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  winnerTitle: {
    color: '#EAB308',
    fontSize: 20,
    fontWeight: '600',
  },
  winnerActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: 16,
    gap: 16,
  },
  winnerButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  winnerExitButton: {
    backgroundColor: COLORS.bgCard,
  },
  winnerButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '500',
  },
});
