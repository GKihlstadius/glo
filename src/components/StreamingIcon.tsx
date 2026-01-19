import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Rect, Circle, G, Defs, LinearGradient, Stop, ClipPath } from 'react-native-svg';

// ============================================================================
// STREAMING ICONS — CIRCULAR APP ICONS
// ============================================================================
// Clean, circular app-style icons matching iOS app icon design.
// Pure brand representation with no boxes, borders, or containers.
// ============================================================================

const SIZE = 44; // Icon diameter

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
};

function normalize(id: string): string {
  const key = id.toLowerCase().replace(/[\s-_]/g, '');
  return ALIASES[key] || key;
}

// Supported providers
const SUPPORTED_PROVIDERS = new Set([
  'netflix', 'prime', 'disney', 'hbo', 'apple', 'hulu', 'paramount', 'peacock'
]);

export function hasVerifiedIcon(id: string): boolean {
  return SUPPORTED_PROVIDERS.has(normalize(id));
}

export function filterVerifiedProviders(ids: string[]): string[] {
  return ids.filter(id => hasVerifiedIcon(id));
}

// Netflix - Red circle with N
function NetflixIcon() {
  return (
    <Svg width={SIZE} height={SIZE} viewBox="0 0 100 100">
      <Circle cx="50" cy="50" r="50" fill="#E50914" />
      <Path
        d="M30 20h12l14 40V20h12v60H56L42 40v40H30V20z"
        fill="#FFFFFF"
      />
    </Svg>
  );
}

// Prime Video - Light blue circle with play arrow
function PrimeIcon() {
  return (
    <Svg width={SIZE} height={SIZE} viewBox="0 0 100 100">
      <Circle cx="50" cy="50" r="50" fill="#00A8E1" />
      <Path
        d="M35 25v50l40-25z"
        fill="#FFFFFF"
      />
    </Svg>
  );
}

// Disney+ - Dark blue circle with Disney+ wordmark
function DisneyIcon() {
  return (
    <Svg width={SIZE} height={SIZE} viewBox="0 0 100 100">
      <Circle cx="50" cy="50" r="50" fill="#0E1A2D" />
      <G fill="#FFFFFF">
        {/* Simplified D+ logo */}
        <Path d="M25 35h25c10 0 15 8 15 15s-5 15-15 15H35v-20h-10v-10zm10 10v20h15c5 0 8-4 8-10s-3-10-8-10H35z" />
        <Path d="M68 40h8v20h-8V40zm4-8a5 5 0 110 10 5 5 0 010-10z" />
        <Rect x="72" y="48" width="8" height="4" />
      </G>
    </Svg>
  );
}

// HBO Max / Max - Purple circle with "max" text
function HBOIcon() {
  return (
    <Svg width={SIZE} height={SIZE} viewBox="0 0 100 100">
      <Circle cx="50" cy="50" r="50" fill="#002BE7" />
      <G fill="#FFFFFF">
        <Path d="M15 40h10l5 12 5-12h10v20H37V48l-5 12h-4l-5-12v12H15V40z" />
        <Path d="M50 40h10l8 20H60l-1.5-4H50l-1.5 4H40l10-20zm5 5l-3 8h6l-3-8z" />
        <Path d="M70 40h10l4 8 4-8h10l-8 12 8 8H88l-4-6-4 6H70l8-8-8-12z" />
      </G>
    </Svg>
  );
}

// Apple TV+ - Black circle with Apple logo
function AppleIcon() {
  return (
    <Svg width={SIZE} height={SIZE} viewBox="0 0 100 100">
      <Circle cx="50" cy="50" r="50" fill="#000000" />
      <Path
        d="M50 22c-2 0-4 1-5 3 2 0 4-1 5-3zm10 15c-4-4-10-3-13 0-2 2-4 2-6 0-5-4-13-3-16 5-4 10 2 26 10 32 3 2 6 2 8 0 2-1 3-1 5 0 2 2 5 2 8 0 10-8 14-28 4-37z"
        fill="#FFFFFF"
      />
    </Svg>
  );
}

// Hulu - Green circle with "hulu" text
function HuluIcon() {
  return (
    <Svg width={SIZE} height={SIZE} viewBox="0 0 100 100">
      <Circle cx="50" cy="50" r="50" fill="#1CE783" />
      <G fill="#1A1A1A">
        <Path d="M18 35v30h8V50c0-3 2-5 5-5s5 2 5 5v15h8V48c0-8-5-13-13-13-3 0-6 1-8 3v-3h-5z" />
        <Path d="M48 45v20h8V50c0-3 2-5 5-5s5 2 5 5v15h8V48c0-8-5-13-13-13-3 0-6 1-8 3v-3h-5z" />
      </G>
    </Svg>
  );
}

// Paramount+ - Blue circle with mountain peak
function ParamountIcon() {
  return (
    <Svg width={SIZE} height={SIZE} viewBox="0 0 100 100">
      <Circle cx="50" cy="50" r="50" fill="#0064FF" />
      <Path
        d="M50 18L20 75h60L50 18zm0 12l20 38H30l20-38z"
        fill="#FFFFFF"
      />
      <Circle cx="50" cy="38" r="5" fill="#0064FF" />
    </Svg>
  );
}

// Peacock - Black circle with colorful peacock feathers
function PeacockIcon() {
  return (
    <Svg width={SIZE} height={SIZE} viewBox="0 0 100 100">
      <Circle cx="50" cy="50" r="50" fill="#000000" />
      <G>
        <Path d="M50 25c-3 0-5 15-5 25s2 25 5 25 5-15 5-25-2-25-5-25z" fill="#FFD700" />
        <Path d="M35 30c-2 2-2 18 3 27s12 20 14 18 0-18-5-27-10-20-12-18z" fill="#00CED1" />
        <Path d="M65 30c2 2 2 18-3 27s-12 20-14 18 0-18 5-27 10-20 12-18z" fill="#FF6B6B" />
        <Path d="M25 40c-2 3 2 16 10 22s18 12 19 9-5-15-13-21-14-13-16-10z" fill="#9B59B6" />
        <Path d="M75 40c2 3-2 16-10 22s-18 12-19 9 5-15 13-21 14-13 16-10z" fill="#3498DB" />
      </G>
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
    gap: 12,
  },
});
