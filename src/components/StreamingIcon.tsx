import React from 'react';
import { View, StyleSheet, Image } from 'react-native';

// ============================================================================
// STREAMING ICONS — OFFICIAL BRAND LOGOS
// ============================================================================
// Using official streaming service logos as images.
// Clean rectangular buttons with rounded corners.
// ============================================================================

const WIDTH = 56;
const HEIGHT = 32;
const RADIUS = 6;

// Provider ID normalization
const ALIASES: Record<string, string> = {
  amazonprime: 'prime',
  primevideo: 'prime',
  amazonprimevideo: 'prime',
  hbomax: 'max',
  max: 'max',
  disneyplus: 'disney',
  appletv: 'apple',
  appletvplus: 'apple',
  paramountplus: 'paramount',
  cbs: 'paramount',
  youtubeTV: 'youtubetv',
  youtube_tv: 'youtubetv',
};

function normalize(id: string): string {
  const key = id.toLowerCase().replace(/[\s-_]/g, '');
  return ALIASES[key] || key;
}

// Official streaming provider logo URLs
// Using high-quality brand assets
const PROVIDER_LOGOS: Record<string, string> = {
  netflix: 'https://images.justwatch.com/icon/207360008/s100/netflix.webp',
  prime: 'https://images.justwatch.com/icon/52449861/s100/amazonprimevideo.webp',
  disney: 'https://images.justwatch.com/icon/147638351/s100/disneyplus.webp',
  max: 'https://images.justwatch.com/icon/305458112/s100/max.webp',
  apple: 'https://images.justwatch.com/icon/190848813/s100/appletvplus.webp',
  hulu: 'https://images.justwatch.com/icon/116305230/s100/hulu.webp',
  paramount: 'https://images.justwatch.com/icon/232697473/s100/paramountplus.webp',
  peacock: 'https://images.justwatch.com/icon/194559929/s100/peacocktv.webp',
  viaplay: 'https://images.justwatch.com/icon/213498857/s100/viaplay.webp',
  svtplay: 'https://images.justwatch.com/icon/171947990/s100/svtplay.webp',
  mubi: 'https://images.justwatch.com/icon/6917040/s100/mubi.webp',
  crunchyroll: 'https://images.justwatch.com/icon/134498937/s100/crunchyroll.webp',
  youtubetv: 'https://images.justwatch.com/icon/158028612/s100/youtubetv.webp',
  hbo: 'https://images.justwatch.com/icon/305458112/s100/max.webp',
};

// Supported providers
const SUPPORTED_PROVIDERS = new Set(Object.keys(PROVIDER_LOGOS));

export function hasVerifiedIcon(id: string): boolean {
  return SUPPORTED_PROVIDERS.has(normalize(id));
}

export function filterVerifiedProviders(ids: string[]): string[] {
  return ids.filter(id => hasVerifiedIcon(id));
}

interface StreamingIconProps {
  providerId: string;
  size?: 'small' | 'medium' | 'large';
}

export function StreamingIcon({ providerId, size = 'medium' }: StreamingIconProps) {
  const id = normalize(providerId);
  const logoUrl = PROVIDER_LOGOS[id];

  if (!logoUrl) {
    return null;
  }

  const dimensions = {
    small: { width: 40, height: 40, radius: 8 },
    medium: { width: 48, height: 48, radius: 10 },
    large: { width: 56, height: 56, radius: 12 },
  };

  const { width, height, radius } = dimensions[size];

  return (
    <Image
      source={{ uri: logoUrl }}
      style={{
        width,
        height,
        borderRadius: radius,
      }}
      resizeMode="cover"
    />
  );
}

interface StreamingRowProps {
  providerIds: string[];
  maxVisible?: number;
  size?: 'small' | 'medium' | 'large';
}

export function StreamingRow({ providerIds, maxVisible = 4, size = 'medium' }: StreamingRowProps) {
  const verified = filterVerifiedProviders(providerIds).slice(0, maxVisible);
  if (verified.length === 0) return null;

  return (
    <View style={styles.row}>
      {verified.map(id => (
        <StreamingIcon key={normalize(id)} providerId={id} size={size} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
