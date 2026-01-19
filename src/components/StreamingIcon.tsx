import React from 'react';
import { View, StyleSheet, Image } from 'react-native';

// ============================================================================
// STREAMING ICON RENDERING — FINAL LOCK
// ============================================================================
// Streaming icons are PASSIVE BRAND SIGNALS only.
// They answer: "Is this movie available to stream in my region?"
// They do NOT answer: "Take me there."
//
// ICONS ARE:
// - Raw images
// - Non-interactive (NOT tappable, NOT buttons, NOT links)
// - Brand-true (original colors, shapes, aspect ratios)
//
// ICONS ARE NOT:
// - UI elements
// - Buttons
// - Links
// - Wrapped in containers/pills/badges/chips
//
// RENDERING RULES:
// - Transparent background (icon keeps its own brand background)
// - No padding, border radius, shadows, masks, overlays
// - No opacity effects, no scaling tricks
//
// LAYOUT (ONLY ALLOWED):
// - Horizontal alignment
// - Spacing between icons
// - Shared max height (28px)
//
// If icons look uneven → that is CORRECT.
// Brand fidelity beats UI consistency. Always.
// ============================================================================

// Sprite: public/image-2.png (1290x180, 9x3 grid)
const SPRITE_WIDTH = 1290;
const SPRITE_HEIGHT = 180;
const COLS = 9;
const ROWS = 3;
const CELL_W = SPRITE_WIDTH / COLS;
const CELL_H = SPRITE_HEIGHT / ROWS;

// Icon grid positions
const ICONS: Record<string, { row: number; col: number }> = {
  netflix: { row: 0, col: 0 },
  youtubetv: { row: 0, col: 1 },
  prime: { row: 0, col: 2 },
  hbo: { row: 0, col: 3 },
  hulu: { row: 0, col: 4 },
  disney: { row: 0, col: 5 },
  apple: { row: 0, col: 6 },
  cbs: { row: 0, col: 7 },
  amc: { row: 0, col: 8 },
  crackle: { row: 1, col: 0 },
  livexlive: { row: 1, col: 1 },
  showtime: { row: 1, col: 2 },
  skygo: { row: 1, col: 3 },
  spotify: { row: 1, col: 4 },
  googleplaymusic: { row: 1, col: 5 },
  applemusic: { row: 1, col: 6 },
  tunein: { row: 1, col: 7 },
  siriusxm: { row: 1, col: 8 },
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

// Aliases
const ALIASES: Record<string, string> = {
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

function normalize(id: string): string {
  const key = id.toLowerCase().replace(/[\s-_]/g, '');
  return ALIASES[key] || key;
}

export function hasVerifiedIcon(id: string): boolean {
  return normalize(id) in ICONS;
}

export function filterVerifiedProviders(ids: string[]): string[] {
  return ids.filter(id => hasVerifiedIcon(id));
}

// Display size
const HEIGHT = 28;
const WIDTH = HEIGHT * (CELL_W / CELL_H);

// Sprite source
const sprite = require('../../public/image-2.png');

interface StreamingIconProps {
  providerId: string;
}

// Streaming icon - RAW IMAGE, NO INTERACTION
export function StreamingIcon({ providerId }: StreamingIconProps) {
  const pos = ICONS[normalize(providerId)];
  if (!pos) return null;

  const scale = HEIGHT / CELL_H;

  return (
    <View style={{ width: WIDTH, height: HEIGHT, overflow: 'hidden' }}>
      <Image
        source={sprite}
        style={{
          width: SPRITE_WIDTH * scale,
          height: SPRITE_HEIGHT * scale,
          marginLeft: -pos.col * WIDTH,
          marginTop: -pos.row * HEIGHT,
        }}
        resizeMode="cover"
      />
    </View>
  );
}

interface StreamingRowProps {
  providerIds: string[];
  maxVisible?: number;
}

// Row of icons - NO INTERACTION, just layout
export function StreamingRow({ providerIds, maxVisible = 4 }: StreamingRowProps) {
  const verified = filterVerifiedProviders(providerIds).slice(0, maxVisible);
  if (verified.length === 0) return null;

  return (
    <View style={styles.row}>
      {verified.map(id => (
        <StreamingIcon key={id} providerId={id} />
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
