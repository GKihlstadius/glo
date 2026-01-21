// ============================================================================
// NATIVE TRAILER SOURCE — MP4/HLS VIDEO INTEGRATION (US-004)
// ============================================================================
// Provides native video sources (MP4/HLS) for the smoothest trailer experience.
// Sources are checked in priority order and validated before returning.
//
// Priority:
// 1. Apple Movie Trailers (iTunes API) - High quality HLS
// 2. TMDB videos with direct playback capability
// 3. Known CDN patterns for movie trailers
//
// Returns null if no valid native source found (falls through to YouTube/Apple).
// ============================================================================

import type { Movie } from './types';
import type { TrailerSource } from '../components/TrailerPlayer';

// ============================================================================
// CONSTANTS
// ============================================================================

// Apple iTunes Search API for movie lookup
const APPLE_ITUNES_API = 'https://itunes.apple.com/search';

// Timeout for validation requests (ms)
const VALIDATION_TIMEOUT_MS = 3000;

// ============================================================================
// APPLE MOVIE TRAILERS
// ============================================================================

interface iTunesSearchResult {
  resultCount: number;
  results: Array<{
    trackId: number;
    trackName: string;
    artistName: string;
    previewUrl?: string;
    trackViewUrl?: string;
    releaseDate?: string;
    primaryGenreName?: string;
    contentAdvisoryRating?: string;
    artworkUrl100?: string;
    kind?: string;
  }>;
}

/**
 * Search Apple iTunes for movie preview URL
 * Apple provides high-quality HLS streams for movie previews
 */
async function getAppleMoviePreview(movie: Movie): Promise<string | null> {
  try {
    const searchQuery = encodeURIComponent(movie.title);
    const url = `${APPLE_ITUNES_API}?term=${searchQuery}&media=movie&entity=movie&limit=5&country=US`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), VALIDATION_TIMEOUT_MS);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }

    const data: iTunesSearchResult = await response.json();

    if (data.resultCount === 0 || !data.results.length) {
      return null;
    }

    // Find best match by comparing title and year
    const movieYear = movie.year;
    const movieTitleLower = movie.title.toLowerCase();

    for (const result of data.results) {
      if (!result.previewUrl) continue;

      // Check title similarity
      const resultTitleLower = result.trackName?.toLowerCase() || '';
      const titleMatches =
        resultTitleLower === movieTitleLower ||
        resultTitleLower.includes(movieTitleLower) ||
        movieTitleLower.includes(resultTitleLower);

      if (!titleMatches) continue;

      // Check year if available
      if (result.releaseDate) {
        const releaseYear = new Date(result.releaseDate).getFullYear();
        if (Math.abs(releaseYear - movieYear) > 1) continue; // Allow 1 year variance
      }

      // Found a match with preview URL
      return result.previewUrl;
    }

    return null;
  } catch {
    return null;
  }
}

// ============================================================================
// TMDB NATIVE SOURCES
// ============================================================================

// TMDB does not provide direct video URLs - it provides YouTube/Vimeo keys
// This function checks if TMDB has any native (non-YouTube) video sources
// Currently TMDB's API only returns site: "YouTube" or "Vimeo" for videos,
// so this returns null. Future: if TMDB adds direct HLS/MP4 support, implement here.

async function getTMDBNativeSource(_movie: Movie): Promise<string | null> {
  // TMDB's /movie/{id}/videos endpoint only returns YouTube/Vimeo keys
  // It does not provide direct MP4/HLS URLs
  // Returning null to fall through to other sources
  return null;
}

// ============================================================================
// KNOWN CDN PATTERNS
// ============================================================================

// Some movie distributors host trailers on predictable CDN URLs
// These patterns can be checked for common movies

interface CDNPattern {
  name: string;
  buildUrl: (movie: Movie) => string | null;
}

// Known CDN patterns for movie trailers
const CDN_PATTERNS: CDNPattern[] = [
  // Note: Most movie CDNs require authentication or have complex URL schemes
  // These are placeholder patterns that could be expanded with known working CDNs

  // Example: Some studios host trailers at predictable paths
  // {
  //   name: 'StudioCDN',
  //   buildUrl: (movie) => `https://cdn.studio.com/trailers/${movie.imdbId}.mp4`,
  // },
];

/**
 * Check known CDN patterns for native trailer sources
 */
async function checkCDNPatterns(movie: Movie): Promise<string | null> {
  for (const pattern of CDN_PATTERNS) {
    const url = pattern.buildUrl(movie);
    if (!url) continue;

    const isValid = await validateVideoUrl(url);
    if (isValid) {
      return url;
    }
  }

  return null;
}

// ============================================================================
// SOURCE VALIDATION
// ============================================================================

/**
 * Validate that a video URL is accessible and returns video content
 * Uses HEAD request to check content-type and availability
 */
async function validateVideoUrl(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), VALIDATION_TIMEOUT_MS);

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return false;
    }

    // Check content-type is video
    const contentType = response.headers.get('content-type') || '';
    const isVideo =
      contentType.includes('video/') ||
      contentType.includes('application/x-mpegURL') || // HLS
      contentType.includes('application/vnd.apple.mpegurl') || // HLS
      contentType.includes('application/dash+xml'); // DASH

    return isVideo;
  } catch {
    return false;
  }
}

/**
 * Validate an Apple preview URL
 * Apple URLs are assumed valid if they match the expected pattern
 */
function validateApplePreviewUrl(url: string): boolean {
  // Apple preview URLs have a specific format
  // e.g., https://video-ssl.itunes.apple.com/...
  return url.includes('itunes.apple.com') || url.includes('apple.com');
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

/**
 * Get native video source (MP4/HLS) for a movie
 *
 * This function checks multiple sources in priority order:
 * 1. Apple Movie Trailers (iTunes API) - provides HLS streams
 * 2. TMDB native sources (if available)
 * 3. Known CDN patterns
 *
 * @param movie - The movie to get a trailer for
 * @returns TrailerSource with type 'native' or null if not found
 *
 * @example
 * ```ts
 * const source = await getNativeTrailerSource(movie);
 * if (source) {
 *   trailerPlayer.play(source);
 * }
 * ```
 */
export async function getNativeTrailerSource(movie: Movie): Promise<TrailerSource | null> {
  // 1. Try Apple Movie Trailers (best quality HLS)
  const appleUrl = await getAppleMoviePreview(movie);
  if (appleUrl && validateApplePreviewUrl(appleUrl)) {
    return {
      type: 'native',
      uri: appleUrl,
    };
  }

  // 2. Try TMDB native sources (currently returns null)
  const tmdbUrl = await getTMDBNativeSource(movie);
  if (tmdbUrl) {
    const isValid = await validateVideoUrl(tmdbUrl);
    if (isValid) {
      return {
        type: 'native',
        uri: tmdbUrl,
      };
    }
  }

  // 3. Try known CDN patterns
  const cdnUrl = await checkCDNPatterns(movie);
  if (cdnUrl) {
    return {
      type: 'native',
      uri: cdnUrl,
    };
  }

  // No valid native source found
  return null;
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  getAppleMoviePreview,
  validateVideoUrl,
};
