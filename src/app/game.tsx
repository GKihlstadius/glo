import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  FadeInUp,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, Gamepad2, Play, Shuffle, Sparkles } from 'lucide-react-native';
import { router } from 'expo-router';
import { COLORS, MOOD_CARDS } from '@/lib/constants';
import { useGloStore, useHapticEnabled } from '@/lib/store';
import { MoodCard, Session } from '@/lib/types';

interface MoodCardItemProps {
  mood: MoodCard;
  isSelected: boolean;
  onSelect: () => void;
  index: number;
}

function MoodCardItem({ mood, isSelected, onSelect, index }: MoodCardItemProps) {
  const scale = useSharedValue(1);
  const moodData = MOOD_CARDS[mood];

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSequence(
      withSpring(0.95, { damping: 10 }),
      withSpring(1, { damping: 10 })
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect();
  };

  return (
    <Animated.View entering={FadeInUp.delay(index * 80).springify()}>
      <Pressable onPress={handlePress}>
        <Animated.View
          className="rounded-2xl p-4 mb-3"
          style={[
            {
              backgroundColor: isSelected ? COLORS.primaryDark : COLORS.backgroundCard,
              borderWidth: isSelected ? 0 : 1,
              borderColor: 'rgba(255,255,255,0.08)',
            },
            animatedStyle,
          ]}
        >
          <View className="flex-row items-center">
            <Text className="text-3xl mr-4">{moodData.emoji}</Text>
            <View className="flex-1">
              <Text
                className="text-lg font-semibold"
                style={{ color: COLORS.textPrimary }}
              >
                {moodData.label}
              </Text>
              <Text className="text-sm" style={{ color: COLORS.textSecondary }}>
                {moodData.description}
              </Text>
            </View>
          </View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

export default function GameScreen() {
  const insets = useSafeAreaInsets();
  const hapticEnabled = useHapticEnabled();
  const [selectedMood, setSelectedMood] = useState<MoodCard | null>(null);
  const [showMoodPicker, setShowMoodPicker] = useState(false);

  const setCurrentSession = useGloStore((s) => s.setCurrentSession);
  const deviceId = useGloStore((s) => s.deviceId);

  const handleRandomMood = () => {
    const moods = Object.keys(MOOD_CARDS) as MoodCard[];
    const randomMood = moods[Math.floor(Math.random() * moods.length)];
    setSelectedMood(randomMood);
    if (hapticEnabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleStartGame = () => {
    const session: Session = {
      id: Math.random().toString(36).substring(2, 15),
      code: '',
      hostId: deviceId || 'host',
      participants: [deviceId || 'host'],
      movieQueue: [],
      swipes: {},
      matches: [],
      mode: 'game',
      moodCard: selectedMood || undefined,
      createdAt: Date.now(),
      status: 'active',
    };

    setCurrentSession(session);
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push('/session');
  };

  return (
    <View className="flex-1" style={{ backgroundColor: COLORS.background }}>
      {/* Gradient Background */}
      <LinearGradient
        colors={['#7C3AED', COLORS.background]}
        locations={[0, 0.4]}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 350 }}
      />

      {/* Header */}
      <View
        className="flex-row items-center px-5"
        style={{ paddingTop: insets.top + 12 }}
      >
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
        >
          <ArrowLeft size={20} color={COLORS.textPrimary} />
        </Pressable>
        <Text className="text-xl font-bold ml-4" style={{ color: COLORS.textPrimary }}>
          Spelläge
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Content */}
        <Animated.View entering={FadeInDown.springify()} className="items-center mt-8 mb-8">
          <View
            className="w-20 h-20 rounded-full items-center justify-center mb-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
          >
            <Gamepad2 size={40} color="#A78BFA" />
          </View>
          <Text
            className="text-3xl font-bold text-center mb-2"
            style={{ color: COLORS.textPrimary }}
          >
            Make it a game
          </Text>
          <Text
            className="text-base text-center"
            style={{ color: COLORS.textSecondary }}
          >
            Add some fun to your movie night with mood cards and challenges.
          </Text>
        </Animated.View>

        {/* How It Works */}
        <Animated.View
          entering={FadeInUp.delay(50).springify()}
          className="rounded-2xl p-5 mb-6"
          style={{ backgroundColor: COLORS.backgroundCard }}
        >
          <Text className="text-base font-semibold mb-3" style={{ color: COLORS.textPrimary }}>
            How Spelläge works:
          </Text>
          <View className="flex-row items-start mb-2">
            <Text className="text-xl mr-3">1.</Text>
            <Text className="text-sm flex-1" style={{ color: COLORS.textSecondary }}>
              Pick a mood card (or let us surprise you)
            </Text>
          </View>
          <View className="flex-row items-start mb-2">
            <Text className="text-xl mr-3">2.</Text>
            <Text className="text-sm flex-1" style={{ color: COLORS.textSecondary }}>
              Best-of-3: Find 3 matches before deciding
            </Text>
          </View>
          <View className="flex-row items-start mb-2">
            <Text className="text-xl mr-3">3.</Text>
            <Text className="text-sm flex-1" style={{ color: COLORS.textSecondary }}>
              Dare Card: Challenged to try something new
            </Text>
          </View>
          <View className="flex-row items-start">
            <Text className="text-xl mr-3">4.</Text>
            <Text className="text-sm flex-1" style={{ color: COLORS.textSecondary }}>
              Earn Connection Points together
            </Text>
          </View>
        </Animated.View>

        {/* Mood Selection */}
        <Animated.View entering={FadeInUp.delay(100).springify()}>
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-sm font-semibold uppercase" style={{ color: COLORS.textMuted }}>
              Pick Your Mood
            </Text>
            <Pressable
              onPress={handleRandomMood}
              className="flex-row items-center px-3 py-1.5 rounded-full active:opacity-70"
              style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
            >
              <Shuffle size={14} color={COLORS.textSecondary} />
              <Text className="text-sm ml-1.5" style={{ color: COLORS.textSecondary }}>
                Surprise me
              </Text>
            </Pressable>
          </View>
        </Animated.View>

        {(Object.keys(MOOD_CARDS) as MoodCard[]).map((mood, index) => (
          <MoodCardItem
            key={mood}
            mood={mood}
            isSelected={selectedMood === mood}
            onSelect={() => setSelectedMood(mood)}
            index={index}
          />
        ))}

        {/* Selected Mood Display */}
        {selectedMood && (
          <Animated.View
            entering={ZoomIn.springify()}
            className="items-center mt-4 mb-4"
          >
            <View
              className="flex-row items-center px-4 py-2 rounded-full"
              style={{ backgroundColor: COLORS.primaryDark }}
            >
              <Sparkles size={16} color={COLORS.textPrimary} />
              <Text className="text-sm font-medium ml-2" style={{ color: COLORS.textPrimary }}>
                {MOOD_CARDS[selectedMood].emoji} {MOOD_CARDS[selectedMood].label} mood selected
              </Text>
            </View>
          </Animated.View>
        )}
      </ScrollView>

      {/* Start Button */}
      <View
        className="absolute bottom-0 left-0 right-0 px-6"
        style={{ paddingBottom: insets.bottom + 16 }}
      >
        <LinearGradient
          colors={['transparent', COLORS.background]}
          style={{
            position: 'absolute',
            top: -60,
            left: 0,
            right: 0,
            height: 80,
          }}
          pointerEvents="none"
        />
        <Pressable
          onPress={handleStartGame}
          className="rounded-2xl py-4 flex-row items-center justify-center active:opacity-90"
          style={{ backgroundColor: '#A78BFA' }}
        >
          <Play size={20} color="#000" fill="#000" />
          <Text className="text-lg font-bold ml-2" style={{ color: '#000' }}>
            {selectedMood ? 'Start Game' : 'Start Without Mood'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
