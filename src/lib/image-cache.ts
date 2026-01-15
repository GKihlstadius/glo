// Image prefetch and caching utilities
// Uses expo-image's built-in caching with manual prefetch triggers

import { Image } from 'expo-image';
import { Movie } from './types';

// Prefetch a single image URL
export async function prefetchImage(url: string): Promise<boolean> {
  if (!url) return false;

  try {
    await Image.prefetch(url);
    return true;
  } catch (error) {
    console.log('Failed to prefetch image:', url);
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
  } = { includePoster: true, includeBackdrop: false }
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

// Image quality levels for different network conditions
export type ImageQuality = 'low' | 'medium' | 'high' | 'original';

// Get optimized image URL based on quality preference
export function getOptimizedImageUrl(
  baseUrl: string,
  quality: ImageQuality = 'high'
): string {
  // For Unsplash URLs, adjust quality parameters
  if (baseUrl.includes('unsplash.com')) {
    const qualityParams: Record<ImageQuality, string> = {
      low: 'w=400&q=60',
      medium: 'w=600&q=75',
      high: 'w=800&q=85',
      original: 'w=1200&q=90',
    };

    // Replace existing params or append
    const url = new URL(baseUrl);
    const params = qualityParams[quality].split('&');
    params.forEach((param) => {
      const [key, value] = param.split('=');
      url.searchParams.set(key, value);
    });

    return url.toString();
  }

  // For TMDB URLs, return as-is (already sized)
  return baseUrl;
}

// Cache management
export const ImageCache = {
  // Clear all cached images
  async clear(): Promise<void> {
    try {
      await Image.clearDiskCache();
      await Image.clearMemoryCache();
    } catch (error) {
      console.log('Failed to clear image cache:', error);
    }
  },

  // Get cache size (expo-image doesn't expose this, so return estimate)
  async getSize(): Promise<number> {
    // Return -1 to indicate unknown
    return -1;
  },
};

// Placeholder blur hash for loading states
export const PLACEHOLDER_BLUR_HASH = 'LEHV6nWB2yk8pyo0adR*.7kCMdnj';

// Default transition for images
export const IMAGE_TRANSITION = {
  duration: 200,
  effect: 'cross-dissolve' as const,
};
