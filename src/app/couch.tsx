import React, { useState } from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Share2 } from 'lucide-react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { COLORS } from '@/lib/constants';
import { useStore } from '@/lib/store';
import { createRoomInvite, RoomInvite } from '@/lib/room';
import { InviteSheet } from '@/components/InviteSheet';

export default function CouchScreen() {
  const insets = useSafeAreaInsets();
  const country = useStore((s) => s.country);
  const haptic = useStore((s) => s.hapticEnabled);
  const deviceId = useStore((s) => s.deviceId);
  const setSession = useStore((s) => s.setSession);
  const lang = country.language;

  const [mode, setMode] = useState<'choose' | 'create' | 'join'>('choose');
  const [invite, setInvite] = useState<RoomInvite | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [showInviteSheet, setShowInviteSheet] = useState(false);

  const handleCreate = () => {
    const newInvite = createRoomInvite('couch');
    setInvite(newInvite);
    setMode('create');
    if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleStart = () => {
    if (!invite) return;

    const now = Date.now();
    setSession({
      id: invite.roomId,
      code: invite.code,
      participants: [deviceId],
      swipes: {},
      status: 'active',
      regionCode: country.code,
      mode: 'couch',
      createdAt: now,
      expiresAt: invite.expiresAt,
    });
    router.push('/session');
  };

  const handleJoin = () => {
    if (joinCode.length !== 6) return;
    const now = Date.now();
    setSession({
      id: Math.random().toString(36).slice(2),
      code: joinCode.toUpperCase(),
      participants: [deviceId],
      swipes: {},
      status: 'active',
      regionCode: country.code,
      mode: 'couch',
      createdAt: now,
      expiresAt: now + 2 * 60 * 60 * 1000,
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

        {mode === 'create' && invite && (
          <>
            <Text className="text-sm mb-4" style={{ color: COLORS.textMuted }}>
              {lang === 'sv' ? 'Bjud in' : 'Invite'}
            </Text>

            {/* Room code display */}
            <View className="py-6 mb-4" style={{ backgroundColor: COLORS.bgCard }}>
              <Text
                className="text-3xl font-medium text-center tracking-widest"
                style={{ color: COLORS.text, letterSpacing: 8 }}
              >
                {invite.code}
              </Text>
            </View>

            {/* Invite button */}
            <Pressable
              onPress={() => setShowInviteSheet(true)}
              className="flex-row items-center justify-center py-3 mb-8"
              style={{ backgroundColor: COLORS.bgCard }}
            >
              <Share2 size={18} color={COLORS.textMuted} />
              <Text className="ml-2" style={{ color: COLORS.textMuted }}>
                {lang === 'sv' ? 'Dela' : 'Share'}
              </Text>
            </Pressable>

            {/* Start button */}
            <Pressable
              onPress={handleStart}
              className="py-4"
              style={{ backgroundColor: COLORS.text }}
            >
              <Text className="text-center" style={{ color: COLORS.bg }}>
                {lang === 'sv' ? 'Börja' : 'Start'}
              </Text>
            </Pressable>

            {/* Invite sheet */}
            <InviteSheet
              visible={showInviteSheet}
              invite={invite}
              language={lang}
              onClose={() => setShowInviteSheet(false)}
              haptic={haptic}
            />
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
