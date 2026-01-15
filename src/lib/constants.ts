import { Country, StreamingService, Mood } from './types';

// Near-black, cinematic
export const COLORS = {
  bg: '#0A0A0A',
  bgCard: '#141414',
  text: '#FFFFFF',
  textMuted: '#666666',
  accent: '#FFFFFF',
};

// Streaming services - just id and name, no decoration
export const STREAMING_SERVICES: StreamingService[] = [
  { id: 'netflix', name: 'Netflix' },
  { id: 'prime', name: 'Prime' },
  { id: 'disney', name: 'Disney+' },
  { id: 'hbo', name: 'Max' },
  { id: 'apple', name: 'Apple TV+' },
  { id: 'viaplay', name: 'Viaplay' },
  { id: 'svtplay', name: 'SVT Play' },
  { id: 'hulu', name: 'Hulu' },
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

// Moods - icon only, one word
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
