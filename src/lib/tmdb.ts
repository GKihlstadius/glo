// TMDB API Service - Real Movie Data Pipeline
// Handles fetching, caching, and transforming movie data

import { Movie, MovieWithAvailability, StreamingOffer, CandidateBucket } from './types';

// TMDB API Configuration
const TMDB_API_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

// Image size configurations
export const IMAGE_SIZES = {
  poster: {
    small: 'w185',
    medium: 'w342',
    large: 'w500',
    xlarge: 'w780',
    original: 'original',
  },
  backdrop: {
    small: 'w300',
    medium: 'w780',
    large: 'w1280',
    original: 'original',
  },
} as const;

// TMDB Provider ID mapping (from TMDB watch providers API)
export const TMDB_PROVIDER_MAP: Record<number, string> = {
  8: 'netflix',
  9: 'prime',
  337: 'disney',
  1899: 'hbo', // Max
  350: 'apple',
  76: 'viaplay',
  118: 'hbo', // HBO Max legacy
  15: 'hulu',
  531: 'paramount',
  386: 'peacock',
  11: 'mubi',
  258: 'criterion',
  119: 'prime', // Amazon Video
  10: 'prime', // Amazon Prime legacy
  43: 'starz',
  1770: 'paramount',
  283: 'crunchyroll',
  175: 'netflix', // Netflix basic
  1796: 'netflix', // Netflix Kids
};

// TMDB API Response Types
interface TMDBMovie {
  id: number;
  title: string;
  original_title: string;
  release_date: string;
  runtime: number | null;
  genres: { id: number; name: string }[];
  vote_average: number;
  vote_count: number;
  popularity: number;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  imdb_id?: string;
}

interface TMDBCredits {
  cast: { id: number; name: string; order: number }[];
  crew: { id: number; name: string; job: string }[];
}

interface TMDBWatchProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
}

interface TMDBWatchProviders {
  results: Record<string, {
    link?: string;
    flatrate?: TMDBWatchProvider[];
    rent?: TMDBWatchProvider[];
    buy?: TMDBWatchProvider[];
  }>;
}

interface TMDBMovieListResponse {
  page: number;
  results: TMDBMovie[];
  total_pages: number;
  total_results: number;
}

// Genre ID to mood mapping
const GENRE_MOOD_MAP: Record<number, ('calm' | 'fun' | 'intense')[]> = {
  28: ['intense'], // Action
  12: ['fun', 'intense'], // Adventure
  16: ['fun'], // Animation
  35: ['fun'], // Comedy
  80: ['intense'], // Crime
  99: ['calm'], // Documentary
  18: ['calm', 'intense'], // Drama
  10751: ['fun', 'calm'], // Family
  14: ['fun'], // Fantasy
  36: ['calm'], // History
  27: ['intense'], // Horror
  10402: ['calm', 'fun'], // Music
  9648: ['calm', 'intense'], // Mystery
  10749: ['calm', 'fun'], // Romance
  878: ['intense', 'fun'], // Science Fiction
  10770: ['calm'], // TV Movie
  53: ['intense'], // Thriller
  10752: ['intense'], // War
  37: ['fun', 'intense'], // Western
};

// Era classification based on year
function classifyEra(year: number): 'classic' | 'modern' | 'recent' {
  if (year < 2000) return 'classic';
  if (year < 2020) return 'modern';
  return 'recent';
}

// Convert TMDB movie to our Movie type
function transformMovie(tmdb: TMDBMovie, credits?: TMDBCredits): Movie {
  const year = tmdb.release_date ? parseInt(tmdb.release_date.split('-')[0]) : 2024;

  // Derive moods from genres
  const moods = new Set<'calm' | 'fun' | 'intense'>();
  tmdb.genres?.forEach(g => {
    const genreMoods = GENRE_MOOD_MAP[g.id] || [];
    genreMoods.forEach(m => moods.add(m));
  });

  // Default mood if none derived
  if (moods.size === 0) moods.add('calm');

  // Extract directors and cast
  const directors = credits?.crew
    ?.filter(c => c.job === 'Director')
    ?.slice(0, 3)
    ?.map(c => c.name) || [];

  const cast = credits?.cast
    ?.slice(0, 5)
    ?.map(c => c.name) || [];

  return {
    id: tmdb.id.toString(),
    tmdbId: tmdb.id,
    imdbId: tmdb.imdb_id,
    title: tmdb.title,
    originalTitle: tmdb.original_title,
    year,
    releaseDate: tmdb.release_date || `${year}-01-01`,
    runtime: tmdb.runtime || 120,
    genres: tmdb.genres?.map(g => g.name.toLowerCase()) || [],
    mood: Array.from(moods),
    era: classifyEra(year),
    ratingAvg: tmdb.vote_average,
    ratingCount: tmdb.vote_count,
    popularityScore: tmdb.popularity,
    posterUrl: tmdb.poster_path ? `${TMDB_IMAGE_BASE}/${IMAGE_SIZES.poster.large}${tmdb.poster_path}` : '',
    posterPath: tmdb.poster_path,
    backdropUrl: tmdb.backdrop_path ? `${TMDB_IMAGE_BASE}/${IMAGE_SIZES.backdrop.medium}${tmdb.backdrop_path}` : undefined,
    backdropPath: tmdb.backdrop_path,
    directors,
    cast,
    overview: tmdb.overview,
  };
}

// Build streaming offers from TMDB watch providers
function buildStreamingOffers(
  providers: TMDBWatchProviders['results'],
  countryCode: string,
  movieId: string
): StreamingOffer[] {
  const countryProviders = providers[countryCode];
  if (!countryProviders) return [];

  const offers: StreamingOffer[] = [];
  const webLink = countryProviders.link;

  // Flatrate (streaming)
  countryProviders.flatrate?.forEach(p => {
    const providerId = TMDB_PROVIDER_MAP[p.provider_id];
    if (providerId) {
      offers.push({
        providerId,
        type: 'stream',
        webUrl: webLink || `https://www.themoviedb.org/movie/${movieId}/watch`,
        quality: '4k',
      });
    }
  });

  // Rent
  countryProviders.rent?.forEach(p => {
    const providerId = TMDB_PROVIDER_MAP[p.provider_id];
    if (providerId && !offers.some(o => o.providerId === providerId)) {
      offers.push({
        providerId,
        type: 'rent',
        webUrl: webLink || `https://www.themoviedb.org/movie/${movieId}/watch`,
      });
    }
  });

  // Buy
  countryProviders.buy?.forEach(p => {
    const providerId = TMDB_PROVIDER_MAP[p.provider_id];
    if (providerId && !offers.some(o => o.providerId === providerId)) {
      offers.push({
        providerId,
        type: 'buy',
        webUrl: webLink || `https://www.themoviedb.org/movie/${movieId}/watch`,
      });
    }
  });

  return offers;
}

// Image URL builders
export function getPosterUrl(
  path: string | null,
  size: keyof typeof IMAGE_SIZES.poster = 'large'
): string | null {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE}/${IMAGE_SIZES.poster[size]}${path}`;
}

export function getBackdropUrl(
  path: string | null,
  size: keyof typeof IMAGE_SIZES.backdrop = 'medium'
): string | null {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE}/${IMAGE_SIZES.backdrop[size]}${path}`;
}

// Quality filters for different buckets
export const QUALITY_FILTERS = {
  top_rated: {
    minRating: 7.0,
    minVoteCount: 1000,
  },
  trending: {
    minRating: 5.5,
    minVoteCount: 100,
  },
  popular: {
    minRating: 6.0,
    minVoteCount: 500,
    minPopularity: 50,
  },
  new_noteworthy: {
    minRating: 6.5,
    minVoteCount: 100,
    maxAge: 365, // days
  },
  hidden_gems: {
    minRating: 7.5,
    maxVoteCount: 5000,
    minVoteCount: 100,
  },
  personalized: {
    minRating: 5.0,
    minVoteCount: 50,
  },
  wildcard: {
    minRating: 5.0,
    minVoteCount: 50,
  },
};

// Check if movie passes quality filter for a bucket
export function passesQualityFilter(
  movie: Movie,
  bucket: CandidateBucket
): boolean {
  const filter = QUALITY_FILTERS[bucket] || QUALITY_FILTERS.wildcard;

  if (movie.ratingAvg < filter.minRating) return false;
  if (movie.ratingCount < filter.minVoteCount) return false;

  if ('maxVoteCount' in filter && movie.ratingCount > filter.maxVoteCount) return false;
  if ('minPopularity' in filter && movie.popularityScore < filter.minPopularity) return false;

  if ('maxAge' in filter) {
    const releaseDate = new Date(movie.releaseDate);
    const daysSinceRelease = (Date.now() - releaseDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceRelease > filter.maxAge) return false;
  }

  return true;
}

// Validate movie has required visual assets
export function hasValidAssets(movie: Movie): boolean {
  // Must have poster - this is non-negotiable
  if (!movie.posterPath) return false;

  // Poster path must be a valid TMDB path (starts with /)
  if (!movie.posterPath.startsWith('/')) return false;

  return true;
}

// Export types for external use
export type { TMDBMovie, TMDBCredits, TMDBWatchProviders };
