// Glo - Premium Movie Discovery
// Production-ready type definitions

export interface Country {
  code: string;
  name: string;
  flag: string;
  language: 'sv' | 'en';
}

// Streaming provider with real branding
export interface StreamingProvider {
  id: string;
  name: string;
  primaryColor: string;
}

// Streaming offer with deep linking
export interface StreamingOffer {
  providerId: string;
  type: 'stream' | 'rent' | 'buy';
  price?: number;
  currency?: string;
  deepLink?: string;
  webUrl?: string;
  quality?: 'sd' | 'hd' | '4k';
}

// Complete movie data contract (TMDB-style)
export interface Movie {
  id: string;
  tmdbId: number;
  imdbId?: string;

  // Core metadata
  title: string;
  originalTitle?: string;
  year: number;
  releaseDate: string;
  runtime: number;

  // Classification
  genres: string[];
  keywords?: string[];
  mood: ('calm' | 'fun' | 'intense')[];
  era: 'classic' | 'modern' | 'recent';

  // Ratings
  ratingAvg: number; // 0-10
  ratingCount: number;
  popularityScore: number;

  // Images - posterUrl for display, posterPath for TMDB path
  posterUrl: string;
  posterPath?: string | null;
  backdropUrl?: string | null;
  backdropPath?: string | null;

  // Credits (for diversity)
  directors: string[];
  cast: string[];

  // Overview
  overview?: string;
}

// Movie with regional availability
export interface MovieWithAvailability extends Movie {
  availability: StreamingOffer[];
}

// Taste profile for personalization
export interface TasteProfile {
  genres: Record<string, number>;
  directors: Record<string, number>;
  cast: Record<string, number>;
  preferredRuntime: number;
  runtimeVariance: number;
  eraWeights: Record<string, number>;
  moodWeights: Record<string, number>;
  likeCount: number;
  passCount: number;
  saveCount: number;
  consecutivePasses: number;
  recentGenres: string[];
  recentDirectors: string[];
  lastUpdated: number;
}

// Candidate bucket types
export type CandidateBucket =
  | 'trending'
  | 'top_rated'
  | 'popular'
  | 'new_noteworthy'
  | 'hidden_gems'
  | 'personalized';

// Feed bucket types (for algorithm)
export type FeedBucket = 'exploit' | 'explore' | 'wildcard';

// Feed item with debug info
export interface FeedItem {
  movie: Movie;
  bucket: FeedBucket;
  score: number;
  reason: string;
  diversity?: {
    genreDistance: number;
    directorDistance: number;
    runtimeDistance: number;
  };
}

// Session for couch/spellage mode
export interface Session {
  id: string;
  code: string;
  participants: string[];
  swipes: Record<string, Record<string, 'like' | 'pass'>>;
  status: 'waiting' | 'active' | 'matched';
  matchedMovieId?: string;
  mood?: Mood;
  regionCode: string;
  mode: 'couch' | 'spellage';
  createdAt: number;
  expiresAt: number;
}

export type Mood = 'calm' | 'fun' | 'intense' | 'short';

// Room invite
export interface RoomInvite {
  roomId: string;
  code: string;
  token: string;
  joinUrl: string;
  expiresAt: number;
}

// Image sizes for CDN
export type ImageSize = 'w185' | 'w342' | 'w500' | 'w780' | 'original';
export type BackdropSize = 'w300' | 'w780' | 'w1280' | 'original';
