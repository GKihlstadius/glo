// Glo - Pick together
// A quiet tool for choosing movies together

export interface Country {
  code: string;
  name: string;
  flag: string;
  language: 'sv' | 'en';
}

export interface StreamingService {
  id: string;
  name: string;
}

// Enhanced availability with deep links
export interface StreamingOffer {
  serviceId: string;
  type: 'stream' | 'rent' | 'buy';
  deepLink?: string; // Universal link (preferred)
  webUrl?: string; // Web fallback
}

export interface MovieAvailability {
  serviceId: string;
  type: 'stream' | 'rent' | 'buy';
}

// Extended movie with metadata for feed algorithm
export interface Movie {
  id: string;
  title: string;
  year: number;
  runtime: number;
  posterUrl: string;
  availability: MovieAvailability[];
  // Feed algorithm metadata
  genres?: string[];
  mood?: ('calm' | 'fun' | 'intense')[];
  era?: 'classic' | 'modern' | 'recent';
  popularity?: number; // 0-100
}

// Taste profile for feed personalization
export interface TasteProfile {
  // Genre affinities (-1 to 1, decays over time)
  genres: Record<string, number>;
  // Runtime preference (average of liked)
  preferredRuntime: number;
  // Era preference
  eraWeights: Record<string, number>;
  // Mood affinities
  moodWeights: Record<string, number>;
  // Interaction counts for confidence
  likeCount: number;
  passCount: number;
  saveCount: number;
  // Pass streak for explore trigger
  consecutivePasses: number;
  // Last update timestamp
  lastUpdated: number;
}

// Room/Session with secure tokens
export interface Session {
  id: string;
  code: string;
  participants: string[];
  swipes: Record<string, Record<string, 'like' | 'pass'>>;
  status: 'waiting' | 'active' | 'matched';
  matchedMovieId?: string;
  mood?: Mood;
  // Room metadata
  regionCode: string;
  mode: 'couch' | 'spellage';
  createdAt: number;
  expiresAt: number;
}

// Room invite token (for URL sharing)
export interface RoomInvite {
  roomId: string;
  token: string;
  expiresAt: number;
}

export type Mood = 'calm' | 'fun' | 'intense' | 'short';

// Feed engine types
export type FeedBucket = 'exploit' | 'explore' | 'wildcard';

export interface FeedItem {
  movie: Movie;
  bucket: FeedBucket;
  score: number;
  reason?: string; // Debug info
}

export interface FeedState {
  queue: FeedItem[];
  historyWindow: Set<string>; // Recently shown IDs
  fallbackLevel: number; // 0 = normal, higher = more desperate
}
