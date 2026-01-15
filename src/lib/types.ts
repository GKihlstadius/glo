// Core types for Glo app

export interface Country {
  code: string;
  name: string;
  flag: string;
  currency: string;
  currencySymbol: string;
}

export interface StreamingService {
  id: string;
  name: string;
  logo: string;
  color: string;
}

export interface MovieAvailability {
  service: StreamingService;
  type: 'stream' | 'rent' | 'buy';
  price?: number;
  currency?: string;
  url?: string;
}

export interface Movie {
  id: string;
  title: string;
  year: number;
  runtime: number; // in minutes
  posterUrl: string;
  backdropUrl?: string;
  genres: string[];
  rating: number; // 0-10
  overview: string;
  director?: string;
  cast?: string[];
  availability: MovieAvailability[];
}

export interface SwipeAction {
  movieId: string;
  action: 'like' | 'pass' | 'save';
  timestamp: number;
}

export interface Session {
  id: string;
  code: string;
  hostId: string;
  participants: string[];
  movieQueue: string[];
  swipes: Record<string, SwipeAction[]>; // participantId -> swipes
  matches: string[]; // movie IDs that everyone liked
  mode: 'quick' | 'game';
  moodCard?: MoodCard;
  createdAt: number;
  status: 'waiting' | 'active' | 'completed';
}

export type MoodCard = 'calm' | 'fun' | 'deep' | 'unexpected' | 'short';

export interface UserPreferences {
  country: Country | null;
  hasCompletedOnboarding: boolean;
  savedMovies: string[];
  likedMovies: string[];
  passedMovies: string[];
  connectionPoints: number;
  sessionHistory: string[];
  preferredGenres: string[];
  prefersDarkMode: boolean;
  hapticEnabled: boolean;
  hasPurchased: boolean;
}

export interface DareCard {
  id: string;
  text: string;
  duration?: number; // in minutes
}
