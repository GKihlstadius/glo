import React from 'react';
import { View } from 'react-native';
import Svg, { Path, Rect, Circle, G, Defs, LinearGradient, Stop } from 'react-native-svg';

// Provider icon sizes
type IconSize = 'small' | 'medium' | 'large';

const SIZES: Record<IconSize, number> = {
  small: 24,
  medium: 32,
  large: 40,
};

interface ProviderIconProps {
  providerId: string;
  size?: IconSize;
}

// Netflix "N" ribbon icon
function NetflixIcon({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect width="24" height="24" rx="4" fill="#E50914" />
      <Path
        d="M6 4h3.5l4.5 10.5V4H17v16h-3.5L9 9.5V20H6V4z"
        fill="#FFFFFF"
      />
    </Svg>
  );
}

// Prime Video checkmark/arrow icon
function PrimeIcon({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect width="24" height="24" rx="4" fill="#00A8E1" />
      <Path
        d="M5 12.5c3.5 2.5 7 3 11 1"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M14 10l2.5 3.5L19 10"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

// Disney+ castle icon
function DisneyIcon({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect width="24" height="24" rx="4" fill="#113CCF" />
      <Path
        d="M12 5l-1 3h2l-1-3zM8 8v8h2v-5h4v5h2V8l-4-2-4 2z"
        fill="#FFFFFF"
      />
      <Path
        d="M6 16h12v2H6v-2z"
        fill="#FFFFFF"
      />
    </Svg>
  );
}

// Max (HBO) icon
function MaxIcon({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect width="24" height="24" rx="4" fill="#002BE7" />
      <Path
        d="M4 8h3l2 5 2-5h3v8h-2.5v-5l-2 5h-1l-2-5v5H4V8z"
        fill="#FFFFFF"
      />
      <Path
        d="M15 8h2l2 4 2-4h-2l-2 4-2-4z"
        fill="#FFFFFF"
      />
    </Svg>
  );
}

// Apple TV+ icon
function AppleIcon({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect width="24" height="24" rx="4" fill="#000000" />
      <Path
        d="M12 6c-.5-1.5-2-2-3-1.5.5.5.5 1.5 0 2-.5.5-1 .5-1.5 0 1 2 3 1.5 4 .5 1 1 3 1.5 4-.5-.5.5-1 .5-1.5 0-.5-.5-.5-1.5 0-2-1-.5-2.5 0-3 1.5z"
        fill="#FFFFFF"
      />
      <Path
        d="M12 8c-2 0-4 2-4 5s1.5 5 4 5 4-2 4-5-2-5-4-5z"
        fill="#FFFFFF"
      />
    </Svg>
  );
}

// Viaplay icon
function ViaplayIcon({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect width="24" height="24" rx="4" fill="#FF0000" />
      <Path
        d="M7 7l5 10 5-10h-3l-2 5-2-5H7z"
        fill="#FFFFFF"
      />
    </Svg>
  );
}

// SVT Play icon
function SVTIcon({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect width="24" height="24" rx="4" fill="#1B5E20" />
      <Path
        d="M5 8c1 0 2 .5 2 1.5S6 11 5 11s-2-.5-2-1.5S4 8 5 8z"
        fill="#FFFFFF"
      />
      <Path
        d="M8 8l2 8 2-8h2l-3 10h-2L6 8h2z"
        fill="#FFFFFF"
      />
      <Path
        d="M15 8h5v2h-3v6h-2V8z"
        fill="#FFFFFF"
      />
    </Svg>
  );
}

// Hulu icon
function HuluIcon({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect width="24" height="24" rx="4" fill="#1CE783" />
      <Path
        d="M4 7v10h2v-4c0-1 1-2 2-2s2 1 2 2v4h2V7h-2v3c-.5-1-1.5-1.5-2.5-1.5S6 9 5.5 10V7H4z"
        fill="#FFFFFF"
      />
      <Path
        d="M14 10v7h2v-4c0-1 1-2 2-2s2 1 2 2v4h2v-5c0-2-1.5-3-3.5-3S15 10 14 11v-1h2z"
        fill="#FFFFFF"
      />
    </Svg>
  );
}

// Paramount+ icon
function ParamountIcon({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect width="24" height="24" rx="4" fill="#0064FF" />
      <Path
        d="M12 4l-8 14h4l4-8 4 8h4L12 4z"
        fill="#FFFFFF"
      />
      <Circle cx="12" cy="8" r="2" fill="#0064FF" />
    </Svg>
  );
}

// Peacock icon
function PeacockIcon({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect width="24" height="24" rx="4" fill="#000000" />
      <G>
        <Path d="M12 6c-1 0-2 1-2 2v8c0 1 1 2 2 2s2-1 2-2V8c0-1-1-2-2-2z" fill="#FFD700" />
        <Path d="M8 8c-1 0-2 1-1.5 2l2 6c.3 1 1.5 1 1.8 0l.7-2-2-6c-.2-.6-.5-1-1-1z" fill="#00CED1" />
        <Path d="M16 8c1 0 2 1 1.5 2l-2 6c-.3 1-1.5 1-1.8 0l-.7-2 2-6c.2-.6.5-1 1-1z" fill="#FF6B6B" />
      </G>
    </Svg>
  );
}

// MUBI icon
function MubiIcon({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect width="24" height="24" rx="4" fill="#000000" />
      <Path
        d="M4 8h2l1.5 5 1.5-5h2l1.5 5 1.5-5h2l-2.5 8h-2l-1.5-5-1.5 5h-2L4 8z"
        fill="#FFFFFF"
      />
    </Svg>
  );
}

// Criterion Channel icon
function CriterionIcon({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect width="24" height="24" rx="4" fill="#000000" />
      <Circle
        cx="12"
        cy="12"
        r="7"
        stroke="#FFFFFF"
        strokeWidth="2"
        fill="none"
      />
      <Path
        d="M9 9l6 6M15 9l-6 6"
        stroke="#FFFFFF"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </Svg>
  );
}

// Generic/fallback icon
function GenericIcon({ size, color, letter }: { size: number; color: string; letter: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect width="24" height="24" rx="4" fill={color} />
      <G>
        <Path
          d="M12 6a6 6 0 100 12 6 6 0 000-12z"
          fill="rgba(255,255,255,0.2)"
        />
      </G>
    </Svg>
  );
}

// Provider colors for fallback
const PROVIDER_COLORS: Record<string, string> = {
  netflix: '#E50914',
  prime: '#00A8E1',
  disney: '#113CCF',
  hbo: '#002BE7',
  apple: '#000000',
  viaplay: '#FF0000',
  svtplay: '#1B5E20',
  hulu: '#1CE783',
  paramount: '#0064FF',
  peacock: '#000000',
  mubi: '#000000',
  criterion: '#000000',
  starz: '#000000',
  crunchyroll: '#F47521',
};

// Main provider icon component
export function ProviderIcon({ providerId, size = 'medium' }: ProviderIconProps) {
  const pixelSize = SIZES[size];

  switch (providerId) {
    case 'netflix':
      return <NetflixIcon size={pixelSize} />;
    case 'prime':
      return <PrimeIcon size={pixelSize} />;
    case 'disney':
      return <DisneyIcon size={pixelSize} />;
    case 'hbo':
      return <MaxIcon size={pixelSize} />;
    case 'apple':
      return <AppleIcon size={pixelSize} />;
    case 'viaplay':
      return <ViaplayIcon size={pixelSize} />;
    case 'svtplay':
      return <SVTIcon size={pixelSize} />;
    case 'hulu':
      return <HuluIcon size={pixelSize} />;
    case 'paramount':
      return <ParamountIcon size={pixelSize} />;
    case 'peacock':
      return <PeacockIcon size={pixelSize} />;
    case 'mubi':
      return <MubiIcon size={pixelSize} />;
    case 'criterion':
      return <CriterionIcon size={pixelSize} />;
    default:
      return (
        <GenericIcon
          size={pixelSize}
          color={PROVIDER_COLORS[providerId] || '#666666'}
          letter={providerId.charAt(0).toUpperCase()}
        />
      );
  }
}

// Export provider colors for use elsewhere
export { PROVIDER_COLORS };
