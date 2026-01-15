import React from 'react';
import { View, Text, Pressable, ScrollView, Switch, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Globe, Vibrate, Trash2 } from 'lucide-react-native';
import { router } from 'expo-router';
import { COLORS, COUNTRIES } from '@/lib/constants';
import { useStore } from '@/lib/store';

// Minimal settings - only what's necessary
export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const country = useStore((s) => s.country);
  const haptic = useStore((s) => s.hapticEnabled);
  const setCountry = useStore((s) => s.setCountry);
  const toggleHaptic = useStore((s) => s.toggleHaptic);
  const reset = useStore((s) => s.reset);
  const lang = country.language;

  const handleReset = () => {
    Alert.alert(
      lang === 'sv' ? 'Återställ allt?' : 'Reset everything?',
      lang === 'sv' ? 'Detta raderar all data.' : 'This will clear all data.',
      [
        { text: lang === 'sv' ? 'Avbryt' : 'Cancel', style: 'cancel' },
        { text: lang === 'sv' ? 'Återställ' : 'Reset', style: 'destructive', onPress: reset },
      ]
    );
  };

  return (
    <View className="flex-1" style={{ backgroundColor: COLORS.bg }}>
      {/* Header */}
      <View
        className="flex-row items-center justify-between px-4 pb-4"
        style={{ paddingTop: insets.top + 8 }}
      >
        <Text className="text-lg font-medium" style={{ color: COLORS.text }}>
          {lang === 'sv' ? 'Inställningar' : 'Settings'}
        </Text>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <X size={24} color={COLORS.text} />
        </Pressable>
      </View>

      <ScrollView className="flex-1 px-4">
        {/* Region */}
        <Text className="text-xs uppercase tracking-wider mb-2 mt-4" style={{ color: COLORS.textMuted }}>
          {lang === 'sv' ? 'Region' : 'Region'}
        </Text>
        <View className="mb-6">
          {COUNTRIES.map((c) => (
            <Pressable
              key={c.code}
              onPress={() => setCountry(c)}
              className="flex-row items-center py-3"
            >
              <Text className="text-lg mr-3">{c.flag}</Text>
              <Text className="flex-1" style={{ color: country.code === c.code ? COLORS.text : COLORS.textMuted }}>
                {c.name}
              </Text>
              {country.code === c.code && (
                <View className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.text }} />
              )}
            </Pressable>
          ))}
        </View>

        {/* Haptics */}
        <Text className="text-xs uppercase tracking-wider mb-2" style={{ color: COLORS.textMuted }}>
          {lang === 'sv' ? 'Haptik' : 'Haptics'}
        </Text>
        <View className="flex-row items-center justify-between py-3 mb-6">
          <View className="flex-row items-center">
            <Vibrate size={18} color={COLORS.textMuted} />
            <Text className="ml-3" style={{ color: COLORS.text }}>
              {lang === 'sv' ? 'Vibrationer' : 'Vibrations'}
            </Text>
          </View>
          <Switch
            value={haptic}
            onValueChange={toggleHaptic}
            trackColor={{ false: COLORS.bgCard, true: COLORS.textMuted }}
            thumbColor={COLORS.text}
          />
        </View>

        {/* Reset */}
        <Text className="text-xs uppercase tracking-wider mb-2" style={{ color: COLORS.textMuted }}>
          {lang === 'sv' ? 'Data' : 'Data'}
        </Text>
        <Pressable
          onPress={handleReset}
          className="flex-row items-center py-3"
        >
          <Trash2 size={18} color={COLORS.textMuted} />
          <Text className="ml-3" style={{ color: COLORS.textMuted }}>
            {lang === 'sv' ? 'Återställ allt' : 'Reset everything'}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
