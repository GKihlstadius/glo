import React, { useState } from 'react';
import { View, Text, Pressable, TextInput, Share } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Copy, Users } from 'lucide-react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { COLORS } from '@/lib/constants';
import { useStore } from '@/lib/store';

// Generate session code
const genCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

export default function CouchScreen() {
  const insets = useSafeAreaInsets();
  const country = useStore((s) => s.country);
  const haptic = useStore((s) => s.hapticEnabled);
  const deviceId = useStore((s) => s.deviceId);
  const setSession = useStore((s) => s.setSession);
  const lang = country.language;

  const [mode, setMode] = useState<'choose' | 'create' | 'join'>('choose');
  const [code, setCode] = useState('');
  const [joinCode, setJoinCode] = useState('');

  const handleCreate = () => {
    const newCode = genCode();
    setCode(newCode);
    setMode('create');
    if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleShare = async () => {
    await Share.share({ message: code });
  };

  const handleStart = () => {
    setSession({
      id: Math.random().toString(36).slice(2),
      code,
      participants: [deviceId],
      swipes: {},
      status: 'active',
    });
    router.push('/session');
  };

  const handleJoin = () => {
    if (joinCode.length !== 6) return;
    setSession({
      id: Math.random().toString(36).slice(2),
      code: joinCode.toUpperCase(),
      participants: [deviceId],
      swipes: {},
      status: 'active',
    });
    if (haptic) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.push('/session');
  };

  return (
    <View className="flex-1" style={{ backgroundColor: COLORS.bg }}>
      {/* Header */}
      <View
        className="flex-row items-center px-4 pb-4"
        style={{ paddingTop: insets.top + 8 }}
      >
        <Pressable
          onPress={() => (mode === 'choose' ? router.back() : setMode('choose'))}
          hitSlop={8}
        >
          <ArrowLeft size={24} color={COLORS.text} />
        </Pressable>
      </View>

      <View className="flex-1 px-6">
        {mode === 'choose' && (
          <>
            <Text className="text-xl font-medium mb-8" style={{ color: COLORS.text }}>
              {lang === 'sv' ? 'Välj tillsammans.' : 'Choose together.'}
            </Text>

            <Pressable
              onPress={handleCreate}
              className="py-4 mb-3"
              style={{ backgroundColor: COLORS.bgCard }}
            >
              <Text className="text-center" style={{ color: COLORS.text }}>
                {lang === 'sv' ? 'Starta session' : 'Start session'}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setMode('join')}
              className="py-4"
              style={{ backgroundColor: COLORS.bgCard }}
            >
              <Text className="text-center" style={{ color: COLORS.text }}>
                {lang === 'sv' ? 'Gå med' : 'Join'}
              </Text>
            </Pressable>
          </>
        )}

        {mode === 'create' && (
          <>
            <Text className="text-sm mb-4" style={{ color: COLORS.textMuted }}>
              {lang === 'sv' ? 'Dela koden' : 'Share the code'}
            </Text>

            <Pressable onPress={handleShare} className="py-6 mb-8" style={{ backgroundColor: COLORS.bgCard }}>
              <Text
                className="text-3xl font-medium text-center tracking-widest"
                style={{ color: COLORS.text, letterSpacing: 8 }}
              >
                {code}
              </Text>
            </Pressable>

            <Pressable
              onPress={handleStart}
              className="py-4"
              style={{ backgroundColor: COLORS.text }}
            >
              <Text className="text-center" style={{ color: COLORS.bg }}>
                {lang === 'sv' ? 'Börja' : 'Start'}
              </Text>
            </Pressable>
          </>
        )}

        {mode === 'join' && (
          <>
            <Text className="text-sm mb-4" style={{ color: COLORS.textMuted }}>
              {lang === 'sv' ? 'Ange kod' : 'Enter code'}
            </Text>

            <TextInput
              value={joinCode}
              onChangeText={(t) => setJoinCode(t.toUpperCase().slice(0, 6))}
              placeholder="XXXXXX"
              placeholderTextColor={COLORS.textMuted}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={6}
              className="py-6 text-center text-2xl font-medium mb-8"
              style={{
                backgroundColor: COLORS.bgCard,
                color: COLORS.text,
                letterSpacing: 8,
              }}
            />

            <Pressable
              onPress={handleJoin}
              disabled={joinCode.length !== 6}
              className="py-4"
              style={{
                backgroundColor: joinCode.length === 6 ? COLORS.text : COLORS.bgCard,
              }}
            >
              <Text
                className="text-center"
                style={{ color: joinCode.length === 6 ? COLORS.bg : COLORS.textMuted }}
              >
                {lang === 'sv' ? 'Gå med' : 'Join'}
              </Text>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}
