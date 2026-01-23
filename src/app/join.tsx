import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Pressable, TextInput, StyleSheet, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Users } from 'lucide-react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { COLORS } from '@/lib/constants';
import { useStore } from '@/lib/store';
import { joinSession, validateJoinCode } from '@/lib/session-registry';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CODE_LENGTH = 6;

export default function JoinScreen() {
  const insets = useSafeAreaInsets();
  const country = useStore((s) => s.country);
  const haptic = useStore((s) => s.hapticEnabled);
  const setSession = useStore((s) => s.setSession);
  const deviceId = useStore((s) => s.deviceId);
  const lang = country.language;

  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Animation values
  const headerOpacity = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(20);
  const codeBoxProgress = useSharedValue(0);
  const buttonProgress = useSharedValue(0);

  // Entrance animations
  useEffect(() => {
    headerOpacity.value = withDelay(100, withTiming(1, { duration: 300 }));
    titleOpacity.value = withDelay(150, withTiming(1, { duration: 400 }));
    titleTranslateY.value = withDelay(150, withSpring(0, { damping: 20, stiffness: 200 }));
    codeBoxProgress.value = withDelay(300, withSpring(1, { damping: 18, stiffness: 120 }));
    buttonProgress.value = withDelay(400, withSpring(1, { damping: 18, stiffness: 120 }));

    // Focus input after animation
    setTimeout(() => inputRef.current?.focus(), 500);
  }, []);

  // Animated styles
  const headerAnimStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const titleAnimStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const codeBoxAnimStyle = useAnimatedStyle(() => ({
    opacity: codeBoxProgress.value,
    transform: [
      { translateY: interpolate(codeBoxProgress.value, [0, 1], [30, 0]) },
      { scale: interpolate(codeBoxProgress.value, [0, 1], [0.95, 1]) },
    ],
  }));

  const buttonAnimStyle = useAnimatedStyle(() => ({
    opacity: buttonProgress.value,
    transform: [
      { translateY: interpolate(buttonProgress.value, [0, 1], [20, 0]) },
    ],
  }));

  const handleCodeChange = (text: string) => {
    // Only allow alphanumeric, uppercase
    const cleaned = text.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, CODE_LENGTH);
    setCode(cleaned);
    setError(null);
  };

  const handleJoin = async () => {
    if (code.length !== CODE_LENGTH) {
      setError(lang === 'sv' ? 'Ange en 6-teckens kod' : 'Enter a 6-character code');
      if (haptic) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setIsJoining(true);
    setError(null);

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
        setError(errorMessages[errorKey]?.[lang] || errorMessages.not_found[lang]);
        setIsJoining(false);
        return;
      }

      // Success - set session and navigate
      if (haptic) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSession(result.session);
      router.replace('/session');
    } catch {
      if (haptic) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(lang === 'sv' ? 'Något gick fel' : 'Something went wrong');
      setIsJoining(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  // Render code boxes
  const renderCodeBoxes = () => {
    const boxes = [];
    for (let i = 0; i < CODE_LENGTH; i++) {
      const char = code[i] || '';
      const isFilled = char !== '';
      const isActive = i === code.length;

      boxes.push(
        <View
          key={i}
          style={[
            styles.codeChar,
            isFilled && styles.codeCharFilled,
            isActive && styles.codeCharActive,
            error && styles.codeCharError,
          ]}
        >
          <Text style={[styles.codeCharText, isFilled && styles.codeCharTextFilled]}>
            {char}
          </Text>
        </View>
      );
    }
    return boxes;
  };

  return (
    <View className="flex-1" style={{ backgroundColor: COLORS.bg }}>
      {/* Safe area spacer */}
      <View style={{ height: insets.top }} />

      {/* Header */}
      <Animated.View style={[styles.header, headerAnimStyle]}>
        <Pressable
          onPress={handleBack}
          hitSlop={12}
          style={({ pressed }) => [
            styles.backButton,
            pressed && { opacity: 0.5 },
          ]}
        >
          <ArrowLeft size={24} color={COLORS.text} />
        </Pressable>
      </Animated.View>

      {/* Content */}
      <View style={styles.content}>
        {/* Title Section */}
        <Animated.View style={[styles.titleSection, titleAnimStyle]}>
          <View style={styles.iconContainer}>
            <Users size={40} color={COLORS.text} strokeWidth={1.5} />
          </View>
          <Text style={styles.title}>
            {lang === 'sv' ? 'Gå med i rum' : 'Join Room'}
          </Text>
          <Text style={styles.subtitle}>
            {lang === 'sv'
              ? 'Ange koden du fått av din vän'
              : 'Enter the code you received from your friend'}
          </Text>
        </Animated.View>

        {/* Code Input */}
        <Animated.View style={[styles.codeInputContainer, codeBoxAnimStyle]}>
          <Pressable
            style={styles.codeBoxes}
            onPress={() => inputRef.current?.focus()}
          >
            {renderCodeBoxes()}
          </Pressable>

          {/* Hidden input for keyboard */}
          <TextInput
            ref={inputRef}
            style={styles.hiddenInput}
            value={code}
            onChangeText={handleCodeChange}
            maxLength={CODE_LENGTH}
            autoCapitalize="characters"
            autoCorrect={false}
            keyboardType="default"
            returnKeyType="join"
            onSubmitEditing={handleJoin}
          />

          {/* Error message */}
          {error && (
            <Text style={styles.errorText}>{error}</Text>
          )}
        </Animated.View>

        {/* Join Button */}
        <Animated.View style={[styles.buttonContainer, buttonAnimStyle]}>
          <Pressable
            onPress={handleJoin}
            disabled={isJoining || code.length !== CODE_LENGTH}
            style={({ pressed }) => [
              styles.joinButton,
              (isJoining || code.length !== CODE_LENGTH) && styles.joinButtonDisabled,
              pressed && !isJoining && { opacity: 0.8, transform: [{ scale: 0.98 }] },
            ]}
          >
            <Text style={[
              styles.joinButtonText,
              (isJoining || code.length !== CODE_LENGTH) && styles.joinButtonTextDisabled,
            ]}>
              {isJoining
                ? (lang === 'sv' ? 'Går med...' : 'Joining...')
                : (lang === 'sv' ? 'Gå med' : 'Join')}
            </Text>
          </Pressable>
        </Animated.View>

        {/* Hint */}
        <Animated.View style={[styles.hintContainer, buttonAnimStyle]}>
          <Text style={styles.hintText}>
            {lang === 'sv'
              ? 'Be din vän dela sin rumskod med dig'
              : 'Ask your friend to share their room code with you'}
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  titleSection: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 48,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  codeInputContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 32,
  },
  codeBoxes: {
    flexDirection: 'row',
    gap: 8,
  },
  codeChar: {
    width: 48,
    height: 60,
    borderRadius: 12,
    backgroundColor: COLORS.bgCard,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeCharFilled: {
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  codeCharActive: {
    borderColor: '#FFFFFF',
  },
  codeCharError: {
    borderColor: '#ef4444',
  },
  codeCharText: {
    color: COLORS.textMuted,
    fontSize: 24,
    fontWeight: '600',
  },
  codeCharTextFilled: {
    color: COLORS.text,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    height: 0,
    width: 0,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    marginTop: 16,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 24,
  },
  joinButton: {
    backgroundColor: '#22c55e',
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
  },
  joinButtonDisabled: {
    backgroundColor: 'rgba(34, 197, 94, 0.3)',
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  joinButtonTextDisabled: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  hintContainer: {
    paddingHorizontal: 20,
  },
  hintText: {
    color: COLORS.textMuted,
    fontSize: 13,
    textAlign: 'center',
    opacity: 0.7,
  },
});
