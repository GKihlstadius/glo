import React from 'react';
import { View, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { StreamingOffer } from '@/lib/types';
import { openStreamingProvider } from '@/lib/streaming';
import { ProviderIcon } from './ProviderIcon';

interface ProviderButtonProps {
  offer: StreamingOffer;
  size?: 'small' | 'medium' | 'large';
  haptic?: boolean;
}

export function ProviderButton({ offer, size = 'small', haptic = true }: ProviderButtonProps) {
  const handlePress = async () => {
    if (haptic) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const success = await openStreamingProvider(offer);
    if (!success && haptic) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      hitSlop={8}
      style={({ pressed }) => ({
        opacity: pressed ? 0.7 : 1,
        transform: [{ scale: pressed ? 0.95 : 1 }],
      })}
    >
      <ProviderIcon providerId={offer.providerId} size={size} />
    </Pressable>
  );
}

interface ProviderRowProps {
  offers: StreamingOffer[];
  size?: 'small' | 'medium' | 'large';
  haptic?: boolean;
  maxVisible?: number;
}

export function ProviderRow({ offers, size = 'small', haptic = true, maxVisible = 4 }: ProviderRowProps) {
  // Sort by type: stream first, then rent, then buy
  const sortedOffers = [...offers].sort((a, b) => {
    const typeOrder = { stream: 0, rent: 1, buy: 2 };
    return (typeOrder[a.type] || 3) - (typeOrder[b.type] || 3);
  });

  const visibleOffers = sortedOffers.slice(0, maxVisible);

  if (visibleOffers.length === 0) return null;

  return (
    <View className="flex-row" style={{ gap: 6 }}>
      {visibleOffers.map((offer) => (
        <ProviderButton
          key={offer.providerId}
          offer={offer}
          size={size}
          haptic={haptic}
        />
      ))}
    </View>
  );
}
