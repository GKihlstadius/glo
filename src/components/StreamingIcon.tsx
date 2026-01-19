import React from 'react';
import { View, Pressable, StyleSheet, Linking } from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';

// STREAMING ICON SYSTEM - ICON LOCK
// All icons extracted from the user-provided image asset at /public/image-1.png
// ❌ NO generated icons, fetched icons, recolors, approximations, or letters
// If an icon doesn't exist in the image → it must NOT be shown

// The sprite sheet is organized in 3 rows, 9 columns
// Row 1: Netflix, YouTube TV, Prime Video, HBO Max, Hulu, Disney+, Apple TV+, CBS, AMC
// Row 2: Crackle, LiveXLive, Showtime, Sky Go, Spotify, Google Play Music, Apple Music, TuneIn, SiriusXM
// Row 3: Acorn TV, Crunchyroll, Rakuten TV, MUBI, Deezer, Fubo TV, PLEX, Sling, Philo

// Sprite dimensions (from image analysis)
const SPRITE_COLS = 9;
const SPRITE_ROWS = 3;
const ICON_ASPECT = 1.8; // Width/Height ratio of each icon

// Icon positions in the sprite (row, col) - 0-indexed
// ONLY these providers are available - if not in this list, icon will NOT show
const ICON_POSITIONS: Record<string, { row: number; col: number }> = {
  // Row 1 - Streaming video
  netflix: { row: 0, col: 0 },
  youtubetv: { row: 0, col: 1 },
  prime: { row: 0, col: 2 },
  hbo: { row: 0, col: 3 }, // HBO Max
  hulu: { row: 0, col: 4 },
  disney: { row: 0, col: 5 },
  apple: { row: 0, col: 6 }, // Apple TV+
  cbs: { row: 0, col: 7 },
  amc: { row: 0, col: 8 },
  // Row 2 - Mixed streaming
  crackle: { row: 1, col: 0 },
  livexlive: { row: 1, col: 1 },
  showtime: { row: 1, col: 2 },
  skygo: { row: 1, col: 3 },
  spotify: { row: 1, col: 4 },
  googleplaymusic: { row: 1, col: 5 },
  applemusic: { row: 1, col: 6 },
  tunein: { row: 1, col: 7 },
  siriusxm: { row: 1, col: 8 },
  // Row 3 - Specialty streaming
  acorntv: { row: 2, col: 0 },
  crunchyroll: { row: 2, col: 1 },
  rakuten: { row: 2, col: 2 },
  mubi: { row: 2, col: 3 },
  deezer: { row: 2, col: 4 },
  fubotv: { row: 2, col: 5 },
  plex: { row: 2, col: 6 },
  sling: { row: 2, col: 7 },
  philo: { row: 2, col: 8 },
};

// Provider ID aliases (normalize different naming conventions)
const PROVIDER_ALIASES: Record<string, string> = {
  amazonprime: 'prime',
  primevideo: 'prime',
  amazonprimevideo: 'prime',
  hbomax: 'hbo',
  max: 'hbo',
  disneyplus: 'disney',
  appletv: 'apple',
  appletvplus: 'apple',
  paramountplus: 'cbs', // Paramount+ is CBS rebrand
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
  crunchyroll: {
    universal: 'https://www.crunchyroll.com/',
    web: 'https://www.crunchyroll.com/',
  },
  cbs: {
    universal: 'https://www.paramountplus.com/movies/',
    web: 'https://www.paramountplus.com/movies/',
  },
  showtime: {
    universal: 'https://www.sho.com/',
    web: 'https://www.sho.com/',
  },
  plex: {
    universal: 'https://watch.plex.tv/',
    web: 'https://watch.plex.tv/',
  },
  acorntv: {
    universal: 'https://acorn.tv/',
    web: 'https://acorn.tv/',
  },
  rakuten: {
    universal: 'https://www.rakuten.tv/',
    web: 'https://www.rakuten.tv/',
  },
};

type IconSize = 'small' | 'medium' | 'large';

// Display sizes for icons
const SIZES: Record<IconSize, { width: number; height: number }> = {
  small: { width: 36, height: 20 },
  medium: { width: 48, height: 27 },
  large: { width: 64, height: 36 },
};

interface StreamingIconProps {
  providerId: string;
  size?: IconSize;
  onPress?: () => void;
  movieId?: string;
  haptic?: boolean;
}

// Normalize provider ID using aliases
function normalizeProviderId(id: string): string {
  const lowerId = id.toLowerCase().replace(/[\s-_]/g, '');
  return PROVIDER_ALIASES[lowerId] || lowerId;
}

// Check if provider has an icon in the sprite sheet
export function hasVerifiedIcon(providerId: string): boolean {
  const normalized = normalizeProviderId(providerId);
  return normalized in ICON_POSITIONS;
}

// Get only providers that have verified icons
export function filterVerifiedProviders(providerIds: string[]): string[] {
  return providerIds.filter(id => hasVerifiedIcon(id));
}

// Open movie in streaming provider app/web
async function openStreamingLink(providerId: string, movieId?: string): Promise<void> {
  const normalized = normalizeProviderId(providerId);
  const links = PROVIDER_LINKS[normalized];
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
  const normalized = normalizeProviderId(providerId);
  const position = ICON_POSITIONS[normalized];

  // If no verified icon exists in sprite, return null (never show fake icons)
  if (!position) return null;

  const dimensions = SIZES[size];

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

  // Calculate crop region for the sprite
  // The image is a grid with SPRITE_COLS x SPRITE_ROWS icons
  // We use percentage-based positioning for the crop
  const cropPercentX = (position.col / SPRITE_COLS) * 100;
  const cropPercentY = (position.row / SPRITE_ROWS) * 100;
  const cropWidthPercent = (1 / SPRITE_COLS) * 100;
  const cropHeightPercent = (1 / SPRITE_ROWS) * 100;

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.iconContainer,
        { width: dimensions.width, height: dimensions.height },
        pressed && styles.pressed,
      ]}
      hitSlop={8}
    >
      {/* Overflow container to clip the sprite */}
      <View style={[styles.spriteClip, { width: dimensions.width, height: dimensions.height }]}>
        <Image
          source={require('../../public/image-1.png')}
          style={{
            // Scale sprite so each icon fills the container
            width: dimensions.width * SPRITE_COLS,
            height: dimensions.height * SPRITE_ROWS,
            // Offset to show correct icon
            marginLeft: -dimensions.width * position.col,
            marginTop: -dimensions.height * position.row,
          }}
          contentFit="fill"
          cachePolicy="memory-disk"
        />
      </View>
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
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  spriteClip: {
    overflow: 'hidden',
    borderRadius: 6,
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
});
