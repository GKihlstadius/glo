import React from 'react';
import { View } from 'react-native';
import Svg, { Path, Rect, Circle, G, Defs, LinearGradient, Stop, Text as SvgText } from 'react-native-svg';

// ============================================================================
// PROVIDER ICONS — RECTANGULAR BRAND BUTTONS
// ============================================================================
// Clean, rectangular icons matching the actual streaming service branding.
// Rounded corners, proper brand colors, and accurate logos/wordmarks.
// ============================================================================

// Provider icon sizes
type IconSize = 'small' | 'medium' | 'large';

const SIZES: Record<IconSize, { width: number; height: number }> = {
  small: { width: 42, height: 24 },
  medium: { width: 56, height: 32 },
  large: { width: 70, height: 40 },
};

const RADIUS = 6;

interface ProviderIconProps {
  providerId: string;
  size?: IconSize;
}

// Netflix - Black background with red NETFLIX text
function NetflixIcon({ width, height }: { width: number; height: number }) {
  const scale = width / 56;
  return (
    <Svg width={width} height={height} viewBox="0 0 112 64">
      <Rect width="112" height="64" rx={RADIUS * 2} fill="#000000" />
      <SvgText
        x="56"
        y="40"
        fill="#E50914"
        fontSize="22"
        fontWeight="bold"
        textAnchor="middle"
        fontFamily="sans-serif"
      >
        NETFLIX
      </SvgText>
    </Svg>
  );
}

// Prime Video - Dark with "prime video" text and blue swoosh
function PrimeIcon({ width, height }: { width: number; height: number }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 112 64">
      <Rect width="112" height="64" rx={RADIUS * 2} fill="#00050D" />
      <SvgText
        x="56"
        y="32"
        fill="#FFFFFF"
        fontSize="14"
        fontWeight="400"
        textAnchor="middle"
        fontFamily="sans-serif"
      >
        prime video
      </SvgText>
      <Path
        d="M25 44 Q56 52 87 44"
        stroke="#00A8E1"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
    </Svg>
  );
}

// Disney+ - Dark navy with Disney+ logo
function DisneyIcon({ width, height }: { width: number; height: number }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 112 64">
      <Defs>
        <LinearGradient id="disneyGradPI" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#0E1A2D" />
          <Stop offset="100%" stopColor="#0A1628" />
        </LinearGradient>
      </Defs>
      <Rect width="112" height="64" rx={RADIUS * 2} fill="url(#disneyGradPI)" />
      <SvgText
        x="48"
        y="40"
        fill="#FFFFFF"
        fontSize="18"
        fontWeight="400"
        fontStyle="italic"
        textAnchor="middle"
        fontFamily="serif"
      >
        Disney
      </SvgText>
      <SvgText
        x="88"
        y="40"
        fill="#FFFFFF"
        fontSize="22"
        fontWeight="300"
        textAnchor="middle"
        fontFamily="sans-serif"
      >
        +
      </SvgText>
    </Svg>
  );
}

// HBO Max / Max - Purple gradient with "max" text
function MaxIcon({ width, height }: { width: number; height: number }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 112 64">
      <Defs>
        <LinearGradient id="maxGradPI" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#1E0050" />
          <Stop offset="50%" stopColor="#4A148C" />
          <Stop offset="100%" stopColor="#0D47A1" />
        </LinearGradient>
      </Defs>
      <Rect width="112" height="64" rx={RADIUS * 2} fill="url(#maxGradPI)" />
      <SvgText
        x="56"
        y="42"
        fill="#FFFFFF"
        fontSize="26"
        fontWeight="bold"
        textAnchor="middle"
        fontFamily="sans-serif"
      >
        max
      </SvgText>
    </Svg>
  );
}

// Apple TV+ - Black with Apple logo and tv+
function AppleIcon({ width, height }: { width: number; height: number }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 112 64">
      <Rect width="112" height="64" rx={RADIUS * 2} fill="#000000" />
      <Path
        d="M30 20c-1.5 0-3 1-3.5 2.5 1 0 2-.5 2.5-1.5.5-.5.5-1 .5-1-.2 0-.3 0-.5 0z
           M34 24c-2-2-5-1.5-6.5 0-1 1-1.5 2-1.5 3.5 0 4 3 10 5 10 1 0 1.5-.5 3-.5s2 .5 3 .5c2 0 4.5-6 5-10-.5 0-3-.5-3.5-3-.5-2 1-3.5 1-3.5-1-1-3-1-4 0-.5.5-1 .5-1.5.5s-1 0-1.5-.5z"
        fill="#FFFFFF"
        transform="translate(0, 6) scale(0.8)"
      />
      <SvgText
        x="70"
        y="40"
        fill="#FFFFFF"
        fontSize="16"
        fontWeight="500"
        textAnchor="middle"
        fontFamily="sans-serif"
      >
        tv+
      </SvgText>
    </Svg>
  );
}

// Viaplay - Red with "V" logo
function ViaplayIcon({ width, height }: { width: number; height: number }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 112 64">
      <Rect width="112" height="64" rx={RADIUS * 2} fill="#E4002B" />
      <SvgText
        x="56"
        y="44"
        fill="#FFFFFF"
        fontSize="32"
        fontWeight="bold"
        textAnchor="middle"
        fontFamily="sans-serif"
      >
        V
      </SvgText>
    </Svg>
  );
}

// SVT Play - Green with SVT text
function SVTIcon({ width, height }: { width: number; height: number }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 112 64">
      <Rect width="112" height="64" rx={RADIUS * 2} fill="#1B5E20" />
      <SvgText
        x="56"
        y="42"
        fill="#FFFFFF"
        fontSize="22"
        fontWeight="bold"
        textAnchor="middle"
        fontFamily="sans-serif"
      >
        SVT
      </SvgText>
    </Svg>
  );
}

// Hulu - Green background with white "hulu" text
function HuluIcon({ width, height }: { width: number; height: number }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 112 64">
      <Rect width="112" height="64" rx={RADIUS * 2} fill="#1CE783" />
      <SvgText
        x="56"
        y="42"
        fill="#FFFFFF"
        fontSize="28"
        fontWeight="bold"
        textAnchor="middle"
        fontFamily="sans-serif"
      >
        hulu
      </SvgText>
    </Svg>
  );
}

// Paramount+ - Blue mountain peak logo
function ParamountIcon({ width, height }: { width: number; height: number }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 112 64">
      <Rect width="112" height="64" rx={RADIUS * 2} fill="#0064FF" />
      <Path
        d="M56 12 L32 52 L80 52 Z"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="3"
      />
      <Path
        d="M56 24 L42 48 L70 48 Z"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="2"
      />
      <Circle cx="56" cy="16" r="3" fill="#FFFFFF" />
    </Svg>
  );
}

// Peacock - Black with colorful peacock icon
function PeacockIcon({ width, height }: { width: number; height: number }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 112 64">
      <Rect width="112" height="64" rx={RADIUS * 2} fill="#000000" />
      <G transform="translate(56, 32) scale(0.6)">
        <Path d="M0 -20 C-5 -10 -5 10 0 20" fill="#FFD700" />
        <Path d="M-15 -15 C-15 -5 -10 15 -5 18" fill="#00CED1" />
        <Path d="M15 -15 C15 -5 10 15 5 18" fill="#FF6B6B" />
        <Path d="M-25 -8 C-20 2 -12 18 -8 20" fill="#9B59B6" />
        <Path d="M25 -8 C20 2 12 18 8 20" fill="#2ECC71" />
      </G>
    </Svg>
  );
}

// MUBI - Black with MUBI text
function MubiIcon({ width, height }: { width: number; height: number }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 112 64">
      <Rect width="112" height="64" rx={RADIUS * 2} fill="#000000" />
      <SvgText
        x="42"
        y="42"
        fill="#FFFFFF"
        fontSize="22"
        fontWeight="bold"
        textAnchor="middle"
        fontFamily="sans-serif"
      >
        MUBI
      </SvgText>
      <G transform="translate(78, 32)">
        <Circle cx="0" cy="-6" r="3" fill="#FFFFFF" />
        <Circle cx="0" cy="6" r="3" fill="#FFFFFF" />
        <Circle cx="10" cy="-6" r="3" fill="#FFFFFF" />
        <Circle cx="10" cy="6" r="3" fill="#FFFFFF" />
      </G>
    </Svg>
  );
}

// Criterion Channel - Black with C logo
function CriterionIcon({ width, height }: { width: number; height: number }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 112 64">
      <Rect width="112" height="64" rx={RADIUS * 2} fill="#000000" />
      <Circle
        cx="56"
        cy="32"
        r="20"
        stroke="#FFFFFF"
        strokeWidth="3"
        fill="none"
      />
      <SvgText
        x="56"
        y="40"
        fill="#FFFFFF"
        fontSize="24"
        fontWeight="bold"
        textAnchor="middle"
        fontFamily="serif"
      >
        C
      </SvgText>
    </Svg>
  );
}

// Crunchyroll - Orange with text
function CrunchyrollIcon({ width, height }: { width: number; height: number }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 112 64">
      <Rect width="112" height="64" rx={RADIUS * 2} fill="#F47521" />
      <SvgText
        x="56"
        y="42"
        fill="#FFFFFF"
        fontSize="14"
        fontWeight="bold"
        textAnchor="middle"
        fontFamily="sans-serif"
      >
        crunchyroll
      </SvgText>
    </Svg>
  );
}

// Generic/fallback icon
function GenericIcon({ width, height, color }: { width: number; height: number; color: string }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 112 64">
      <Rect width="112" height="64" rx={RADIUS * 2} fill={color} />
      <Circle cx="56" cy="32" r="16" fill="rgba(255,255,255,0.2)" />
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
  viaplay: '#E4002B',
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
  const { width, height } = SIZES[size];

  switch (providerId) {
    case 'netflix':
      return <NetflixIcon width={width} height={height} />;
    case 'prime':
      return <PrimeIcon width={width} height={height} />;
    case 'disney':
      return <DisneyIcon width={width} height={height} />;
    case 'hbo':
      return <MaxIcon width={width} height={height} />;
    case 'apple':
      return <AppleIcon width={width} height={height} />;
    case 'viaplay':
      return <ViaplayIcon width={width} height={height} />;
    case 'svtplay':
      return <SVTIcon width={width} height={height} />;
    case 'hulu':
      return <HuluIcon width={width} height={height} />;
    case 'paramount':
      return <ParamountIcon width={width} height={height} />;
    case 'peacock':
      return <PeacockIcon width={width} height={height} />;
    case 'mubi':
      return <MubiIcon width={width} height={height} />;
    case 'criterion':
      return <CriterionIcon width={width} height={height} />;
    case 'crunchyroll':
      return <CrunchyrollIcon width={width} height={height} />;
    default:
      return (
        <GenericIcon
          width={width}
          height={height}
          color={PROVIDER_COLORS[providerId] || '#666666'}
        />
      );
  }
}

// Export provider colors for use elsewhere
export { PROVIDER_COLORS };
