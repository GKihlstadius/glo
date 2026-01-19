import React from 'react';
import { Image, StyleSheet } from 'react-native';

// ============================================================================
// PROVIDER ICONS — OFFICIAL BRAND LOGOS
// ============================================================================
// Using official streaming service logos as images.
// Clean rectangular buttons with rounded corners.
// ============================================================================

// Provider icon sizes
type IconSize = 'small' | 'medium' | 'large';

const SIZES: Record<IconSize, { width: number; height: number; radius: number }> = {
  small: { width: 40, height: 40, radius: 8 },
  medium: { width: 48, height: 48, radius: 10 },
  large: { width: 56, height: 56, radius: 12 },
};

// Official streaming provider logo URLs from JustWatch
const PROVIDER_LOGOS: Record<string, string> = {
  netflix: 'https://images.justwatch.com/icon/207360008/s100/netflix.webp',
  prime: 'https://images.justwatch.com/icon/52449861/s100/amazonprimevideo.webp',
  disney: 'https://images.justwatch.com/icon/147638351/s100/disneyplus.webp',
  max: 'https://images.justwatch.com/icon/305458112/s100/max.webp',
  hbo: 'https://images.justwatch.com/icon/305458112/s100/max.webp',
  apple: 'https://images.justwatch.com/icon/190848813/s100/appletvplus.webp',
  hulu: 'https://images.justwatch.com/icon/116305230/s100/hulu.webp',
  paramount: 'https://images.justwatch.com/icon/232697473/s100/paramountplus.webp',
  peacock: 'https://images.justwatch.com/icon/194559929/s100/peacocktv.webp',
  viaplay: 'https://images.justwatch.com/icon/213498857/s100/viaplay.webp',
  svtplay: 'https://images.justwatch.com/icon/171947990/s100/svtplay.webp',
  mubi: 'https://images.justwatch.com/icon/6917040/s100/mubi.webp',
  crunchyroll: 'https://images.justwatch.com/icon/134498937/s100/crunchyroll.webp',
  youtubetv: 'https://images.justwatch.com/icon/158028612/s100/youtubetv.webp',
  criterion: 'https://images.justwatch.com/icon/3227886/s100/criterionchannel.webp',
  starz: 'https://images.justwatch.com/icon/194590/s100/starz.webp',
};

// Provider colors for fallback
export const PROVIDER_COLORS: Record<string, string> = {
  netflix: '#E50914',
  prime: '#00A8E1',
  disney: '#113CCF',
  hbo: '#002BE7',
  max: '#002BE7',
  apple: '#000000',
  viaplay: '#E4002B',
  svtplay: '#1B5E20',
  hulu: '#1CE783',
  paramount: '#0064FF',
  peacock: '#000000',
  mubi: '#000000',
  criterion: '#000000',
  starz: '#000000',
  crunchyroll: '#F47521',
  youtubetv: '#FF0000',
};

interface ProviderIconProps {
  providerId: string;
  size?: IconSize;
}

// Main provider icon component
export function ProviderIcon({ providerId, size = 'medium' }: ProviderIconProps) {
  const { width, height, radius } = SIZES[size];
  const logoUrl = PROVIDER_LOGOS[providerId];

  if (!logoUrl) {
    // Return null for unsupported providers
    return null;
  }

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
