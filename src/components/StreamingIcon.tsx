import React from 'react';
import { View, Pressable, StyleSheet, Linking, ImageBackground } from 'react-native';

// ============================================================================
// STREAMING ICON RENDERING — FINAL LOCK
// ============================================================================
// Streaming icons are BRAND ASSETS, not UI elements.
// They must be rendered as raw brand images exactly as provided.
//
// RENDERING RULES (NON-NEGOTIABLE):
// - Plain image
// - Original colors
// - Original shape
// - Original aspect ratio
//
// THE APP MUST NOT APPLY:
// - Background color / pills
// - Padding / border radius / shadows / masks / overlays
// - Opacity effects / hover or press states
//
// If an icon looks like a button → implementation is WRONG.
// ============================================================================

// Sprite sheet: public/image-2.png
// Actual image dimensions: 1290 x 180 pixels
// Grid: 9 columns x 3 rows
// Each cell: ~143 x 60 pixels
const SPRITE_WIDTH = 1290;
const SPRITE_HEIGHT = 180;
const SPRITE_COLS = 9;
const SPRITE_ROWS = 3;
const CELL_WIDTH = SPRITE_WIDTH / SPRITE_COLS; // ~143.3
const CELL_HEIGHT = SPRITE_HEIGHT / SPRITE_ROWS; // 60

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

// Display height for icons
const DISPLAY_HEIGHT = 28;
const DISPLAY_WIDTH = DISPLAY_HEIGHT * (CELL_WIDTH / CELL_HEIGHT); // Preserve aspect ratio

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

// Use require once at module level
const spriteSource = require('../../public/image-2.png');

export function StreamingIcon({ providerId, movieId }: StreamingIconProps) {
  const normalized = normalizeProviderId(providerId);
  const position = ICON_POSITIONS[normalized];

  if (!position) return null;

  const handlePress = async () => {
    if (movieId) {
      await openStreamingLink(providerId, movieId);
    }
  };

  // Calculate scale factor from original sprite to display size
  const scale = DISPLAY_HEIGHT / CELL_HEIGHT;
  const scaledSpriteWidth = SPRITE_WIDTH * scale;
  const scaledSpriteHeight = SPRITE_HEIGHT * scale;
  const offsetX = -position.col * DISPLAY_WIDTH;
  const offsetY = -position.row * DISPLAY_HEIGHT;

  return (
    <Pressable onPress={handlePress} hitSlop={8}>
      <View style={{
        width: DISPLAY_WIDTH,
        height: DISPLAY_HEIGHT,
        overflow: 'hidden',
      }}>
        <ImageBackground
          source={spriteSource}
          style={{
            width: scaledSpriteWidth,
            height: scaledSpriteHeight,
            marginLeft: offsetX,
            marginTop: offsetY,
          }}
          resizeMode="cover"
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
