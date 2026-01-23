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
import { useSessionMovies, haveAllParticipantsSwiped, isMovieMatch } from '@/lib/useSessionMovies';
import { updateSessionInRegistry } from '@/lib/session-registry';

// Spelläge game config
// Note: Game now uses round-based gameplay (7 rounds) instead of "first to X likes"

export default function SessionScreen() {
  const insets = useSafeAreaInsets();
  const country = useStore((s) => s.country);
  const haptic = useStore((s) => s.hapticEnabled);
  const session = useStore((s) => s.currentSession);
  const setSession = useStore((s) => s.setSession);
  const deviceId = useStore((s) => s.deviceId);
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

  // Feed engine reference (for Solo mode / fallback)
  const feedEngineRef = useRef<FeedEngine | null>(null);

  // Session movies hook (for Together mode synchronized feed)
  const {
    currentMovie: sessionCurrentMovie,
    isSessionMode,
    totalRounds,
    currentRound,
  } = useSessionMovies(session, session?.regionCode || country.code);

  // Determine if we're in Together mode (not solo)
  const isTogetherMode = Boolean(session && !session.spellageSolo);

  // Initialize feed engine (only when NOT using session movies)
  // Spelläge (both Solo and Together) uses pre-generated session.movies
  // Feed engine is used for regular swipe mode without session
  useEffect(() => {
    // Skip feed engine if we have session movies (both Solo and Together Spelläge modes)
    if (isSessionMode) {
      return;
    }

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
  }, [session?.regionCode, session?.mood, country.code, isSessionMode]);

  // Check for game completion in Spelläge mode (after all rounds finished)
  useEffect(() => {
    if (session?.mode === 'spellage' && session.status === 'completed' && !showWinnerReveal) {
      // Game is complete - all rounds done
      if (sessionLikes.length > 0) {
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
      } else {
        // No likes at all - still show completion state
        setShowWinnerReveal(true);
        if (haptic) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }
      }
    }
  }, [session?.status, session?.mode, sessionLikes, country.code, haptic, showWinnerReveal]);

  // Record swipe to session state and sync with registry
  const recordSwipeToSession = useCallback(
    (movieId: string, action: 'like' | 'pass') => {
      if (!session) return;

      // Create updated swipes object
      const updatedSwipes = {
        ...session.swipes,
        [deviceId]: {
          ...(session.swipes[deviceId] || {}),
          [movieId]: action,
        },
      };

      // Check if this is a match (all participants liked)
      const updatedSession = {
        ...session,
        swipes: updatedSwipes,
      };

      // Calculate matches
      let newMatches = [...session.matches];
      if (action === 'like') {
        // Check if all participants have now liked this movie
        const allParticipantsLiked = session.participants.every(
          pid => updatedSwipes[pid]?.[movieId] === 'like'
        );
        if (allParticipantsLiked && !newMatches.includes(movieId)) {
          newMatches = [...newMatches, movieId];
        }
      }

      // Check if we should advance to next round
      // For Solo mode: always advance after swipe
      // For Together mode: advance when all participants have swiped
      let newRound = session.currentRound;
      if (session.spellageSolo) {
        // Solo mode: advance immediately after each swipe
        if (newRound < session.totalRounds) {
          newRound = newRound + 1;
        }
      } else {
        // Together mode: advance when all participants have swiped
        const allSwiped = session.participants.every(
          pid => updatedSwipes[pid]?.[movieId] !== undefined
        );
        if (allSwiped && newRound < session.totalRounds) {
          newRound = newRound + 1;
        }
      }

      // Determine session status
      // Mark as completed when current round exceeds total rounds
      const isGameComplete = newRound > session.totalRounds;
      const newStatus = isGameComplete ? 'completed' as const : session.status;

      // Update session
      const finalSession = {
        ...updatedSession,
        matches: newMatches,
        currentRound: newRound,
        status: newStatus,
      };

      setSession(finalSession);

      // Sync to registry for other participants (Together mode)
      if (isTogetherMode) {
        updateSessionInRegistry(finalSession);
      }
    },
    [session, deviceId, setSession, isTogetherMode]
  );

  const handleSwipe = useCallback(
    (direction: 'left' | 'right' | 'up') => {
      // Get current movie based on mode
      // Session mode (both Solo and Together) uses sessionCurrentMovie
      // Non-session mode uses feed engine
      const movie = isSessionMode
        ? sessionCurrentMovie?.movie
        : currentItem?.movie;

      if (!movie) return;

      // Record to local store
      if (direction === 'right') {
        likeMovie(movie.id);
        // Track session likes for Spelläge
        setSessionLikes(prev => [...prev, movie.id]);
        // Reveal movie title in blind mode after like
        if (session?.blindChoice) {
          setRevealedMovies(prev => new Set(prev).add(movie.id));
        }
        if (haptic) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // Record to session
        recordSwipeToSession(movie.id, 'like');
      } else if (direction === 'left') {
        passMovie(movie.id);
        // Record to session
        recordSwipeToSession(movie.id, 'pass');
      } else if (direction === 'up') {
        saveMovie(movie.id);
        // Saves count as likes for Spelläge matching
        setSessionLikes(prev => [...prev, movie.id]);
        // Reveal movie title in blind mode after save
        if (session?.blindChoice) {
          setRevealedMovies(prev => new Set(prev).add(movie.id));
        }
        if (haptic) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // Record saves as likes to session
        recordSwipeToSession(movie.id, 'like');
      }

      // Record to feed engine if using it (non-session mode)
      if (feedEngineRef.current && !isSessionMode) {
        feedEngineRef.current.recordSwipe(movie.id, direction === 'left' ? 'pass' : direction === 'up' ? 'save' : 'like');
      }

      // Advance queue for non-session mode (uses feed engine)
      // Session mode advances via session.currentRound in recordSwipeToSession
      if (!isSessionMode) {
        setCurrentItem(nextItem);
        const newNext = feedEngineRef.current?.getNext() ?? null;
        setNextItem(newNext);
      }
    },
    [
      currentItem,
      nextItem,
      sessionCurrentMovie,
      isSessionMode,
      likeMovie,
      passMovie,
      saveMovie,
      haptic,
      session?.blindChoice,
      recordSwipeToSession,
    ]
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

  // Get current movie (from session movies in Spelläge modes, feed engine otherwise)
  const displayMovie = isSessionMode
    ? sessionCurrentMovie?.movie
    : currentItem?.movie;

  // Get current movie's streaming provider IDs
  const currentProviderIds = displayMovie
    ? getStreamingOffers(displayMovie.id, session?.regionCode || country.code)
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

  // Game complete screen (Spelläge dramatic reveal after all rounds)
  if (showWinnerReveal) {
    return (
      <View className="flex-1" style={{ backgroundColor: COLORS.bg }}>
        <View style={{ height: insets.top }} />

        {winner ? (
          <>
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
                    maxVisible={4}
                  />
                </View>
              )}

              {/* Exit button */}
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
          </>
        ) : (
          <>
            {/* No winner - game complete without likes */}
            <View style={styles.noWinnerContent}>
              <Text style={styles.noWinnerTitle}>
                {lang === 'sv' ? 'Spelomgång slutförd!' : 'Game complete!'}
              </Text>
              <Text style={styles.noWinnerSubtitle}>
                {lang === 'sv'
                  ? 'Ingen film valdes den här gången. Prova igen!'
                  : 'No film was picked this time. Try again!'}
              </Text>
            </View>

            {/* Exit button */}
            <View style={[styles.bottomSection, { paddingBottom: insets.bottom + 16 }]}>
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
          </>
        )}
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

      {/* Round indicator for Spelläge (both Solo and Together modes) */}
      {session?.mode === 'spellage' && isSessionMode && (
        <View style={styles.roundIndicator}>
          <Text style={styles.roundText}>
            {lang === 'sv' ? `Runda ${currentRound} av ${totalRounds}` : `Round ${currentRound} of ${totalRounds}`}
          </Text>
        </View>
      )}

      {/* Main content - movie poster */}
      <View style={styles.cardArea}>
        {!displayMovie ? (
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
            key={displayMovie.id}
            movie={displayMovie}
            onSwipe={handleSwipe}
            haptic={haptic}
            blindMode={session?.blindChoice ?? false}
            isRevealed={revealedMovies.has(displayMovie.id)}
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
  roundIndicator: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  roundText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '500',
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
  noWinnerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  noWinnerTitle: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  noWinnerSubtitle: {
    color: COLORS.textMuted,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});
