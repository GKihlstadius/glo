import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { X, Users, Gamepad2, Sparkles, Check, Crown, Heart } from 'lucide-react-native';
import { router } from 'expo-router';
import { COLORS, PRICE } from '@/lib/constants';
import { useGloStore, useHapticEnabled } from '@/lib/store';

interface FeatureItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: number;
}

function FeatureItem({ icon, title, description, delay }: FeatureItemProps) {
  return (
    <Animated.View
      entering={FadeInUp.delay(delay).springify()}
      className="flex-row items-start mb-5"
    >
      <View
        className="w-12 h-12 rounded-2xl items-center justify-center mr-4"
        style={{ backgroundColor: COLORS.primaryDark }}
      >
        {icon}
      </View>
      <View className="flex-1">
        <Text className="text-lg font-semibold mb-1" style={{ color: COLORS.textPrimary }}>
          {title}
        </Text>
        <Text className="text-sm leading-5" style={{ color: COLORS.textSecondary }}>
          {description}
        </Text>
      </View>
    </Animated.View>
  );
}

export default function PurchaseScreen() {
  const insets = useSafeAreaInsets();
  const hapticEnabled = useHapticEnabled();
  const setPurchased = useGloStore((s) => s.setPurchased);

  const handlePurchase = () => {
    // In production, this would integrate with RevenueCat or App Store
    if (hapticEnabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setPurchased(true);
    router.back();
  };

  return (
    <View className="flex-1" style={{ backgroundColor: COLORS.background }}>
      {/* Gradient Background */}
      <LinearGradient
        colors={[COLORS.primaryDark, COLORS.background]}
        locations={[0, 0.5]}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 400 }}
      />

      {/* Close Button */}
      <View
        className="flex-row justify-end px-5"
        style={{ paddingTop: insets.top + 12 }}
      >
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
        >
          <X size={20} color={COLORS.textPrimary} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 100 }}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.springify()} className="items-center mt-4 mb-8">
          <View
            className="w-20 h-20 rounded-full items-center justify-center mb-6"
            style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
          >
            <Crown size={40} color={COLORS.primary} />
          </View>
          <Text
            className="text-4xl font-bold text-center mb-2"
            style={{ color: COLORS.textPrimary }}
          >
            Glo Premium
          </Text>
          <Text
            className="text-lg text-center"
            style={{ color: COLORS.textSecondary }}
          >
            One purchase. Forever yours.
          </Text>
        </Animated.View>

        {/* Features */}
        <View className="mb-8">
          <FeatureItem
            icon={<Users size={24} color={COLORS.textPrimary} />}
            title="Couch Mode"
            description="Invite others to swipe together. Matches are revealed when everyone agrees."
            delay={100}
          />
          <FeatureItem
            icon={<Gamepad2 size={24} color={COLORS.textPrimary} />}
            title="Spelläge (Game Mode)"
            description="Make choosing fun with mood cards, best-of-3 matches, and dare cards."
            delay={150}
          />
          <FeatureItem
            icon={<Heart size={24} color={COLORS.textPrimary} />}
            title="Connection Points"
            description="Track your shared decisions and build your movie journey together."
            delay={200}
          />
          <FeatureItem
            icon={<Sparkles size={24} color={COLORS.textPrimary} />}
            title="Unlimited Sessions"
            description="Create as many shared sessions as you want. No limits, no ads."
            delay={250}
          />
        </View>

        {/* What You Don't Get */}
        <Animated.View
          entering={FadeInUp.delay(300).springify()}
          className="rounded-2xl p-5 mb-8"
          style={{ backgroundColor: COLORS.backgroundCard }}
        >
          <Text className="text-base font-semibold mb-3" style={{ color: COLORS.textPrimary }}>
            What you won't find here:
          </Text>
          <View className="flex-row items-center mb-2">
            <X size={16} color={COLORS.textMuted} />
            <Text className="text-sm ml-2" style={{ color: COLORS.textMuted }}>
              No subscriptions
            </Text>
          </View>
          <View className="flex-row items-center mb-2">
            <X size={16} color={COLORS.textMuted} />
            <Text className="text-sm ml-2" style={{ color: COLORS.textMuted }}>
              No ads ever
            </Text>
          </View>
          <View className="flex-row items-center mb-2">
            <X size={16} color={COLORS.textMuted} />
            <Text className="text-sm ml-2" style={{ color: COLORS.textMuted }}>
              No tracking or data selling
            </Text>
          </View>
          <View className="flex-row items-center">
            <X size={16} color={COLORS.textMuted} />
            <Text className="text-sm ml-2" style={{ color: COLORS.textMuted }}>
              No dark patterns
            </Text>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Purchase Button */}
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
          onPress={handlePurchase}
          className="rounded-2xl py-5 items-center active:opacity-90"
          style={{ backgroundColor: COLORS.primary }}
        >
          <Text className="text-xl font-bold" style={{ color: '#000' }}>
            Unlock for {PRICE.display}
          </Text>
          <Text className="text-sm mt-1" style={{ color: 'rgba(0,0,0,0.6)' }}>
            One-time purchase
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
