import React from 'react';
import { View, Pressable, StyleSheet, Linking } from 'react-native';
import { Image } from 'expo-image';

// ============================================================================
// STREAMING ICON RENDERING — FINAL LOCK
// ============================================================================
// Streaming icons are BRAND ASSETS, not UI elements.
// They must be rendered as raw brand images exactly as provided.
//
// RENDERING RULES (NON-NEGOTIABLE):
// - Plain image
// - Transparent background
// - Original colors
// - Original shape
// - Original aspect ratio
//
// THE APP MUST NOT APPLY:
// - Background color
// - White or black pills
// - Padding
// - Border radius
// - Shadows
// - Masks
// - Overlays
// - Opacity effects
// - Hover or press states
// - Scaling beyond a shared max height
//
// If an icon looks like a button → implementation is WRONG.
//
// LAYOUT RULES:
// - Icons sit directly on the app background
// - Icons may share a max height only
// - Icons must NOT be visually equalized
// - Visual inconsistency is expected and CORRECT
//
// INTERACTION:
// - Tappable
// - Opens streaming app via deep link
// - NO animation
// - NO visual feedback
// - They must feel PASSIVE, not interactive UI
// ============================================================================

// Sprite sheet: public/image-2.png (user-provided asset)
// 3 rows, 9 columns
const SPRITE_COLS = 9;
const SPRITE_ROWS = 3;

// Icon positions (row, col) - 0-indexed
const ICON_POSITIONS: Record<string, { row: number; col: number }> = {
  // Row 1
  netflix: { row: 0, col: 0 },
  youtubetv: { row: 0, col: 1 },
  prime: { row: 0, col: 2 },
  hbo: { row: 0, col: 3 },
  hulu: { row: 0, col: 4 },
  disney: { row: 0, col: 5 },
  apple: { row: 0, col: 6 },
  cbs: { row: 0, col: 7 },
  amc: { row: 0, col: 8 },
  // Row 2
  crackle: { row: 1, col: 0 },
  livexlive: { row: 1, col: 1 },
  showtime: { row: 1, col: 2 },
  skygo: { row: 1, col: 3 },
  spotify: { row: 1, col: 4 },
  googleplaymusic: { row: 1, col: 5 },
  applemusic: { row: 1, col: 6 },
  tunein: { row: 1, col: 7 },
  siriusxm: { row: 1, col: 8 },
  // Row 3
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

// Provider aliases
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

// Deep links
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

// Shared max height - icons scale to this, preserving aspect ratio
const MAX_HEIGHT = 24;
const ICON_ASPECT = 1.8; // Width:Height from sprite

function normalizeProviderId(id: string): string {
  const lowerId = id.toLowerCase().replace(/[\s-_]/g, '');
  return PROVIDER_ALIASES[lowerId] || lowerId;
}

export function hasVerifiedIcon(providerId: string): boolean {
  return normalizeProviderId(providerId) in ICON_POSITIONS;
}

export function filterVerifiedProviders(providerIds: string[]): string[] {
  return providerIds.filter(id => hasVerifiedIcon(id));
}

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

interface StreamingIconProps {
  providerId: string;
  movieId?: string;
}

export function StreamingIcon({ providerId, movieId }: StreamingIconProps) {
  const normalized = normalizeProviderId(providerId);
  const position = ICON_POSITIONS[normalized];

  if (!position) return null;

  const handlePress = async () => {
    // NO haptic, NO animation, NO visual feedback
    if (movieId) {
      await openStreamingLink(providerId, movieId);
    }
  };

  // Icon dimensions from sprite aspect ratio
  const iconWidth = MAX_HEIGHT * ICON_ASPECT;
  const iconHeight = MAX_HEIGHT;

  return (
    <Pressable onPress={handlePress} hitSlop={8}>
      <View style={{ width: iconWidth, height: iconHeight, overflow: 'hidden' }}>
        <Image
          source={require('../../public/image-2.png')}
          style={{
            width: iconWidth * SPRITE_COLS,
            height: iconHeight * SPRITE_ROWS,
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
}

export function StreamingRow({ providerIds, movieId, maxVisible = 4 }: StreamingRowProps) {
  const verified = filterVerifiedProviders(providerIds).slice(0, maxVisible);
  if (verified.length === 0) return null;

  return (
    <View style={styles.row}>
      {verified.map((id) => (
        <StreamingIcon key={id} providerId={id} movieId={movieId} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
});
