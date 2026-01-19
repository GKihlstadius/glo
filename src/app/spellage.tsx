import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Coffee, Flame, Zap, Clock, Sparkles, User, Users } from 'lucide-react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { COLORS } from '@/lib/constants';
import { useStore } from '@/lib/store';
import { Mood } from '@/lib/types';

// Spelläge is the ONLY premium feature
// Inside Spelläge: Solo or Together

type SpellageMode = 'solo' | 'together';
type SpellageStep = 'mode' | 'mood';

// Mood options including "Surprise me"
const MOODS: { id: Mood | 'surprise'; icon: typeof Coffee; labelEn: string; labelSv: string }[] = [
  { id: 'calm', icon: Coffee, labelEn: 'Calm', labelSv: 'Lugn' },
  { id: 'fun', icon: Zap, labelEn: 'Fun', labelSv: 'Rolig' },
  { id: 'intense', icon: Flame, labelEn: 'Intense', labelSv: 'Intensiv' },
  { id: 'short', icon: Clock, labelEn: 'Short', labelSv: 'Kort' },
  { id: 'surprise', icon: Sparkles, labelEn: 'Surprise me', labelSv: 'Överraska mig' },
];

export default function SpellageScreen() {
  const insets = useSafeAreaInsets();
  const country = useStore((s) => s.country);
  const haptic = useStore((s) => s.hapticEnabled);
  const setSession = useStore((s) => s.setSession);
  const deviceId = useStore((s) => s.deviceId);
  const lang = country.language;

  const [step, setStep] = useState<SpellageStep>('mode');
  const [selectedMode, setSelectedMode] = useState<SpellageMode | null>(null);

  const handleModeSelect = (mode: SpellageMode) => {
    if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedMode(mode);
    setStep('mood');
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
      setStep('mode');
      setSelectedMode(null);
    } else {
      router.back();
    }
  };

  return (
    <View className="flex-1" style={{ backgroundColor: COLORS.bg }}>
      {/* Empty top area - only safe area spacer */}
      <View style={{ height: insets.top }} />

      {/* Back button - minimal, bottom-aligned conceptually but at nav level */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} hitSlop={12}>
          <ArrowLeft size={24} color={COLORS.text} />
        </Pressable>
      </View>

      {/* Content - centered, premium feel */}
      <View style={styles.content}>
        {step === 'mode' ? (
          <>
            <Text style={styles.title}>
              {lang === 'sv' ? 'Spelläge' : 'Game Mode'}
            </Text>
            <Text style={styles.subtitle}>
              {lang === 'sv' ? 'Hur vill du spela?' : 'How do you want to play?'}
            </Text>

            <View style={styles.modeContainer}>
              {/* Solo */}
              <Pressable
                onPress={() => handleModeSelect('solo')}
                style={({ pressed }) => [
                  styles.modeCard,
                  pressed && styles.modeCardPressed,
                ]}
              >
                <User size={32} color={COLORS.text} strokeWidth={1.5} />
                <Text style={styles.modeLabel}>
                  {lang === 'sv' ? 'Solo' : 'Solo'}
                </Text>
                <Text style={styles.modeDescription}>
                  {lang === 'sv' ? 'Blind val, avslöja vid like' : 'Blind choice, reveal on like'}
                </Text>
              </Pressable>

              {/* Together */}
              <Pressable
                onPress={() => handleModeSelect('together')}
                style={({ pressed }) => [
                  styles.modeCard,
                  pressed && styles.modeCardPressed,
                ]}
              >
                <Users size={32} color={COLORS.text} strokeWidth={1.5} />
                <Text style={styles.modeLabel}>
                  {lang === 'sv' ? 'Tillsammans' : 'Together'}
                </Text>
                <Text style={styles.modeDescription}>
                  {lang === 'sv' ? 'Matcha med någon' : 'Match with someone'}
                </Text>
              </Pressable>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.title}>
              {lang === 'sv' ? 'Välj känsla' : 'Pick a mood'}
            </Text>
            <Text style={styles.subtitle}>
              {lang === 'sv' ? 'Vad känner du för?' : 'What are you in the mood for?'}
            </Text>

            <View style={styles.moodGrid}>
              {MOODS.map((mood) => {
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
          </>
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  title: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: '600',
    marginBottom: 8,
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 16,
    marginBottom: 32,
  },
  modeContainer: {
    gap: 16,
  },
  modeCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  modeCardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  modeLabel: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '500',
    marginTop: 12,
  },
  modeDescription: {
    color: COLORS.textMuted,
    fontSize: 14,
    marginTop: 4,
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
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodCardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  moodLabel: {
    color: COLORS.textMuted,
    fontSize: 14,
    marginTop: 8,
  },
});
