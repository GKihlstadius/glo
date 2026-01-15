// CandidateStore - Quality-filtered movie buckets for infinite feed
// Maintains replenishing pools of high-quality candidates per region

import { Movie, CandidateBucket, TasteProfile } from './types';
import { getMovies } from './movies';

// Quality thresholds for each bucket
const BUCKET_THRESHOLDS = {
  trending: {
    minRating: 5.5,
    minVoteCount: 100,
    minPopularity: 40,
  },
  top_rated: {
    minRating: 7.0,
    minVoteCount: 1000,
  },
  popular: {
    minRating: 6.0,
    minVoteCount: 500,
    minPopularity: 50,
  },
  new_noteworthy: {
    minRating: 6.5,
    minVoteCount: 100,
    maxAgeDays: 365,
  },
  hidden_gems: {
    minRating: 7.5,
    minVoteCount: 100,
    maxVoteCount: 5000,
  },
  personalized: {
    minRating: 5.0,
    minVoteCount: 50,
  },
};

// Bucket distribution for feed mix
const BUCKET_DISTRIBUTION = {
  personalized: 0.50,    // 50% personalized picks
  trending: 0.15,        // 15% trending
  top_rated: 0.15,       // 15% top rated
  popular: 0.10,         // 10% popular
  new_noteworthy: 0.05,  // 5% new releases
  hidden_gems: 0.05,     // 5% hidden gems
};

// Diversity constraints
const DIVERSITY_RULES = {
  maxSameGenreStreak: 3,
  maxSameDirectorStreak: 2,
  maxSameEraStreak: 4,
  minRuntimeVariance: 20, // minutes
};

interface CandidateWithMeta {
  movie: Movie;
  bucket: CandidateBucket;
  score: number;
  addedAt: number;
}

export class CandidateStore {
  private buckets: Map<CandidateBucket, CandidateWithMeta[]> = new Map();
  private countryCode: string;
  private tasteProfile: TasteProfile;
  private seenIds: Set<string> = new Set();
  private recentHistory: string[] = []; // Last 30 days of shown movie IDs
  private sessionHistory: string[] = []; // This session's shown movie IDs

  constructor(countryCode: string, tasteProfile: TasteProfile, seenIds: string[] = []) {
    this.countryCode = countryCode;
    this.tasteProfile = tasteProfile;
    this.seenIds = new Set(seenIds);
    this.initializeBuckets();
  }

  // Initialize all buckets with quality-filtered candidates
  private initializeBuckets(): void {
    const allMovies = getMovies(this.countryCode);
    const now = Date.now();

    // Clear existing buckets
    this.buckets.clear();
    Object.keys(BUCKET_THRESHOLDS).forEach(bucket => {
      this.buckets.set(bucket as CandidateBucket, []);
    });

    // Filter movies into appropriate buckets
    allMovies.forEach(movie => {
      // Skip if no valid poster
      if (!movie.posterUrl) return;

      // Skip if already seen (in 30-day window)
      if (this.recentHistory.includes(movie.id)) return;

      // Check each bucket's criteria
      Object.entries(BUCKET_THRESHOLDS).forEach(([bucketName, thresholds]) => {
        const bucket = bucketName as CandidateBucket;

        if (this.passesThreshold(movie, thresholds, now)) {
          const score = this.scoreForBucket(movie, bucket);
          const bucketArray = this.buckets.get(bucket) || [];
          bucketArray.push({
            movie,
            bucket,
            score,
            addedAt: now,
          });
          this.buckets.set(bucket, bucketArray);
        }
      });
    });

    // Sort each bucket by score
    this.buckets.forEach((candidates, bucket) => {
      candidates.sort((a, b) => b.score - a.score);
      this.buckets.set(bucket, candidates);
    });
  }

  // Check if movie passes bucket thresholds
  private passesThreshold(
    movie: Movie,
    thresholds: Record<string, number>,
    now: number
  ): boolean {
    if (thresholds.minRating && movie.ratingAvg < thresholds.minRating) return false;
    if (thresholds.minVoteCount && movie.ratingCount < thresholds.minVoteCount) return false;
    if (thresholds.maxVoteCount && movie.ratingCount > thresholds.maxVoteCount) return false;
    if (thresholds.minPopularity && movie.popularityScore < thresholds.minPopularity) return false;

    if (thresholds.maxAgeDays) {
      const releaseDate = new Date(movie.releaseDate).getTime();
      const ageDays = (now - releaseDate) / (1000 * 60 * 60 * 24);
      if (ageDays > thresholds.maxAgeDays) return false;
    }

    return true;
  }

  // Score movie for a specific bucket
  private scoreForBucket(movie: Movie, bucket: CandidateBucket): number {
    let score = 0;

    switch (bucket) {
      case 'trending':
        score = movie.popularityScore * 2 + movie.ratingAvg * 5;
        break;

      case 'top_rated':
        score = movie.ratingAvg * 10 + Math.log10(movie.ratingCount + 1) * 5;
        break;

      case 'popular':
        score = movie.popularityScore + movie.ratingAvg * 3;
        break;

      case 'new_noteworthy':
        const recency = Math.max(0, 365 - this.getDaysSinceRelease(movie));
        score = recency * 0.3 + movie.ratingAvg * 5;
        break;

      case 'hidden_gems':
        // Prefer high rating with moderate vote count
        const voteCountPenalty = Math.max(0, 5000 - movie.ratingCount) / 1000;
        score = movie.ratingAvg * 8 + voteCountPenalty * 3;
        break;

      case 'personalized':
        score = this.computePersonalizedScore(movie);
        break;
    }

    return score;
  }

  // Compute personalized score based on taste profile
  private computePersonalizedScore(movie: Movie): number {
    let score = movie.ratingAvg * 3; // Base quality score

    // Genre affinity
    movie.genres?.forEach(genre => {
      const affinity = this.tasteProfile.genres?.[genre] ?? 0;
      score += affinity * 15;
    });

    // Mood affinity
    movie.mood?.forEach(mood => {
      const affinity = this.tasteProfile.moodWeights?.[mood] ?? 0;
      score += affinity * 10;
    });

    // Era affinity
    if (movie.era) {
      const affinity = this.tasteProfile.eraWeights?.[movie.era] ?? 0;
      score += affinity * 8;
    }

    // Runtime preference
    const runtimeDiff = Math.abs(movie.runtime - (this.tasteProfile.preferredRuntime ?? 120));
    score -= runtimeDiff * 0.1;

    // Director affinity
    movie.directors?.forEach(director => {
      const affinity = this.tasteProfile.directors?.[director] ?? 0;
      score += affinity * 20;
    });

    // Cast affinity
    movie.cast?.forEach(actor => {
      const affinity = this.tasteProfile.cast?.[actor] ?? 0;
      score += affinity * 12;
    });

    return Math.max(0, score);
  }

  // Get days since movie release
  private getDaysSinceRelease(movie: Movie): number {
    const releaseDate = new Date(movie.releaseDate).getTime();
    return (Date.now() - releaseDate) / (1000 * 60 * 60 * 24);
  }

  // Select next bucket based on distribution
  private selectBucket(): CandidateBucket {
    const rand = Math.random();
    let cumulative = 0;

    for (const [bucket, weight] of Object.entries(BUCKET_DISTRIBUTION)) {
      cumulative += weight;
      if (rand < cumulative) {
        return bucket as CandidateBucket;
      }
    }

    return 'personalized'; // Fallback
  }

  // Get next candidate from store
  getNext(): CandidateWithMeta | null {
    // Try primary bucket selection
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const bucket = this.selectBucket();
      const candidates = this.buckets.get(bucket) || [];

      // Find first candidate not in session history
      const candidate = candidates.find(c => !this.sessionHistory.includes(c.movie.id));

      if (candidate) {
        // Check diversity constraints
        if (this.passesDiversityCheck(candidate.movie)) {
          this.sessionHistory.push(candidate.movie.id);

          // Trim session history if too long
          if (this.sessionHistory.length > 100) {
            this.sessionHistory.shift();
          }

          return candidate;
        }
      }

      attempts++;
    }

    // Fallback: get any available candidate
    return this.getFallbackCandidate();
  }

  // Get fallback candidate when primary selection fails
  private getFallbackCandidate(): CandidateWithMeta | null {
    // Fallback ladder: try buckets in order of size
    const sortedBuckets = Array.from(this.buckets.entries())
      .sort((a, b) => b[1].length - a[1].length);

    for (const [bucket, candidates] of sortedBuckets) {
      const candidate = candidates.find(c => !this.sessionHistory.includes(c.movie.id));
      if (candidate) {
        this.sessionHistory.push(candidate.movie.id);
        return candidate;
      }
    }

    // Ultimate fallback: allow repeats from largest bucket
    const [largestBucket, candidates] = sortedBuckets[0] || [null, []];
    if (candidates.length > 0) {
      const randomIdx = Math.floor(Math.random() * candidates.length);
      return candidates[randomIdx];
    }

    return null;
  }

  // Check diversity constraints
  private passesDiversityCheck(movie: Movie): boolean {
    if (this.sessionHistory.length < 3) return true;

    const recentMovies = this.sessionHistory
      .slice(-5)
      .map(id => this.findMovieById(id))
      .filter(Boolean) as Movie[];

    // Check genre streak
    if (movie.genres?.length) {
      const genreStreakCount = this.countRecentWithSameGenre(movie.genres[0], recentMovies);
      if (genreStreakCount >= DIVERSITY_RULES.maxSameGenreStreak) {
        return false;
      }
    }

    // Check director streak
    if (movie.directors?.length) {
      const directorStreakCount = this.countRecentWithSameDirector(movie.directors[0], recentMovies);
      if (directorStreakCount >= DIVERSITY_RULES.maxSameDirectorStreak) {
        return false;
      }
    }

    // Check era streak
    if (movie.era) {
      const eraStreakCount = this.countRecentWithSameEra(movie.era, recentMovies);
      if (eraStreakCount >= DIVERSITY_RULES.maxSameEraStreak) {
        return false;
      }
    }

    return true;
  }

  // Count recent movies with same primary genre
  private countRecentWithSameGenre(genre: string, recentMovies: Movie[]): number {
    return recentMovies.filter(m => m.genres?.includes(genre)).length;
  }

  // Count recent movies with same director
  private countRecentWithSameDirector(director: string, recentMovies: Movie[]): number {
    return recentMovies.filter(m => m.directors?.includes(director)).length;
  }

  // Count recent movies with same era
  private countRecentWithSameEra(era: string, recentMovies: Movie[]): number {
    return recentMovies.filter(m => m.era === era).length;
  }

  // Find movie by ID across all buckets
  private findMovieById(id: string): Movie | null {
    for (const candidates of this.buckets.values()) {
      const found = candidates.find(c => c.movie.id === id);
      if (found) return found.movie;
    }
    return null;
  }

  // Record a swipe action
  recordSwipe(movieId: string, action: 'like' | 'pass' | 'save'): void {
    this.seenIds.add(movieId);

    // Remove from all buckets
    this.buckets.forEach((candidates, bucket) => {
      const filtered = candidates.filter(c => c.movie.id !== movieId);
      this.buckets.set(bucket, filtered);
    });
  }

  // Update taste profile
  updateTasteProfile(profile: TasteProfile): void {
    this.tasteProfile = profile;

    // Re-score personalized bucket
    const personalizedBucket = this.buckets.get('personalized') || [];
    personalizedBucket.forEach(candidate => {
      candidate.score = this.computePersonalizedScore(candidate.movie);
    });
    personalizedBucket.sort((a, b) => b.score - a.score);
    this.buckets.set('personalized', personalizedBucket);
  }

  // Get stats for debugging
  getStats(): {
    bucketSizes: Record<CandidateBucket, number>;
    sessionHistoryLength: number;
    seenCount: number;
  } {
    const bucketSizes: Record<string, number> = {};
    this.buckets.forEach((candidates, bucket) => {
      bucketSizes[bucket] = candidates.length;
    });

    return {
      bucketSizes: bucketSizes as Record<CandidateBucket, number>,
      sessionHistoryLength: this.sessionHistory.length,
      seenCount: this.seenIds.size,
    };
  }

  // Check if store has content
  hasContent(): boolean {
    for (const candidates of this.buckets.values()) {
      if (candidates.length > 0) return true;
    }
    return false;
  }

  // Get total candidate count
  getTotalCount(): number {
    let total = 0;
    this.buckets.forEach(candidates => {
      total += candidates.length;
    });
    return total;
  }
}

// Export bucket distribution for transparency
export { BUCKET_DISTRIBUTION, BUCKET_THRESHOLDS, DIVERSITY_RULES };
