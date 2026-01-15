import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeInUp,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Check, ChevronRight, Globe } from 'lucide-react-native';
import { router } from 'expo-router';
import { Country } from '@/lib/types';
import { COLORS, SUPPORTED_COUNTRIES } from '@/lib/constants';
import { useGloStore } from '@/lib/store';
import { cn } from '@/lib/cn';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface CountryItemProps {
  country: Country;
  isSelected: boolean;
  onSelect: () => void;
  index: number;
}

function CountryItem({ country, isSelected, onSelect, index }: CountryItemProps) {
  const scale = useSharedValue(1);

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
    <Animated.View entering={FadeInUp.delay(index * 30).springify()}>
      <Pressable onPress={handlePress}>
        <Animated.View
          className="flex-row items-center px-5 py-4 mx-4 mb-2 rounded-2xl"
          style={[
            {
              backgroundColor: isSelected ? COLORS.primaryDark : COLORS.backgroundCard,
              borderWidth: isSelected ? 0 : 1,
              borderColor: 'rgba(255,255,255,0.08)',
            },
            animatedStyle,
          ]}
        >
          <Text className="text-3xl mr-4">{country.flag}</Text>
          <View className="flex-1">
            <Text
              className="text-lg font-semibold"
              style={{ color: isSelected ? COLORS.textPrimary : COLORS.textPrimary }}
            >
              {country.name}
            </Text>
            <Text
              className="text-sm"
              style={{ color: isSelected ? 'rgba(255,255,255,0.7)' : COLORS.textMuted }}
            >
              {country.currency} ({country.currencySymbol})
            </Text>
          </View>
          {isSelected && (
            <View
              className="w-7 h-7 rounded-full items-center justify-center"
              style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
            >
              <Check size={18} color={COLORS.textPrimary} strokeWidth={3} />
            </View>
          )}
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

export default function CountrySelectScreen() {
  const insets = useSafeAreaInsets();
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const setCountry = useGloStore((s) => s.setCountry);
  const completeOnboarding = useGloStore((s) => s.completeOnboarding);

  const handleContinue = () => {
    if (!selectedCountry) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCountry(selectedCountry);
    completeOnboarding();
    router.replace('/');
  };

  return (
    <View className="flex-1" style={{ backgroundColor: COLORS.background }}>
      <LinearGradient
        colors={[COLORS.primaryDark, COLORS.background, COLORS.background]}
        locations={[0, 0.4, 1]}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 400 }}
      />

      {/* Header */}
      <View style={{ paddingTop: insets.top + 24, paddingHorizontal: 24 }}>
        <Animated.View
          entering={FadeInDown.delay(100).springify()}
          className="w-16 h-16 rounded-full items-center justify-center mb-6"
          style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
        >
          <Globe size={32} color={COLORS.primary} />
        </Animated.View>

        <Animated.Text
          entering={FadeInDown.delay(200).springify()}
          className="text-4xl font-bold mb-2"
          style={{ color: COLORS.textPrimary }}
        >
          Where are you?
        </Animated.Text>

        <Animated.Text
          entering={FadeInDown.delay(300).springify()}
          className="text-lg mb-6"
          style={{ color: COLORS.textSecondary }}
        >
          We'll only show movies available in your country. No guessing, no disappointment.
        </Animated.Text>
      </View>

      {/* Country List */}
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {SUPPORTED_COUNTRIES.map((country, index) => (
          <CountryItem
            key={country.code}
            country={country}
            isSelected={selectedCountry?.code === country.code}
            onSelect={() => setSelectedCountry(country)}
            index={index}
          />
        ))}
      </ScrollView>

      {/* Continue Button */}
      <View
        className="absolute bottom-0 left-0 right-0 px-6"
        style={{ paddingBottom: insets.bottom + 16 }}
      >
        <LinearGradient
          colors={['transparent', COLORS.background]}
          style={{
            position: 'absolute',
            top: -40,
            left: 0,
            right: 0,
            height: 60,
          }}
          pointerEvents="none"
        />
        <Pressable
          onPress={handleContinue}
          disabled={!selectedCountry}
          className="rounded-2xl py-4 flex-row items-center justify-center active:opacity-80"
          style={{
            backgroundColor: selectedCountry ? COLORS.primary : COLORS.backgroundCard,
            opacity: selectedCountry ? 1 : 0.5,
          }}
        >
          <Text
            className="text-lg font-bold mr-2"
            style={{ color: selectedCountry ? '#000' : COLORS.textMuted }}
          >
            Continue
          </Text>
          <ChevronRight size={20} color={selectedCountry ? '#000' : COLORS.textMuted} />
        </Pressable>
      </View>
    </View>
  );
}
