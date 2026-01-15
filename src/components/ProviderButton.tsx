import React from 'react';
import { View, Text, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { StreamingOffer } from '@/lib/types';
import { PROVIDER_INFO, openStreamingProvider } from '@/lib/streaming';

interface ProviderButtonProps {
  offer: StreamingOffer;
  size?: 'small' | 'medium';
  haptic?: boolean;
}

export function ProviderButton({ offer, size = 'small', haptic = true }: ProviderButtonProps) {
  const info = PROVIDER_INFO[offer.serviceId] || {
    name: offer.serviceId,
    color: '#666666',
    icon: offer.serviceId.charAt(0).toUpperCase(),
  };

  const handlePress = async () => {
    if (haptic) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const success = await openStreamingProvider(offer);
    if (!success && haptic) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  };

  const buttonSize = size === 'small' ? 28 : 36;
  const fontSize = size === 'small' ? 12 : 14;

  return (
    <Pressable
      onPress={handlePress}
      hitSlop={8}
      style={({ pressed }) => ({
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <View
        style={{
          width: buttonSize,
          height: buttonSize,
          borderRadius: 6,
          backgroundColor: info.color,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text
          style={{
            color: '#FFFFFF',
            fontSize,
            fontWeight: '700',
          }}
        >
          {info.icon}
        </Text>
      </View>
    </Pressable>
  );
}

interface ProviderRowProps {
  offers: StreamingOffer[];
  size?: 'small' | 'medium';
  haptic?: boolean;
  maxVisible?: number;
}

export function ProviderRow({ offers, size = 'small', haptic = true, maxVisible = 4 }: ProviderRowProps) {
  const visibleOffers = offers.slice(0, maxVisible);

  if (visibleOffers.length === 0) return null;

  return (
    <View className="flex-row" style={{ gap: 6 }}>
      {visibleOffers.map((offer) => (
        <ProviderButton
          key={offer.serviceId}
          offer={offer}
          size={size}
          haptic={haptic}
        />
      ))}
    </View>
  );
}
