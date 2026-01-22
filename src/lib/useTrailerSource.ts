// ============================================================================
// USE TRAILER SOURCE — SOURCE-AGNOSTIC VIDEO LOADER (US-002)
// ============================================================================
// Unified video source interface that checks all source types (native, YouTube,
// Apple) and returns the best available one. Sources are cached per movie.
//
// Priority order:
// 1. Native (MP4/HLS) - fastest, smoothest experience
// 2. YouTube - most comprehensive coverage
// 3. Apple Movie Previews - high quality HLS streams
//
// Returns null if no source available (triggers poster fallback).
// ============================================================================

import { useQuery } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TrailerSource } from '../components/TrailerPlayer';
import { getNativeTrailerSource } from './native-trailer-source';
import { getYouTubeTrailerSource } from './youtube-trailer-source';
import { getAppleTrailerSource } from './apple-trailer-source';
import type { Movie } from './types';

// ============================================================================
// TYPES
// ============================================================================

// Re-export TrailerSource for convenience
export type { TrailerSource } from '../components/TrailerPlayer';

export interface CachedTrailerSource {
  source: TrailerSource | null;
  cachedAt: number;
  movieId: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const CACHE_PREFIX = 'trailer_source_';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// ============================================================================
// CACHE HELPERS
// ============================================================================

/**
 * Get cached trailer source for a movie
 */
async function getCachedSource(movieId: string): Promise<TrailerSource | null | undefined> {
  try {
    const key = `${CACHE_PREFIX}${movieId}`;
    const cached = await AsyncStorage.getItem(key);

    if (!cached) return undefined; // No cache = undefined (not found)

    const data: CachedTrailerSource = JSON.parse(cached);

    // Check if cache is expired
    if (Date.now() - data.cachedAt > CACHE_TTL_MS) {
      await AsyncStorage.removeItem(key);
      return undefined;
    }

    return data.source; // null = no source available (cached negative result)
  } catch {
    return undefined;
  }
}

/**
 * Cache a trailer source (including null for "no source available")
 */
async function setCachedSource(movieId: string, source: TrailerSource | null): Promise<void> {
  try {
    const key = `${CACHE_PREFIX}${movieId}`;
    const data: CachedTrailerSource = {
      source,
      cachedAt: Date.now(),
      movieId,
    };
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch {
    // Silent fail - caching is best-effort
  }
}

/**
 * Clear cached source for a movie
 */
export async function clearCachedSource(movieId: string): Promise<void> {
  try {
    const key = `${CACHE_PREFIX}${movieId}`;
    await AsyncStorage.removeItem(key);
  } catch {
    // Silent fail
  }
}

// ============================================================================
// SOURCE FETCHERS
// ============================================================================

/**
 * Get native video source (MP4/HLS) for a movie
 * Uses getNativeTrailerSource to check Apple Movie Trailers, TMDB, and CDN patterns
 *
 * Note: With only movieId, native sources are limited since Apple iTunes search
 * requires movie title and year. Returns null to fall through to YouTube/Apple sources.
 * For full native source support, use getNativeTrailerSource directly with Movie object.
 */
async function getNativeSource(movieId: string): Promise<TrailerSource | null> {
  // Create minimal movie for native source lookup
  // Note: This has empty title/year, so Apple iTunes search won't work
  // Full Movie object is needed for proper native source lookup
  const movie = createMinimalMovie(movieId);

  // Only try if we have a valid tmdbId (can check CDN patterns at least)
  if (movie.tmdbId === 0) {
    return null;
  }

  return getNativeTrailerSource(movie);
}

/**
 * Create a minimal Movie object for trailer lookup
 * Only the ID is used by getTrailer for KNOWN_TRAILERS lookup
 */
function createMinimalMovie(movieId: string): Movie {
  return {
    id: movieId,
    tmdbId: parseInt(movieId, 10) || 0,
    title: '',
    year: 0,
    releaseDate: '',
    runtime: 0,
    genres: [],
    mood: [],
    era: 'modern',
    ratingAvg: 0,
    ratingCount: 0,
    popularityScore: 0,
    posterUrl: '',
    directors: [],
    cast: [],
  };
}

/**
 * Get YouTube source for a movie
 * Uses the dedicated youtube-trailer-source module for:
 * - youtube-nocookie.com embeds (privacy-enhanced)
 * - Proper embed configuration (autoplay, mute, playsinline, controls)
 * - Embeddability validation
 */
async function getYouTubeSource(movieId: string): Promise<TrailerSource | null> {
  // Use the dedicated YouTube trailer source module
  // It handles: official channel priority, embed validation, nocookie URLs
  return getYouTubeTrailerSource(createMinimalMovie(movieId));
}

/**
 * Get Apple Movie Previews source for a movie
 * Uses getAppleTrailerSource to query iTunes API for HLS preview URLs
 */
async function getAppleSource(movieId: string): Promise<TrailerSource | null> {
  // Create minimal movie for Apple source lookup
  // Note: Apple search requires movie title and year for accurate matching
  // With only movieId, we have limited data for search
  const movie = createMinimalMovie(movieId);

  // Only try if we have valid tmdbId (though results will be limited without title/year)
  if (movie.tmdbId === 0) {
    return null;
  }

  return getAppleTrailerSource(movie);
}

// ============================================================================
// MAIN RESOLVER
// ============================================================================

/**
 * Resolve the best available trailer source for a movie
 * Checks sources in priority order: native > YouTube > Apple
 */
async function resolveTrailerSource(movieId: string): Promise<TrailerSource | null> {
  // 1. Check cache first
  const cached = await getCachedSource(movieId);
  if (cached !== undefined) {
    // Found in cache (could be null = no source available)
    return cached;
  }

  // 2. Try native source (MP4/HLS) - fastest experience
  const nativeSource = await getNativeSource(movieId);
  if (nativeSource) {
    await setCachedSource(movieId, nativeSource);
    return nativeSource;
  }

  // 3. Try YouTube - best coverage
  const youtubeSource = await getYouTubeSource(movieId);
  if (youtubeSource) {
    await setCachedSource(movieId, youtubeSource);
    return youtubeSource;
  }

  // 4. Try Apple Movie Previews - high quality HLS
  const appleSource = await getAppleSource(movieId);
  if (appleSource) {
    await setCachedSource(movieId, appleSource);
    return appleSource;
  }

  // 5. No source available - cache negative result
  await setCachedSource(movieId, null);
  return null;
}

// ============================================================================
// REACT HOOK
// ============================================================================

export interface UseTrailerSourceResult {
  /** The best available trailer source, or null if none available */
  source: TrailerSource | null;
  /** True while loading source */
  isLoading: boolean;
  /** Error if source fetching failed */
  error: Error | null;
  /** Refetch the source (clears cache first) */
  refetch: () => void;
}

/**
 * Resolve trailer source using full Movie object (better results)
 */
async function resolveTrailerSourceWithMovie(movie: Movie): Promise<TrailerSource | null> {
  const movieId = movie.id;
  
  // 1. Check cache first
  const cached = await getCachedSource(movieId);
  if (cached !== undefined) {
    return cached;
  }

  // 2. Try native source (Apple iTunes with full movie data)
  const nativeSource = await getNativeTrailerSource(movie);
  if (nativeSource) {
    await setCachedSource(movieId, nativeSource);
    return nativeSource;
  }

  // 3. Try YouTube with full movie data
  const youtubeSource = await getYouTubeTrailerSource(movie);
  if (youtubeSource) {
    await setCachedSource(movieId, youtubeSource);
    return youtubeSource;
  }

  // 4. Try Apple with full movie data
  const appleSource = await getAppleTrailerSource(movie);
  if (appleSource) {
    await setCachedSource(movieId, appleSource);
    return appleSource;
  }

  // 5. No source available - cache negative result
  await setCachedSource(movieId, null);
  return null;
}

/**
 * Hook to get the best available trailer source for a movie
 *
 * @param movie - The movie object (or just movieId for backwards compat)
 * @returns The best available source or null if none available
 *
 * @example
 * ```tsx
 * const { source, isLoading } = useTrailerSource(movie);
 *
 * if (source) {
 *   trailerPlayer.play(source);
 * }
 * ```
 */
export function useTrailerSource(movie: Movie | string | null): UseTrailerSourceResult {
  // Handle both Movie object and string movieId
  const movieId = movie ? (typeof movie === 'string' ? movie : movie.id) : null;
  const movieObj = movie && typeof movie !== 'string' ? movie : null;
  
  const query = useQuery({
    queryKey: ['trailerSource', movieId],
    queryFn: async () => {
      if (!movieId) return null;
      
      // Use full Movie object if available for better search results
      if (movieObj) {
        return resolveTrailerSourceWithMovie(movieObj);
      }
      return resolveTrailerSource(movieId);
    },
    enabled: !!movieId,
    staleTime: CACHE_TTL_MS, // Don't refetch for 7 days
    gcTime: CACHE_TTL_MS, // Keep in memory for 7 days (renamed from cacheTime in v5)
    retry: false, // Don't retry on failure - fallback to poster
    refetchOnWindowFocus: false, // Don't refetch when app comes to foreground
  });

  return {
    source: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error as Error | null,
    refetch: async () => {
      if (movieId) {
        await clearCachedSource(movieId);
        query.refetch();
      }
    },
  };
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Prefetch trailer sources for multiple movies
 * Useful for prefetching upcoming cards in the feed
 */
export async function prefetchTrailerSources(movieIds: string[]): Promise<void> {
  // Run in parallel but don't block
  const promises = movieIds.map(id => resolveTrailerSource(id).catch(() => null));
  await Promise.allSettled(promises);
}

/**
 * Clear all cached trailer sources
 */
export async function clearAllCachedSources(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const trailerKeys = keys.filter(k => k.startsWith(CACHE_PREFIX));
    if (trailerKeys.length > 0) {
      await AsyncStorage.multiRemove(trailerKeys);
    }
  } catch {
    // Silent fail
  }
}
