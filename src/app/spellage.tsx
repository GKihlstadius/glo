import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, User, Users, Sparkles, Shuffle } from 'lucide-react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  interpolate,
  Extrapolation,
  FadeIn,
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '@/lib/constants';
import { useStore } from '@/lib/store';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================================================
// SPELLÄGE 2.0 — Premium Game Mode Entry
// ============================================================================
// The ONLY premium feature. Fun, exciting, worth paying for.
// Solo: Pick blind, random winner from likes
// Together: Match with a friend (coming soon)
// ============================================================================

type SpellageMode = 'solo' | 'together';

// Animation config
const SPRING_CONFIG = { damping: 15, stiffness: 150 };

export default function SpellageScreen() {
  const insets = useSafeAreaInsets();
  const country = useStore((s) => s.country);
  const haptic = useStore((s) => s.hapticEnabled);
  const setSession = useStore((s) => s.setSession);
  const deviceId = useStore((s) => s.deviceId);
  const lang = country.language;

  const [selectedMode, setSelectedMode] = useState<SpellageMode | null>(null);

  // Animated values
  const titleScale = useSharedValue(0.8);
  const titleOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.9);
  const cardOpacity = useSharedValue(0);
  const glowPulse = useSharedValue(0);

  // Entry animation
  useEffect(() => {
    // Title animation
    titleScale.value = withSpring(1, SPRING_CONFIG);
    titleOpacity.value = withTiming(1, { duration: 400 });

    // Cards stagger
    cardScale.value = withDelay(200, withSpring(1, SPRING_CONFIG));
    cardOpacity.value = withDelay(200, withTiming(1, { duration: 400 }));

    // Glow pulse loop
    glowPulse.value = withSequence(
      withTiming(1, { duration: 1500 }),
      withTiming(0, { duration: 1500 })
    );

    // Restart glow loop
    const interval = setInterval(() => {
      glowPulse.value = withSequence(
        withTiming(1, { duration: 1500 }),
        withTiming(0, { duration: 1500 })
      );
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const titleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: titleScale.value }],
    opacity: titleOpacity.value,
  }));

  const cardContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
    opacity: cardOpacity.value,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glowPulse.value, [0, 1], [0.3, 0.7], Extrapolation.CLAMP),
    transform: [{ scale: interpolate(glowPulse.value, [0, 1], [1, 1.1], Extrapolation.CLAMP) }],
  }));

  const handleModeSelect = (mode: SpellageMode) => {
    if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedMode(mode);

    if (mode === 'solo') {
      // Start solo session immediately
      startSoloSession();
    } else {
      // TODO: Together mode - show invite screen
      // For now, just show coming soon or start solo
      if (haptic) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      // Fallback to solo for now
      startSoloSession();
    }
  };

  const startSoloSession = () => {
    const now = Date.now();

    setSession({
      id: Math.random().toString(36).slice(2),
      code: '',
      participants: [deviceId],
      swipes: {},
      status: 'active',
      mood: null, // No mood filter in Spelläge 2.0
      regionCode: country.code,
      mode: 'spellage',
      spellageSolo: true,
      blindChoice: true,
      createdAt: now,
      expiresAt: now + 2 * 60 * 60 * 1000,
      // New Spelläge 2.0 fields
      totalRounds: 7,
      currentRound: 1,
      likes: [],
      moviePool: [], // Will be populated by session screen
    });

    router.push('/session');
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <View className="flex-1" style={{ backgroundColor: COLORS.bg }}>
      {/* Animated gradient background */}
      <Animated.View style={[StyleSheet.absoluteFill, glowStyle]}>
        <LinearGradient
          colors={['transparent', 'rgba(139, 92, 246, 0.15)', 'transparent']}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Safe area spacer */}
      <View style={{ height: insets.top }} />

      {/* Back button */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} hitSlop={12} style={styles.backButton}>
          <ArrowLeft size={24} color={COLORS.text} />
        </Pressable>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Title */}
        <Animated.View style={[styles.titleContainer, titleStyle]}>
          <View style={styles.iconRow}>
            <Sparkles size={28} color="#8B5CF6" />
          </View>
          <Text style={styles.title}>
            {lang === 'sv' ? 'Spelläge' : 'Game Mode'}
          </Text>
          <Text style={styles.subtitle}>
            {lang === 'sv' 
              ? 'Svajpa blint. Hitta din film.'
              : 'Swipe blind. Find your movie.'}
          </Text>
        </Animated.View>

        {/* Mode cards */}
        <Animated.View style={[styles.cardsContainer, cardContainerStyle]}>
          {/* Solo Mode */}
          <Pressable
            onPress={() => handleModeSelect('solo')}
            style={({ pressed }) => [
              styles.modeCard,
              styles.soloCard,
              pressed && styles.cardPressed,
            ]}
          >
            <LinearGradient
              colors={['rgba(139, 92, 246, 0.2)', 'rgba(139, 92, 246, 0.05)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardGradient}
            />
            <View style={styles.cardContent}>
              <View style={styles.cardIconContainer}>
                <User size={32} color="#A78BFA" strokeWidth={1.5} />
              </View>
              <Text style={styles.cardTitle}>
                {lang === 'sv' ? 'Solo' : 'Solo'}
              </Text>
              <Text style={styles.cardDescription}>
                {lang === 'sv' 
                  ? '7 filmer • Titlar dolda • Slumpad vinnare'
                  : '7 movies • Titles hidden • Random winner'}
              </Text>
              <View style={styles.playBadge}>
                <Shuffle size={14} color="#fff" />
                <Text style={styles.playBadgeText}>
                  {lang === 'sv' ? 'Spela nu' : 'Play now'}
                </Text>
              </View>
            </View>
          </Pressable>

          {/* Together Mode */}
          <Pressable
            onPress={() => handleModeSelect('together')}
            style={({ pressed }) => [
              styles.modeCard,
              styles.togetherCard,
              pressed && styles.cardPressed,
            ]}
          >
            <LinearGradient
              colors={['rgba(59, 130, 246, 0.2)', 'rgba(59, 130, 246, 0.05)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardGradient}
            />
            <View style={styles.cardContent}>
              <View style={[styles.cardIconContainer, styles.togetherIcon]}>
                <Users size={32} color="#60A5FA" strokeWidth={1.5} />
              </View>
              <Text style={styles.cardTitle}>
                {lang === 'sv' ? 'Tillsammans' : 'Together'}
              </Text>
              <Text style={styles.cardDescription}>
                {lang === 'sv' 
                  ? 'Matcha med en vän • Se vem som gillar samma'
                  : 'Match with a friend • See who likes the same'}
              </Text>
              <View style={[styles.playBadge, styles.comingSoonBadge]}>
                <Text style={styles.playBadgeText}>
                  {lang === 'sv' ? 'Kommer snart' : 'Coming soon'}
                </Text>
              </View>
            </View>
          </Pressable>
        </Animated.View>

        {/* How it works */}
        <Animated.View 
          entering={FadeInUp.delay(500).duration(400)}
          style={styles.howItWorks}
        >
          <Text style={styles.howItWorksTitle}>
            {lang === 'sv' ? 'Hur fungerar det?' : 'How does it work?'}
          </Text>
          <View style={styles.steps}>
            <Text style={styles.step}>
              {lang === 'sv' ? '1. Svajpa 7 filmer (titlar dolda)' : '1. Swipe 7 movies (titles hidden)'}
            </Text>
            <Text style={styles.step}>
              {lang === 'sv' ? '2. Gilla de som ser bra ut' : '2. Like the ones that look good'}
            </Text>
            <Text style={styles.step}>
              {lang === 'sv' ? '3. En slumpad vinnare avslöjas!' : '3. A random winner is revealed!'}
            </Text>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconRow: {
    marginBottom: 12,
  },
  title: {
    color: COLORS.text,
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: -1,
    marginBottom: 8,
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 17,
    textAlign: 'center',
  },
  cardsContainer: {
    gap: 16,
    marginBottom: 32,
  },
  modeCard: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  soloCard: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  togetherCard: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  cardGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  cardContent: {
    padding: 24,
    alignItems: 'center',
  },
  cardIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  togetherIcon: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
  },
  cardTitle: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 8,
  },
  cardDescription: {
    color: COLORS.textMuted,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  playBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(139, 92, 246, 0.8)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  comingSoonBadge: {
    backgroundColor: 'rgba(100, 100, 100, 0.6)',
  },
  playBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  howItWorks: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  howItWorksTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  steps: {
    gap: 8,
  },
  step: {
    color: COLORS.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
});
