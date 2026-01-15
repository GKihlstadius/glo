import React from 'react';
import { View, Text, Pressable, ScrollView, Switch, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  X,
  Globe,
  ChevronRight,
  Vibrate,
  Heart,
  Trash2,
  Info,
  Crown,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { COLORS, SUPPORTED_COUNTRIES } from '@/lib/constants';
import { useGloStore, useCountry, useHapticEnabled, useHasPurchased, useConnectionPoints } from '@/lib/store';

interface SettingsRowProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  delay?: number;
}

function SettingsRow({ icon, title, subtitle, onPress, rightElement, delay = 0 }: SettingsRowProps) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).springify()}>
      <Pressable
        onPress={onPress}
        disabled={!onPress}
        className="flex-row items-center px-5 py-4 active:opacity-70"
      >
        <View
          className="w-10 h-10 rounded-xl items-center justify-center mr-4"
          style={{ backgroundColor: COLORS.backgroundCard }}
        >
          {icon}
        </View>
        <View className="flex-1">
          <Text className="text-base font-medium" style={{ color: COLORS.textPrimary }}>
            {title}
          </Text>
          {subtitle && (
            <Text className="text-sm mt-0.5" style={{ color: COLORS.textMuted }}>
              {subtitle}
            </Text>
          )}
        </View>
        {rightElement || (onPress && <ChevronRight size={20} color={COLORS.textMuted} />)}
      </Pressable>
    </Animated.View>
  );
}

function SectionHeader({ title, delay = 0 }: { title: string; delay?: number }) {
  return (
    <Animated.Text
      entering={FadeInDown.delay(delay).springify()}
      className="text-sm font-semibold uppercase tracking-wider px-5 pt-6 pb-2"
      style={{ color: COLORS.textMuted }}
    >
      {title}
    </Animated.Text>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const country = useCountry();
  const hapticEnabled = useHapticEnabled();
  const hasPurchased = useHasPurchased();
  const connectionPoints = useConnectionPoints();

  const toggleHaptic = useGloStore((s) => s.toggleHaptic);
  const resetPreferences = useGloStore((s) => s.resetPreferences);

  const handleToggleHaptic = () => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    toggleHaptic();
  };

  const handleReset = () => {
    Alert.alert(
      'Reset Everything?',
      'This will clear all your preferences, saved movies, and swipe history. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            resetPreferences();
            router.replace('/onboarding');
          },
        },
      ]
    );
  };

  return (
    <View className="flex-1" style={{ backgroundColor: COLORS.background }}>
      {/* Header */}
      <View
        className="flex-row items-center justify-between px-5 pb-4 border-b"
        style={{ paddingTop: insets.top + 12, borderBottomColor: 'rgba(255,255,255,0.1)' }}
      >
        <Text className="text-2xl font-bold" style={{ color: COLORS.textPrimary }}>
          Settings
        </Text>
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full items-center justify-center"
          style={{ backgroundColor: COLORS.backgroundCard }}
        >
          <X size={20} color={COLORS.textPrimary} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Premium Status */}
        {!hasPurchased && (
          <Animated.View entering={FadeInDown.springify()} className="mx-5 mt-5">
            <Pressable
              onPress={() => router.push('/purchase')}
              className="rounded-2xl p-5 active:opacity-90"
              style={{ backgroundColor: COLORS.primaryDark }}
            >
              <View className="flex-row items-center">
                <Crown size={24} color={COLORS.textPrimary} />
                <Text className="text-lg font-bold ml-3" style={{ color: COLORS.textPrimary }}>
                  Unlock Glo Premium
                </Text>
              </View>
              <Text className="text-sm mt-2" style={{ color: 'rgba(255,255,255,0.7)' }}>
                Get Couch Mode, Game Mode, and unlimited shared sessions for a one-time purchase.
              </Text>
            </Pressable>
          </Animated.View>
        )}

        {/* Account */}
        <SectionHeader title="Region" delay={50} />
        <SettingsRow
          icon={<Globe size={20} color={COLORS.primary} />}
          title={country?.name || 'Select Country'}
          subtitle={country ? `${country.flag} Showing movies available here` : 'Tap to select'}
          onPress={() => router.push('/onboarding')}
          delay={100}
        />

        {/* Stats */}
        <SectionHeader title="Your Journey" delay={150} />
        <SettingsRow
          icon={<Heart size={20} color={COLORS.like} />}
          title="Connection Points"
          subtitle={`${connectionPoints} movies chosen together`}
          delay={200}
        />

        {/* Preferences */}
        <SectionHeader title="Preferences" delay={250} />
        <SettingsRow
          icon={<Vibrate size={20} color={COLORS.save} />}
          title="Haptic Feedback"
          subtitle="Feel subtle vibrations when swiping"
          rightElement={
            <Switch
              value={hapticEnabled}
              onValueChange={handleToggleHaptic}
              trackColor={{ false: COLORS.backgroundCard, true: COLORS.primary }}
              thumbColor={COLORS.textPrimary}
            />
          }
          delay={300}
        />

        {/* About */}
        <SectionHeader title="About" delay={350} />
        <SettingsRow
          icon={<Info size={20} color={COLORS.textSecondary} />}
          title="Version"
          subtitle="1.0.0"
          delay={400}
        />

        {/* Danger Zone */}
        <SectionHeader title="Danger Zone" delay={450} />
        <SettingsRow
          icon={<Trash2 size={20} color={COLORS.like} />}
          title="Reset Everything"
          subtitle="Clear all data and start fresh"
          onPress={handleReset}
          delay={500}
        />

        <View style={{ height: insets.bottom + 40 }} />
      </ScrollView>
    </View>
  );
}
