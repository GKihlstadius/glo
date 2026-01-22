import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { X, Bookmark, Heart, Trophy, Sparkles, PartyPopper } from 'lucide-react-native';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  interpolate,
  Extrapolation,
  runOnJS,
  FadeIn,
  FadeInDown,
  ZoomIn,
  SlideInUp,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { MovieCard } from '@/components/MovieCard';
import { StreamingRow } from '@/components/StreamingIcon';
import { FeedItem, Movie } from '@/lib/types';
import { COLORS } from '@/lib/constants';
import { useStore } from '@/lib/store';
import { FeedEngine, createFeedEngine } from '@/lib/feed-engine';
import { getStreamingOffers, getMovie } from '@/lib/movies';
import { PLACEHOLDER_BLUR_HASH } from '@/lib/image-cache';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ============================================================================
// SPELLÄGE SESSION — Round-Based Gameplay
// ============================================================================
// 7 rounds, blind choice, random winner from likes
// Fun, celebratory, worth paying for
// ============================================================================

const TOTAL_ROUNDS = 7;

type GamePhase = 'playing' | 'revealing' | 'winner' | 'no-winner';

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

  // Game state
  const [phase, setPhase] = useState<GamePhase>('playing');
  const [currentRound, setCurrentRound] = useState(1);
  const [sessionLikes, setSessionLikes] = useState<string[]>([]);
  const [winner, setWinner] = useState<Movie | null>(null);
  const [moviePool, setMoviePool] = useState<Movie[]>([]);
  const [currentMovie, setCurrentMovie] = useState<Movie | null>(null);

  // Animation values
  const progressWidth = useSharedValue(0);
  const confettiOpacity = useSharedValue(0);
  const winnerScale = useSharedValue(0.8);

  // Feed engine reference
  const feedEngineRef = useRef<FeedEngine | null>(null);

  // Initialize game
  useEffect(() => {
    feedEngineRef.current = createFeedEngine(
      session?.regionCode || country.code,
      tasteProfile,
      likedMovies,
      passedMovies,
      savedMovies,
      null // No mood filter in Spelläge 2.0
    );

    // Generate movie pool for all rounds
    const pool: Movie[] = [];
    for (let i = 0; i < TOTAL_ROUNDS; i++) {
      const item = feedEngineRef.current.getNext();
      if (item) pool.push(item.movie);
    }
    setMoviePool(pool);

    // Set first movie
    if (pool.length > 0) {
      setCurrentMovie(pool[0]);
    }

    // Animate progress bar
    progressWidth.value = withTiming((1 / TOTAL_ROUNDS) * 100, { duration: 300 });
  }, [session?.regionCode, country.code]);

  // Handle swipe
  const handleSwipe = useCallback((direction: 'left' | 'right' | 'up') => {
    if (!currentMovie || phase !== 'playing') return;

    const isLike = direction === 'right' || direction === 'up';

    if (direction === 'right') {
      likeMovie(currentMovie.id);
      setSessionLikes(prev => [...prev, currentMovie.id]);
      if (haptic) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (direction === 'up') {
      saveMovie(currentMovie.id);
      setSessionLikes(prev => [...prev, currentMovie.id]);
      if (haptic) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      passMovie(currentMovie.id);
      if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // Next round or end game
    if (currentRound >= TOTAL_ROUNDS) {
      // Game over!
      endGame();
    } else {
      // Next round
      const nextRound = currentRound + 1;
      setCurrentRound(nextRound);
      setCurrentMovie(moviePool[nextRound - 1]);

      // Update progress bar
      progressWidth.value = withSpring((nextRound / TOTAL_ROUNDS) * 100, {
        damping: 15,
        stiffness: 200,
      });
    }
  }, [currentMovie, currentRound, moviePool, phase, haptic, likeMovie, saveMovie, passMovie]);

  // End game - pick winner
  const endGame = useCallback(() => {
    setPhase('revealing');

    // Short delay for drama
    setTimeout(() => {
      if (sessionLikes.length > 0) {
        // Pick random winner from likes
        const winnerIdx = Math.floor(Math.random() * sessionLikes.length);
        const winnerId = sessionLikes[winnerIdx];
        const winnerMovie = getMovie(winnerId, country.code);

        if (winnerMovie) {
          setWinner(winnerMovie);
          setPhase('winner');

          // Trigger celebration
          confettiOpacity.value = withSequence(
            withTiming(1, { duration: 200 }),
            withDelay(3000, withTiming(0, { duration: 500 }))
          );
          winnerScale.value = withSpring(1, { damping: 12, stiffness: 150 });

          if (haptic) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            // Victory haptic pattern
            setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 100);
            setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 200);
            setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 300);
          }
        }
      } else {
        // No likes = no winner
        setPhase('no-winner');
      }
    }, 800);
  }, [sessionLikes, country.code, haptic, confettiOpacity, winnerScale]);

  // Exit session
  const handleExit = () => {
    setSession(null);
    router.back();
  };

  // Play again
  const handlePlayAgain = () => {
    setSession(null);
    router.replace('/spellage');
  };

  // Action handlers
  const handlePass = useCallback(() => {
    handleSwipe('left');
  }, [handleSwipe]);

  const handleSave = useCallback(() => {
    handleSwipe('up');
  }, [handleSwipe]);

  const handleLike = useCallback(() => {
    handleSwipe('right');
  }, [handleSwipe]);

  // Animated styles
  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  const confettiStyle = useAnimatedStyle(() => ({
    opacity: confettiOpacity.value,
  }));

  const winnerAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: winnerScale.value }],
  }));

  // Get streaming providers
  const currentProviderIds = currentMovie
    ? getStreamingOffers(currentMovie.id, session?.regionCode || country.code)
        .slice(0, 4)
        .map(offer => offer.providerId)
    : [];

  const winnerProviderIds = winner
    ? getStreamingOffers(winner.id, session?.regionCode || country.code)
        .slice(0, 4)
        .map(offer => offer.providerId)
    : [];

  // ============================================================================
  // WINNER SCREEN
  // ============================================================================
  if (phase === 'winner' && winner) {
    return (
      <View className="flex-1" style={{ backgroundColor: COLORS.bg }}>
        {/* Confetti overlay */}
        <Animated.View style={[styles.confettiOverlay, confettiStyle]} pointerEvents="none">
          <LinearGradient
            colors={['rgba(139, 92, 246, 0.3)', 'transparent', 'rgba(234, 179, 8, 0.3)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          {/* Confetti particles would be here - simplified for now */}
          <View style={styles.confettiContainer}>
            <Sparkles size={40} color="#EAB308" style={{ position: 'absolute', top: '20%', left: '20%' }} />
            <PartyPopper size={36} color="#8B5CF6" style={{ position: 'absolute', top: '15%', right: '25%' }} />
            <Sparkles size={32} color="#22C55E" style={{ position: 'absolute', top: '30%', right: '15%' }} />
            <PartyPopper size={28} color="#EAB308" style={{ position: 'absolute', bottom: '40%', left: '10%' }} />
          </View>
        </Animated.View>

        <View style={{ height: insets.top }} />

        {/* Winner header */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.winnerHeader}>
          <Trophy size={32} color="#EAB308" />
          <Text style={styles.winnerHeaderTitle}>
            {lang === 'sv' ? 'Din vinnare!' : 'Your winner!'}
          </Text>
        </Animated.View>

        {/* Winner movie */}
        <Animated.View style={[styles.winnerCardArea, winnerAnimStyle]}>
          <View style={styles.winnerCard}>
            <Image
              source={{ uri: winner.posterUrl }}
              style={styles.winnerPoster}
              contentFit="cover"
              placeholder={PLACEHOLDER_BLUR_HASH}
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.8)']}
              style={styles.winnerGradient}
            />
            <View style={styles.winnerInfo}>
              <Text style={styles.winnerTitle}>{winner.title}</Text>
              <Text style={styles.winnerYear}>{winner.year}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Bottom section */}
        <View style={[styles.bottomSection, { paddingBottom: insets.bottom + 16 }]}>
          {/* Streaming providers */}
          {winnerProviderIds.length > 0 && (
            <Animated.View entering={FadeIn.delay(600)} style={styles.providerSection}>
              <Text style={styles.watchOnText}>
                {lang === 'sv' ? 'Streama på' : 'Watch on'}
              </Text>
              <StreamingRow providerIds={winnerProviderIds} maxVisible={4} />
            </Animated.View>
          )}

          {/* Liked count */}
          <Animated.View entering={FadeIn.delay(800)} style={styles.statsRow}>
            <Text style={styles.statsText}>
              {lang === 'sv' 
                ? `Du gillade ${sessionLikes.length} av ${TOTAL_ROUNDS} filmer`
                : `You liked ${sessionLikes.length} of ${TOTAL_ROUNDS} movies`}
            </Text>
          </Animated.View>

          {/* Action buttons */}
          <Animated.View entering={SlideInUp.delay(1000)} style={styles.winnerActions}>
            <Pressable
              onPress={handlePlayAgain}
              style={({ pressed }) => [
                styles.actionBtn,
                styles.playAgainBtn,
                pressed && styles.actionBtnPressed,
              ]}
            >
              <Text style={styles.playAgainText}>
                {lang === 'sv' ? 'Spela igen' : 'Play again'}
              </Text>
            </Pressable>

            <Pressable
              onPress={handleExit}
              style={({ pressed }) => [
                styles.actionBtn,
                styles.exitBtn,
                pressed && styles.actionBtnPressed,
              ]}
            >
              <Text style={styles.exitText}>
                {lang === 'sv' ? 'Avsluta' : 'Exit'}
              </Text>
            </Pressable>
          </Animated.View>
        </View>
      </View>
    );
  }

  // ============================================================================
  // NO WINNER SCREEN
  // ============================================================================
  if (phase === 'no-winner') {
    return (
      <View className="flex-1" style={{ backgroundColor: COLORS.bg }}>
        <View style={{ height: insets.top }} />

        <View style={styles.noWinnerContent}>
          <Text style={styles.noWinnerEmoji}>🤷</Text>
          <Text style={styles.noWinnerTitle}>
            {lang === 'sv' ? 'Inga gillade' : 'No likes'}
          </Text>
          <Text style={styles.noWinnerSubtitle}>
            {lang === 'sv' 
              ? 'Du gillade ingen film. Försök igen!'
              : "You didn't like any movie. Try again!"}
          </Text>

          <Pressable
            onPress={handlePlayAgain}
            style={({ pressed }) => [
              styles.actionBtn,
              styles.playAgainBtn,
              pressed && styles.actionBtnPressed,
            ]}
          >
            <Text style={styles.playAgainText}>
              {lang === 'sv' ? 'Försök igen' : 'Try again'}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ============================================================================
  // REVEALING SCREEN (brief transition)
  // ============================================================================
  if (phase === 'revealing') {
    return (
      <View className="flex-1" style={{ backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center' }}>
        <Animated.View entering={ZoomIn.duration(300)}>
          <Sparkles size={48} color="#8B5CF6" />
        </Animated.View>
        <Text style={styles.revealingText}>
          {lang === 'sv' ? 'Väljer vinnare...' : 'Picking winner...'}
        </Text>
      </View>
    );
  }

  // ============================================================================
  // PLAYING SCREEN
  // ============================================================================
  return (
    <View className="flex-1" style={{ backgroundColor: COLORS.bg }}>
      <View style={{ height: insets.top }} />

      {/* Top bar: Round indicator + Exit */}
      <View style={styles.topBar}>
        {/* Progress bar */}
        <View style={styles.progressContainer}>
          <Animated.View style={[styles.progressFill, progressStyle]} />
        </View>

        {/* Round text */}
        <Text style={styles.roundText}>
          {lang === 'sv' 
            ? `Runda ${currentRound} av ${TOTAL_ROUNDS}`
            : `Round ${currentRound} of ${TOTAL_ROUNDS}`}
        </Text>

        {/* Exit button */}
        <Pressable onPress={handleExit} hitSlop={12} style={styles.exitButton}>
          <X size={22} color={COLORS.textMuted} />
        </Pressable>
      </View>

      {/* Movie card */}
      <View style={styles.cardArea}>
        {!currentMovie ? (
          <View className="flex-1 items-center justify-center">
            <Text style={{ color: COLORS.textMuted }}>Loading...</Text>
          </View>
        ) : (
          <MovieCard
            key={currentMovie.id}
            movie={currentMovie}
            onSwipe={handleSwipe}
            haptic={haptic}
            blindMode={true} // Always blind in Spelläge
          />
        )}
      </View>

      {/* Bottom section */}
      <View style={[styles.bottomSection, { paddingBottom: insets.bottom + 16 }]}>
        {/* Streaming providers */}
        {currentProviderIds.length > 0 && (
          <View style={styles.providerSection}>
            <StreamingRow providerIds={currentProviderIds} maxVisible={4} />
          </View>
        )}

        {/* Action buttons */}
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

        {/* Likes counter */}
        <View style={styles.likesCounter}>
          <Heart size={14} color="#22C55E" fill="#22C55E" />
          <Text style={styles.likesText}>
            {sessionLikes.length}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
  },
  progressContainer: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8B5CF6',
    borderRadius: 2,
  },
  roundText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
  exitButton: {
    padding: 4,
  },

  // Card area
  cardArea: {
    flex: 1,
    marginHorizontal: 8,
  },

  // Bottom section
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
  likesCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 12,
  },
  likesText: {
    color: '#22C55E',
    fontSize: 14,
    fontWeight: '600',
  },

  // Winner screen
  confettiOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  confettiContainer: {
    flex: 1,
  },
  winnerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  winnerHeaderTitle: {
    color: '#EAB308',
    fontSize: 24,
    fontWeight: '700',
  },
  winnerCardArea: {
    flex: 1,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  winnerCard: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: COLORS.bgCard,
  },
  winnerPoster: {
    width: '100%',
    height: '100%',
  },
  winnerGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '40%',
  },
  winnerInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
  },
  winnerTitle: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 4,
  },
  winnerYear: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 18,
    fontWeight: '500',
  },
  watchOnText: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginBottom: 8,
  },
  statsRow: {
    alignItems: 'center',
    marginTop: 8,
  },
  statsText: {
    color: COLORS.textMuted,
    fontSize: 14,
  },
  winnerActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 16,
  },
  actionBtn: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  actionBtnPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  playAgainBtn: {
    backgroundColor: '#8B5CF6',
  },
  playAgainText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  exitBtn: {
    backgroundColor: COLORS.bgCard,
  },
  exitText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '500',
  },

  // No winner screen
  noWinnerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  noWinnerEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  noWinnerTitle: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
  },
  noWinnerSubtitle: {
    color: COLORS.textMuted,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },

  // Revealing screen
  revealingText: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '500',
    marginTop: 16,
  },
});
