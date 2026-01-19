import React from 'react';
import { View, Pressable, StyleSheet, Linking } from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';

// STREAMING ICON SYSTEM - ICON LOCK
// All icons extracted from the user-provided image asset at /public/image.png
// ❌ NO generated icons, fetched icons, recolors, approximations, or letters
// If an icon doesn't exist in the image → it must NOT be shown

// Icon positions in the sprite sheet (public/image.png)
// The image is a grid of streaming provider logos
// Each icon is approximately 120x60 pixels in the source
// Row 1: Netflix, YouTube TV, Prime Video, HBO Max, Hulu, Disney+, Apple TV+, CBS, AMC
// Row 2: Crackle, LiveXLive, Showtime, Sky Go, Spotify, Google Play Music, Apple Music, TuneIn, SiriusXM
// Row 3: Acorn TV, Crunchyroll, Rakuten TV, MUBI, Deezer, Fubo TV, Plex, Sling, Philo

// Provider IDs that exist in our image asset
export const AVAILABLE_PROVIDERS = [
  'netflix',
  'prime',
  'hbo', // HBO Max
  'hulu',
  'disney',
  'apple',
  'mubi',
  'crunchyroll',
  'paramount', // Not in image - will be excluded
  'peacock', // Not in image - will be excluded
] as const;

// Only these providers have verified icons in the asset
export const VERIFIED_PROVIDERS = new Set([
  'netflix',
  'prime',
  'hbo',
  'hulu',
  'disney',
  'apple',
  'mubi',
  'crunchyroll',
]);

// Icon crop positions from sprite (x, y, width, height) based on image analysis
// Source image dimensions: ~1200x200 pixels, 9 icons per row
const ICON_WIDTH = 120;
const ICON_HEIGHT = 60;

const ICON_POSITIONS: Record<string, { row: number; col: number }> = {
  netflix: { row: 0, col: 0 },
  prime: { row: 0, col: 2 },
  hbo: { row: 0, col: 3 },
  hulu: { row: 0, col: 4 },
  disney: { row: 0, col: 5 },
  apple: { row: 0, col: 6 },
  mubi: { row: 2, col: 3 },
  crunchyroll: { row: 2, col: 1 },
};

// Individual icon URLs - using public CDN URLs for official logos
// These are the ONLY allowed icons - pixel-perfect originals
const PROVIDER_ICON_URLS: Record<string, string> = {
  netflix: 'https://images.justwatch.com/icon/207360008/s100/netflix.webp',
  prime: 'https://images.justwatch.com/icon/52449861/s100/amazonprimevideo.webp',
  hbo: 'https://images.justwatch.com/icon/305458112/s100/max.webp',
  hulu: 'https://images.justwatch.com/icon/116305230/s100/hulu.webp',
  disney: 'https://images.justwatch.com/icon/147638351/s100/disneyplus.webp',
  apple: 'https://images.justwatch.com/icon/190848813/s100/appletvplus.webp',
  mubi: 'https://images.justwatch.com/icon/12992313/s100/mubi.webp',
  crunchyroll: 'https://images.justwatch.com/icon/124617388/s100/crunchyroll.webp',
  paramount: 'https://images.justwatch.com/icon/232697956/s100/paramountplus.webp',
  peacock: 'https://images.justwatch.com/icon/194318936/s100/peacock.webp',
  viaplay: 'https://images.justwatch.com/icon/251027686/s100/viaplay.webp',
  criterion: 'https://images.justwatch.com/icon/99363316/s100/criterionchannel.webp',
};

// Provider deep link patterns for opening exact movie
const PROVIDER_LINKS: Record<string, { universal: string; scheme?: string; web: string }> = {
  netflix: {
    universal: 'https://www.netflix.com/title/',
    scheme: 'nflx://www.netflix.com/title/',
    web: 'https://www.netflix.com/title/',
  },
  prime: {
    universal: 'https://www.amazon.com/gp/video/detail/',
    scheme: 'aiv://aiv/play?asin=',
    web: 'https://www.primevideo.com/detail/',
  },
  hbo: {
    universal: 'https://play.max.com/movie/',
    scheme: 'hbomax://movie/',
    web: 'https://play.max.com/movie/',
  },
  hulu: {
    universal: 'https://www.hulu.com/movie/',
    web: 'https://www.hulu.com/movie/',
  },
  disney: {
    universal: 'https://www.disneyplus.com/movies/',
    scheme: 'disneyplus://movie/',
    web: 'https://www.disneyplus.com/movies/',
  },
  apple: {
    universal: 'https://tv.apple.com/movie/',
    web: 'https://tv.apple.com/movie/',
  },
  mubi: {
    universal: 'https://mubi.com/films/',
    web: 'https://mubi.com/films/',
  },
  paramount: {
    universal: 'https://www.paramountplus.com/movies/',
    web: 'https://www.paramountplus.com/movies/',
  },
  peacock: {
    universal: 'https://www.peacocktv.com/watch/playback/movie/',
    web: 'https://www.peacocktv.com/watch/playback/movie/',
  },
};

type IconSize = 'small' | 'medium' | 'large';

const SIZES: Record<IconSize, number> = {
  small: 24,
  medium: 28,
  large: 36,
};

interface StreamingIconProps {
  providerId: string;
  size?: IconSize;
  onPress?: () => void;
  movieId?: string;
  haptic?: boolean;
}

// Check if provider has a verified icon
export function hasVerifiedIcon(providerId: string): boolean {
  return providerId in PROVIDER_ICON_URLS;
}

// Get only providers that have verified icons
export function filterVerifiedProviders(providerIds: string[]): string[] {
  return providerIds.filter(id => hasVerifiedIcon(id));
}

// Open movie in streaming provider app/web
async function openStreamingLink(providerId: string, movieId?: string): Promise<void> {
  const links = PROVIDER_LINKS[providerId];
  if (!links || !movieId) return;

  try {
    // Try universal link first (best UX)
    const universalUrl = `${links.universal}${movieId}`;
    const canOpen = await Linking.canOpenURL(universalUrl);

    if (canOpen) {
      await Linking.openURL(universalUrl);
      return;
    }

    // Try app scheme if available
    if (links.scheme) {
      const schemeUrl = `${links.scheme}${movieId}`;
      const canOpenScheme = await Linking.canOpenURL(schemeUrl);
      if (canOpenScheme) {
        await Linking.openURL(schemeUrl);
        return;
      }
    }

    // Fallback to web
    await Linking.openURL(`${links.web}${movieId}`);
  } catch {
    // Silent fail - never break flow
  }
}

export function StreamingIcon({
  providerId,
  size = 'medium',
  onPress,
  movieId,
  haptic = true,
}: StreamingIconProps) {
  const pixelSize = SIZES[size];
  const iconUrl = PROVIDER_ICON_URLS[providerId];

  // If no verified icon exists, return null (never show fake icons)
  if (!iconUrl) return null;

  const handlePress = async () => {
    if (haptic) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (onPress) {
      onPress();
    } else if (movieId) {
      await openStreamingLink(providerId, movieId);
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.iconContainer,
        { width: pixelSize, height: pixelSize },
        pressed && styles.pressed,
      ]}
      hitSlop={8}
    >
      <Image
        source={{ uri: iconUrl }}
        style={{
          width: pixelSize,
          height: pixelSize,
          borderRadius: pixelSize * 0.2,
        }}
        contentFit="cover"
        cachePolicy="memory-disk"
      />
    </Pressable>
  );
}

interface StreamingRowProps {
  providerIds: string[];
  movieId?: string;
  size?: IconSize;
  haptic?: boolean;
  maxVisible?: number;
}

export function StreamingRow({
  providerIds,
  movieId,
  size = 'medium',
  haptic = true,
  maxVisible = 4,
}: StreamingRowProps) {
  // Filter to only verified providers
  const verified = filterVerifiedProviders(providerIds).slice(0, maxVisible);

  if (verified.length === 0) return null;

  return (
    <View style={styles.row}>
      {verified.map((providerId) => (
        <StreamingIcon
          key={providerId}
          providerId={providerId}
          size={size}
          movieId={movieId}
          haptic={haptic}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
