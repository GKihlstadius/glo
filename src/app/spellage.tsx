import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Coffee, Flame, Zap, Clock, Sparkles, User, Users, Dices, Heart } from 'lucide-react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { COLORS } from '@/lib/constants';
import { useStore } from '@/lib/store';
import { Mood } from '@/lib/types';

// Spelläge is the ONLY premium feature
// Inside Spelläge: Solo or Together

type SpellageMode = 'solo' | 'together';
type SpellageStep = 'mode' | 'mood';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Mood options including "Surprise me"
const MOODS: { id: Mood | 'surprise'; icon: typeof Coffee; labelEn: string; labelSv: string }[] = [
  { id: 'calm', icon: Coffee, labelEn: 'Calm', labelSv: 'Lugn' },
  { id: 'fun', icon: Zap, labelEn: 'Fun', labelSv: 'Rolig' },
  { id: 'intense', icon: Flame, labelEn: 'Intense', labelSv: 'Intensiv' },
  { id: 'short', icon: Clock, labelEn: 'Short', labelSv: 'Kort' },
  { id: 'surprise', icon: Sparkles, labelEn: 'Surprise me', labelSv: 'Överraska mig' },
];

// Animated Pressable wrapper
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function SpellageScreen() {
  const insets = useSafeAreaInsets();
  const country = useStore((s) => s.country);
  const haptic = useStore((s) => s.hapticEnabled);
  const setSession = useStore((s) => s.setSession);
  const deviceId = useStore((s) => s.deviceId);
  const lang = country.language;

  const [step, setStep] = useState<SpellageStep>('mode');
  const [selectedMode, setSelectedMode] = useState<SpellageMode | null>(null);

  // Animation values
  const headerOpacity = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(20);
  const soloCardProgress = useSharedValue(0);
  const togetherCardProgress = useSharedValue(0);
  const moodGridOpacity = useSharedValue(0);

  // Entrance animations
  useEffect(() => {
    // Reset and play entrance animations
    headerOpacity.value = 0;
    titleOpacity.value = 0;
    titleTranslateY.value = 20;
    soloCardProgress.value = 0;
    togetherCardProgress.value = 0;

    // Staggered entrance
    headerOpacity.value = withDelay(100, withTiming(1, { duration: 300 }));
    titleOpacity.value = withDelay(150, withTiming(1, { duration: 400 }));
    titleTranslateY.value = withDelay(150, withSpring(0, { damping: 20, stiffness: 200 }));
    soloCardProgress.value = withDelay(300, withSpring(1, { damping: 18, stiffness: 120 }));
    togetherCardProgress.value = withDelay(400, withSpring(1, { damping: 18, stiffness: 120 }));
  }, [step]);

  // Animated styles
  const headerAnimStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const titleAnimStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const soloCardAnimStyle = useAnimatedStyle(() => ({
    opacity: soloCardProgress.value,
    transform: [
      { translateY: interpolate(soloCardProgress.value, [0, 1], [40, 0]) },
      { scale: interpolate(soloCardProgress.value, [0, 1], [0.95, 1]) },
    ],
  }));

  const togetherCardAnimStyle = useAnimatedStyle(() => ({
    opacity: togetherCardProgress.value,
    transform: [
      { translateY: interpolate(togetherCardProgress.value, [0, 1], [40, 0]) },
      { scale: interpolate(togetherCardProgress.value, [0, 1], [0.95, 1]) },
    ],
  }));

  const handleModeSelect = (mode: SpellageMode) => {
    if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedMode(mode);

    // Animate out then change step
    soloCardProgress.value = withTiming(0, { duration: 200 });
    togetherCardProgress.value = withTiming(0, { duration: 200 });
    titleOpacity.value = withTiming(0, { duration: 150 });

    setTimeout(() => {
      setStep('mood');
    }, 220);
  };

  const handleMoodSelect = (moodId: Mood | 'surprise') => {
    if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // If surprise, pick a random mood
    const actualMood: Mood = moodId === 'surprise'
      ? (['calm', 'fun', 'intense', 'short'] as Mood[])[Math.floor(Math.random() * 4)]
      : moodId;

    const now = Date.now();

    // Create session
    setSession({
      id: Math.random().toString(36).slice(2),
      code: selectedMode === 'together' ? generateCode() : '',
      participants: [deviceId],
      swipes: {},
      status: 'active',
      mood: actualMood,
      regionCode: country.code,
      mode: 'spellage',
      spellageSolo: selectedMode === 'solo',
      blindChoice: true, // MANDATORY: titles hidden in Spelläge
      createdAt: now,
      expiresAt: now + 2 * 60 * 60 * 1000, // 2 hours
    });

    router.push('/session');
  };

  const handleBack = () => {
    if (step === 'mood') {
      // Animate transition back to mode selection
      moodGridOpacity.value = withTiming(0, { duration: 150 });
      setTimeout(() => {
        setStep('mode');
        setSelectedMode(null);
      }, 160);
    } else {
      router.back();
    }
  };

  // Mood step animation
  useEffect(() => {
    if (step === 'mood') {
      moodGridOpacity.value = withDelay(100, withTiming(1, { duration: 300 }));
    }
  }, [step]);

  const moodGridAnimStyle = useAnimatedStyle(() => ({
    opacity: moodGridOpacity.value,
  }));

  return (
    <View className="flex-1" style={{ backgroundColor: COLORS.bg }}>
      {/* Safe area spacer */}
      <View style={{ height: insets.top }} />

      {/* Header with back button */}
      <Animated.View style={[styles.header, headerAnimStyle]}>
        <Pressable
          onPress={handleBack}
          hitSlop={12}
          style={({ pressed }) => [
            styles.backButton,
            pressed && { opacity: 0.5 }
          ]}
        >
          <ArrowLeft size={24} color={COLORS.text} />
        </Pressable>
      </Animated.View>

      {/* Content */}
      <View style={styles.content}>
        {step === 'mode' ? (
          <>
            {/* Title Section */}
            <Animated.View style={[styles.titleSection, titleAnimStyle]}>
              <View style={styles.titleRow}>
                <Dices size={32} color={COLORS.text} strokeWidth={1.5} />
                <Text style={styles.title}>
                  {lang === 'sv' ? 'Spelläge' : 'Game Mode'}
                </Text>
              </View>
              <Text style={styles.subtitle}>
                {lang === 'sv' ? 'Välj hur du vill upptäcka din nästa film' : 'Choose how you want to discover your next film'}
              </Text>
            </Animated.View>

            {/* Mode Cards */}
            <View style={styles.cardsContainer}>
              {/* Solo Card */}
              <AnimatedPressable
                onPress={() => handleModeSelect('solo')}
                style={[soloCardAnimStyle]}
              >
                <View style={styles.modeCard}>
                  <View style={styles.cardGlow} />
                  <View style={styles.cardContent}>
                    <View style={styles.iconContainer}>
                      <User size={40} color={COLORS.text} strokeWidth={1.5} />
                    </View>
                    <View style={styles.cardTextContent}>
                      <Text style={styles.modeTitle}>
                        {lang === 'sv' ? 'Solo' : 'Solo'}
                      </Text>
                      <Text style={styles.modeDescription}>
                        {lang === 'sv'
                          ? 'Swipa blindt genom filmer och avslöja din favorit'
                          : 'Swipe blindly through films and reveal your pick'}
                      </Text>
                    </View>
                    <View style={styles.cardArrow}>
                      <ArrowLeft size={20} color={COLORS.textMuted} style={{ transform: [{ rotate: '180deg' }] }} />
                    </View>
                  </View>
                </View>
              </AnimatedPressable>

              {/* Together Card */}
              <AnimatedPressable
                onPress={() => handleModeSelect('together')}
                style={[togetherCardAnimStyle]}
              >
                <View style={[styles.modeCard, styles.togetherCard]}>
                  <View style={[styles.cardGlow, styles.togetherGlow]} />
                  <View style={styles.cardContent}>
                    <View style={[styles.iconContainer, styles.togetherIcon]}>
                      <Users size={40} color={COLORS.text} strokeWidth={1.5} />
                      <Heart
                        size={16}
                        color="#ef4444"
                        fill="#ef4444"
                        style={styles.heartBadge}
                      />
                    </View>
                    <View style={styles.cardTextContent}>
                      <Text style={styles.modeTitle}>
                        {lang === 'sv' ? 'Tillsammans' : 'Together'}
                      </Text>
                      <Text style={styles.modeDescription}>
                        {lang === 'sv'
                          ? 'Hitta en film ni båda vill se genom blind matchning'
                          : 'Find a film you both want to watch with blind matching'}
                      </Text>
                    </View>
                    <View style={styles.cardArrow}>
                      <ArrowLeft size={20} color={COLORS.textMuted} style={{ transform: [{ rotate: '180deg' }] }} />
                    </View>
                  </View>
                </View>
              </AnimatedPressable>
            </View>

            {/* Footer hint */}
            <Animated.View style={[styles.footerHint, titleAnimStyle]}>
              <Text style={styles.hintText}>
                {lang === 'sv'
                  ? 'Filmtitlar avslöjas först efter ditt val'
                  : 'Film titles revealed only after your choice'}
              </Text>
            </Animated.View>
          </>
        ) : (
          <Animated.View style={[styles.moodContent, moodGridAnimStyle]}>
            <View style={styles.titleSection}>
              <Text style={styles.title}>
                {lang === 'sv' ? 'Välj känsla' : 'Pick a mood'}
              </Text>
              <Text style={styles.subtitle}>
                {lang === 'sv' ? 'Vad känner du för?' : 'What are you in the mood for?'}
              </Text>
            </View>

            <View style={styles.moodGrid}>
              {MOODS.map((mood, index) => {
                const Icon = mood.icon;
                return (
                  <Pressable
                    key={mood.id}
                    onPress={() => handleMoodSelect(mood.id)}
                    style={({ pressed }) => [
                      styles.moodCard,
                      pressed && styles.moodCardPressed,
                    ]}
                  >
                    <Icon size={28} color={COLORS.text} strokeWidth={1.5} />
                    <Text style={styles.moodLabel}>
                      {lang === 'sv' ? mood.labelSv : mood.labelEn}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>
        )}
      </View>
    </View>
  );
}

// Generate 6-character room code
function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  titleSection: {
    marginTop: 16,
    marginBottom: 32,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  title: {
    color: COLORS.text,
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 16,
    lineHeight: 22,
  },
  cardsContainer: {
    gap: 16,
  },
  modeCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  togetherCard: {
    borderColor: 'rgba(239, 68, 68, 0.15)',
  },
  cardGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  togetherGlow: {
    backgroundColor: 'rgba(239, 68, 68, 0.04)',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  togetherIcon: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  heartBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
  },
  cardTextContent: {
    flex: 1,
  },
  modeTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  modeDescription: {
    color: COLORS.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  cardArrow: {
    opacity: 0.4,
  },
  footerHint: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  hintText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontStyle: 'italic',
    opacity: 0.7,
  },
  moodContent: {
    flex: 1,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  moodCard: {
    width: '47%',
    aspectRatio: 1.2,
    backgroundColor: COLORS.bgCard,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  moodCardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  moodLabel: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '500',
    marginTop: 10,
  },
});
