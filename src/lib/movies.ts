import { Movie, MovieAvailability, Mood } from './types';

// Availability per country - only show movies that are actually available
const AVAILABILITY_MAP: Record<string, Record<string, string[]>> = {
  SE: {
    '1': ['netflix'], '2': ['disney'], '3': ['netflix', 'prime'],
    '4': ['hbo'], '5': ['prime'], '6': ['netflix'],
    '7': ['viaplay'], '8': ['disney'], '9': ['netflix'],
    '10': ['prime'], '11': ['svtplay', 'netflix'], '12': ['disney'],
    '13': ['prime'], '14': ['hbo'], '15': ['netflix'],
    '16': ['prime'], '17': ['apple'], '18': ['netflix'],
    '19': ['hbo'], '20': ['prime'],
  },
  US: {
    '1': ['netflix', 'prime'], '2': ['hbo', 'prime'], '3': ['netflix'],
    '4': ['prime'], '5': ['hbo'], '6': ['netflix', 'prime'],
    '7': ['prime'], '8': ['prime'], '9': ['netflix', 'hulu'],
    '10': ['prime'], '11': ['prime'], '12': ['disney'],
    '13': ['prime'], '14': ['prime'], '15': ['netflix'],
    '16': ['prime'], '17': ['apple'], '18': ['prime'],
    '19': ['prime'], '20': ['prime'],
  },
  GB: {
    '1': ['netflix'], '2': ['disney'], '3': ['netflix', 'prime'],
    '4': ['prime'], '5': ['prime'], '6': ['netflix'],
    '7': ['prime'], '8': ['prime'], '9': ['netflix'],
    '10': ['prime'], '11': ['prime'], '12': ['disney'],
    '13': ['prime'], '14': ['prime'], '15': ['netflix'],
    '16': ['prime'], '17': ['apple'], '18': ['prime'],
    '19': ['prime'], '20': ['prime'],
  },
};

// Simple movie data - poster is the focus
const MOVIES_BASE: Omit<Movie, 'availability'>[] = [
  { id: '1', title: 'The Midnight Garden', year: 2024, runtime: 118, posterUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&h=1200&fit=crop' },
  { id: '2', title: 'Steel Horizon', year: 2024, runtime: 142, posterUrl: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800&h=1200&fit=crop' },
  { id: '3', title: 'Love in Transit', year: 2023, runtime: 96, posterUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=800&h=1200&fit=crop' },
  { id: '4', title: 'The Last Algorithm', year: 2024, runtime: 128, posterUrl: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=800&h=1200&fit=crop' },
  { id: '5', title: 'Whispers of the Forest', year: 2023, runtime: 105, posterUrl: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=800&h=1200&fit=crop' },
  { id: '6', title: 'The Baker\'s Daughter', year: 2024, runtime: 112, posterUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&h=1200&fit=crop' },
  { id: '7', title: 'Velocity', year: 2024, runtime: 98, posterUrl: 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=800&h=1200&fit=crop' },
  { id: '8', title: 'Between Worlds', year: 2023, runtime: 134, posterUrl: 'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?w=800&h=1200&fit=crop' },
  { id: '9', title: 'Laughing Matter', year: 2024, runtime: 88, posterUrl: 'https://images.unsplash.com/photo-1585647347483-22b66260dfff?w=800&h=1200&fit=crop' },
  { id: '10', title: 'The Silent Cartographer', year: 2024, runtime: 145, posterUrl: 'https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?w=800&h=1200&fit=crop' },
  { id: '11', title: 'Shadows in the Snow', year: 2023, runtime: 116, posterUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=1200&fit=crop' },
  { id: '12', title: 'Pixel Hearts', year: 2024, runtime: 92, posterUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&h=1200&fit=crop' },
  { id: '13', title: 'The Weight of Water', year: 2024, runtime: 108, posterUrl: 'https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=800&h=1200&fit=crop' },
  { id: '14', title: 'Neon Requiem', year: 2023, runtime: 121, posterUrl: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&h=1200&fit=crop' },
  { id: '15', title: 'Summer of \'89', year: 2024, runtime: 95, posterUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=1200&fit=crop' },
  { id: '16', title: 'The Inheritance', year: 2024, runtime: 138, posterUrl: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&h=1200&fit=crop' },
  { id: '17', title: 'Orbit', year: 2024, runtime: 152, posterUrl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=800&h=1200&fit=crop' },
  { id: '18', title: 'The Art of Letting Go', year: 2023, runtime: 104, posterUrl: 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=800&h=1200&fit=crop' },
  { id: '19', title: 'Frostbite', year: 2024, runtime: 99, posterUrl: 'https://images.unsplash.com/photo-1478827536114-da961b7f86d2?w=800&h=1200&fit=crop' },
  { id: '20', title: 'The Grand Illusion', year: 2024, runtime: 126, posterUrl: 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=800&h=1200&fit=crop' },
];

// Get movies available in a country
export function getMovies(countryCode: string): Movie[] {
  const countryAvailability = AVAILABILITY_MAP[countryCode] || AVAILABILITY_MAP['US'];

  return MOVIES_BASE
    .filter((movie) => countryAvailability[movie.id])
    .map((movie) => ({
      ...movie,
      availability: countryAvailability[movie.id].map((serviceId) => ({
        serviceId,
        type: 'stream' as const,
      })),
    }));
}

// Get unseen movies (filter out already swiped)
export function getUnseenMovies(
  countryCode: string,
  likedIds: string[],
  passedIds: string[]
): Movie[] {
  const allMovies = getMovies(countryCode);
  const seenIds = new Set([...likedIds, ...passedIds]);
  return allMovies.filter((m) => !seenIds.has(m.id));
}

// Filter by mood
export function filterByMood(movies: Movie[], mood: Mood): Movie[] {
  switch (mood) {
    case 'short':
      return movies.filter((m) => m.runtime <= 100);
    case 'calm':
    case 'fun':
    case 'intense':
    default:
      // Shuffle for variety
      return [...movies].sort(() => Math.random() - 0.5);
  }
}

// Get single movie
export function getMovie(id: string, countryCode: string): Movie | null {
  const movies = getMovies(countryCode);
  return movies.find((m) => m.id === id) || null;
}
