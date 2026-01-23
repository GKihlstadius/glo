import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Users, AlertCircle, CheckCircle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import { COLORS } from '@/lib/constants';
import { useStore } from '@/lib/store';
import { joinSession } from '@/lib/session-registry';

// This screen handles deep links: vibecode://join/{code}
export default function JoinWithCodeScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const insets = useSafeAreaInsets();
  const country = useStore((s) => s.country);
  const haptic = useStore((s) => s.hapticEnabled);
  const setSession = useStore((s) => s.setSession);
  const deviceId = useStore((s) => s.deviceId);
  const lang = country.language;

  const [status, setStatus] = useState<'joining' | 'success' | 'error'>('joining');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Animation values
  const iconScale = useSharedValue(0.8);
  const iconOpacity = useSharedValue(0);
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    iconOpacity.value = withTiming(1, { duration: 300 });
    iconScale.value = withSpring(1, { damping: 15, stiffness: 150 });

    // Pulse animation while joining
    pulseScale.value = withRepeat(
      withTiming(1.05, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  useEffect(() => {
    if (!code) {
      setStatus('error');
      setErrorMessage(lang === 'sv' ? 'Ogiltig kod' : 'Invalid code');
      return;
    }

    // Attempt to join the session
    const attemptJoin = async () => {
      try {
        const result = await joinSession(code, deviceId);

        if (!result.success || !result.session) {
          if (haptic) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

          const errorMessages: Record<string, { en: string; sv: string }> = {
            not_found: { en: 'Room not found', sv: 'Rummet hittades inte' },
            expired: { en: 'Room has expired', sv: 'Rummet har gått ut' },
            already_started: { en: 'Game has already started', sv: 'Spelet har redan startat' },
            full: { en: 'Room is full', sv: 'Rummet är fullt' },
          };

          const errorKey = result.error || 'not_found';
          setErrorMessage(errorMessages[errorKey]?.[lang] || errorMessages.not_found[lang]);
          setStatus('error');

          // Navigate to manual join screen after delay
          setTimeout(() => {
            router.replace('/join');
          }, 2500);
          return;
        }

        // Success
        if (haptic) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setStatus('success');
        setSession(result.session);

        // Navigate to session after brief success animation
        setTimeout(() => {
          router.replace('/session');
        }, 800);
      } catch {
        if (haptic) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setErrorMessage(lang === 'sv' ? 'Något gick fel' : 'Something went wrong');
        setStatus('error');

        setTimeout(() => {
          router.replace('/join');
        }, 2500);
      }
    };

    // Small delay before joining for better UX
    const timer = setTimeout(attemptJoin, 500);
    return () => clearTimeout(timer);
  }, [code, deviceId, lang, haptic, setSession]);

  const iconAnimStyle = useAnimatedStyle(() => ({
    opacity: iconOpacity.value,
    transform: [{ scale: iconScale.value }],
  }));

  const pulseAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const renderIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircle size={48} color="#22c55e" strokeWidth={1.5} />;
      case 'error':
        return <AlertCircle size={48} color="#ef4444" strokeWidth={1.5} />;
      default:
        return <Users size={48} color={COLORS.text} strokeWidth={1.5} />;
    }
  };

  const renderMessage = () => {
    switch (status) {
      case 'success':
        return lang === 'sv' ? 'Gick med i rummet!' : 'Joined the room!';
      case 'error':
        return errorMessage;
      default:
        return lang === 'sv' ? 'Går med...' : 'Joining...';
    }
  };

  return (
    <View className="flex-1" style={{ backgroundColor: COLORS.bg }}>
      <View style={{ height: insets.top }} />

      <View style={styles.content}>
        <Animated.View style={[
          styles.iconContainer,
          iconAnimStyle,
          status === 'joining' && pulseAnimStyle,
        ]}>
          {renderIcon()}
        </Animated.View>

        <Text style={[
          styles.codeText,
          status === 'error' && styles.codeTextError,
        ]}>
          {code || '------'}
        </Text>

        <Text style={[
          styles.statusText,
          status === 'success' && styles.statusTextSuccess,
          status === 'error' && styles.statusTextError,
        ]}>
          {renderMessage()}
        </Text>

        {status === 'joining' && (
          <ActivityIndicator
            size="small"
            color={COLORS.textMuted}
            style={styles.spinner}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  codeText: {
    color: COLORS.text,
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 6,
    marginBottom: 12,
  },
  codeTextError: {
    color: COLORS.textMuted,
  },
  statusText: {
    color: COLORS.textMuted,
    fontSize: 18,
    fontWeight: '500',
  },
  statusTextSuccess: {
    color: '#22c55e',
  },
  statusTextError: {
    color: '#ef4444',
  },
  spinner: {
    marginTop: 24,
  },
});
