import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, Modal, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { Share2, Copy, QrCode, X, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { COLORS } from '@/lib/constants';
import { RoomInvite, shareRoomLink, copyRoomLink } from '@/lib/room';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface InviteSheetProps {
  visible: boolean;
  invite: RoomInvite;
  language: 'sv' | 'en';
  onClose: () => void;
  haptic?: boolean;
}

export function InviteSheet({ visible, invite, language, onClose, haptic = true }: InviteSheetProps) {
  const insets = useSafeAreaInsets();
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShare = useCallback(async () => {
    if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await shareRoomLink(invite.joinUrl, language);
  }, [invite.joinUrl, language, haptic]);

  const handleCopy = useCallback(async () => {
    if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const success = await copyRoomLink(invite.joinUrl);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [invite.joinUrl, haptic]);

  const handleShowQR = useCallback(() => {
    if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowQR(true);
  }, [haptic]);

  const texts = {
    share: language === 'sv' ? 'Dela länk' : 'Share link',
    copy: language === 'sv' ? 'Kopiera länk' : 'Copy link',
    copied: language === 'sv' ? 'Kopierad' : 'Copied',
    qr: language === 'sv' ? 'Visa kod' : 'Show code',
    scanToJoin: language === 'sv' ? 'Dela denna kod' : 'Share this code',
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View
        entering={FadeIn.duration(150)}
        exiting={FadeOut.duration(100)}
        className="flex-1 justify-end"
        style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      >
        <Pressable className="flex-1" onPress={onClose} />

        <Animated.View
          entering={SlideInDown.duration(250)}
          exiting={SlideOutDown.duration(200)}
          style={{
            backgroundColor: COLORS.bgCard,
            paddingBottom: insets.bottom + 16,
            paddingTop: 20,
            paddingHorizontal: 20,
          }}
        >
          {!showQR ? (
            // Main invite options
            <View>
              {/* Share button */}
              <Pressable
                onPress={handleShare}
                className="flex-row items-center py-4"
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
              >
                <Share2 size={22} color={COLORS.text} />
                <Text className="text-base ml-4" style={{ color: COLORS.text }}>
                  {texts.share}
                </Text>
              </Pressable>

              {/* Copy button */}
              <Pressable
                onPress={handleCopy}
                className="flex-row items-center py-4"
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
              >
                {copied ? (
                  <Check size={22} color="#4CAF50" />
                ) : (
                  <Copy size={22} color={COLORS.text} />
                )}
                <Text className="text-base ml-4" style={{ color: copied ? '#4CAF50' : COLORS.text }}>
                  {copied ? texts.copied : texts.copy}
                </Text>
              </Pressable>

              {/* Code display button */}
              <Pressable
                onPress={handleShowQR}
                className="flex-row items-center py-4"
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
              >
                <QrCode size={22} color={COLORS.text} />
                <Text className="text-base ml-4" style={{ color: COLORS.text }}>
                  {texts.qr}
                </Text>
              </Pressable>
            </View>
          ) : (
            // Large code display view (for showing to someone next to you)
            <View className="items-center">
              <Pressable
                onPress={() => setShowQR(false)}
                className="absolute top-0 right-0 p-2"
                hitSlop={8}
              >
                <X size={24} color={COLORS.textMuted} />
              </Pressable>

              {/* Large room code display */}
              <View
                className="px-12 py-10 rounded-lg mt-4"
                style={{ backgroundColor: COLORS.bg }}
              >
                <Text
                  className="text-center font-bold"
                  style={{
                    color: COLORS.text,
                    fontSize: 48,
                    letterSpacing: 12,
                  }}
                >
                  {invite.code}
                </Text>
              </View>

              <Text className="text-sm mt-6" style={{ color: COLORS.textMuted }}>
                {texts.scanToJoin}
              </Text>
            </View>
          )}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
