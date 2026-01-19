import React from 'react';
import { View, Pressable, StyleSheet, Linking } from 'react-native';
import { Image } from 'expo-image';

// ============================================================================
// STREAMING ICON RENDERING — FINAL LOCK
// ============================================================================
// Icons are LOGOS, not UI elements.
// They must be rendered exactly as provided by the user.
//
// MUST:
// - Render icons exactly as provided
// - Preserve original colors
// - Preserve original shape
// - Preserve original aspect ratio
// - Scale uniformly ONLY to fit max height
//
// MUST NOT:
// - Apply border radius
// - Apply background containers
// - Apply shadows, overlays, or masks
// - Normalize icon dimensions visually
// - Apply theme colors
// - Treat icons as buttons or chips
// - Apply press animation, hover effect, or opacity change
//
// If icons differ in shape or color → that is CORRECT.
// Uniformity is NOT the goal. Brand recognition IS.
// ============================================================================

// The sprite sheet is organized in 3 rows, 9 columns
// Source: public/image-2.png (user-provided asset)
// Row 1: Netflix, YouTube TV, Prime Video, HBO Max, Hulu, Disney+, Apple TV+, CBS, AMC
// Row 2: Crackle, LiveXLive, Showtime, Sky Go, Spotify, Google Play Music, Apple Music, TuneIn, SiriusXM
// Row 3: Acorn TV, Crunchyroll, Rakuten TV, MUBI, Deezer, Fubo TV, PLEX, Sling, Philo

const SPRITE_COLS = 9;
const SPRITE_ROWS = 3;

// Icon positions in the sprite (row, col) - 0-indexed
// ONLY these providers are available - if not in this list, icon will NOT show
const ICON_POSITIONS: Record<string, { row: number; col: number }> = {
  // Row 1 - Streaming video
  netflix: { row: 0, col: 0 },
  youtubetv: { row: 0, col: 1 },
  prime: { row: 0, col: 2 },
  hbo: { row: 0, col: 3 },
  hulu: { row: 0, col: 4 },
  disney: { row: 0, col: 5 },
  apple: { row: 0, col: 6 },
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
  paramountplus: 'cbs',
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

// Max height for icons - they scale uniformly to fit this
const MAX_ICON_HEIGHT = 24;

interface StreamingIconProps {
  providerId: string;
  onPress?: () => void;
  movieId?: string;
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
    const universalUrl = `${links.universal}${movieId}`;
    const canOpen = await Linking.canOpenURL(universalUrl);

    if (canOpen) {
      await Linking.openURL(universalUrl);
      return;
    }

    if (links.scheme) {
      const schemeUrl = `${links.scheme}${movieId}`;
      const canOpenScheme = await Linking.canOpenURL(schemeUrl);
      if (canOpenScheme) {
        await Linking.openURL(schemeUrl);
        return;
      }
    }

    await Linking.openURL(`${links.web}${movieId}`);
  } catch {
    // Silent fail
  }
}

export function StreamingIcon({
  providerId,
  onPress,
  movieId,
}: StreamingIconProps) {
  const normalized = normalizeProviderId(providerId);
  const position = ICON_POSITIONS[normalized];

  // If no verified icon exists, return null
  if (!position) return null;

  const handlePress = async () => {
    // NO haptic feedback - icons should feel passive
    if (onPress) {
      onPress();
    } else if (movieId) {
      await openStreamingLink(providerId, movieId);
    }
  };

  // Icon dimensions: preserve original aspect ratio from sprite
  // The sprite has icons at approximately 1.8:1 aspect ratio (width:height)
  const iconWidth = MAX_ICON_HEIGHT * 1.8;
  const iconHeight = MAX_ICON_HEIGHT;

  return (
    <Pressable
      onPress={handlePress}
      // NO pressed style - icons should feel passive but obvious
      style={styles.iconTouchArea}
      hitSlop={8}
    >
      {/* Clip container - overflow hidden to extract from sprite */}
      <View style={{ width: iconWidth, height: iconHeight, overflow: 'hidden' }}>
        <Image
          source={require('../../public/image-2.png')}
          style={{
            // Scale sprite so each icon cell matches our target size
            width: iconWidth * SPRITE_COLS,
            height: iconHeight * SPRITE_ROWS,
            // Offset to show the correct icon
            marginLeft: -iconWidth * position.col,
            marginTop: -iconHeight * position.row,
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
  maxVisible?: number;
  // Removed: size, haptic - icons render at fixed size, no haptic
}

export function StreamingRow({
  providerIds,
  movieId,
  maxVisible = 4,
}: StreamingRowProps) {
  const verified = filterVerifiedProviders(providerIds).slice(0, maxVisible);

  if (verified.length === 0) return null;

  return (
    <View style={styles.row}>
      {verified.map((providerId) => (
        <StreamingIcon
          key={providerId}
          providerId={providerId}
          movieId={movieId}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  iconTouchArea: {
    // NO border radius
    // NO background
    // NO shadows
    // Just a touch target
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
});
