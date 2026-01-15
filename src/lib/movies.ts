import { Movie, MovieAvailability, Country } from './types';
import { STREAMING_SERVICES, SUPPORTED_COUNTRIES } from './constants';

// Mock movie data with realistic streaming availability per country
// In production, this would come from a real API like JustWatch, TMDB, or similar

const generateMockAvailability = (countryCode: string): MovieAvailability[] => {
  // Simulate different availability per country
  const availabilityMap: Record<string, string[]> = {
    'SE': ['netflix', 'disney', 'hbo', 'prime'],
    'US': ['netflix', 'hulu', 'disney', 'prime', 'hbo', 'paramount', 'peacock', 'apple'],
    'GB': ['netflix', 'disney', 'prime', 'apple'],
    'DE': ['netflix', 'disney', 'prime', 'apple'],
    'FR': ['netflix', 'disney', 'prime', 'apple'],
    'ES': ['netflix', 'disney', 'prime', 'hbo'],
    'IT': ['netflix', 'disney', 'prime'],
    'NL': ['netflix', 'disney', 'prime', 'hbo'],
    'NO': ['netflix', 'disney', 'hbo', 'prime'],
    'DK': ['netflix', 'disney', 'hbo', 'prime'],
    'FI': ['netflix', 'disney', 'prime'],
    'AU': ['netflix', 'disney', 'prime', 'paramount'],
    'CA': ['netflix', 'disney', 'prime', 'paramount', 'apple'],
    'JP': ['netflix', 'disney', 'prime', 'apple'],
    'BR': ['netflix', 'disney', 'prime'],
    'MX': ['netflix', 'disney', 'prime', 'hbo'],
    'IN': ['netflix', 'disney', 'prime'],
  };

  const availableServices = availabilityMap[countryCode] || ['netflix', 'prime'];
  const result: MovieAvailability[] = [];

  // Randomly assign some services as stream, rent, or buy
  availableServices.forEach((serviceId, index) => {
    const service = STREAMING_SERVICES.find((s) => s.id === serviceId);
    if (!service) return;

    // First 2-3 services are streaming
    if (index < 2 + Math.floor(Math.random() * 2)) {
      result.push({ service, type: 'stream' });
    } else if (index < 4) {
      // Next might be rent/buy
      const price = Math.floor(Math.random() * 5) + 3;
      result.push({
        service,
        type: Math.random() > 0.5 ? 'rent' : 'buy',
        price: price * (Math.random() > 0.5 ? 1 : 2),
      });
    }
  });

  return result;
};

// Comprehensive mock movie database
const MOCK_MOVIES_BASE: Omit<Movie, 'availability'>[] = [
  {
    id: '1',
    title: 'The Midnight Garden',
    year: 2024,
    runtime: 118,
    posterUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500',
    backdropUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1200',
    genres: ['Drama', 'Mystery'],
    rating: 7.8,
    overview: 'A botanist discovers a hidden garden that only blooms at midnight, leading her to uncover secrets about her family\'s past.',
    director: 'Sofia Andersson',
    cast: ['Emma Stone', 'Oscar Isaac', 'Tilda Swinton'],
  },
  {
    id: '2',
    title: 'Steel Horizon',
    year: 2024,
    runtime: 142,
    posterUrl: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=500',
    backdropUrl: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=1200',
    genres: ['Action', 'Science Fiction'],
    rating: 8.1,
    overview: 'In a world where humanity lives in massive mobile cities, a mechanic uncovers a conspiracy that threatens everything.',
    director: 'Denis Villeneuve',
    cast: ['Timothée Chalamet', 'Zendaya', 'Josh Brolin'],
  },
  {
    id: '3',
    title: 'Love in Transit',
    year: 2023,
    runtime: 96,
    posterUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=500',
    backdropUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=1200',
    genres: ['Romance', 'Comedy'],
    rating: 7.2,
    overview: 'Two strangers meet on a delayed flight and spend 24 hours together in a foreign city.',
    director: 'Richard Curtis',
    cast: ['Florence Pugh', 'Andrew Garfield'],
  },
  {
    id: '4',
    title: 'The Last Algorithm',
    year: 2024,
    runtime: 128,
    posterUrl: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=500',
    backdropUrl: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=1200',
    genres: ['Thriller', 'Science Fiction'],
    rating: 8.4,
    overview: 'A programmer creates an AI that predicts crimes, but when it predicts her own death, she must race to change her fate.',
    director: 'Christopher Nolan',
    cast: ['Margot Robbie', 'Daniel Kaluuya', 'Michael Caine'],
  },
  {
    id: '5',
    title: 'Whispers of the Forest',
    year: 2023,
    runtime: 105,
    posterUrl: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=500',
    backdropUrl: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=1200',
    genres: ['Fantasy', 'Adventure'],
    rating: 7.9,
    overview: 'A young woman inherits a cabin in an ancient forest and discovers she can communicate with the trees.',
    director: 'Guillermo del Toro',
    cast: ['Saoirse Ronan', 'Doug Jones', 'Sally Hawkins'],
  },
  {
    id: '6',
    title: 'The Baker\'s Daughter',
    year: 2024,
    runtime: 112,
    posterUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500',
    backdropUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200',
    genres: ['Drama', 'Family'],
    rating: 7.5,
    overview: 'After her father falls ill, a woman returns to her small hometown to save the family bakery.',
    director: 'Greta Gerwig',
    cast: ['Carey Mulligan', 'Stanley Tucci', 'Helen Mirren'],
  },
  {
    id: '7',
    title: 'Velocity',
    year: 2024,
    runtime: 98,
    posterUrl: 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=500',
    backdropUrl: 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=1200',
    genres: ['Action', 'Thriller'],
    rating: 7.0,
    overview: 'A street racer is recruited by an intelligence agency to stop an international smuggling ring.',
    director: 'Chad Stahelski',
    cast: ['Idris Elba', 'Ana de Armas', 'John Cena'],
  },
  {
    id: '8',
    title: 'Between Worlds',
    year: 2023,
    runtime: 134,
    posterUrl: 'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?w=500',
    backdropUrl: 'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?w=1200',
    genres: ['Drama', 'Romance'],
    rating: 8.2,
    overview: 'A translator falls in love with a diplomat from a country at war with her own.',
    director: 'Wong Kar-wai',
    cast: ['Gemma Chan', 'Rami Malek', 'Michelle Yeoh'],
  },
  {
    id: '9',
    title: 'Laughing Matter',
    year: 2024,
    runtime: 88,
    posterUrl: 'https://images.unsplash.com/photo-1585647347483-22b66260dfff?w=500',
    backdropUrl: 'https://images.unsplash.com/photo-1585647347483-22b66260dfff?w=1200',
    genres: ['Comedy'],
    rating: 7.3,
    overview: 'A struggling stand-up comedian accidentally becomes famous when her worst set goes viral.',
    director: 'Judd Apatow',
    cast: ['Awkwafina', 'Pete Davidson', 'Maya Rudolph'],
  },
  {
    id: '10',
    title: 'The Silent Cartographer',
    year: 2024,
    runtime: 145,
    posterUrl: 'https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?w=500',
    backdropUrl: 'https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?w=1200',
    genres: ['Adventure', 'History'],
    rating: 8.0,
    overview: 'The true story of a mapmaker who discovered a lost civilization in the 1920s Amazon.',
    director: 'James Gray',
    cast: ['Dev Patel', 'Robert Pattinson', 'Cate Blanchett'],
  },
  {
    id: '11',
    title: 'Shadows in the Snow',
    year: 2023,
    runtime: 116,
    posterUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500',
    backdropUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200',
    genres: ['Thriller', 'Mystery'],
    rating: 7.7,
    overview: 'A detective investigates a series of disappearances in a remote Scandinavian village during winter.',
    director: 'David Fincher',
    cast: ['Rebecca Ferguson', 'Alexander Skarsgård', 'Stellan Skarsgård'],
  },
  {
    id: '12',
    title: 'Pixel Hearts',
    year: 2024,
    runtime: 92,
    posterUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=500',
    backdropUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200',
    genres: ['Animation', 'Comedy', 'Family'],
    rating: 8.3,
    overview: 'A video game character discovers she\'s been living in a retro arcade game and sets out to find the modern gaming world.',
    director: 'Phil Lord',
    cast: ['Zoe Saldaña', 'Jack Black', 'Keanu Reeves'],
  },
  {
    id: '13',
    title: 'The Weight of Water',
    year: 2024,
    runtime: 108,
    posterUrl: 'https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=500',
    backdropUrl: 'https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=1200',
    genres: ['Drama', 'Documentary'],
    rating: 8.5,
    overview: 'A documentary following three families across the world dealing with water scarcity.',
    director: 'Chloé Zhao',
    cast: ['Narrated by Lupita Nyong\'o'],
  },
  {
    id: '14',
    title: 'Neon Requiem',
    year: 2023,
    runtime: 121,
    posterUrl: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=500',
    backdropUrl: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200',
    genres: ['Science Fiction', 'Crime'],
    rating: 7.6,
    overview: 'In a neon-lit future city, a private investigator takes on a case that will unravel the fabric of reality.',
    director: 'Ridley Scott',
    cast: ['Ryan Gosling', 'Jenna Ortega', 'Harrison Ford'],
  },
  {
    id: '15',
    title: 'Summer of \'89',
    year: 2024,
    runtime: 95,
    posterUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500',
    backdropUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200',
    genres: ['Comedy', 'Romance'],
    rating: 7.1,
    overview: 'A coming-of-age story about three friends spending their last summer together before college.',
    director: 'Bo Burnham',
    cast: ['Rachel Zegler', 'Caleb McLaughlin', 'Sydney Sweeney'],
  },
  {
    id: '16',
    title: 'The Inheritance',
    year: 2024,
    runtime: 138,
    posterUrl: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=500',
    backdropUrl: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200',
    genres: ['Drama', 'Mystery'],
    rating: 8.0,
    overview: 'When a billionaire dies, his estranged family gathers at his estate for a reading of the will that reveals dark secrets.',
    director: 'Rian Johnson',
    cast: ['Daniel Craig', 'Jamie Lee Curtis', 'Chris Evans'],
  },
  {
    id: '17',
    title: 'Orbit',
    year: 2024,
    runtime: 152,
    posterUrl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=500',
    backdropUrl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=1200',
    genres: ['Science Fiction', 'Drama'],
    rating: 8.7,
    overview: 'Astronauts on a mission to Mars must make impossible choices when communication with Earth is lost.',
    director: 'Alfonso Cuarón',
    cast: ['Jessica Chastain', 'Chiwetel Ejiofor', 'Matt Damon'],
  },
  {
    id: '18',
    title: 'The Art of Letting Go',
    year: 2023,
    runtime: 104,
    posterUrl: 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=500',
    backdropUrl: 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=1200',
    genres: ['Drama', 'Romance'],
    rating: 7.4,
    overview: 'A widow learns to love again while sorting through her late husband\'s art collection.',
    director: 'Sarah Polley',
    cast: ['Viola Davis', 'Mahershala Ali', 'Frances McDormand'],
  },
  {
    id: '19',
    title: 'Frostbite',
    year: 2024,
    runtime: 99,
    posterUrl: 'https://images.unsplash.com/photo-1478827536114-da961b7f86d2?w=500',
    backdropUrl: 'https://images.unsplash.com/photo-1478827536114-da961b7f86d2?w=1200',
    genres: ['Horror', 'Thriller'],
    rating: 6.8,
    overview: 'A group of researchers at an Arctic station discover something ancient frozen in the ice.',
    director: 'John Krasinski',
    cast: ['Emily Blunt', 'Millicent Simmonds', 'Noah Jupe'],
  },
  {
    id: '20',
    title: 'The Grand Illusion',
    year: 2024,
    runtime: 126,
    posterUrl: 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=500',
    backdropUrl: 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=1200',
    genres: ['Crime', 'Thriller'],
    rating: 8.1,
    overview: 'A master thief plans one last heist against the world\'s most secure casino.',
    director: 'Steven Soderbergh',
    cast: ['George Clooney', 'Brad Pitt', 'Julia Roberts'],
  },
];

// Generate movies with country-specific availability
export function getMoviesForCountry(countryCode: string): Movie[] {
  return MOCK_MOVIES_BASE.map((movie) => ({
    ...movie,
    availability: generateMockAvailability(countryCode),
  })).filter((movie) => movie.availability.length > 0); // Only return movies with availability
}

// Get a single movie by ID with country-specific availability
export function getMovieById(id: string, countryCode: string): Movie | null {
  const baseMovie = MOCK_MOVIES_BASE.find((m) => m.id === id);
  if (!baseMovie) return null;

  const availability = generateMockAvailability(countryCode);
  if (availability.length === 0) return null; // Not available in this country

  return {
    ...baseMovie,
    availability,
  };
}

// Filter movies by mood
export function filterMoviesByMood(movies: Movie[], mood: string): Movie[] {
  switch (mood) {
    case 'calm':
      return movies.filter((m) =>
        m.genres.some((g) => ['Drama', 'Documentary', 'Romance'].includes(g))
      );
    case 'fun':
      return movies.filter((m) =>
        m.genres.some((g) => ['Comedy', 'Animation', 'Family'].includes(g))
      );
    case 'deep':
      return movies.filter((m) =>
        m.genres.some((g) => ['Drama', 'History', 'Documentary'].includes(g)) && m.rating >= 7.5
      );
    case 'unexpected':
      // Return a shuffled subset
      return [...movies].sort(() => Math.random() - 0.5).slice(0, 10);
    case 'short':
      return movies.filter((m) => m.runtime <= 100);
    default:
      return movies;
  }
}

// Weighted recommendation based on user preferences
export function getRecommendedMovies(
  movies: Movie[],
  likedMovies: string[],
  passedMovies: string[],
  preferredGenres: string[]
): Movie[] {
  // Filter out already swiped movies
  const unseenMovies = movies.filter(
    (m) => !likedMovies.includes(m.id) && !passedMovies.includes(m.id)
  );

  // Score each movie based on preferences
  const scoredMovies = unseenMovies.map((movie) => {
    let score = 0;

    // Genre preference scoring
    movie.genres.forEach((genre) => {
      if (preferredGenres.includes(genre)) {
        score += 2;
      }
    });

    // Rating bonus
    score += movie.rating / 2;

    // Recency bonus (newer movies slightly preferred)
    if (movie.year >= 2024) score += 1;

    return { movie, score };
  });

  // Sort by score (highest first) with some randomness
  return scoredMovies
    .sort((a, b) => b.score - a.score + (Math.random() - 0.5) * 2)
    .map((s) => s.movie);
}
