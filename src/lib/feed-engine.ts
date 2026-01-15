import { Movie, TasteProfile, FeedItem, FeedBucket, Mood } from './types';
import { getMovies, filterByMood } from './movies';

// Constants for feed algorithm
const QUEUE_SIZE = 40;
const HISTORY_WINDOW_SIZE = 100;
const DECAY_FACTOR = 0.95; // Per-session decay for taste weights
const PASS_STREAK_EXPLORE_THRESHOLD = 5;

// Bucket distribution (adjusts dynamically)
const BASE_EXPLOIT_RATIO = 0.6;
const BASE_EXPLORE_RATIO = 0.3;
const BASE_WILDCARD_RATIO = 0.1;

// Default taste profile
export function createDefaultTasteProfile(): TasteProfile {
  return {
    genres: {},
    preferredRuntime: 110,
    eraWeights: { classic: 0, modern: 0, recent: 0.1 },
    moodWeights: { calm: 0, fun: 0, intense: 0 },
    likeCount: 0,
    passCount: 0,
    saveCount: 0,
    consecutivePasses: 0,
    lastUpdated: Date.now(),
  };
}

// Update taste profile based on user action
export function updateTasteProfile(
  profile: TasteProfile,
  movie: Movie,
  action: 'like' | 'pass' | 'save'
): TasteProfile {
  const updated = { ...profile };
  const weight = action === 'like' ? 0.15 : action === 'save' ? 0.2 : -0.08;

  // Update genre affinities
  movie.genres?.forEach((genre) => {
    const current = updated.genres[genre] || 0;
    updated.genres[genre] = Math.max(-1, Math.min(1, current + weight));
  });

  // Update mood affinities
  movie.mood?.forEach((mood) => {
    const current = updated.moodWeights[mood] || 0;
    updated.moodWeights[mood] = Math.max(-1, Math.min(1, current + weight));
  });

  // Update era preference
  if (movie.era) {
    const current = updated.eraWeights[movie.era] || 0;
    updated.eraWeights[movie.era] = Math.max(-1, Math.min(1, current + weight * 0.5));
  }

  // Update runtime preference (running average for likes only)
  if (action === 'like' || action === 'save') {
    const count = updated.likeCount + updated.saveCount + 1;
    updated.preferredRuntime =
      (updated.preferredRuntime * (count - 1) + movie.runtime) / count;
  }

  // Update counts
  if (action === 'like') {
    updated.likeCount++;
    updated.consecutivePasses = 0;
  } else if (action === 'pass') {
    updated.passCount++;
    updated.consecutivePasses++;
  } else if (action === 'save') {
    updated.saveCount++;
    updated.consecutivePasses = 0;
  }

  updated.lastUpdated = Date.now();
  return updated;
}

// Apply decay to taste profile (call periodically)
export function decayTasteProfile(profile: TasteProfile): TasteProfile {
  const updated = { ...profile };

  // Decay genre weights
  updated.genres = Object.fromEntries(
    Object.entries(updated.genres).map(([k, v]) => [k, v * DECAY_FACTOR])
  );

  // Decay mood weights
  updated.moodWeights = Object.fromEntries(
    Object.entries(updated.moodWeights).map(([k, v]) => [k, v * DECAY_FACTOR])
  );

  // Decay era weights
  updated.eraWeights = Object.fromEntries(
    Object.entries(updated.eraWeights).map(([k, v]) => [k, v * DECAY_FACTOR])
  );

  return updated;
}

// Score a movie based on taste profile
function scoreMovie(movie: Movie, profile: TasteProfile): number {
  let score = 0;

  // Base popularity score (0-30 points)
  score += (movie.popularity || 50) * 0.3;

  // Genre affinity (up to 30 points)
  const genreScore =
    movie.genres?.reduce((sum, g) => sum + (profile.genres[g] || 0), 0) || 0;
  score += Math.max(-15, Math.min(30, genreScore * 20));

  // Mood affinity (up to 15 points)
  const moodScore =
    movie.mood?.reduce((sum, m) => sum + (profile.moodWeights[m] || 0), 0) || 0;
  score += Math.max(-10, Math.min(15, moodScore * 15));

  // Era affinity (up to 10 points)
  if (movie.era) {
    score += (profile.eraWeights[movie.era] || 0) * 10;
  }

  // Runtime proximity (up to 15 points, penalty for deviation)
  const runtimeDiff = Math.abs(movie.runtime - profile.preferredRuntime);
  score += Math.max(0, 15 - runtimeDiff * 0.2);

  return score;
}

// Calculate dynamic bucket ratios
function getBucketRatios(profile: TasteProfile): { exploit: number; explore: number; wildcard: number } {
  const totalInteractions = profile.likeCount + profile.passCount + profile.saveCount;

  // Start with more exploration, shift to exploitation as taste develops
  const confidenceMultiplier = Math.min(1, totalInteractions / 30);

  // If pass streak is high, increase exploration
  const passStreakBonus = profile.consecutivePasses >= PASS_STREAK_EXPLORE_THRESHOLD ? 0.2 : 0;

  let exploit = BASE_EXPLOIT_RATIO * confidenceMultiplier;
  let explore = BASE_EXPLORE_RATIO + (1 - confidenceMultiplier) * 0.2 + passStreakBonus;
  let wildcard = BASE_WILDCARD_RATIO;

  // Normalize
  const total = exploit + explore + wildcard;
  return {
    exploit: exploit / total,
    explore: explore / total,
    wildcard: wildcard / total,
  };
}

// Select bucket for next item
function selectBucket(profile: TasteProfile): FeedBucket {
  const ratios = getBucketRatios(profile);
  const rand = Math.random();

  if (rand < ratios.exploit) return 'exploit';
  if (rand < ratios.exploit + ratios.explore) return 'explore';
  return 'wildcard';
}

// Main feed engine class
export class FeedEngine {
  private queue: FeedItem[] = [];
  private historyWindow: Set<string> = new Set();
  private countryCode: string;
  private tasteProfile: TasteProfile;
  private likedIds: Set<string>;
  private passedIds: Set<string>;
  private savedIds: Set<string>;
  private moodFilter: Mood | null;

  constructor(
    countryCode: string,
    tasteProfile: TasteProfile,
    likedIds: string[],
    passedIds: string[],
    savedIds: string[],
    moodFilter: Mood | null = null
  ) {
    this.countryCode = countryCode;
    this.tasteProfile = tasteProfile;
    this.likedIds = new Set(likedIds);
    this.passedIds = new Set(passedIds);
    this.savedIds = new Set(savedIds);
    this.moodFilter = moodFilter;
    this.refillQueue();
  }

  // Get available candidates (not seen, not in history window)
  private getCandidates(): Movie[] {
    let movies = getMovies(this.countryCode);

    // Apply mood filter if set
    if (this.moodFilter) {
      movies = filterByMood(movies, this.moodFilter);
    }

    // Filter out seen and recently shown
    return movies.filter(
      (m) =>
        !this.likedIds.has(m.id) &&
        !this.passedIds.has(m.id) &&
        !this.historyWindow.has(m.id)
    );
  }

  // Get all movies for fallback (ignore history window)
  private getAllCandidates(): Movie[] {
    let movies = getMovies(this.countryCode);

    if (this.moodFilter) {
      movies = filterByMood(movies, this.moodFilter);
    }

    // Only filter out permanently swiped
    return movies.filter(
      (m) => !this.likedIds.has(m.id) && !this.passedIds.has(m.id)
    );
  }

  // Refill the queue
  private refillQueue(): void {
    const candidates = this.getCandidates();

    // Fallback ladder
    let fallbackLevel = 0;
    let pool = candidates;

    if (candidates.length === 0) {
      fallbackLevel = 1;
      pool = this.getAllCandidates();
    }

    if (pool.length === 0) {
      fallbackLevel = 2;
      // Ultimate fallback: show already-swiped movies again (but not saved)
      let movies = getMovies(this.countryCode);
      if (this.moodFilter) {
        movies = filterByMood(movies, this.moodFilter);
      }
      pool = movies.filter((m) => !this.savedIds.has(m.id));
    }

    if (pool.length === 0) {
      fallbackLevel = 3;
      // Absolute last resort: any movie in region
      pool = getMovies(this.countryCode);
    }

    // Score and sort candidates
    const scored = pool.map((movie) => ({
      movie,
      score: scoreMovie(movie, this.tasteProfile),
    }));

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);

    // Fill queue with bucket distribution
    const newItems: FeedItem[] = [];
    const neededCount = QUEUE_SIZE - this.queue.length;

    for (let i = 0; i < neededCount && scored.length > 0; i++) {
      const bucket = selectBucket(this.tasteProfile);
      let selected: { movie: Movie; score: number } | undefined;
      let reason = '';

      switch (bucket) {
        case 'exploit':
          // Pick from top 30%
          const exploitPool = scored.slice(0, Math.max(1, Math.ceil(scored.length * 0.3)));
          const exploitIdx = Math.floor(Math.random() * exploitPool.length);
          selected = exploitPool[exploitIdx];
          reason = 'Matches your taste';
          break;

        case 'explore':
          // Pick from middle 40%
          const midStart = Math.ceil(scored.length * 0.3);
          const midEnd = Math.ceil(scored.length * 0.7);
          const explorePool = scored.slice(midStart, midEnd);
          if (explorePool.length > 0) {
            const exploreIdx = Math.floor(Math.random() * explorePool.length);
            selected = explorePool[exploreIdx];
            reason = 'Something different';
          } else {
            selected = scored[Math.floor(Math.random() * scored.length)];
            reason = 'Explore';
          }
          break;

        case 'wildcard':
          // Random from entire pool
          selected = scored[Math.floor(Math.random() * scored.length)];
          reason = 'Wildcard pick';
          break;
      }

      if (selected) {
        newItems.push({
          movie: selected.movie,
          bucket,
          score: selected.score,
          reason: fallbackLevel > 0 ? `Fallback L${fallbackLevel}` : reason,
        });

        // Remove from scored pool to avoid duplicates
        const idx = scored.findIndex((s) => s.movie.id === selected!.movie.id);
        if (idx !== -1) scored.splice(idx, 1);
      }
    }

    this.queue.push(...newItems);
  }

  // Get next movie from queue
  getNext(): FeedItem | null {
    if (this.queue.length < 10) {
      this.refillQueue();
    }

    const item = this.queue.shift();
    if (item) {
      // Add to history window
      this.historyWindow.add(item.movie.id);

      // Trim history window
      if (this.historyWindow.size > HISTORY_WINDOW_SIZE) {
        const first = this.historyWindow.values().next().value;
        if (first) this.historyWindow.delete(first);
      }
    }

    return item || null;
  }

  // Peek at upcoming items without consuming
  peek(count: number = 3): FeedItem[] {
    if (this.queue.length < count + 5) {
      this.refillQueue();
    }
    return this.queue.slice(0, count);
  }

  // Record a swipe action
  recordSwipe(movieId: string, action: 'like' | 'pass' | 'save'): void {
    if (action === 'like') {
      this.likedIds.add(movieId);
    } else if (action === 'pass') {
      this.passedIds.add(movieId);
    } else if (action === 'save') {
      this.savedIds.add(movieId);
    }

    // Remove from queue if present
    this.queue = this.queue.filter((item) => item.movie.id !== movieId);
  }

  // Get queue stats (for debug)
  getStats(): { queueLength: number; historySize: number; bucketRatios: Record<string, number> } {
    const ratios = getBucketRatios(this.tasteProfile);
    return {
      queueLength: this.queue.length,
      historySize: this.historyWindow.size,
      bucketRatios: ratios,
    };
  }

  // Update taste profile
  updateProfile(profile: TasteProfile): void {
    this.tasteProfile = profile;
  }

  // Check if feed has content
  hasContent(): boolean {
    return this.queue.length > 0 || this.getCandidates().length > 0 || this.getAllCandidates().length > 0;
  }
}

// Hook for using feed engine in components
export function createFeedEngine(
  countryCode: string,
  tasteProfile: TasteProfile,
  likedIds: string[],
  passedIds: string[],
  savedIds: string[],
  moodFilter: Mood | null = null
): FeedEngine {
  return new FeedEngine(countryCode, tasteProfile, likedIds, passedIds, savedIds, moodFilter);
}
