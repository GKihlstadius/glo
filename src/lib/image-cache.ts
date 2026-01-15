// Image prefetch and caching utilities for TMDB posters
// Uses expo-image's built-in caching with manual prefetch triggers

import { Image } from 'expo-image';
import { Movie } from './types';

// TMDB Image base URL
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

// Get poster URL with specific size
export function getTMDBPosterUrl(posterPath: string | null | undefined, size: 'w342' | 'w500' | 'w780' = 'w500'): string | null {
  if (!posterPath) return null;
  return `${TMDB_IMAGE_BASE}/${size}${posterPath}`;
}

// Prefetch a single image URL
export async function prefetchImage(url: string): Promise<boolean> {
  if (!url) return false;

  try {
    await Image.prefetch(url);
    return true;
  } catch (error) {
    console.log('[ImageCache] Failed to prefetch:', url);
    return false;
  }
}

// Prefetch multiple images in parallel
export async function prefetchImages(urls: string[]): Promise<number> {
  const validUrls = urls.filter(Boolean);
  if (validUrls.length === 0) return 0;

  const results = await Promise.allSettled(
    validUrls.map((url) => prefetchImage(url))
  );

  return results.filter((r) => r.status === 'fulfilled' && r.value).length;
}

// Prefetch images for a list of movies
export async function prefetchMovieImages(
  movies: Movie[],
  options: {
    includePoster?: boolean;
    includeBackdrop?: boolean;
    posterSize?: 'w342' | 'w500' | 'w780';
  } = { includePoster: true, includeBackdrop: false, posterSize: 'w500' }
): Promise<number> {
  const urls: string[] = [];

  movies.forEach((movie) => {
    if (options.includePoster && movie.posterUrl) {
      urls.push(movie.posterUrl);
    }
    if (options.includeBackdrop && movie.backdropUrl) {
      urls.push(movie.backdropUrl);
    }
  });

  return prefetchImages(urls);
}

// Prefetch next N movies in queue (call periodically)
export async function prefetchUpcoming(movies: Movie[], count: number = 10): Promise<void> {
  const toFetch = movies.slice(0, count);
  const urls = toFetch
    .map(m => m.posterUrl)
    .filter(Boolean);

  await prefetchImages(urls);
}

// Validate that a poster URL is loadable
export async function validatePosterUrl(url: string): Promise<boolean> {
  if (!url) return false;

  try {
    // Try to prefetch - if it fails, poster is invalid
    const success = await prefetchImage(url);
    return success;
  } catch {
    return false;
  }
}

// Image quality levels for different network conditions
export type ImageQuality = 'low' | 'medium' | 'high' | 'original';

// Get optimized image URL based on quality preference
export function getOptimizedImageUrl(
  posterPath: string | null | undefined,
  quality: ImageQuality = 'high'
): string | null {
  if (!posterPath) return null;

  const sizeMap: Record<ImageQuality, 'w342' | 'w500' | 'w780'> = {
    low: 'w342',
    medium: 'w500',
    high: 'w500',
    original: 'w780',
  };

  return getTMDBPosterUrl(posterPath, sizeMap[quality]);
}

// Cache management
export const ImageCache = {
  // Clear all cached images
  async clear(): Promise<void> {
    try {
      await Image.clearDiskCache();
      await Image.clearMemoryCache();
    } catch (error) {
      console.log('[ImageCache] Failed to clear cache:', error);
    }
  },

  // Get cache size (expo-image doesn't expose this, so return estimate)
  async getSize(): Promise<number> {
    return -1;
  },
};

// Placeholder blur hash for loading states (subtle gray)
export const PLACEHOLDER_BLUR_HASH = 'L6PZfSi_.AyE_3t7t7R**0teleR*';

// Default transition for images - quick fade
export const IMAGE_TRANSITION = {
  duration: 150,
  effect: 'cross-dissolve' as const,
};
