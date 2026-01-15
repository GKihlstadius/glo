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

export interface MovieAvailability {
  serviceId: string;
  type: 'stream' | 'rent' | 'buy';
}

export interface Movie {
  id: string;
  title: string;
  year: number;
  runtime: number;
  posterUrl: string;
  availability: MovieAvailability[];
}

export interface Session {
  id: string;
  code: string;
  participants: string[];
  swipes: Record<string, Record<string, 'like' | 'pass'>>;
  status: 'waiting' | 'active' | 'matched';
  matchedMovieId?: string;
  mood?: Mood;
}

export type Mood = 'calm' | 'fun' | 'intense' | 'short';
