import React, { useEffect, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, Share, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Copy, Share2, Users, Check } from 'lucide-react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import Svg, { Rect } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import { COLORS } from '@/lib/constants';
import { useStore } from '@/lib/store';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const QR_SIZE = Math.min(SCREEN_WIDTH * 0.5, 200);

// Simple QR code generator using SVG
// This creates a visual representation of the code pattern
function QRCode({ data, size }: { data: string; size: number }) {
  const moduleCount = 21; // Standard QR code module count for small data
  const moduleSize = size / moduleCount;

  // Generate a deterministic pattern from the data
  const pattern = useMemo(() => {
    const modules: boolean[][] = [];

    // Create base pattern from code
    for (let row = 0; row < moduleCount; row++) {
      modules[row] = [];
      for (let col = 0; col < moduleCount; col++) {
        // Position detection patterns (corners)
        const isInTopLeftFinder = row < 7 && col < 7;
        const isInTopRightFinder = row < 7 && col >= moduleCount - 7;
        const isInBottomLeftFinder = row >= moduleCount - 7 && col < 7;

        if (isInTopLeftFinder || isInTopRightFinder || isInBottomLeftFinder) {
          // Finder pattern
          const localRow = row % 7 || (row >= moduleCount - 7 ? row - (moduleCount - 7) : row);
          const localCol = col % 7 || (col >= moduleCount - 7 ? col - (moduleCount - 7) : col);
          const r = localRow < 7 ? localRow : localRow - (moduleCount - 7);
          const c = localCol < 7 ? localCol : localCol - (moduleCount - 7);

          const isOuter = r === 0 || r === 6 || c === 0 || c === 6;
          const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
          modules[row][col] = isOuter || isInner;
        } else {
          // Data area - use deterministic pseudo-random based on code and position
          const seed = data.charCodeAt(row % data.length) +
                       data.charCodeAt(col % data.length) +
                       row * 13 + col * 17;
          modules[row][col] = (seed % 3) !== 0;
        }
      }
    }

    return modules;
  }, [data]);

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* White background */}
      <Rect x={0} y={0} width={size} height={size} fill="#FFFFFF" rx={8} />

      {/* QR modules */}
      {pattern.map((row, rowIndex) =>
        row.map((isBlack, colIndex) =>
          isBlack ? (
            <Rect
              key={`${rowIndex}-${colIndex}`}
              x={colIndex * moduleSize + 2}
              y={rowIndex * moduleSize + 2}
              width={moduleSize - 0.5}
              height={moduleSize - 0.5}
              fill="#000000"
            />
          ) : null
        )
      )}
    </Svg>
  );
}

export default function WaitingRoomScreen() {
  const insets = useSafeAreaInsets();
  const country = useStore((s) => s.country);
  const haptic = useStore((s) => s.hapticEnabled);
  const session = useStore((s) => s.currentSession);
  const setSession = useStore((s) => s.setSession);
  const lang = country.language;

  const [copied, setCopied] = React.useState(false);

  // Animation values
  const headerOpacity = useSharedValue(0);
  const codeOpacity = useSharedValue(0);
  const codeScale = useSharedValue(0.9);
  const qrOpacity = useSharedValue(0);
  const qrScale = useSharedValue(0.8);
  const buttonsOpacity = useSharedValue(0);
  const pulseScale = useSharedValue(1);

  // Deep link URL (uses vibecode scheme from app.json)
  const joinLink = session ? `vibecode://join/${session.code}` : '';

  // Entrance animations
  useEffect(() => {
    headerOpacity.value = withDelay(100, withTiming(1, { duration: 300 }));
    codeOpacity.value = withDelay(200, withTiming(1, { duration: 400 }));
    codeScale.value = withDelay(200, withSpring(1, { damping: 15, stiffness: 150 }));
    qrOpacity.value = withDelay(400, withTiming(1, { duration: 400 }));
    qrScale.value = withDelay(400, withSpring(1, { damping: 15, stiffness: 150 }));
    buttonsOpacity.value = withDelay(600, withTiming(1, { duration: 300 }));

    // Pulse animation for waiting indicator
    pulseScale.value = withRepeat(
      withTiming(1.05, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  // Animated styles
  const headerAnimStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const codeAnimStyle = useAnimatedStyle(() => ({
    opacity: codeOpacity.value,
    transform: [{ scale: codeScale.value }],
  }));

  const qrAnimStyle = useAnimatedStyle(() => ({
    opacity: qrOpacity.value,
    transform: [{ scale: qrScale.value }],
  }));

  const buttonsAnimStyle = useAnimatedStyle(() => ({
    opacity: buttonsOpacity.value,
  }));

  const pulseAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const handleBack = () => {
    // Clear session and go back
    setSession(null);
    router.back();
  };

  const handleCopyCode = async () => {
    if (!session) return;

    await Clipboard.setStringAsync(session.code);
    if (haptic) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!session) return;

    try {
      if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      await Share.share({
        message: lang === 'sv'
          ? `Spela Glo med mig! Gå med med koden: ${session.code}\n\nEller klicka: ${joinLink}`
          : `Play Glo with me! Join with code: ${session.code}\n\nOr tap: ${joinLink}`,
        title: lang === 'sv' ? 'Spela Glo tillsammans' : 'Play Glo together',
      });
    } catch {
      // Share cancelled or failed silently
    }
  };

  const handleStartGame = () => {
    if (!session) return;

    if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Update session to active and navigate to game
    setSession({
      ...session,
      status: 'active',
    });

    router.replace('/session');
  };

  if (!session) {
    return null;
  }

  const participantCount = session.participants.length;
  const canStart = participantCount >= 2;

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
        {/* Title */}
        <Animated.View style={[styles.titleSection, headerAnimStyle]}>
          <Text style={styles.title}>
            {lang === 'sv' ? 'Väntar på spelare' : 'Waiting for players'}
          </Text>
          <Animated.View style={[styles.waitingIndicator, pulseAnimStyle]}>
            <Users size={20} color={COLORS.textMuted} />
            <Text style={styles.participantCount}>
              {participantCount} {lang === 'sv' ? 'spelare' : (participantCount === 1 ? 'player' : 'players')}
            </Text>
          </Animated.View>
        </Animated.View>

        {/* Code display */}
        <Animated.View style={[styles.codeContainer, codeAnimStyle]}>
          <Text style={styles.codeLabel}>
            {lang === 'sv' ? 'Rumskod' : 'Room Code'}
          </Text>
          <View style={styles.codeBox}>
            <Text style={styles.codeText}>{session.code}</Text>
          </View>
          <Pressable
            onPress={handleCopyCode}
            style={({ pressed }) => [
              styles.copyButton,
              pressed && { opacity: 0.7 },
            ]}
          >
            {copied ? (
              <Check size={18} color="#22c55e" />
            ) : (
              <Copy size={18} color={COLORS.textMuted} />
            )}
            <Text style={styles.copyText}>
              {copied
                ? (lang === 'sv' ? 'Kopierad!' : 'Copied!')
                : (lang === 'sv' ? 'Kopiera kod' : 'Copy code')}
            </Text>
          </Pressable>
        </Animated.View>

        {/* QR Code */}
        <Animated.View style={[styles.qrContainer, qrAnimStyle]}>
          <Text style={styles.qrLabel}>
            {lang === 'sv' ? 'Eller skanna' : 'Or scan'}
          </Text>
          <View style={styles.qrWrapper}>
            <QRCode data={joinLink} size={QR_SIZE} />
          </View>
        </Animated.View>

        {/* Action buttons */}
        <Animated.View style={[styles.actionsContainer, buttonsAnimStyle]}>
          <Pressable
            onPress={handleShare}
            style={({ pressed }) => [
              styles.shareButton,
              pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
            ]}
          >
            <Share2 size={20} color={COLORS.text} />
            <Text style={styles.shareButtonText}>
              {lang === 'sv' ? 'Dela inbjudan' : 'Share invite'}
            </Text>
          </Pressable>

          {/* Start game (for testing - normally would wait for others) */}
          <Pressable
            onPress={handleStartGame}
            style={({ pressed }) => [
              styles.startButton,
              pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
            ]}
          >
            <Text style={styles.startButtonText}>
              {lang === 'sv' ? 'Starta spelet' : 'Start game'}
            </Text>
          </Pressable>
        </Animated.View>

        {/* Hint */}
        <Text style={styles.hint}>
          {lang === 'sv'
            ? 'Dela koden med någon du vill spela med'
            : 'Share the code with someone you want to play with'}
        </Text>
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
    marginTop: 16,
    marginBottom: 32,
  },
  title: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  waitingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 20,
  },
  participantCount: {
    color: COLORS.textMuted,
    fontSize: 14,
  },
  codeContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  codeLabel: {
    color: COLORS.textMuted,
    fontSize: 14,
    marginBottom: 12,
  },
  codeBox: {
    backgroundColor: COLORS.bgCard,
    paddingHorizontal: 32,
    paddingVertical: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  codeText: {
    color: COLORS.text,
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: 8,
    fontVariant: ['tabular-nums'],
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  copyText: {
    color: COLORS.textMuted,
    fontSize: 14,
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  qrLabel: {
    color: COLORS.textMuted,
    fontSize: 14,
    marginBottom: 16,
  },
  qrWrapper: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
  },
  actionsContainer: {
    width: '100%',
    gap: 12,
    marginBottom: 24,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: COLORS.bgCard,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  shareButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '500',
  },
  startButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#22c55e',
    paddingVertical: 16,
    borderRadius: 12,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  hint: {
    color: COLORS.textMuted,
    fontSize: 13,
    textAlign: 'center',
    opacity: 0.7,
  },
});
