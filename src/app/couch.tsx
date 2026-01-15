import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, TextInput, Share } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, Users, Copy, QrCode, Plus, Play, Check } from 'lucide-react-native';
import { router } from 'expo-router';
import { COLORS } from '@/lib/constants';
import { useGloStore, useHapticEnabled } from '@/lib/store';
import { Session } from '@/lib/types';

// Generate a random 6-character session code
function generateSessionCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// Generate a random device ID
function generateDeviceId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export default function CouchScreen() {
  const insets = useSafeAreaInsets();
  const hapticEnabled = useHapticEnabled();
  const [mode, setMode] = useState<'choose' | 'create' | 'join'>('choose');
  const [sessionCode, setSessionCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [participants, setParticipants] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const setCurrentSession = useGloStore((s) => s.setCurrentSession);
  const deviceId = useGloStore((s) => s.deviceId);
  const setDeviceId = useGloStore((s) => s.setDeviceId);

  // Ensure device has an ID
  useEffect(() => {
    if (!deviceId) {
      setDeviceId(generateDeviceId());
    }
  }, [deviceId, setDeviceId]);

  const handleCreateSession = () => {
    const code = generateSessionCode();
    setSessionCode(code);
    setParticipants([deviceId || 'host']);
    setMode('create');

    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const handleCopyCode = async () => {
    // In a real app, this would use Clipboard API
    setCopied(true);
    if (hapticEnabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    try {
      await Share.share({
        message: `Join my Glo session! Code: ${sessionCode}`,
      });
    } catch (error) {
      // Ignore share errors
    }

    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartSession = () => {
    const session: Session = {
      id: Math.random().toString(36).substring(2, 15),
      code: sessionCode,
      hostId: deviceId || 'host',
      participants: participants,
      movieQueue: [],
      swipes: {},
      matches: [],
      mode: 'quick',
      createdAt: Date.now(),
      status: 'active',
    };

    setCurrentSession(session);
    router.push('/session');
  };

  const handleJoinSession = () => {
    if (joinCode.length !== 6) return;

    // In production, this would validate the code with a backend
    const session: Session = {
      id: Math.random().toString(36).substring(2, 15),
      code: joinCode.toUpperCase(),
      hostId: 'remote-host',
      participants: ['remote-host', deviceId || 'guest'],
      movieQueue: [],
      swipes: {},
      matches: [],
      mode: 'quick',
      createdAt: Date.now(),
      status: 'active',
    };

    setCurrentSession(session);
    if (hapticEnabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    router.push('/session');
  };

  // Simulate participants joining
  useEffect(() => {
    if (mode === 'create' && participants.length < 3) {
      const timer = setTimeout(() => {
        // Simulate a new participant joining (in production this would be real-time)
        if (Math.random() > 0.5 && participants.length < 2) {
          setParticipants((prev) => [...prev, `guest-${prev.length}`]);
          if (hapticEnabled) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [mode, participants, hapticEnabled]);

  return (
    <View className="flex-1" style={{ backgroundColor: COLORS.background }}>
      {/* Gradient Background */}
      <LinearGradient
        colors={[COLORS.primaryDark, COLORS.background]}
        locations={[0, 0.4]}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 350 }}
      />

      {/* Header */}
      <View
        className="flex-row items-center px-5"
        style={{ paddingTop: insets.top + 12 }}
      >
        <Pressable
          onPress={() => {
            if (mode !== 'choose') {
              setMode('choose');
            } else {
              router.back();
            }
          }}
          className="w-10 h-10 rounded-full items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
        >
          <ArrowLeft size={20} color={COLORS.textPrimary} />
        </Pressable>
        <Text className="text-xl font-bold ml-4" style={{ color: COLORS.textPrimary }}>
          Couch Mode
        </Text>
      </View>

      <View className="flex-1 px-6 pt-8">
        {mode === 'choose' && (
          <>
            {/* Header Content */}
            <Animated.View entering={FadeInDown.springify()} className="items-center mb-8">
              <View
                className="w-20 h-20 rounded-full items-center justify-center mb-4"
                style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
              >
                <Users size={40} color={COLORS.primary} />
              </View>
              <Text
                className="text-3xl font-bold text-center mb-2"
                style={{ color: COLORS.textPrimary }}
              >
                Pick together
              </Text>
              <Text
                className="text-base text-center"
                style={{ color: COLORS.textSecondary }}
              >
                Everyone swipes. Match when you all agree.
              </Text>
            </Animated.View>

            {/* Options */}
            <Animated.View entering={FadeInUp.delay(100).springify()}>
              <Pressable
                onPress={handleCreateSession}
                className="rounded-2xl p-5 mb-4 active:opacity-90"
                style={{ backgroundColor: COLORS.backgroundCard }}
              >
                <View className="flex-row items-center">
                  <View
                    className="w-12 h-12 rounded-xl items-center justify-center"
                    style={{ backgroundColor: COLORS.primaryDark }}
                  >
                    <Plus size={24} color={COLORS.textPrimary} />
                  </View>
                  <View className="flex-1 ml-4">
                    <Text className="text-lg font-semibold" style={{ color: COLORS.textPrimary }}>
                      Create Session
                    </Text>
                    <Text className="text-sm" style={{ color: COLORS.textSecondary }}>
                      Start a new session and invite others
                    </Text>
                  </View>
                </View>
              </Pressable>
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(150).springify()}>
              <Pressable
                onPress={() => setMode('join')}
                className="rounded-2xl p-5 active:opacity-90"
                style={{ backgroundColor: COLORS.backgroundCard }}
              >
                <View className="flex-row items-center">
                  <View
                    className="w-12 h-12 rounded-xl items-center justify-center"
                    style={{ backgroundColor: COLORS.saveBg }}
                  >
                    <QrCode size={24} color={COLORS.save} />
                  </View>
                  <View className="flex-1 ml-4">
                    <Text className="text-lg font-semibold" style={{ color: COLORS.textPrimary }}>
                      Join Session
                    </Text>
                    <Text className="text-sm" style={{ color: COLORS.textSecondary }}>
                      Enter a code to join an existing session
                    </Text>
                  </View>
                </View>
              </Pressable>
            </Animated.View>
          </>
        )}

        {mode === 'create' && (
          <>
            <Animated.View entering={FadeInDown.springify()} className="items-center mb-8">
              <Text
                className="text-2xl font-bold text-center mb-2"
                style={{ color: COLORS.textPrimary }}
              >
                Share this code
              </Text>
              <Text
                className="text-base text-center mb-6"
                style={{ color: COLORS.textSecondary }}
              >
                Others can join with this code
              </Text>

              {/* Session Code */}
              <Pressable
                onPress={handleCopyCode}
                className="rounded-2xl px-8 py-5 mb-4 active:scale-95"
                style={{ backgroundColor: COLORS.backgroundCard }}
              >
                <Text
                  className="text-4xl font-bold tracking-widest text-center"
                  style={{ color: COLORS.primary, letterSpacing: 8 }}
                >
                  {sessionCode}
                </Text>
              </Pressable>

              <Pressable
                onPress={handleCopyCode}
                className="flex-row items-center px-4 py-2 rounded-full"
                style={{ backgroundColor: copied ? COLORS.available : 'rgba(255,255,255,0.1)' }}
              >
                {copied ? (
                  <>
                    <Check size={16} color={COLORS.textPrimary} />
                    <Text className="text-sm font-medium ml-2" style={{ color: COLORS.textPrimary }}>
                      Copied!
                    </Text>
                  </>
                ) : (
                  <>
                    <Copy size={16} color={COLORS.textSecondary} />
                    <Text className="text-sm font-medium ml-2" style={{ color: COLORS.textSecondary }}>
                      Tap to share
                    </Text>
                  </>
                )}
              </Pressable>
            </Animated.View>

            {/* Participants */}
            <Animated.View entering={FadeInUp.delay(100).springify()}>
              <Text className="text-sm font-semibold uppercase mb-3" style={{ color: COLORS.textMuted }}>
                Waiting for others ({participants.length})
              </Text>
              <View
                className="rounded-2xl p-4"
                style={{ backgroundColor: COLORS.backgroundCard }}
              >
                {participants.map((p, i) => (
                  <Animated.View
                    key={p}
                    entering={ZoomIn.delay(i * 100).springify()}
                    className="flex-row items-center py-2"
                  >
                    <View
                      className="w-10 h-10 rounded-full items-center justify-center"
                      style={{ backgroundColor: i === 0 ? COLORS.primary : COLORS.save }}
                    >
                      <Text className="text-base font-bold" style={{ color: '#000' }}>
                        {i === 0 ? 'You' : `P${i + 1}`}
                      </Text>
                    </View>
                    <Text className="text-base ml-3" style={{ color: COLORS.textPrimary }}>
                      {i === 0 ? 'You (Host)' : `Participant ${i + 1}`}
                    </Text>
                    <View
                      className="ml-auto w-2 h-2 rounded-full"
                      style={{ backgroundColor: COLORS.available }}
                    />
                  </Animated.View>
                ))}
              </View>
            </Animated.View>

            {/* Start Button */}
            <View className="flex-1" />
            <Pressable
              onPress={handleStartSession}
              className="rounded-2xl py-4 flex-row items-center justify-center mb-8 active:opacity-90"
              style={{ backgroundColor: COLORS.primary }}
            >
              <Play size={20} color="#000" fill="#000" />
              <Text className="text-lg font-bold ml-2" style={{ color: '#000' }}>
                Start Swiping
              </Text>
            </Pressable>
          </>
        )}

        {mode === 'join' && (
          <>
            <Animated.View entering={FadeInDown.springify()} className="items-center mb-8">
              <Text
                className="text-2xl font-bold text-center mb-2"
                style={{ color: COLORS.textPrimary }}
              >
                Enter session code
              </Text>
              <Text
                className="text-base text-center"
                style={{ color: COLORS.textSecondary }}
              >
                Ask the host for the 6-character code
              </Text>
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(100).springify()}>
              <TextInput
                value={joinCode}
                onChangeText={(text) => setJoinCode(text.toUpperCase().slice(0, 6))}
                placeholder="XXXXXX"
                placeholderTextColor={COLORS.textMuted}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={6}
                className="rounded-2xl px-6 py-5 text-center text-3xl font-bold"
                style={{
                  backgroundColor: COLORS.backgroundCard,
                  color: COLORS.primary,
                  letterSpacing: 8,
                }}
              />
            </Animated.View>

            {/* Join Button */}
            <View className="flex-1" />
            <Pressable
              onPress={handleJoinSession}
              disabled={joinCode.length !== 6}
              className="rounded-2xl py-4 flex-row items-center justify-center mb-8"
              style={{
                backgroundColor: joinCode.length === 6 ? COLORS.primary : COLORS.backgroundCard,
                opacity: joinCode.length === 6 ? 1 : 0.5,
              }}
            >
              <Users size={20} color={joinCode.length === 6 ? '#000' : COLORS.textMuted} />
              <Text
                className="text-lg font-bold ml-2"
                style={{ color: joinCode.length === 6 ? '#000' : COLORS.textMuted }}
              >
                Join Session
              </Text>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}
