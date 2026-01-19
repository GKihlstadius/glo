import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import Svg, { Path, Rect, Circle, G, Defs, LinearGradient, Stop, Text as SvgText } from 'react-native-svg';

// ============================================================================
// STREAMING ICONS — RECTANGULAR BRAND BUTTONS
// ============================================================================
// Clean, rectangular icons matching the actual streaming service branding.
// Rounded corners, proper brand colors, and accurate logos/wordmarks.
// ============================================================================

const WIDTH = 56;
const HEIGHT = 32;
const RADIUS = 6;

// Provider ID normalization
const ALIASES: Record<string, string> = {
  amazonprime: 'prime',
  primevideo: 'prime',
  amazonprimevideo: 'prime',
  hbomax: 'hbo',
  max: 'hbo',
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

// Supported providers
const SUPPORTED_PROVIDERS = new Set([
  'netflix', 'prime', 'disney', 'hbo', 'apple', 'hulu', 'paramount', 'peacock',
  'viaplay', 'svtplay', 'mubi', 'crunchyroll', 'youtubetv'
]);

export function hasVerifiedIcon(id: string): boolean {
  return SUPPORTED_PROVIDERS.has(normalize(id));
}

export function filterVerifiedProviders(ids: string[]): string[] {
  return ids.filter(id => hasVerifiedIcon(id));
}

// Netflix - Black background with red NETFLIX text
function NetflixIcon() {
  return (
    <Svg width={WIDTH} height={HEIGHT} viewBox="0 0 112 64">
      <Rect width="112" height="64" rx={RADIUS * 2} fill="#000000" />
      {/* NETFLIX wordmark */}
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

// Prime Video - Dark blue/navy with "prime video" text
function PrimeIcon() {
  return (
    <Svg width={WIDTH} height={HEIGHT} viewBox="0 0 112 64">
      <Rect width="112" height="64" rx={RADIUS * 2} fill="#00050D" />
      {/* "prime video" text */}
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
      {/* Blue underline swoosh */}
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
function DisneyIcon() {
  return (
    <Svg width={WIDTH} height={HEIGHT} viewBox="0 0 112 64">
      <Defs>
        <LinearGradient id="disneyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#0E1A2D" />
          <Stop offset="100%" stopColor="#0A1628" />
        </LinearGradient>
      </Defs>
      <Rect width="112" height="64" rx={RADIUS * 2} fill="url(#disneyGrad)" />
      {/* Disney+ wordmark */}
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
      {/* Plus sign */}
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
function HBOIcon() {
  return (
    <Svg width={WIDTH} height={HEIGHT} viewBox="0 0 112 64">
      <Defs>
        <LinearGradient id="maxGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#1E0050" />
          <Stop offset="50%" stopColor="#4A148C" />
          <Stop offset="100%" stopColor="#0D47A1" />
        </LinearGradient>
      </Defs>
      <Rect width="112" height="64" rx={RADIUS * 2} fill="url(#maxGrad)" />
      {/* max wordmark */}
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
function AppleIcon() {
  return (
    <Svg width={WIDTH} height={HEIGHT} viewBox="0 0 112 64">
      <Rect width="112" height="64" rx={RADIUS * 2} fill="#000000" />
      {/* Apple logo (simplified) */}
      <Path
        d="M30 20c-1.5 0-3 1-3.5 2.5 1 0 2-.5 2.5-1.5.5-.5.5-1 .5-1-.2 0-.3 0-.5 0z
           M34 24c-2-2-5-1.5-6.5 0-1 1-1.5 2-1.5 3.5 0 4 3 10 5 10 1 0 1.5-.5 3-.5s2 .5 3 .5c2 0 4.5-6 5-10-.5 0-3-.5-3.5-3-.5-2 1-3.5 1-3.5-1-1-3-1-4 0-.5.5-1 .5-1.5.5s-1 0-1.5-.5z"
        fill="#FFFFFF"
        transform="translate(0, 6) scale(0.8)"
      />
      {/* tv+ text */}
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

// Hulu - Green background with white "hulu" text
function HuluIcon() {
  return (
    <Svg width={WIDTH} height={HEIGHT} viewBox="0 0 112 64">
      <Rect width="112" height="64" rx={RADIUS * 2} fill="#1CE783" />
      {/* hulu wordmark */}
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
function ParamountIcon() {
  return (
    <Svg width={WIDTH} height={HEIGHT} viewBox="0 0 112 64">
      <Rect width="112" height="64" rx={RADIUS * 2} fill="#0064FF" />
      {/* Mountain peak */}
      <Path
        d="M56 12 L32 52 L80 52 Z"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="3"
      />
      {/* Inner mountain */}
      <Path
        d="M56 24 L42 48 L70 48 Z"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="2"
      />
      {/* Star at top */}
      <Circle cx="56" cy="16" r="3" fill="#FFFFFF" />
    </Svg>
  );
}

// Peacock - Black with colorful peacock icon
function PeacockIcon() {
  return (
    <Svg width={WIDTH} height={HEIGHT} viewBox="0 0 112 64">
      <Rect width="112" height="64" rx={RADIUS * 2} fill="#000000" />
      {/* Peacock feathers */}
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

// Viaplay - Red with "V" logo
function ViaplayIcon() {
  return (
    <Svg width={WIDTH} height={HEIGHT} viewBox="0 0 112 64">
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
function SVTIcon() {
  return (
    <Svg width={WIDTH} height={HEIGHT} viewBox="0 0 112 64">
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

// MUBI - Black with MUBI text
function MubiIcon() {
  return (
    <Svg width={WIDTH} height={HEIGHT} viewBox="0 0 112 64">
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
      {/* Four dots */}
      <G transform="translate(78, 32)">
        <Circle cx="0" cy="-6" r="3" fill="#FFFFFF" />
        <Circle cx="0" cy="6" r="3" fill="#FFFFFF" />
        <Circle cx="10" cy="-6" r="3" fill="#FFFFFF" />
        <Circle cx="10" cy="6" r="3" fill="#FFFFFF" />
      </G>
    </Svg>
  );
}

// Crunchyroll - Orange with logo
function CrunchyrollIcon() {
  return (
    <Svg width={WIDTH} height={HEIGHT} viewBox="0 0 112 64">
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

// YouTube TV - White/gray with red play button
function YouTubeTVIcon() {
  return (
    <Svg width={WIDTH} height={HEIGHT} viewBox="0 0 112 64">
      <Rect width="112" height="64" rx={RADIUS * 2} fill="#FFFFFF" />
      {/* Red rounded rectangle with play button */}
      <Rect x="20" y="18" width="36" height="28" rx="6" fill="#FF0000" />
      <Path d="M40 26 L48 32 L40 38 Z" fill="#FFFFFF" />
      {/* TV text */}
      <SvgText
        x="78"
        y="40"
        fill="#000000"
        fontSize="16"
        fontWeight="500"
        textAnchor="middle"
        fontFamily="sans-serif"
      >
        TV
      </SvgText>
    </Svg>
  );
}

interface StreamingIconProps {
  providerId: string;
}

export function StreamingIcon({ providerId }: StreamingIconProps) {
  const id = normalize(providerId);

  switch (id) {
    case 'netflix':
      return <NetflixIcon />;
    case 'prime':
      return <PrimeIcon />;
    case 'disney':
      return <DisneyIcon />;
    case 'hbo':
      return <HBOIcon />;
    case 'apple':
      return <AppleIcon />;
    case 'hulu':
      return <HuluIcon />;
    case 'paramount':
      return <ParamountIcon />;
    case 'peacock':
      return <PeacockIcon />;
    case 'viaplay':
      return <ViaplayIcon />;
    case 'svtplay':
      return <SVTIcon />;
    case 'mubi':
      return <MubiIcon />;
    case 'crunchyroll':
      return <CrunchyrollIcon />;
    case 'youtubetv':
      return <YouTubeTVIcon />;
    default:
      return null;
  }
}

interface StreamingRowProps {
  providerIds: string[];
  maxVisible?: number;
}

export function StreamingRow({ providerIds, maxVisible = 4 }: StreamingRowProps) {
  const verified = filterVerifiedProviders(providerIds).slice(0, maxVisible);
  if (verified.length === 0) return null;

  return (
    <View style={styles.row}>
      {verified.map(id => (
        <StreamingIcon key={normalize(id)} providerId={id} />
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
