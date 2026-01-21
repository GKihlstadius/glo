// ============================================================================
// YOUTUBE TRAILER SOURCE — YOUTUBE VIDEO INTEGRATION (US-005)
// ============================================================================
// Provides YouTube as a fallback trailer source with proper embed handling.
// Uses youtube-nocookie.com for privacy-enhanced embeds.
//
// Priority order for finding trailers:
// 1. Official studio channels
// 2. Distributor channels
// 3. Trusted trailer aggregators
//
// Returns null if no valid embeddable trailer found.
// ============================================================================

import type { Movie } from './types';
import type { TrailerSource } from '../components/TrailerPlayer';
import { getTrailer } from './trailer';

// ============================================================================
// CONSTANTS
// ============================================================================

// Use youtube-nocookie.com for privacy-enhanced embeds
const YOUTUBE_NOCOOKIE_BASE = 'https://www.youtube-nocookie.com/embed';

// Timeout for validation requests (ms)
const VALIDATION_TIMEOUT_MS = 5000;

// YouTube oEmbed API for checking embeddability
const YOUTUBE_OEMBED_API = 'https://www.youtube.com/oembed';

// ============================================================================
// URL BUILDERS
// ============================================================================

/**
 * Build YouTube embed URL using youtube-nocookie.com
 * Configured for inline autoplay with no controls
 */
export function buildYouTubeNoCookieEmbedUrl(
  videoId: string,
  options?: {
    autoplay?: boolean;
    mute?: boolean;
    start?: number;
    end?: number;
    loop?: boolean;
  }
): string {
  const params = new URLSearchParams({
    // Required for embed autoplay
    autoplay: options?.autoplay ? '1' : '0',
    mute: options?.mute ? '1' : '0',

    // UI configuration
    controls: '0',           // Hide controls for cleaner look
    playsinline: '1',        // Play inline on mobile (not fullscreen)
    modestbranding: '1',     // Minimal YouTube branding
    rel: '0',                // Don't show related videos at end
    showinfo: '0',           // Hide video info (deprecated but keep for older embeds)

    // API access
    enablejsapi: '1',        // Enable JavaScript API for control
    origin: 'https://glo.app', // Set origin for postMessage
  });

  // Optional timing parameters
  if (options?.start) params.set('start', String(options.start));
  if (options?.end) params.set('end', String(options.end));

  // Loop configuration
  if (options?.loop) {
    params.set('loop', '1');
    params.set('playlist', videoId); // Required for looping single video
  }

  return `${YOUTUBE_NOCOOKIE_BASE}/${videoId}?${params.toString()}`;
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Check if a YouTube video is embeddable
 * Uses the oEmbed API to verify embed availability
 */
export async function isVideoEmbeddable(videoId: string): Promise<boolean> {
  try {
    const url = `${YOUTUBE_OEMBED_API}?url=https://www.youtube.com/watch?v=${videoId}&format=json`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), VALIDATION_TIMEOUT_MS);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    // 200 = embeddable, 401/403 = blocked, 404 = not found
    if (response.ok) {
      // Additionally check the response to ensure it's valid
      const data = await response.json();
      return data && data.type === 'video';
    }

    return false;
  } catch {
    // Network error or timeout - assume not embeddable
    return false;
  }
}

/**
 * Validate YouTube video ID format
 * YouTube IDs are 11 characters: letters, numbers, hyphens, underscores
 */
export function isValidYouTubeVideoId(videoId: string): boolean {
  const pattern = /^[a-zA-Z0-9_-]{11}$/;
  return pattern.test(videoId);
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

/**
 * Get YouTube trailer source for a movie
 *
 * This function:
 * 1. Searches for official trailer using existing trailer system
 * 2. Validates the video is embeddable
 * 3. Returns youtube-nocookie.com embed URL with proper parameters
 *
 * @param movie - The movie to get a trailer for
 * @returns TrailerSource with type 'youtube' or null if not found
 *
 * @example
 * ```ts
 * const source = await getYouTubeTrailerSource(movie);
 * if (source) {
 *   // source.uri is youtube-nocookie.com embed URL
 *   trailerPlayer.play(source);
 * }
 * ```
 */
export async function getYouTubeTrailerSource(movie: Movie): Promise<TrailerSource | null> {
  try {
    // 1. Get trailer info using existing system
    // This prioritizes official studio channels, then distributors, then trusted
    const trailerInfo = await getTrailer(movie, 'US', 'en');

    if (!trailerInfo?.videoId) {
      return null;
    }

    // 2. Validate video ID format
    if (!isValidYouTubeVideoId(trailerInfo.videoId)) {
      return null;
    }

    // 3. Validate video is embeddable
    const embeddable = await isVideoEmbeddable(trailerInfo.videoId);
    if (!embeddable) {
      return null;
    }

    // 4. Build embed URL with youtube-nocookie.com
    const embedUrl = buildYouTubeNoCookieEmbedUrl(trailerInfo.videoId, {
      autoplay: true,
      mute: true,
      loop: false,
    });

    return {
      type: 'youtube',
      uri: embedUrl,
      // Duration could be used for endTime if needed
      // startTime: undefined,
      // endTime: trailerInfo.duration ? trailerInfo.duration : undefined,
    };
  } catch {
    // Any error = no YouTube source available
    return null;
  }
}

/**
 * Get YouTube trailer source from video ID directly
 * Use this when you already have a known video ID
 *
 * @param videoId - YouTube video ID
 * @param validate - Whether to validate embeddability (default: true)
 * @returns TrailerSource or null if invalid/blocked
 */
export async function getYouTubeSourceFromVideoId(
  videoId: string,
  validate = true
): Promise<TrailerSource | null> {
  // 1. Validate video ID format
  if (!isValidYouTubeVideoId(videoId)) {
    return null;
  }

  // 2. Optionally validate embeddability
  if (validate) {
    const embeddable = await isVideoEmbeddable(videoId);
    if (!embeddable) {
      return null;
    }
  }

  // 3. Build embed URL
  const embedUrl = buildYouTubeNoCookieEmbedUrl(videoId, {
    autoplay: true,
    mute: true,
    loop: false,
  });

  return {
    type: 'youtube',
    uri: embedUrl,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  YOUTUBE_NOCOOKIE_BASE,
  VALIDATION_TIMEOUT_MS,
};
