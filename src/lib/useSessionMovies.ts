// useSessionMovies - Hook for synchronized feed access in Spelläge Together mode
// All participants see the same movies in the same order from session.movies

import { useMemo } from 'react';
import { Movie, Session } from './types';
import { getMovie } from './movies';

export interface SessionMovieItem {
  movie: Movie;
  roundIndex: number; // 0-based index into session.movies
  roundNumber: number; // 1-based round number for display
}

export interface UseSessionMoviesResult {
  // Current movie for the current round
  currentMovie: SessionMovieItem | null;
  // All movies in the session (for reference)
  allMovies: SessionMovieItem[];
  // Is session using pre-generated movies
  isSessionMode: boolean;
  // Total rounds in session
  totalRounds: number;
  // Current round (1-based)
  currentRound: number;
  // Get movie for a specific round
  getMovieForRound: (round: number) => SessionMovieItem | null;
}

/**
 * Hook to access synchronized movies from a Spelläge session.
 * In Together mode, all participants see the same movies in the same order.
 *
 * @param session - The current session (or null for no session)
 * @param countryCode - Country code for fetching movie details
 * @returns Object with current movie, all movies, and helper functions
 */
export function useSessionMovies(
  session: Session | null,
  countryCode: string
): UseSessionMoviesResult {
  // Check if this session has pre-generated movies
  const isSessionMode = Boolean(session && session.movies && session.movies.length > 0);

  // Convert movie IDs to full Movie objects
  const allMovies = useMemo(() => {
    if (!session?.movies || session.movies.length === 0) {
      return [];
    }

    return session.movies
      .map((movieId, index) => {
        const movie = getMovie(movieId, countryCode);
        if (!movie) return null;

        return {
          movie,
          roundIndex: index,
          roundNumber: index + 1,
        };
      })
      .filter((item): item is SessionMovieItem => item !== null);
  }, [session?.movies, countryCode]);

  // Get current movie based on currentRound
  const currentMovie = useMemo(() => {
    if (!session || !isSessionMode || allMovies.length === 0) {
      return null;
    }

    const roundIndex = session.currentRound - 1; // Convert 1-based to 0-based
    if (roundIndex < 0 || roundIndex >= allMovies.length) {
      return null;
    }

    return allMovies[roundIndex] ?? null;
  }, [session?.currentRound, isSessionMode, allMovies]);

  // Helper to get movie for any round
  const getMovieForRound = (round: number): SessionMovieItem | null => {
    const index = round - 1; // Convert 1-based to 0-based
    if (index < 0 || index >= allMovies.length) {
      return null;
    }
    return allMovies[index] ?? null;
  };

  return {
    currentMovie,
    allMovies,
    isSessionMode,
    totalRounds: session?.totalRounds ?? 0,
    currentRound: session?.currentRound ?? 0,
    getMovieForRound,
  };
}

/**
 * Check if a device has swiped on a specific movie in the session
 */
export function hasDeviceSwiped(
  session: Session | null,
  deviceId: string,
  movieId: string
): boolean {
  if (!session?.swipes) return false;
  return session.swipes[deviceId]?.[movieId] !== undefined;
}

/**
 * Get all swipes for a specific movie across all participants
 */
export function getMovieSwipes(
  session: Session | null,
  movieId: string
): Record<string, 'like' | 'pass'> {
  if (!session?.swipes) return {};

  const result: Record<string, 'like' | 'pass'> = {};

  for (const [deviceId, swipes] of Object.entries(session.swipes)) {
    const swipe = swipes[movieId];
    if (swipe) {
      result[deviceId] = swipe;
    }
  }

  return result;
}

/**
 * Check if all participants have swiped on a specific movie
 */
export function haveAllParticipantsSwiped(
  session: Session | null,
  movieId: string
): boolean {
  if (!session) return false;

  const swipes = getMovieSwipes(session, movieId);
  return session.participants.every(deviceId => swipes[deviceId] !== undefined);
}

/**
 * Check if a movie is a match (all participants liked it)
 */
export function isMovieMatch(
  session: Session | null,
  movieId: string
): boolean {
  if (!session) return false;

  const swipes = getMovieSwipes(session, movieId);

  // Need at least 2 participants for a match
  if (session.participants.length < 2) return false;

  // Check if all participants liked this movie
  return session.participants.every(deviceId => swipes[deviceId] === 'like');
}

/**
 * Get all matches in a session
 */
export function getSessionMatches(session: Session | null): string[] {
  if (!session?.movies) return [];

  return session.movies.filter(movieId => isMovieMatch(session, movieId));
}
