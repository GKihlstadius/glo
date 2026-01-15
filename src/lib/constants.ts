import { Country, StreamingService, MoodCard, DareCard } from './types';

// Glo brand colors
export const COLORS = {
  // Primary - warm amber/gold tones
  primary: '#F59E0B',
  primaryLight: '#FCD34D',
  primaryDark: '#D97706',

  // Background - deep, rich darks
  background: '#0F0F0F',
  backgroundLight: '#1A1A1A',
  backgroundCard: '#1F1F1F',

  // Accent - soft coral for likes
  like: '#F87171',
  likeBg: 'rgba(248, 113, 113, 0.15)',

  // Pass - muted slate
  pass: '#64748B',
  passBg: 'rgba(100, 116, 139, 0.15)',

  // Save - teal
  save: '#2DD4BF',
  saveBg: 'rgba(45, 212, 191, 0.15)',

  // Match celebration
  match: '#F59E0B',
  matchGlow: 'rgba(245, 158, 11, 0.3)',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#A1A1AA',
  textMuted: '#71717A',

  // Availability
  available: '#22C55E',
  unavailable: '#EF4444',
  rent: '#3B82F6',
  buy: '#8B5CF6',
};

export const SUPPORTED_COUNTRIES: Country[] = [
  { code: 'SE', name: 'Sweden', flag: '🇸🇪', currency: 'SEK', currencySymbol: 'kr' },
  { code: 'US', name: 'United States', flag: '🇺🇸', currency: 'USD', currencySymbol: '$' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', currency: 'GBP', currencySymbol: '£' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', currency: 'EUR', currencySymbol: '€' },
  { code: 'FR', name: 'France', flag: '🇫🇷', currency: 'EUR', currencySymbol: '€' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸', currency: 'EUR', currencySymbol: '€' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹', currency: 'EUR', currencySymbol: '€' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱', currency: 'EUR', currencySymbol: '€' },
  { code: 'NO', name: 'Norway', flag: '🇳🇴', currency: 'NOK', currencySymbol: 'kr' },
  { code: 'DK', name: 'Denmark', flag: '🇩🇰', currency: 'DKK', currencySymbol: 'kr' },
  { code: 'FI', name: 'Finland', flag: '🇫🇮', currency: 'EUR', currencySymbol: '€' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', currency: 'AUD', currencySymbol: '$' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', currency: 'CAD', currencySymbol: '$' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵', currency: 'JPY', currencySymbol: '¥' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷', currency: 'BRL', currencySymbol: 'R$' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽', currency: 'MXN', currencySymbol: '$' },
  { code: 'IN', name: 'India', flag: '🇮🇳', currency: 'INR', currencySymbol: '₹' },
];

export const STREAMING_SERVICES: StreamingService[] = [
  { id: 'netflix', name: 'Netflix', logo: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=100', color: '#E50914' },
  { id: 'prime', name: 'Prime Video', logo: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=100', color: '#00A8E1' },
  { id: 'disney', name: 'Disney+', logo: 'https://images.unsplash.com/photo-1640499900704-b00dd6a1103a?w=100', color: '#113CCF' },
  { id: 'hbo', name: 'HBO Max', logo: 'https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=100', color: '#B318F0' },
  { id: 'apple', name: 'Apple TV+', logo: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=100', color: '#000000' },
  { id: 'hulu', name: 'Hulu', logo: 'https://images.unsplash.com/photo-1611162618071-b39a2ec055fb?w=100', color: '#1CE783' },
  { id: 'paramount', name: 'Paramount+', logo: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=100', color: '#0064FF' },
  { id: 'peacock', name: 'Peacock', logo: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=100', color: '#000000' },
];

export const MOOD_CARDS: Record<MoodCard, { emoji: string; label: string; description: string }> = {
  calm: { emoji: '🌙', label: 'Calm', description: 'Something peaceful and relaxing' },
  fun: { emoji: '🎉', label: 'Fun', description: 'Light-hearted and entertaining' },
  deep: { emoji: '🎭', label: 'Deep', description: 'Thought-provoking and meaningful' },
  unexpected: { emoji: '✨', label: 'Unexpected', description: 'Something you wouldn\'t normally pick' },
  short: { emoji: '⚡', label: 'Short & Easy', description: 'Under 100 minutes' },
};

export const DARE_CARDS: DareCard[] = [
  { id: '1', text: 'Watch the first 15 minutes together?', duration: 15 },
  { id: '2', text: 'Give it 20 minutes before deciding?', duration: 20 },
  { id: '3', text: 'Watch until the first plot twist?', duration: undefined },
  { id: '4', text: 'One episode to test it out?', duration: undefined },
];

export const GENRES = [
  'Action', 'Adventure', 'Animation', 'Comedy', 'Crime',
  'Documentary', 'Drama', 'Family', 'Fantasy', 'History',
  'Horror', 'Music', 'Mystery', 'Romance', 'Science Fiction',
  'Thriller', 'War', 'Western'
];

export const PRICE = {
  amount: 39,
  currency: 'SEK',
  display: '39 kr',
};

// Swipe physics
export const SWIPE_CONFIG = {
  velocityThreshold: 500,
  translateThreshold: 100,
  rotationRange: 15, // degrees
  swipeOutDuration: 300,
  snapBackDuration: 400,
};
