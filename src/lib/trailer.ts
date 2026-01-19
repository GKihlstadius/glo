// Glo - Trailer System
// YouTube trailer fetching with strict quality controls
// Trailers are enhancements, never blockers

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Movie } from './types';

// Trailer metadata
export interface TrailerInfo {
  videoId: string;
  title: string;
  channelName: string;
  duration: number; // seconds
  sourcePriority: 'official' | 'distributor' | 'trusted';
  language: string;
  cachedAt: number;
  region: string;
}

// Cache key format: trailer_{movieId}_{region}_{language}
const CACHE_PREFIX = 'trailer_';
const CACHE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Known official studio channels (verified)
const OFFICIAL_CHANNELS = new Set([
  'Warner Bros. Pictures',
  'Universal Pictures',
  'Sony Pictures Entertainment',
  'Paramount Pictures',
  'Walt Disney Studios',
  'Marvel Entertainment',
  'DC',
  '20th Century Studios',
  'Lionsgate Movies',
  'A24',
  'Focus Features',
  'Searchlight Pictures',
  'Netflix',
  'Prime Video',
  'Apple TV',
  'HBO',
  'Max',
  'Hulu',
  'Peacock',
  'MGM',
  'DreamWorks Animation',
  'Pixar',
  'Studio Ghibli',
  'NEON',
  'IFC Films',
]);

// Known trusted trailer channels (last resort)
const TRUSTED_CHANNELS = new Set([
  'Movieclips',
  'Rotten Tomatoes Trailers',
  'IGN',
  'FilmSelect Trailer',
  'KinoCheck',
  'ONE Media',
]);

// Blacklisted terms - reject if found in title
const BLACKLIST_TERMS = [
  'reaction',
  'breakdown',
  'explained',
  'review',
  'analysis',
  'fan edit',
  'fan made',
  'parody',
  'scene',
  'clip',
  'ending',
  'behind the scenes',
  'making of',
  'interview',
  'cast',
  'deleted',
  'alternate',
  'extended',
  'remix',
  'mashup',
];

// Validate trailer title
function isValidTrailerTitle(title: string, movieTitle: string, year: number): boolean {
  const lowerTitle = title.toLowerCase();

  // Check blacklist
  for (const term of BLACKLIST_TERMS) {
    if (lowerTitle.includes(term)) return false;
  }

  // Must contain movie title (fuzzy match)
  const movieWords = movieTitle.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const matchCount = movieWords.filter(word => lowerTitle.includes(word)).length;
  const matchRatio = matchCount / movieWords.length;

  if (matchRatio < 0.5) return false;

  // Should contain "trailer" or "teaser"
  if (!lowerTitle.includes('trailer') && !lowerTitle.includes('teaser')) return false;

  return true;
}

// Check channel priority
function getChannelPriority(channelName: string): 'official' | 'distributor' | 'trusted' | null {
  if (OFFICIAL_CHANNELS.has(channelName)) return 'official';

  // Check for studio keywords in channel name
  const lowerChannel = channelName.toLowerCase();
  if (
    lowerChannel.includes('pictures') ||
    lowerChannel.includes('studios') ||
    lowerChannel.includes('films') ||
    lowerChannel.includes('entertainment')
  ) {
    return 'distributor';
  }

  if (TRUSTED_CHANNELS.has(channelName)) return 'trusted';

  return null;
}

// Validate duration (60-180 seconds preferred)
function isValidDuration(duration: number): boolean {
  return duration >= 45 && duration <= 240; // Allow 45s-4min range
}

// Build YouTube search queries in priority order
export function buildTrailerQueries(movie: Movie): string[] {
  const { title, year } = movie;

  return [
    // Query Set A - Official/Studio (TOP PRIORITY)
    `${title} ${year} official trailer`,
    `${title} ${year} official teaser`,
    `${title} official trailer ${year}`,

    // Query Set B - Distributor/Platform
    `${title} trailer ${year}`,
    `${title} ${year} trailer HD`,
    `${title} movie trailer ${year}`,

    // Query Set C - Trusted channels (LAST RESORT)
    `${title} ${year} trailer`,
  ];
}

// YouTube embed URL for inline playback (no app/browser redirect)
export function getYouTubeEmbedUrl(videoId: string, options?: {
  autoplay?: boolean;
  mute?: boolean;
  start?: number;
  end?: number;
  loop?: boolean;
}): string {
  const params = new URLSearchParams({
    autoplay: options?.autoplay ? '1' : '0',
    mute: options?.mute ? '1' : '0',
    controls: '0',
    modestbranding: '1',
    rel: '0',
    showinfo: '0',
    playsinline: '1',
    enablejsapi: '1',
  });

  if (options?.start) params.set('start', String(options.start));
  if (options?.end) params.set('end', String(options.end));
  if (options?.loop) {
    params.set('loop', '1');
    params.set('playlist', videoId);
  }

  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
}

// YouTube thumbnail URL
export function getYouTubeThumbnail(videoId: string, quality: 'default' | 'medium' | 'high' | 'maxres' = 'high'): string {
  const qualityMap = {
    default: 'default',
    medium: 'mqdefault',
    high: 'hqdefault',
    maxres: 'maxresdefault',
  };
  return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}.jpg`;
}

// Cache management
export async function getCachedTrailer(
  movieId: string,
  region: string,
  language: string
): Promise<TrailerInfo | null> {
  try {
    const key = `${CACHE_PREFIX}${movieId}_${region}_${language}`;
    const cached = await AsyncStorage.getItem(key);

    if (!cached) return null;

    const trailer: TrailerInfo = JSON.parse(cached);

    // Check expiry
    if (Date.now() - trailer.cachedAt > CACHE_EXPIRY_MS) {
      await AsyncStorage.removeItem(key);
      return null;
    }

    return trailer;
  } catch {
    return null;
  }
}

export async function cacheTrailer(
  movieId: string,
  trailer: TrailerInfo
): Promise<void> {
  try {
    const key = `${CACHE_PREFIX}${movieId}_${trailer.region}_${trailer.language}`;
    await AsyncStorage.setItem(key, JSON.stringify(trailer));
  } catch {
    // Silent fail - caching is best-effort
  }
}

export async function invalidateTrailerCache(movieId: string): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const trailerKeys = keys.filter(k => k.startsWith(`${CACHE_PREFIX}${movieId}_`));
    await AsyncStorage.multiRemove(trailerKeys);
  } catch {
    // Silent fail
  }
}

// Mock trailer data for known movies (fallback when no API)
// In production, this would come from YouTube Data API v3
const KNOWN_TRAILERS: Record<string, TrailerInfo> = {
  // Top rated movies
  '1': { videoId: '6hB3S9bIaco', title: 'The Shawshank Redemption Official Trailer', channelName: 'Warner Bros.', duration: 142, sourcePriority: 'official', language: 'en', cachedAt: Date.now(), region: 'US' },
  '2': { videoId: 'UaVTIH8mujA', title: 'The Godfather Official Trailer', channelName: 'Paramount Pictures', duration: 168, sourcePriority: 'official', language: 'en', cachedAt: Date.now(), region: 'US' },
  '6': { videoId: 'EXeTwQWrcwY', title: 'The Dark Knight Official Trailer', channelName: 'Warner Bros.', duration: 150, sourcePriority: 'official', language: 'en', cachedAt: Date.now(), region: 'US' },
  '7': { videoId: 's7EdQ4FqbhY', title: 'Pulp Fiction Official Trailer', channelName: 'Miramax', duration: 152, sourcePriority: 'official', language: 'en', cachedAt: Date.now(), region: 'US' },
  '10': { videoId: 'YoHD9XEInc0', title: 'Inception Official Trailer', channelName: 'Warner Bros.', duration: 148, sourcePriority: 'official', language: 'en', cachedAt: Date.now(), region: 'US' },
  '11': { videoId: 'uYPbbksJxIg', title: 'Oppenheimer Official Trailer', channelName: 'Universal Pictures', duration: 180, sourcePriority: 'official', language: 'en', cachedAt: Date.now(), region: 'US' },
  '12': { videoId: 'pBk4NYhWNMM', title: 'Barbie Official Trailer', channelName: 'Warner Bros.', duration: 138, sourcePriority: 'official', language: 'en', cachedAt: Date.now(), region: 'US' },
  '13': { videoId: 'cqGjhVJWtEg', title: 'Spider-Man: Across the Spider-Verse Official Trailer', channelName: 'Sony Pictures', duration: 156, sourcePriority: 'official', language: 'en', cachedAt: Date.now(), region: 'US' },
  '26': { videoId: '8g18jFHCLXk', title: 'Dune Official Trailer', channelName: 'Warner Bros.', duration: 195, sourcePriority: 'official', language: 'en', cachedAt: Date.now(), region: 'US' },
  '27': { videoId: 'Way9Dexny3w', title: 'Dune: Part Two Official Trailer', channelName: 'Warner Bros.', duration: 180, sourcePriority: 'official', language: 'en', cachedAt: Date.now(), region: 'US' },
  '29': { videoId: 'zSWdZVtXT7E', title: 'Interstellar Official Trailer', channelName: 'Paramount Pictures', duration: 169, sourcePriority: 'official', language: 'en', cachedAt: Date.now(), region: 'US' },
  '36': { videoId: '5xH0HfJHsaY', title: 'Parasite Official Trailer', channelName: 'NEON', duration: 135, sourcePriority: 'official', language: 'en', cachedAt: Date.now(), region: 'US' },
  '51': { videoId: 'TcMBFSGVi1c', title: 'Avengers: Endgame Official Trailer', channelName: 'Marvel Entertainment', duration: 181, sourcePriority: 'official', language: 'en', cachedAt: Date.now(), region: 'US' },
  '53': { videoId: 'giXco2jaZ_4', title: 'Top Gun: Maverick Official Trailer', channelName: 'Paramount Pictures', duration: 138, sourcePriority: 'official', language: 'en', cachedAt: Date.now(), region: 'US' },
  '55': { videoId: 'zAGVQLHvwOY', title: 'Joker Official Trailer', channelName: 'Warner Bros.', duration: 142, sourcePriority: 'official', language: 'en', cachedAt: Date.now(), region: 'US' },
  // Animation
  '21': { videoId: 'ByXuk9QqQkk', title: 'Spirited Away Official Trailer', channelName: 'Studio Ghibli', duration: 120, sourcePriority: 'official', language: 'en', cachedAt: Date.now(), region: 'US' },
  '37': { videoId: 'xU47nhruN-Q', title: 'Your Name Official Trailer', channelName: 'Funimation', duration: 106, sourcePriority: 'distributor', language: 'en', cachedAt: Date.now(), region: 'US' },
  '52': { videoId: 'g4Hbz2jLxvQ', title: 'Spider-Man: Into the Spider-Verse Official Trailer', channelName: 'Sony Pictures', duration: 150, sourcePriority: 'official', language: 'en', cachedAt: Date.now(), region: 'US' },
};

// Get trailer for movie (with caching)
export async function getTrailer(
  movie: Movie,
  region: string = 'US',
  language: string = 'en'
): Promise<TrailerInfo | null> {
  // Check cache first
  const cached = await getCachedTrailer(movie.id, region, language);
  if (cached) return cached;

  // Check known trailers
  const known = KNOWN_TRAILERS[movie.id];
  if (known) {
    // Update cache
    await cacheTrailer(movie.id, { ...known, region, language, cachedAt: Date.now() });
    return { ...known, region, language };
  }

  // In production: call YouTube Data API v3 with buildTrailerQueries()
  // For now, return null (poster-only experience is acceptable)
  return null;
}

// Prefetch trailers for upcoming movies
export async function prefetchTrailers(
  movies: Movie[],
  region: string = 'US',
  language: string = 'en'
): Promise<void> {
  // Batch prefetch - run in parallel but don't block
  const promises = movies.slice(0, 5).map(movie =>
    getTrailer(movie, region, language).catch(() => null)
  );

  await Promise.allSettled(promises);
}

// Taste signal: track trailer engagement
export interface TrailerEngagement {
  movieId: string;
  videoId: string;
  holdDuration: number; // ms
  completed: boolean;
  repeatedViews: number;
  timestamp: number;
}

// Record trailer engagement for taste model
export function shouldRecordTrailerSignal(engagement: TrailerEngagement): boolean {
  // Only record if:
  // 1. User held for at least 2 seconds
  // 2. User didn't immediately swipe away
  return engagement.holdDuration >= 2000;
}

// Calculate trailer weight for taste model
export function getTrailerTasteWeight(engagement: TrailerEngagement): number {
  // Base weight: 0.05 (trailers refine, never override)
  let weight = 0.05;

  // Bonus for longer engagement
  if (engagement.holdDuration >= 5000) weight += 0.03;
  if (engagement.holdDuration >= 10000) weight += 0.02;

  // Bonus for repeat views
  weight += Math.min(0.05, engagement.repeatedViews * 0.02);

  // Cap at 0.15 (explicit actions > trailer signals)
  return Math.min(0.15, weight);
}
