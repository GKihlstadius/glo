import { Country, StreamingProvider, Mood } from './types';

// Near-black, cinematic
export const COLORS = {
  bg: '#0A0A0A',
  bgCard: '#141414',
  text: '#FFFFFF',
  textMuted: '#666666',
  accent: '#FFFFFF',
};

// Streaming providers with branding
export const STREAMING_PROVIDERS: StreamingProvider[] = [
  { id: 'netflix', name: 'Netflix', primaryColor: '#E50914' },
  { id: 'prime', name: 'Prime Video', primaryColor: '#00A8E1' },
  { id: 'disney', name: 'Disney+', primaryColor: '#113CCF' },
  { id: 'hbo', name: 'Max', primaryColor: '#002BE7' },
  { id: 'apple', name: 'Apple TV+', primaryColor: '#000000' },
  { id: 'viaplay', name: 'Viaplay', primaryColor: '#FF0000' },
  { id: 'svtplay', name: 'SVT Play', primaryColor: '#1B5E20' },
  { id: 'hulu', name: 'Hulu', primaryColor: '#1CE783' },
  { id: 'paramount', name: 'Paramount+', primaryColor: '#0064FF' },
  { id: 'peacock', name: 'Peacock', primaryColor: '#000000' },
  { id: 'mubi', name: 'MUBI', primaryColor: '#000000' },
  { id: 'criterion', name: 'Criterion', primaryColor: '#000000' },
];

// Countries with language
export const COUNTRIES: Country[] = [
  { code: 'SE', name: 'Sverige', flag: '🇸🇪', language: 'sv' },
  { code: 'US', name: 'United States', flag: '🇺🇸', language: 'en' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', language: 'en' },
  { code: 'DE', name: 'Deutschland', flag: '🇩🇪', language: 'en' },
  { code: 'FR', name: 'France', flag: '🇫🇷', language: 'en' },
  { code: 'NO', name: 'Norge', flag: '🇳🇴', language: 'en' },
  { code: 'DK', name: 'Danmark', flag: '🇩🇰', language: 'en' },
  { code: 'FI', name: 'Suomi', flag: '🇫🇮', language: 'en' },
  { code: 'NL', name: 'Nederland', flag: '🇳🇱', language: 'en' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', language: 'en' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', language: 'en' },
];

// Moods
export const MOODS: Record<Mood, { icon: string; label: { en: string; sv: string } }> = {
  calm: { icon: '🌙', label: { en: 'Calm', sv: 'Lugn' } },
  fun: { icon: '😊', label: { en: 'Fun', sv: 'Kul' } },
  intense: { icon: '⚡', label: { en: 'Intense', sv: 'Intensiv' } },
  short: { icon: '⏱', label: { en: 'Short', sv: 'Kort' } },
};

// Swipe physics
export const SWIPE = {
  velocityThreshold: 500,
  translateThreshold: 120,
  rotation: 12,
};

// TMDB Image CDN
export const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

// Image quality helpers
export function getPosterUrl(path: string | null, size: 'w185' | 'w342' | 'w500' | 'w780' = 'w500'): string | null {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

export function getBackdropUrl(path: string | null, size: 'w300' | 'w780' | 'w1280' = 'w780'): string | null {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

// Get provider by ID
export function getProvider(id: string): StreamingProvider | undefined {
  return STREAMING_PROVIDERS.find((p) => p.id === id);
}
