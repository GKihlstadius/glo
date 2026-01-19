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

// Trailer data for all movies
// Real YouTube video IDs for official trailers
const KNOWN_TRAILERS: Record<string, TrailerInfo> = {
  // TOP RATED (1-5)
  '1': { videoId: '6hB3S9bIaco', title: 'The Shawshank Redemption Official Trailer', channelName: 'Warner Bros.', duration: 142, sourcePriority: 'official', language: 'en', cachedAt: Date.now(), region: 'US' },
  '2': { videoId: 'UaVTIH8mujA', title: 'The Godfather Official Trailer', channelName: 'Paramount Pictures', duration: 168, sourcePriority: 'official', language: 'en', cachedAt: Date.now(), region: 'US' },
  '3': { videoId: 'qJr92K_hKl0', title: 'The Godfather Part II Official Trailer', channelName: 'Paramount Pictures', duration: 147, sourcePriority: 'official', language: 'en', cachedAt: Date.now(), region: 'US' },
  '4': { videoId: 'gG22XNhtnoY', title: "Schindler's List Official Trailer", channelName: 'Universal Pictures', duration: 135, sourcePriority: 'official', language: 'en', cachedAt: Date.now(), region: 'US' },
  '5': { videoId: '_13J_9B5jEk', title: '12 Angry Men Official Trailer', channelName: 'Criterion', duration: 108, sourcePriority: 'official', language: 'en', cachedAt: Date.now(), region: 'US' },

  // POPULAR (6-10)
  '6': { videoId: 'EXeTwQWrcwY', title: 'The Dark Knight Official Trailer', channelName: 'Warner Bros.', duration: 150, sourcePriority: 'official', language: 'en', cachedAt: Date.now(), region: 'US' },
  '7': { videoId: 's7EdQ4FqbhY', title: 'Pulp Fiction Official Trailer', channelName: 'Miramax', duration: 152, sourcePriority: 'official', language: 'en', cachedAt: Date.now(), region: 'US' },
  '8': { videoId: 'qtRKdVHc-cE', title: 'Fight Club Official Trailer', channelName: '20th Century Studios', duration: 135, sourcePriority: 'official', language: 'en', cachedAt: Date.now(), region: 'US' },
  '9': { videoId: 'bLvqoHBptjg', title: 'Forrest Gump Official Trailer', channelName: 'Paramount Pictures', duration: 147, sourcePriority: 'official', language: 'en', cachedAt: Date.now(), region: 'US' },
  '10': { videoId: 'YoHD9XEInc0', title: 'Inception Official Trailer', channelName: 'Warner Bros.', duration: 148, sourcePriority: 'official', language: 'en', cachedAt: Date.now(), region: 'US' },

  // TRENDING (11-15)
  '11': { videoId: 'uYPbbksJxIg', title: 'Oppenheimer Official Trailer', channelName: 'Universal Pictures', duration: 180, sourcePriority: 'official', language: 'en', cachedAt: Date.now(), region: 'US' },
  '12': { videoId: 'pBk4NYhWNMM', title: 'Barbie Official Trailer', channelName: 'Warner Bros.', duration: 138, sourcePriority: 'official', language: 'en', cachedAt: Date.now(), region: 'US' },
  '13': { videoId: 'cqGjhVJWtEg', title: 'Spider-Man: Across the Spider-Verse Official Trailer', channelName: 'Sony Pictures', duration: 156, sourcePriority: 'official', language: 'en', cachedAt: Date.now(), region: 'US' },
  '14': { videoId: 'hXzcyx9V0xw', title: 'Elemental Official Trailer', channelName: 'Pixar', duration: 125, sourcePriority: 'official', language: 'en', cachedAt: Date.now(), region: 'US' },
  '15': { videoId: 'TnGl01FkMMo', title: 'The Super Mario Bros. Movie Official Trailer', channelName: 'Universal Pictures', duration: 138, sourcePriority: 'official', language: 'en', cachedAt: Date.now(), region: 'US' },

  // HIDDEN GEMS (16-20)
  '16': { videoId: 'Ki4haFrqSrw', title: 'The Green Mile Official Trailer', channelName: 'Warner Bros.', duration: 145, sourcePriority: 'official', language: 'en', cachedAt: Date.now(), region: 'US' },
  '17': { videoId: 'WCN5JJY_wiA', title: 'The Good, the Bad and the Ugly Official Trailer', channelName: 'MGM', duration: 165, sourcePriority: 'official', language: 'en', cachedAt: Date.now(), region: 'US' },
  '18': { videoId: '-aJxoUdtMPw', title: 'Life Is Beautiful Official Trailer', channelName: 'Miramax', duration: 130, sourcePriority: 'official', language: 'en', cachedAt: Date.now(), region: 'US' },
  '19': { videoId: 'P-PrhKgwbHU', title: 'Once Upon a Time in America Official Trailer', channelName: 'Warner Bros.', duration: 165, sourcePriority: 'official', language: 'en', cachedAt: Date.now(), region: 'US' },
  '20': { videoId: 'OXrcDonY-B8', title: "One Flew Over the Cuckoo's Nest Official Trailer", channelName: 'Warner Bros.', duration: 140, sourcePriority: 'official', language: 'en', cachedAt: Date.now(), region: 'US' },

  // MODERN CLASSICS (21-25)
  '21': { videoId: 'ByXuk9QqQkk', title: 'Spirited Away Official Trailer', channelName: 'Studio Ghibli', duration: 120, sourcePriority: 'official', language: 'en', cachedAt: Date.now(), region: 'US' },
  '22': { videoId: 'V75dMMIW2B4', title: 'The Lord of the Rings: The Fellowship of the Ring Official Trailer', channelName: 'Warner Bros.', duration: 150, sourcePriority: 'official', language: 'en', cachedAt: Date.now(), region: 'US' },
  '23': { videoId: 'r5X-hFf6Bwo', title: 'The Lord of the Rings: The Return of the King Official Trailer', channelName: 'Warner Bros.', duration: 155, sourcePriority: 'official', language: 'en', cachedAt: Date.now(), region: 'US' },
  '24': { videoId: 'vKQi3bBA1y8', title: 'The Matrix Official Trailer', channelName: 'Warner Bros.', duration: 150, sourcePriority: 'official', language: 'en', cachedAt: Date.now(), region: 'US' },
  '25': { videoId: 'znmZoVkCjpI', title: 'Se7en Official Trailer', channelName: 'Warner Bros.', duration: 135, sourcePriority: 'official', language: 'en', cachedAt: Date.now(), region: 'US' },

  // RECENT QUALITY (26-30)
  '26': { videoId: '8g18jFHCLXk', title: 'Dune Official Trailer', channelName: 'Warner Bros.', duration: 195, sourcePriority: 'official', language: 'en', cachedAt: Date.now(), region: 'US' },
  '27': { videoId: 'Way9Dexny3w', title: 'Dune: Part Two Official Trailer', channelName: 'Warner Bros.', duration: 180, sourcePriority: 'official', language: 'en', cachedAt: Date.now(), region: 'US' },
  '28': { videoId: 'VyHV0BRtdxo', title: "Harry Potter and the Philosopher's Stone Official Trailer", channelName: 'Warner Bros.', duration: 145, sourcePriority: 'official', language: 'en', cachedAt: Date.now(), region: 'US' },
  '29': { videoId: 'zSWdZVtXT7E', title: 'Interstellar Official Trailer', channelName: 'Paramount Pictures', duration: 169, sourcePriority: 'official', language: 'en', cachedAt: Date.now(), region: 'US' },
  '30': { videoId: '7d_jQycdQGo', title: 'Whiplash Official Trailer', channelName: 'Sony Pictures Classics', duration: 140, sourcePriority: 'official', language: 'en', cachedAt: Date.now(), region: 'US' },

  // MORE CROWD PLEASERS (31-35)
  '31': { videoId: 'owK1qxDselE', title: 'Gladiator Official Trailer', channelName: 'Universal Pictures', duration: 150, sourcePriority: 'official', language: 'en', cachedAt: Date.now(), region: 'US' },
  '32': { videoId: 'vZ734NWnAHA', title: 'Star Wars Official Trailer', channelName: 'Lucasfilm', duration: 120, sourcePriority: 'official', language: 'en', cachedAt: Date.now(), region: 'US' },
  '33': { videoId: 'JNwNXF9Y6kY', title: 'The Empire Strikes Back Official Trailer', channelName: 'Lucasfilm', duration: 125, sourcePriority: 'official', language: 'en', cachedAt: Date.now(), region: 'US' },
  '34': { videoId: 'mP0VHJYFOAU', title: 'Bohemian Rhapsody Official Trailer', channelName: '20th Century Studios', duration: 145, sourcePriority: 'official', language: 'en', cachedAt: Date.now(), region: 'US' },
  '35': { videoId: '6ZfuNTqbHE8', title: 'Avengers: Infinity War Official Trailer', channelName: 'Marvel Entertainment', duration: 150, sourcePriority: 'official', language: 'en', cachedAt: Date.now(), region: 'US' },

  // INTERNATIONAL CINEMA (36-40)
  '36': { videoId: '5xH0HfJHsaY', title: 'Parasite Official Trailer', channelName: 'NEON', duration: 135, sourcePriority: 'official', language: 'en', cachedAt: Date.now(), region: 'US' },
  '37': { videoId: 'xU47nhruN-Q', title: 'Your Name Official Trailer', channelName: 'Funimation', duration: 106, sourcePriority: 'distributor', language: 'en', cachedAt: Date.now(), region: 'US' },
  '38': { videoId: '4vPeTSRd580', title: 'Grave of the Fireflies Official Trailer', channelName: 'Studio Ghibli', duration: 100, sourcePriority: 'official', language: 'en', cachedAt: Date.now(), region: 'US' },
  '39': { videoId: '4OiMOHRDs14', title: 'Princess Mononoke Official Trailer', channelName: 'Studio Ghibli', duration: 130, sourcePriority: 'official', language: 'en', cachedAt: Date.now(), region: 'US' },
  '40': { videoId: 'iwROgK94zcM', title: "Howl's Moving Castle Official Trailer", channelName: 'Studio Ghibli', duration: 115, sourcePriority: 'official', language: 'en', cachedAt: Date.now(), region: 'US' },

  // THRILLER/SUSPENSE (41-45)
  '41': { videoId: 'VG9AGf66tXM', title: 'The Sixth Sense Official Trailer', channelName: 'Hollywood Pictures', duration: 140, sourcePriority: 'official', language: 'en', cachedAt: Date.now(), region: 'US' },
  '42': { videoId: 'eogpIG53Cis', title: 'Blade Runner Official Trailer', channelName: 'Warner Bros.', duration: 130, sourcePriority: 'official', language: 'en', cachedAt: Date.now(), region: 'US' },
  '43': { videoId: 'gCcx85zbxz4', title: 'Blade Runner 2049 Official Trailer', channelName: 'Warner Bros.', duration: 155, sourcePriority: 'official', language: 'en', cachedAt: Date.now(), region: 'US' },
  '44': { videoId: 'CRRlbK5w8AE', title: 'Terminator 2: Judgment Day Official Trailer', channelName: 'Lionsgate', duration: 145, sourcePriority: 'official', language: 'en', cachedAt: Date.now(), region: 'US' },
  '45': { videoId: 'ayTnvVpj9t4', title: 'Hot Fuzz Official Trailer', channelName: 'Universal Pictures', duration: 140, sourcePriority: 'official', language: 'en', cachedAt: Date.now(), region: 'US' },

  // FEEL-GOOD / COMEDY (46-50)
  '46': { videoId: 'm4NCribDx4U', title: 'Kingsman: The Secret Service Official Trailer', channelName: '20th Century Studios', duration: 145, sourcePriority: 'official', language: 'en', cachedAt: Date.now(), region: 'US' },
  '47': { videoId: '0pdqf4P9MB8', title: 'La La Land Official Trailer', channelName: 'Lionsgate', duration: 150, sourcePriority: 'official', language: 'en', cachedAt: Date.now(), region: 'US' },
  '48': { videoId: 'ue80QwXMRHg', title: 'Thor: Ragnarok Official Trailer', channelName: 'Marvel Entertainment', duration: 140, sourcePriority: 'official', language: 'en', cachedAt: Date.now(), region: 'US' },
  '49': { videoId: 'JcpWXaA2qeg', title: 'Toy Story 3 Official Trailer', channelName: 'Pixar', duration: 135, sourcePriority: 'official', language: 'en', cachedAt: Date.now(), region: 'US' },
  '50': { videoId: 'yRUAzGQ3nSY', title: 'Inside Out Official Trailer', channelName: 'Pixar', duration: 140, sourcePriority: 'official', language: 'en', cachedAt: Date.now(), region: 'US' },

  // MORE RECENT QUALITY (51-55)
  '51': { videoId: 'TcMBFSGVi1c', title: 'Avengers: Endgame Official Trailer', channelName: 'Marvel Entertainment', duration: 181, sourcePriority: 'official', language: 'en', cachedAt: Date.now(), region: 'US' },
  '52': { videoId: 'g4Hbz2jLxvQ', title: 'Spider-Man: Into the Spider-Verse Official Trailer', channelName: 'Sony Pictures', duration: 150, sourcePriority: 'official', language: 'en', cachedAt: Date.now(), region: 'US' },
  '53': { videoId: 'giXco2jaZ_4', title: 'Top Gun: Maverick Official Trailer', channelName: 'Paramount Pictures', duration: 138, sourcePriority: 'official', language: 'en', cachedAt: Date.now(), region: 'US' },
  '54': { videoId: 'xOsLIiBStEs', title: 'Soul Official Trailer', channelName: 'Pixar', duration: 140, sourcePriority: 'official', language: 'en', cachedAt: Date.now(), region: 'US' },
  '55': { videoId: 'zAGVQLHvwOY', title: 'Joker Official Trailer', channelName: 'Warner Bros.', duration: 142, sourcePriority: 'official', language: 'en', cachedAt: Date.now(), region: 'US' },

  // CLASSIC ESSENTIALS (56-60)
  '56': { videoId: '2ilzidi52Ag', title: 'GoodFellas Official Trailer', channelName: 'Warner Bros.', duration: 150, sourcePriority: 'official', language: 'en', cachedAt: Date.now(), region: 'US' },
  '57': { videoId: 'SPRzm8ibDQ8', title: 'A Clockwork Orange Official Trailer', channelName: 'Warner Bros.', duration: 140, sourcePriority: 'official', language: 'en', cachedAt: Date.now(), region: 'US' },
  '58': { videoId: '5Cb3ik6zP2I', title: 'The Shining Official Trailer', channelName: 'Warner Bros.', duration: 145, sourcePriority: 'official', language: 'en', cachedAt: Date.now(), region: 'US' },
  '59': { videoId: 'zwhP5b4tD6g', title: 'Saving Private Ryan Official Trailer', channelName: 'Paramount Pictures', duration: 155, sourcePriority: 'official', language: 'en', cachedAt: Date.now(), region: 'US' },
  '60': { videoId: 'lc0UehYemQA', title: 'Jurassic Park Official Trailer', channelName: 'Universal Pictures', duration: 140, sourcePriority: 'official', language: 'en', cachedAt: Date.now(), region: 'US' },
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
