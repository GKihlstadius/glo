import { Movie, Mood, StreamingOffer } from './types';

// Provider deep link templates by region
// Universal links preferred (opens app if installed, falls back to web)
const PROVIDER_LINKS: Record<string, Record<string, { deepLink: string; webUrl: string }>> = {
  netflix: {
    US: { deepLink: 'https://www.netflix.com/title/{id}', webUrl: 'https://www.netflix.com/title/{id}' },
    SE: { deepLink: 'https://www.netflix.com/se/title/{id}', webUrl: 'https://www.netflix.com/se/title/{id}' },
    GB: { deepLink: 'https://www.netflix.com/gb/title/{id}', webUrl: 'https://www.netflix.com/gb/title/{id}' },
    DEFAULT: { deepLink: 'https://www.netflix.com/title/{id}', webUrl: 'https://www.netflix.com/title/{id}' },
  },
  prime: {
    US: { deepLink: 'https://www.amazon.com/gp/video/detail/{id}', webUrl: 'https://www.amazon.com/gp/video/detail/{id}' },
    SE: { deepLink: 'https://www.primevideo.com/detail/{id}', webUrl: 'https://www.primevideo.com/detail/{id}' },
    GB: { deepLink: 'https://www.amazon.co.uk/gp/video/detail/{id}', webUrl: 'https://www.amazon.co.uk/gp/video/detail/{id}' },
    DEFAULT: { deepLink: 'https://www.primevideo.com/detail/{id}', webUrl: 'https://www.primevideo.com/detail/{id}' },
  },
  disney: {
    DEFAULT: { deepLink: 'https://www.disneyplus.com/movies/{slug}', webUrl: 'https://www.disneyplus.com/movies/{slug}' },
  },
  hbo: {
    US: { deepLink: 'https://play.max.com/movie/{id}', webUrl: 'https://play.max.com/movie/{id}' },
    SE: { deepLink: 'https://play.max.com/movie/{id}', webUrl: 'https://play.max.com/movie/{id}' },
    DEFAULT: { deepLink: 'https://play.max.com/movie/{id}', webUrl: 'https://play.max.com/movie/{id}' },
  },
  apple: {
    DEFAULT: { deepLink: 'https://tv.apple.com/movie/{id}', webUrl: 'https://tv.apple.com/movie/{id}' },
  },
  viaplay: {
    SE: { deepLink: 'https://viaplay.se/filmer/{slug}', webUrl: 'https://viaplay.se/filmer/{slug}' },
    DEFAULT: { deepLink: 'https://viaplay.com/movies/{slug}', webUrl: 'https://viaplay.com/movies/{slug}' },
  },
  svtplay: {
    SE: { deepLink: 'https://www.svtplay.se/video/{id}', webUrl: 'https://www.svtplay.se/video/{id}' },
    DEFAULT: { deepLink: 'https://www.svtplay.se/video/{id}', webUrl: 'https://www.svtplay.se/video/{id}' },
  },
  hulu: {
    US: { deepLink: 'https://www.hulu.com/movie/{id}', webUrl: 'https://www.hulu.com/movie/{id}' },
    DEFAULT: { deepLink: 'https://www.hulu.com/movie/{id}', webUrl: 'https://www.hulu.com/movie/{id}' },
  },
};

// Availability per country with provider-specific IDs for deep linking
interface AvailabilityEntry {
  services: string[];
  providerIds: Record<string, string>; // serviceId -> provider-specific movie ID
}

const AVAILABILITY_MAP: Record<string, Record<string, AvailabilityEntry>> = {
  SE: {
    '1': { services: ['netflix'], providerIds: { netflix: '81234567' } },
    '2': { services: ['disney'], providerIds: { disney: 'steel-horizon' } },
    '3': { services: ['netflix', 'prime'], providerIds: { netflix: '81234568', prime: 'B09ABCDEF' } },
    '4': { services: ['hbo'], providerIds: { hbo: 'urn:hbo:feature:GXKHzNQ' } },
    '5': { services: ['prime'], providerIds: { prime: 'B09GHIJKL' } },
    '6': { services: ['netflix'], providerIds: { netflix: '81234569' } },
    '7': { services: ['viaplay'], providerIds: { viaplay: 'velocity-2024' } },
    '8': { services: ['disney'], providerIds: { disney: 'between-worlds' } },
    '9': { services: ['netflix'], providerIds: { netflix: '81234570' } },
    '10': { services: ['prime'], providerIds: { prime: 'B09MNOPQR' } },
    '11': { services: ['svtplay', 'netflix'], providerIds: { svtplay: 'jE2bKrx', netflix: '81234571' } },
    '12': { services: ['disney'], providerIds: { disney: 'pixel-hearts' } },
    '13': { services: ['prime'], providerIds: { prime: 'B09STUVWX' } },
    '14': { services: ['hbo'], providerIds: { hbo: 'urn:hbo:feature:GXNeonR' } },
    '15': { services: ['netflix'], providerIds: { netflix: '81234572' } },
    '16': { services: ['prime'], providerIds: { prime: 'B09YZ1234' } },
    '17': { services: ['apple'], providerIds: { apple: 'umc.cmc.orbit2024' } },
    '18': { services: ['netflix'], providerIds: { netflix: '81234573' } },
    '19': { services: ['hbo'], providerIds: { hbo: 'urn:hbo:feature:GXFrost' } },
    '20': { services: ['prime'], providerIds: { prime: 'B09567890' } },
  },
  US: {
    '1': { services: ['netflix', 'prime'], providerIds: { netflix: '81234567', prime: 'B09AAAUS1' } },
    '2': { services: ['hbo', 'prime'], providerIds: { hbo: 'urn:hbo:feature:GXSteelH', prime: 'B09AAAUS2' } },
    '3': { services: ['netflix'], providerIds: { netflix: '81234568' } },
    '4': { services: ['prime'], providerIds: { prime: 'B09AAAUS4' } },
    '5': { services: ['hbo'], providerIds: { hbo: 'urn:hbo:feature:GXWhispr' } },
    '6': { services: ['netflix', 'prime'], providerIds: { netflix: '81234569', prime: 'B09AAAUS6' } },
    '7': { services: ['prime'], providerIds: { prime: 'B09AAAUS7' } },
    '8': { services: ['prime'], providerIds: { prime: 'B09AAAUS8' } },
    '9': { services: ['netflix', 'hulu'], providerIds: { netflix: '81234570', hulu: 'laughing-matter' } },
    '10': { services: ['prime'], providerIds: { prime: 'B09AAAUS10' } },
    '11': { services: ['prime'], providerIds: { prime: 'B09AAAUS11' } },
    '12': { services: ['disney'], providerIds: { disney: 'pixel-hearts' } },
    '13': { services: ['prime'], providerIds: { prime: 'B09AAAUS13' } },
    '14': { services: ['prime'], providerIds: { prime: 'B09AAAUS14' } },
    '15': { services: ['netflix'], providerIds: { netflix: '81234572' } },
    '16': { services: ['prime'], providerIds: { prime: 'B09AAAUS16' } },
    '17': { services: ['apple'], providerIds: { apple: 'umc.cmc.orbit2024' } },
    '18': { services: ['prime'], providerIds: { prime: 'B09AAAUS18' } },
    '19': { services: ['prime'], providerIds: { prime: 'B09AAAUS19' } },
    '20': { services: ['prime'], providerIds: { prime: 'B09AAAUS20' } },
  },
  GB: {
    '1': { services: ['netflix'], providerIds: { netflix: '81234567' } },
    '2': { services: ['disney'], providerIds: { disney: 'steel-horizon' } },
    '3': { services: ['netflix', 'prime'], providerIds: { netflix: '81234568', prime: 'B09GBGB03' } },
    '4': { services: ['prime'], providerIds: { prime: 'B09GBGB04' } },
    '5': { services: ['prime'], providerIds: { prime: 'B09GBGB05' } },
    '6': { services: ['netflix'], providerIds: { netflix: '81234569' } },
    '7': { services: ['prime'], providerIds: { prime: 'B09GBGB07' } },
    '8': { services: ['prime'], providerIds: { prime: 'B09GBGB08' } },
    '9': { services: ['netflix'], providerIds: { netflix: '81234570' } },
    '10': { services: ['prime'], providerIds: { prime: 'B09GBGB10' } },
    '11': { services: ['prime'], providerIds: { prime: 'B09GBGB11' } },
    '12': { services: ['disney'], providerIds: { disney: 'pixel-hearts' } },
    '13': { services: ['prime'], providerIds: { prime: 'B09GBGB13' } },
    '14': { services: ['prime'], providerIds: { prime: 'B09GBGB14' } },
    '15': { services: ['netflix'], providerIds: { netflix: '81234572' } },
    '16': { services: ['prime'], providerIds: { prime: 'B09GBGB16' } },
    '17': { services: ['apple'], providerIds: { apple: 'umc.cmc.orbit2024' } },
    '18': { services: ['prime'], providerIds: { prime: 'B09GBGB18' } },
    '19': { services: ['prime'], providerIds: { prime: 'B09GBGB19' } },
    '20': { services: ['prime'], providerIds: { prime: 'B09GBGB20' } },
  },
};

// Extended movie data with feed algorithm metadata
interface MovieBase {
  id: string;
  title: string;
  year: number;
  runtime: number;
  posterUrl: string;
  genres: string[];
  mood: ('calm' | 'fun' | 'intense')[];
  era: 'classic' | 'modern' | 'recent';
  popularity: number;
}

const MOVIES_BASE: MovieBase[] = [
  { id: '1', title: 'The Midnight Garden', year: 2024, runtime: 118, posterUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&h=1200&fit=crop', genres: ['drama', 'mystery'], mood: ['calm'], era: 'recent', popularity: 75 },
  { id: '2', title: 'Steel Horizon', year: 2024, runtime: 142, posterUrl: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800&h=1200&fit=crop', genres: ['action', 'scifi'], mood: ['intense'], era: 'recent', popularity: 88 },
  { id: '3', title: 'Love in Transit', year: 2023, runtime: 96, posterUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=800&h=1200&fit=crop', genres: ['romance', 'comedy'], mood: ['fun', 'calm'], era: 'recent', popularity: 72 },
  { id: '4', title: 'The Last Algorithm', year: 2024, runtime: 128, posterUrl: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=800&h=1200&fit=crop', genres: ['thriller', 'scifi'], mood: ['intense'], era: 'recent', popularity: 81 },
  { id: '5', title: 'Whispers of the Forest', year: 2023, runtime: 105, posterUrl: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=800&h=1200&fit=crop', genres: ['drama', 'fantasy'], mood: ['calm'], era: 'recent', popularity: 68 },
  { id: '6', title: 'The Baker\'s Daughter', year: 2024, runtime: 112, posterUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&h=1200&fit=crop', genres: ['drama', 'romance'], mood: ['calm'], era: 'recent', popularity: 65 },
  { id: '7', title: 'Velocity', year: 2024, runtime: 98, posterUrl: 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=800&h=1200&fit=crop', genres: ['action', 'thriller'], mood: ['intense', 'fun'], era: 'recent', popularity: 79 },
  { id: '8', title: 'Between Worlds', year: 2023, runtime: 134, posterUrl: 'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?w=800&h=1200&fit=crop', genres: ['fantasy', 'adventure'], mood: ['fun'], era: 'recent', popularity: 77 },
  { id: '9', title: 'Laughing Matter', year: 2024, runtime: 88, posterUrl: 'https://images.unsplash.com/photo-1585647347483-22b66260dfff?w=800&h=1200&fit=crop', genres: ['comedy'], mood: ['fun'], era: 'recent', popularity: 71 },
  { id: '10', title: 'The Silent Cartographer', year: 2024, runtime: 145, posterUrl: 'https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?w=800&h=1200&fit=crop', genres: ['drama', 'mystery'], mood: ['calm', 'intense'], era: 'recent', popularity: 82 },
  { id: '11', title: 'Shadows in the Snow', year: 2023, runtime: 116, posterUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=1200&fit=crop', genres: ['thriller', 'drama'], mood: ['intense', 'calm'], era: 'recent', popularity: 74 },
  { id: '12', title: 'Pixel Hearts', year: 2024, runtime: 92, posterUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&h=1200&fit=crop', genres: ['animation', 'comedy', 'romance'], mood: ['fun'], era: 'recent', popularity: 83 },
  { id: '13', title: 'The Weight of Water', year: 2024, runtime: 108, posterUrl: 'https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=800&h=1200&fit=crop', genres: ['drama'], mood: ['calm'], era: 'recent', popularity: 69 },
  { id: '14', title: 'Neon Requiem', year: 2023, runtime: 121, posterUrl: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&h=1200&fit=crop', genres: ['action', 'scifi', 'thriller'], mood: ['intense'], era: 'recent', popularity: 86 },
  { id: '15', title: 'Summer of \'89', year: 2024, runtime: 95, posterUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=1200&fit=crop', genres: ['drama', 'romance'], mood: ['calm', 'fun'], era: 'recent', popularity: 73 },
  { id: '16', title: 'The Inheritance', year: 2024, runtime: 138, posterUrl: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&h=1200&fit=crop', genres: ['drama', 'mystery', 'thriller'], mood: ['intense', 'calm'], era: 'recent', popularity: 76 },
  { id: '17', title: 'Orbit', year: 2024, runtime: 152, posterUrl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=800&h=1200&fit=crop', genres: ['scifi', 'drama', 'adventure'], mood: ['intense', 'calm'], era: 'recent', popularity: 91 },
  { id: '18', title: 'The Art of Letting Go', year: 2023, runtime: 104, posterUrl: 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=800&h=1200&fit=crop', genres: ['drama', 'romance'], mood: ['calm'], era: 'recent', popularity: 67 },
  { id: '19', title: 'Frostbite', year: 2024, runtime: 99, posterUrl: 'https://images.unsplash.com/photo-1478827536114-da961b7f86d2?w=800&h=1200&fit=crop', genres: ['horror', 'thriller'], mood: ['intense'], era: 'recent', popularity: 78 },
  { id: '20', title: 'The Grand Illusion', year: 2024, runtime: 126, posterUrl: 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=800&h=1200&fit=crop', genres: ['drama', 'mystery'], mood: ['calm', 'intense'], era: 'recent', popularity: 80 },
  // Additional movies to ensure infinite feed
  { id: '21', title: 'Echoes of Tomorrow', year: 2024, runtime: 115, posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&h=1200&fit=crop', genres: ['scifi', 'drama'], mood: ['calm', 'intense'], era: 'recent', popularity: 70 },
  { id: '22', title: 'The Comedian', year: 2023, runtime: 102, posterUrl: 'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=800&h=1200&fit=crop', genres: ['comedy', 'drama'], mood: ['fun'], era: 'recent', popularity: 66 },
  { id: '23', title: 'Dark Waters', year: 2024, runtime: 118, posterUrl: 'https://images.unsplash.com/photo-1551244072-5d12893278ab?w=800&h=1200&fit=crop', genres: ['thriller', 'mystery'], mood: ['intense'], era: 'recent', popularity: 74 },
  { id: '24', title: 'Golden Hour', year: 2024, runtime: 94, posterUrl: 'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=800&h=1200&fit=crop', genres: ['romance', 'drama'], mood: ['calm'], era: 'recent', popularity: 71 },
  { id: '25', title: 'The Recruit', year: 2023, runtime: 108, posterUrl: 'https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?w=800&h=1200&fit=crop', genres: ['action', 'thriller'], mood: ['intense', 'fun'], era: 'recent', popularity: 77 },
  { id: '26', title: 'Parallel Lives', year: 2024, runtime: 125, posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&h=1200&fit=crop', genres: ['scifi', 'drama', 'romance'], mood: ['calm'], era: 'recent', popularity: 73 },
  { id: '27', title: 'Wild Card', year: 2024, runtime: 96, posterUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&h=1200&fit=crop', genres: ['comedy', 'action'], mood: ['fun'], era: 'recent', popularity: 69 },
  { id: '28', title: 'The Last Light', year: 2023, runtime: 132, posterUrl: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=800&h=1200&fit=crop', genres: ['drama', 'thriller'], mood: ['intense', 'calm'], era: 'recent', popularity: 81 },
  { id: '29', title: 'Starfall', year: 2024, runtime: 140, posterUrl: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=800&h=1200&fit=crop', genres: ['scifi', 'adventure'], mood: ['fun', 'intense'], era: 'recent', popularity: 85 },
  { id: '30', title: 'The Quiet Ones', year: 2024, runtime: 98, posterUrl: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800&h=1200&fit=crop', genres: ['horror', 'thriller'], mood: ['intense'], era: 'recent', popularity: 72 },
];

// Extended availability for new movies
const EXTENDED_AVAILABILITY: Record<string, Record<string, AvailabilityEntry>> = {
  SE: {
    '21': { services: ['netflix'], providerIds: { netflix: '81234580' } },
    '22': { services: ['prime'], providerIds: { prime: 'B09SE2222' } },
    '23': { services: ['hbo'], providerIds: { hbo: 'urn:hbo:feature:GXDarkW' } },
    '24': { services: ['netflix', 'viaplay'], providerIds: { netflix: '81234581', viaplay: 'golden-hour' } },
    '25': { services: ['prime'], providerIds: { prime: 'B09SE2525' } },
    '26': { services: ['netflix'], providerIds: { netflix: '81234582' } },
    '27': { services: ['prime', 'viaplay'], providerIds: { prime: 'B09SE2727', viaplay: 'wild-card' } },
    '28': { services: ['hbo'], providerIds: { hbo: 'urn:hbo:feature:GXLastL' } },
    '29': { services: ['disney'], providerIds: { disney: 'starfall-2024' } },
    '30': { services: ['netflix'], providerIds: { netflix: '81234583' } },
  },
  US: {
    '21': { services: ['netflix', 'prime'], providerIds: { netflix: '81234580', prime: 'B09US2121' } },
    '22': { services: ['hulu'], providerIds: { hulu: 'the-comedian' } },
    '23': { services: ['hbo'], providerIds: { hbo: 'urn:hbo:feature:GXDarkW' } },
    '24': { services: ['netflix'], providerIds: { netflix: '81234581' } },
    '25': { services: ['prime', 'hulu'], providerIds: { prime: 'B09US2525', hulu: 'the-recruit' } },
    '26': { services: ['prime'], providerIds: { prime: 'B09US2626' } },
    '27': { services: ['netflix'], providerIds: { netflix: '81234584' } },
    '28': { services: ['hbo'], providerIds: { hbo: 'urn:hbo:feature:GXLastL' } },
    '29': { services: ['disney'], providerIds: { disney: 'starfall-2024' } },
    '30': { services: ['prime'], providerIds: { prime: 'B09US3030' } },
  },
  GB: {
    '21': { services: ['netflix'], providerIds: { netflix: '81234580' } },
    '22': { services: ['prime'], providerIds: { prime: 'B09GB2222' } },
    '23': { services: ['prime'], providerIds: { prime: 'B09GB2323' } },
    '24': { services: ['netflix'], providerIds: { netflix: '81234581' } },
    '25': { services: ['prime'], providerIds: { prime: 'B09GB2525' } },
    '26': { services: ['netflix', 'prime'], providerIds: { netflix: '81234582', prime: 'B09GB2626' } },
    '27': { services: ['prime'], providerIds: { prime: 'B09GB2727' } },
    '28': { services: ['prime'], providerIds: { prime: 'B09GB2828' } },
    '29': { services: ['disney'], providerIds: { disney: 'starfall-2024' } },
    '30': { services: ['netflix'], providerIds: { netflix: '81234583' } },
  },
};

// Merge availability maps
function getAvailabilityMap(countryCode: string): Record<string, AvailabilityEntry> {
  const base = AVAILABILITY_MAP[countryCode] || AVAILABILITY_MAP['US'];
  const extended = EXTENDED_AVAILABILITY[countryCode] || EXTENDED_AVAILABILITY['US'];
  return { ...base, ...extended };
}

// Build streaming offers with deep links for a movie
export function getStreamingOffers(movieId: string, countryCode: string): StreamingOffer[] {
  const availability = getAvailabilityMap(countryCode);
  const entry = availability[movieId];
  if (!entry) return [];

  return entry.services.map((serviceId) => {
    const providerId = entry.providerIds[serviceId] || movieId;
    const linkConfig = PROVIDER_LINKS[serviceId]?.[countryCode] || PROVIDER_LINKS[serviceId]?.['DEFAULT'];

    let deepLink: string | undefined;
    let webUrl: string | undefined;

    if (linkConfig) {
      deepLink = linkConfig.deepLink.replace('{id}', providerId).replace('{slug}', providerId);
      webUrl = linkConfig.webUrl.replace('{id}', providerId).replace('{slug}', providerId);
    }

    return {
      serviceId,
      type: 'stream' as const,
      deepLink,
      webUrl,
    };
  });
}

// Get movies available in a country
export function getMovies(countryCode: string): Movie[] {
  const availability = getAvailabilityMap(countryCode);

  return MOVIES_BASE
    .filter((movie) => availability[movie.id])
    .map((movie) => ({
      id: movie.id,
      title: movie.title,
      year: movie.year,
      runtime: movie.runtime,
      posterUrl: movie.posterUrl,
      genres: movie.genres,
      mood: movie.mood,
      era: movie.era,
      popularity: movie.popularity,
      availability: availability[movie.id].services.map((serviceId) => ({
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
      return movies.filter((m) => m.mood?.includes('calm'));
    case 'fun':
      return movies.filter((m) => m.mood?.includes('fun'));
    case 'intense':
      return movies.filter((m) => m.mood?.includes('intense'));
    default:
      return [...movies].sort(() => Math.random() - 0.5);
  }
}

// Get single movie
export function getMovie(id: string, countryCode: string): Movie | null {
  const movies = getMovies(countryCode);
  return movies.find((m) => m.id === id) || null;
}

// Get total available movies count for a region
export function getCatalogSize(countryCode: string): number {
  return getMovies(countryCode).length;
}
