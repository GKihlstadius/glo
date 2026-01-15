import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Coffee, Flame, Zap, Clock } from 'lucide-react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { COLORS } from '@/lib/constants';
import { useStore } from '@/lib/store';
import { Mood } from '@/lib/types';

// Mood options - minimal, icon-first
const MOODS: { id: Mood; icon: typeof Coffee; labelEn: string; labelSv: string }[] = [
  { id: 'calm', icon: Coffee, labelEn: 'Calm', labelSv: 'Lugn' },
  { id: 'fun', icon: Zap, labelEn: 'Fun', labelSv: 'Rolig' },
  { id: 'intense', icon: Flame, labelEn: 'Intense', labelSv: 'Intensiv' },
  { id: 'short', icon: Clock, labelEn: 'Short', labelSv: 'Kort' },
];

export default function SpellageScreen() {
  const insets = useSafeAreaInsets();
  const country = useStore((s) => s.country);
  const haptic = useStore((s) => s.hapticEnabled);
  const setSession = useStore((s) => s.setSession);
  const deviceId = useStore((s) => s.deviceId);
  const lang = country.language;

  const handleMood = (mood: Mood) => {
    if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Create session with mood filter
    setSession({
      id: Math.random().toString(36).slice(2),
      code: '',
      participants: [deviceId],
      swipes: {},
      status: 'active',
      mood,
    });

    router.push('/session');
  };

  return (
    <View className="flex-1" style={{ backgroundColor: COLORS.bg }}>
      {/* Header */}
      <View
        className="flex-row items-center px-4 pb-4"
        style={{ paddingTop: insets.top + 8 }}
      >
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <ArrowLeft size={24} color={COLORS.text} />
        </Pressable>
      </View>

      <View className="flex-1 px-6">
        <Text className="text-xl font-medium mb-2" style={{ color: COLORS.text }}>
          {lang === 'sv' ? 'Spelläge' : 'Game Mode'}
        </Text>
        <Text className="text-sm mb-8" style={{ color: COLORS.textMuted }}>
          {lang === 'sv' ? 'Välj känsla.' : 'Pick a mood.'}
        </Text>

        <View className="flex-row flex-wrap" style={{ gap: 12 }}>
          {MOODS.map((mood) => {
            const Icon = mood.icon;
            return (
              <Pressable
                key={mood.id}
                onPress={() => handleMood(mood.id)}
                className="items-center justify-center"
                style={{
                  width: '47%',
                  aspectRatio: 1,
                  backgroundColor: COLORS.bgCard,
                }}
              >
                <Icon size={32} color={COLORS.text} strokeWidth={1.5} />
                <Text className="text-sm mt-3" style={{ color: COLORS.textMuted }}>
                  {lang === 'sv' ? mood.labelSv : mood.labelEn}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}
