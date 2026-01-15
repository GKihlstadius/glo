import { Movie, Mood, StreamingOffer } from './types';

// TMDB Image base URL - official CDN
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

// Poster sizes: w185, w342, w500, w780, original
export function getPosterUrl(posterPath: string | null | undefined, size: 'w342' | 'w500' | 'w780' = 'w500'): string | null {
  if (!posterPath) return null;
  return `${TMDB_IMAGE_BASE}/${size}${posterPath}`;
}

// Backdrop sizes: w300, w780, w1280, original
export function getBackdropUrl(backdropPath: string | null | undefined, size: 'w780' | 'w1280' = 'w1280'): string | null {
  if (!backdropPath) return null;
  return `${TMDB_IMAGE_BASE}/${size}${backdropPath}`;
}

// Provider deep link templates by region
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
  hulu: {
    US: { deepLink: 'https://www.hulu.com/movie/{id}', webUrl: 'https://www.hulu.com/movie/{id}' },
    DEFAULT: { deepLink: 'https://www.hulu.com/movie/{id}', webUrl: 'https://www.hulu.com/movie/{id}' },
  },
};

// Real TMDB movie data - curated high-quality titles with official poster paths
// These are real movies from TMDB with actual poster paths
interface MovieData {
  id: string;
  tmdbId: number;
  title: string;
  year: number;
  releaseDate: string;
  runtime: number;
  posterPath: string; // TMDB poster path (e.g., /abc123.jpg)
  backdropPath?: string;
  genres: string[];
  mood: ('calm' | 'fun' | 'intense')[];
  era: 'classic' | 'modern' | 'recent';
  ratingAvg: number;
  ratingCount: number;
  popularityScore: number;
  directors: string[];
  cast: string[];
  overview?: string;
}

// Real movies with TMDB poster paths - all quality-vetted (rating >= 6.5, votes >= 1000)
const MOVIES_DATA: MovieData[] = [
  // TOP RATED - Critically acclaimed masterpieces
  { id: '1', tmdbId: 278, title: 'The Shawshank Redemption', year: 1994, releaseDate: '1994-09-23', runtime: 142, posterPath: '/9cqNxx0GxF0bflZmeSMuL5tnGzr.jpg', backdropPath: '/kXfqcdQKsToO0OUXHcrrNCHDBzO.jpg', genres: ['drama'], mood: ['calm', 'intense'], era: 'modern', ratingAvg: 8.7, ratingCount: 25000, popularityScore: 95, directors: ['Frank Darabont'], cast: ['Tim Robbins', 'Morgan Freeman'] },
  { id: '2', tmdbId: 238, title: 'The Godfather', year: 1972, releaseDate: '1972-03-14', runtime: 175, posterPath: '/3bhkrj58Vtu7enYsRolD1fZdja1.jpg', backdropPath: '/tmU7GeKVybMWFButWEGl2M4GeiP.jpg', genres: ['drama', 'crime'], mood: ['intense', 'calm'], era: 'classic', ratingAvg: 8.7, ratingCount: 19500, popularityScore: 92, directors: ['Francis Ford Coppola'], cast: ['Marlon Brando', 'Al Pacino'] },
  { id: '3', tmdbId: 240, title: 'The Godfather Part II', year: 1974, releaseDate: '1974-12-20', runtime: 202, posterPath: '/hek3koDUyRQk7FIhPXsa6mT2Zc3.jpg', backdropPath: '/kGzFbGhp99zva6oZODW5atUtnqi.jpg', genres: ['drama', 'crime'], mood: ['intense'], era: 'classic', ratingAvg: 8.6, ratingCount: 12000, popularityScore: 88, directors: ['Francis Ford Coppola'], cast: ['Al Pacino', 'Robert De Niro'] },
  { id: '4', tmdbId: 424, title: "Schindler's List", year: 1993, releaseDate: '1993-12-15', runtime: 195, posterPath: '/sF1U4EUQS8YHUYjNl3pMGNIQyr0.jpg', backdropPath: '/loRmRzQXZeqG78TqZuyvSlEQfZb.jpg', genres: ['drama', 'history'], mood: ['intense', 'calm'], era: 'modern', ratingAvg: 8.6, ratingCount: 15000, popularityScore: 90, directors: ['Steven Spielberg'], cast: ['Liam Neeson', 'Ralph Fiennes'] },
  { id: '5', tmdbId: 389, title: '12 Angry Men', year: 1957, releaseDate: '1957-04-10', runtime: 96, posterPath: '/ow3wq89wM8qd5X7hWKxiRfsFf9C.jpg', backdropPath: '/qqHQsStV6exghCM7zbOuYYK2Aaa.jpg', genres: ['drama'], mood: ['intense'], era: 'classic', ratingAvg: 8.5, ratingCount: 8500, popularityScore: 85, directors: ['Sidney Lumet'], cast: ['Henry Fonda', 'Lee J. Cobb'] },

  // POPULAR - High engagement, crowd pleasers
  { id: '6', tmdbId: 155, title: 'The Dark Knight', year: 2008, releaseDate: '2008-07-18', runtime: 152, posterPath: '/qJ2tW6WMUDux911r6m7haRef0WH.jpg', backdropPath: '/nMKdUUepR0i5zn0y1T4CsSB5chy.jpg', genres: ['action', 'drama', 'crime'], mood: ['intense'], era: 'modern', ratingAvg: 8.5, ratingCount: 32000, popularityScore: 98, directors: ['Christopher Nolan'], cast: ['Christian Bale', 'Heath Ledger'] },
  { id: '7', tmdbId: 680, title: 'Pulp Fiction', year: 1994, releaseDate: '1994-10-14', runtime: 154, posterPath: '/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg', backdropPath: '/suaEOtk1N1sgg2MTM7oZd2cfVp3.jpg', genres: ['crime', 'thriller'], mood: ['intense', 'fun'], era: 'modern', ratingAvg: 8.5, ratingCount: 27000, popularityScore: 96, directors: ['Quentin Tarantino'], cast: ['John Travolta', 'Samuel L. Jackson'] },
  { id: '8', tmdbId: 550, title: 'Fight Club', year: 1999, releaseDate: '1999-10-15', runtime: 139, posterPath: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg', backdropPath: '/hZkgoQYus5vegHoetLkCJzb17zJ.jpg', genres: ['drama', 'thriller'], mood: ['intense'], era: 'modern', ratingAvg: 8.4, ratingCount: 28000, popularityScore: 95, directors: ['David Fincher'], cast: ['Brad Pitt', 'Edward Norton'] },
  { id: '9', tmdbId: 13, title: 'Forrest Gump', year: 1994, releaseDate: '1994-07-06', runtime: 142, posterPath: '/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg', backdropPath: '/3h1JZGDhZ8nzxdgvkxha0qBqi05.jpg', genres: ['drama', 'romance', 'comedy'], mood: ['calm', 'fun'], era: 'modern', ratingAvg: 8.5, ratingCount: 26000, popularityScore: 94, directors: ['Robert Zemeckis'], cast: ['Tom Hanks', 'Robin Wright'] },
  { id: '10', tmdbId: 27205, title: 'Inception', year: 2010, releaseDate: '2010-07-16', runtime: 148, posterPath: '/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg', backdropPath: '/8ZTVqvKDQ8emSGUEMjsS4yHAwrp.jpg', genres: ['action', 'scifi', 'thriller'], mood: ['intense'], era: 'modern', ratingAvg: 8.4, ratingCount: 35000, popularityScore: 97, directors: ['Christopher Nolan'], cast: ['Leonardo DiCaprio', 'Joseph Gordon-Levitt'] },

  // TRENDING - Recent hits with strong reception
  { id: '11', tmdbId: 872585, title: 'Oppenheimer', year: 2023, releaseDate: '2023-07-19', runtime: 181, posterPath: '/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg', backdropPath: '/fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg', genres: ['drama', 'history'], mood: ['intense', 'calm'], era: 'recent', ratingAvg: 8.1, ratingCount: 8500, popularityScore: 99, directors: ['Christopher Nolan'], cast: ['Cillian Murphy', 'Emily Blunt', 'Robert Downey Jr.'] },
  { id: '12', tmdbId: 346698, title: 'Barbie', year: 2023, releaseDate: '2023-07-19', runtime: 114, posterPath: '/iuFNMS8U5cb6xfzi51Dbkovj7vM.jpg', backdropPath: '/nHf61UzkfFno5X1ofIhugCPus2R.jpg', genres: ['comedy', 'adventure', 'fantasy'], mood: ['fun'], era: 'recent', ratingAvg: 7.0, ratingCount: 7200, popularityScore: 98, directors: ['Greta Gerwig'], cast: ['Margot Robbie', 'Ryan Gosling'] },
  { id: '13', tmdbId: 569094, title: 'Spider-Man: Across the Spider-Verse', year: 2023, releaseDate: '2023-05-31', runtime: 140, posterPath: '/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg', backdropPath: '/4HodYYKEIsGOdinkGi2Ucz6X9i0.jpg', genres: ['animation', 'action', 'adventure'], mood: ['fun', 'intense'], era: 'recent', ratingAvg: 8.4, ratingCount: 6800, popularityScore: 97, directors: ['Joaquim Dos Santos', 'Kemp Powers', 'Justin K. Thompson'], cast: ['Shameik Moore', 'Hailee Steinfeld'] },
  { id: '14', tmdbId: 976573, title: 'Elemental', year: 2023, releaseDate: '2023-06-14', runtime: 101, posterPath: '/4Y1WNkd88JXmGfhtWR7dmDAo1T2.jpg', backdropPath: '/6tSz7UQfEnCiblOKsocKPnlwz9l.jpg', genres: ['animation', 'comedy', 'fantasy', 'romance'], mood: ['fun', 'calm'], era: 'recent', ratingAvg: 7.7, ratingCount: 4200, popularityScore: 92, directors: ['Peter Sohn'], cast: ['Leah Lewis', 'Mamoudou Athie'] },
  { id: '15', tmdbId: 502356, title: 'The Super Mario Bros. Movie', year: 2023, releaseDate: '2023-04-05', runtime: 92, posterPath: '/qNBAXBIQlnOThrVvA6mA2B5ber.jpg', backdropPath: '/9n2tJBplPbgR2ca05hS5CKXwP2c.jpg', genres: ['animation', 'adventure', 'comedy', 'family'], mood: ['fun'], era: 'recent', ratingAvg: 7.7, ratingCount: 8100, popularityScore: 96, directors: ['Aaron Horvath', 'Michael Jelenic'], cast: ['Chris Pratt', 'Anya Taylor-Joy', 'Jack Black'] },

  // HIDDEN GEMS - High rating, lower vote count (quality films that flew under radar)
  { id: '16', tmdbId: 497, title: 'The Green Mile', year: 1999, releaseDate: '1999-12-10', runtime: 189, posterPath: '/8VG8fDNiy50H4FedGwdSVUPoaJe.jpg', backdropPath: '/l6hQWH9eDksNJNiXWYRkWqikOdu.jpg', genres: ['drama', 'fantasy', 'crime'], mood: ['calm', 'intense'], era: 'modern', ratingAvg: 8.5, ratingCount: 16500, popularityScore: 87, directors: ['Frank Darabont'], cast: ['Tom Hanks', 'Michael Clarke Duncan'] },
  { id: '17', tmdbId: 429, title: 'The Good, the Bad and the Ugly', year: 1966, releaseDate: '1966-12-23', runtime: 178, posterPath: '/bX2xnavhMYjWDoZp1VM6VnU1xwe.jpg', backdropPath: '/qjKdWQFb3hCnfsLJQVjtxrJpbWq.jpg', genres: ['western'], mood: ['intense'], era: 'classic', ratingAvg: 8.5, ratingCount: 8200, popularityScore: 82, directors: ['Sergio Leone'], cast: ['Clint Eastwood', 'Eli Wallach', 'Lee Van Cleef'] },
  { id: '18', tmdbId: 637, title: 'Life Is Beautiful', year: 1997, releaseDate: '1997-12-20', runtime: 116, posterPath: '/74hLDKjD5aGYOotO6esUVaeISa2.jpg', backdropPath: '/bORe0eI72D874TMawOOFvqWS6Xe.jpg', genres: ['drama', 'comedy', 'romance'], mood: ['calm', 'fun'], era: 'modern', ratingAvg: 8.5, ratingCount: 12500, popularityScore: 84, directors: ['Roberto Benigni'], cast: ['Roberto Benigni', 'Nicoletta Braschi'] },
  { id: '19', tmdbId: 311, title: 'Once Upon a Time in America', year: 1984, releaseDate: '1984-05-23', runtime: 229, posterPath: '/i0enkzsL5dPeneWnjl1fCWm6L7k.jpg', backdropPath: '/vnT6HgVFKYsqLwVLoqHTHOBg9tf.jpg', genres: ['drama', 'crime'], mood: ['intense', 'calm'], era: 'modern', ratingAvg: 8.4, ratingCount: 5100, popularityScore: 78, directors: ['Sergio Leone'], cast: ['Robert De Niro', 'James Woods'] },
  { id: '20', tmdbId: 510, title: "One Flew Over the Cuckoo's Nest", year: 1975, releaseDate: '1975-11-19', runtime: 133, posterPath: '/3jcbDmRFiQ83drXNOvRDeKHxS0C.jpg', backdropPath: '/2Hy2U4daDg6ft26gfHVqhajXGJa.jpg', genres: ['drama'], mood: ['intense'], era: 'classic', ratingAvg: 8.4, ratingCount: 14200, popularityScore: 86, directors: ['Milos Forman'], cast: ['Jack Nicholson', 'Louise Fletcher'] },

  // MODERN CLASSICS - 2000s-2010s essential films
  { id: '21', tmdbId: 129, title: 'Spirited Away', year: 2001, releaseDate: '2001-07-20', runtime: 125, posterPath: '/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg', backdropPath: '/6ThZch7bbnCH9ytvh1GKSQZS0x0.jpg', genres: ['animation', 'fantasy', 'family'], mood: ['calm', 'fun'], era: 'modern', ratingAvg: 8.5, ratingCount: 15800, popularityScore: 91, directors: ['Hayao Miyazaki'], cast: ['Rumi Hiiragi', 'Miyu Irino'] },
  { id: '22', tmdbId: 120, title: 'The Lord of the Rings: The Fellowship of the Ring', year: 2001, releaseDate: '2001-12-18', runtime: 178, posterPath: '/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg', backdropPath: '/x2RS3uTcsJJ9IfjNPcgDmukoEcQ.jpg', genres: ['adventure', 'fantasy', 'action'], mood: ['intense', 'fun'], era: 'modern', ratingAvg: 8.4, ratingCount: 24000, popularityScore: 94, directors: ['Peter Jackson'], cast: ['Elijah Wood', 'Ian McKellen', 'Viggo Mortensen'] },
  { id: '23', tmdbId: 122, title: 'The Lord of the Rings: The Return of the King', year: 2003, releaseDate: '2003-12-17', runtime: 201, posterPath: '/rCzpDGLbOoPwLjy3OAm5NUPOTrC.jpg', backdropPath: '/lXhgCODAbBXL5buk9yEmTpOoOgR.jpg', genres: ['adventure', 'fantasy', 'action'], mood: ['intense'], era: 'modern', ratingAvg: 8.5, ratingCount: 23000, popularityScore: 93, directors: ['Peter Jackson'], cast: ['Elijah Wood', 'Ian McKellen', 'Viggo Mortensen'] },
  { id: '24', tmdbId: 603, title: 'The Matrix', year: 1999, releaseDate: '1999-03-31', runtime: 136, posterPath: '/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg', backdropPath: '/fNG7i7RqMErkcqhohV2a6cV1Ehy.jpg', genres: ['action', 'scifi'], mood: ['intense'], era: 'modern', ratingAvg: 8.2, ratingCount: 25500, popularityScore: 93, directors: ['Lana Wachowski', 'Lilly Wachowski'], cast: ['Keanu Reeves', 'Laurence Fishburne', 'Carrie-Anne Moss'] },
  { id: '25', tmdbId: 807, title: 'Se7en', year: 1995, releaseDate: '1995-09-22', runtime: 127, posterPath: '/6yoghtyTpznpBik8EngEmJskVUO.jpg', backdropPath: '/1FuYKZ4wXqdeNTDEWiMUQzT7y3F.jpg', genres: ['crime', 'thriller', 'mystery'], mood: ['intense'], era: 'modern', ratingAvg: 8.4, ratingCount: 21000, popularityScore: 91, directors: ['David Fincher'], cast: ['Brad Pitt', 'Morgan Freeman', 'Kevin Spacey'] },

  // RECENT QUALITY - Post-2020 acclaimed films
  { id: '26', tmdbId: 438631, title: 'Dune', year: 2021, releaseDate: '2021-09-15', runtime: 155, posterPath: '/d5NXSklXo0qyIYkgV94XAgMIckC.jpg', backdropPath: '/jYEW5xZkZk2WTrdbMGAPFuBqbDc.jpg', genres: ['scifi', 'adventure', 'drama'], mood: ['intense', 'calm'], era: 'recent', ratingAvg: 7.8, ratingCount: 11500, popularityScore: 95, directors: ['Denis Villeneuve'], cast: ['Timothée Chalamet', 'Zendaya', 'Rebecca Ferguson'] },
  { id: '27', tmdbId: 693134, title: 'Dune: Part Two', year: 2024, releaseDate: '2024-02-27', runtime: 166, posterPath: '/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg', backdropPath: '/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg', genres: ['scifi', 'adventure', 'action'], mood: ['intense'], era: 'recent', ratingAvg: 8.3, ratingCount: 5200, popularityScore: 98, directors: ['Denis Villeneuve'], cast: ['Timothée Chalamet', 'Zendaya', 'Austin Butler'] },
  { id: '28', tmdbId: 671, title: "Harry Potter and the Philosopher's Stone", year: 2001, releaseDate: '2001-11-16', runtime: 152, posterPath: '/wuMc08IPKEatf9rnMNXvIDxqP4W.jpg', backdropPath: '/hziiv14OpD73u9gAak4XDDfBKa2.jpg', genres: ['adventure', 'fantasy', 'family'], mood: ['fun'], era: 'modern', ratingAvg: 7.9, ratingCount: 26000, popularityScore: 92, directors: ['Chris Columbus'], cast: ['Daniel Radcliffe', 'Rupert Grint', 'Emma Watson'] },
  { id: '29', tmdbId: 157336, title: 'Interstellar', year: 2014, releaseDate: '2014-11-05', runtime: 169, posterPath: '/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg', backdropPath: '/xJHokMbljvjADYdit5fK5VQsXEG.jpg', genres: ['scifi', 'drama', 'adventure'], mood: ['intense', 'calm'], era: 'modern', ratingAvg: 8.4, ratingCount: 34000, popularityScore: 96, directors: ['Christopher Nolan'], cast: ['Matthew McConaughey', 'Anne Hathaway', 'Jessica Chastain'] },
  { id: '30', tmdbId: 244786, title: 'Whiplash', year: 2014, releaseDate: '2014-10-10', runtime: 106, posterPath: '/7fn624j5lj3xTme2SgiLCeuedmO.jpg', backdropPath: '/fRGxZuo7jJUWQsVg9PREb98Aclp.jpg', genres: ['drama', 'music'], mood: ['intense'], era: 'modern', ratingAvg: 8.4, ratingCount: 14200, popularityScore: 88, directors: ['Damien Chazelle'], cast: ['Miles Teller', 'J.K. Simmons'] },

  // MORE CROWD PLEASERS - Broad appeal, high quality
  { id: '31', tmdbId: 98, title: 'Gladiator', year: 2000, releaseDate: '2000-05-05', runtime: 155, posterPath: '/ty8TGRuvJLPUmAR1H1nRIsgwvim.jpg', backdropPath: '/3ODqYuPgmOI7yxe1UDRG45iGn3.jpg', genres: ['action', 'drama', 'adventure'], mood: ['intense'], era: 'modern', ratingAvg: 8.2, ratingCount: 17500, popularityScore: 90, directors: ['Ridley Scott'], cast: ['Russell Crowe', 'Joaquin Phoenix'] },
  { id: '32', tmdbId: 11, title: 'Star Wars', year: 1977, releaseDate: '1977-05-25', runtime: 121, posterPath: '/6FfCtAuVAW8XJjZ7eWeLibRLWTw.jpg', backdropPath: '/zqkmTXzjkAgXmEWLRsY4UpTWCeo.jpg', genres: ['adventure', 'scifi', 'action'], mood: ['fun', 'intense'], era: 'classic', ratingAvg: 8.2, ratingCount: 19500, popularityScore: 93, directors: ['George Lucas'], cast: ['Mark Hamill', 'Harrison Ford', 'Carrie Fisher'] },
  { id: '33', tmdbId: 1891, title: 'The Empire Strikes Back', year: 1980, releaseDate: '1980-05-21', runtime: 124, posterPath: '/nNAeTmF4CtdSgMDplXTDPOpYzsX.jpg', backdropPath: '/dMZxEdrWIzUmUoWsNzKkf9XgCq1.jpg', genres: ['adventure', 'scifi', 'action'], mood: ['intense'], era: 'classic', ratingAvg: 8.4, ratingCount: 16000, popularityScore: 91, directors: ['Irvin Kershner'], cast: ['Mark Hamill', 'Harrison Ford', 'Carrie Fisher'] },
  { id: '34', tmdbId: 424694, title: 'Bohemian Rhapsody', year: 2018, releaseDate: '2018-10-24', runtime: 135, posterPath: '/lHu1wtNaczFPGFDTrjCSzeLPTKN.jpg', backdropPath: '/jNUpYq0p1spGhLvEGaGoWJVlKxW.jpg', genres: ['drama', 'music'], mood: ['fun', 'intense'], era: 'recent', ratingAvg: 8.0, ratingCount: 17000, popularityScore: 89, directors: ['Bryan Singer'], cast: ['Rami Malek', 'Lucy Boynton'] },
  { id: '35', tmdbId: 299536, title: 'Avengers: Infinity War', year: 2018, releaseDate: '2018-04-25', runtime: 149, posterPath: '/7WsyChQLEftFiDOVTGkv3hFpyyt.jpg', backdropPath: '/lmZFxXgJE3vgrciwuDib0N8CfQo.jpg', genres: ['action', 'adventure', 'scifi'], mood: ['intense', 'fun'], era: 'recent', ratingAvg: 8.3, ratingCount: 27000, popularityScore: 95, directors: ['Anthony Russo', 'Joe Russo'], cast: ['Robert Downey Jr.', 'Chris Hemsworth', 'Josh Brolin'] },

  // INTERNATIONAL CINEMA - Non-English masterpieces
  { id: '36', tmdbId: 496243, title: 'Parasite', year: 2019, releaseDate: '2019-05-30', runtime: 132, posterPath: '/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg', backdropPath: '/TU9NIjwzjoKPwQHoHshkFcQUCG.jpg', genres: ['thriller', 'drama', 'comedy'], mood: ['intense'], era: 'recent', ratingAvg: 8.5, ratingCount: 17500, popularityScore: 94, directors: ['Bong Joon-ho'], cast: ['Song Kang-ho', 'Lee Sun-kyun', 'Cho Yeo-jeong'] },
  { id: '37', tmdbId: 372058, title: 'Your Name', year: 2016, releaseDate: '2016-08-26', runtime: 106, posterPath: '/q719jXXEzOoYaps6babgKnONONX.jpg', backdropPath: '/dIWwZW7dJJtqC6CgWzYkNVKIUm8.jpg', genres: ['animation', 'romance', 'drama'], mood: ['calm', 'fun'], era: 'recent', ratingAvg: 8.5, ratingCount: 10500, popularityScore: 88, directors: ['Makoto Shinkai'], cast: ['Ryunosuke Kamiki', 'Mone Kamishiraishi'] },
  { id: '38', tmdbId: 12477, title: 'Grave of the Fireflies', year: 1988, releaseDate: '1988-04-16', runtime: 89, posterPath: '/qG3RYlIVpTYclR9TYIsy8p7m7AT.jpg', backdropPath: '/k9bPJPJPvLpT3VyCQIGTORsJfGl.jpg', genres: ['animation', 'drama', 'war'], mood: ['calm', 'intense'], era: 'modern', ratingAvg: 8.5, ratingCount: 5200, popularityScore: 80, directors: ['Isao Takahata'], cast: ['Tsutomu Tatsumi', 'Ayano Shiraishi'] },
  { id: '39', tmdbId: 128, title: 'Princess Mononoke', year: 1997, releaseDate: '1997-07-12', runtime: 134, posterPath: '/jHWmNr7m544fJ8eItsfNk8fs2Ed.jpg', backdropPath: '/vGfBkrFXuOvEBcADwzA67KprLNO.jpg', genres: ['animation', 'adventure', 'fantasy'], mood: ['intense', 'calm'], era: 'modern', ratingAvg: 8.4, ratingCount: 8100, popularityScore: 84, directors: ['Hayao Miyazaki'], cast: ['Yoji Matsuda', 'Yuriko Ishida'] },
  { id: '40', tmdbId: 4935, title: 'Howl\'s Moving Castle', year: 2004, releaseDate: '2004-11-20', runtime: 119, posterPath: '/TkTPELv4kC3u1lkloush8skOjE.jpg', backdropPath: '/Asg2UUwipAdE87MzBORmRSBtr2e.jpg', genres: ['animation', 'fantasy', 'adventure'], mood: ['fun', 'calm'], era: 'modern', ratingAvg: 8.4, ratingCount: 9500, popularityScore: 86, directors: ['Hayao Miyazaki'], cast: ['Chieko Baisho', 'Takuya Kimura'] },

  // THRILLER/SUSPENSE - Edge of seat entertainment
  { id: '41', tmdbId: 745, title: 'The Sixth Sense', year: 1999, releaseDate: '1999-08-06', runtime: 107, posterPath: '/fIssD3w3SvIhPPmVo4WMgZDVLID.jpg', backdropPath: '/2XDFE6BGKgT8dIB4eYB7xScJy4c.jpg', genres: ['thriller', 'drama', 'mystery'], mood: ['intense', 'calm'], era: 'modern', ratingAvg: 8.1, ratingCount: 13500, popularityScore: 87, directors: ['M. Night Shyamalan'], cast: ['Bruce Willis', 'Haley Joel Osment'] },
  { id: '42', tmdbId: 78, title: 'Blade Runner', year: 1982, releaseDate: '1982-06-25', runtime: 117, posterPath: '/63N9uy8nd9j7Eog2axPQ8lbr3Wj.jpg', backdropPath: '/eIi3klFf7mp3oL5EEF4mLIDs26r.jpg', genres: ['scifi', 'drama', 'thriller'], mood: ['calm', 'intense'], era: 'classic', ratingAvg: 7.9, ratingCount: 14000, popularityScore: 85, directors: ['Ridley Scott'], cast: ['Harrison Ford', 'Rutger Hauer', 'Sean Young'] },
  { id: '43', tmdbId: 335984, title: 'Blade Runner 2049', year: 2017, releaseDate: '2017-10-04', runtime: 164, posterPath: '/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg', backdropPath: '/ilRyazdMJwN05exqhwK4tMKBYZs.jpg', genres: ['scifi', 'drama', 'mystery'], mood: ['calm', 'intense'], era: 'recent', ratingAvg: 7.5, ratingCount: 12800, popularityScore: 88, directors: ['Denis Villeneuve'], cast: ['Ryan Gosling', 'Harrison Ford', 'Ana de Armas'] },
  { id: '44', tmdbId: 280, title: 'Terminator 2: Judgment Day', year: 1991, releaseDate: '1991-07-03', runtime: 137, posterPath: '/5M0j0B18abtBI5gi2RhfjjurTqb.jpg', backdropPath: '/xKb6mtdfI5Qsggc44Hr9CCUDvaj.jpg', genres: ['action', 'scifi', 'thriller'], mood: ['intense'], era: 'modern', ratingAvg: 8.1, ratingCount: 12500, popularityScore: 89, directors: ['James Cameron'], cast: ['Arnold Schwarzenegger', 'Linda Hamilton', 'Edward Furlong'] },
  { id: '45', tmdbId: 4638, title: 'Hot Fuzz', year: 2007, releaseDate: '2007-02-14', runtime: 121, posterPath: '/zPib4ukTPRvhZe1rJNklwrWJHBT.jpg', backdropPath: '/qlesYpJeNsyPDf4sn7wOaW9cjQ0.jpg', genres: ['action', 'comedy', 'crime'], mood: ['fun'], era: 'modern', ratingAvg: 7.8, ratingCount: 9200, popularityScore: 82, directors: ['Edgar Wright'], cast: ['Simon Pegg', 'Nick Frost'] },

  // FEEL-GOOD / COMEDY - Lighter fare, still quality
  { id: '46', tmdbId: 207703, title: 'Kingsman: The Secret Service', year: 2014, releaseDate: '2014-12-13', runtime: 129, posterPath: '/oAISjx6DvR2yUn9dxj00vP8OcJJ.jpg', backdropPath: '/2FFUUrP6JuNYrUv3YXbuQZvq3bw.jpg', genres: ['action', 'adventure', 'comedy'], mood: ['fun', 'intense'], era: 'modern', ratingAvg: 7.6, ratingCount: 14500, popularityScore: 87, directors: ['Matthew Vaughn'], cast: ['Colin Firth', 'Taron Egerton', 'Samuel L. Jackson'] },
  { id: '47', tmdbId: 313369, title: 'La La Land', year: 2016, releaseDate: '2016-11-29', runtime: 128, posterPath: '/uDO8zWDhfWwoFdKS4fzkUJt0Rf0.jpg', backdropPath: '/fvO3wvH4hyoxlzDaSw4AvvlLZJ3.jpg', genres: ['drama', 'romance', 'comedy'], mood: ['calm', 'fun'], era: 'recent', ratingAvg: 7.9, ratingCount: 16000, popularityScore: 90, directors: ['Damien Chazelle'], cast: ['Ryan Gosling', 'Emma Stone'] },
  { id: '48', tmdbId: 284053, title: 'Thor: Ragnarok', year: 2017, releaseDate: '2017-10-25', runtime: 130, posterPath: '/rzRwTcFvttcN1ZpX2xv4j3tSdJu.jpg', backdropPath: '/kaIfm5ryEOwYg8mLbq8HkPuM1Fo.jpg', genres: ['action', 'adventure', 'comedy'], mood: ['fun'], era: 'recent', ratingAvg: 7.6, ratingCount: 18500, popularityScore: 91, directors: ['Taika Waititi'], cast: ['Chris Hemsworth', 'Tom Hiddleston', 'Cate Blanchett'] },
  { id: '49', tmdbId: 10193, title: 'Toy Story 3', year: 2010, releaseDate: '2010-06-16', runtime: 103, posterPath: '/AbbXspMOwdvwWZgVN0nabZq03Ec.jpg', backdropPath: '/y7YWpj5zdCcIwI0YJ8SrCTmWyaQ.jpg', genres: ['animation', 'adventure', 'comedy', 'family'], mood: ['fun', 'calm'], era: 'modern', ratingAvg: 8.0, ratingCount: 14500, popularityScore: 88, directors: ['Lee Unkrich'], cast: ['Tom Hanks', 'Tim Allen'] },
  { id: '50', tmdbId: 150540, title: 'Inside Out', year: 2015, releaseDate: '2015-06-09', runtime: 95, posterPath: '/2H1TmgdfNtsKlU9jKdeNyYL5y8T.jpg', backdropPath: '/j29ekbcLpBvxnGk6LjdTc2EI5SA.jpg', genres: ['animation', 'comedy', 'drama', 'family'], mood: ['fun', 'calm'], era: 'modern', ratingAvg: 8.0, ratingCount: 21000, popularityScore: 90, directors: ['Pete Docter'], cast: ['Amy Poehler', 'Phyllis Smith'] },

  // MORE RECENT QUALITY
  { id: '51', tmdbId: 299534, title: 'Avengers: Endgame', year: 2019, releaseDate: '2019-04-24', runtime: 181, posterPath: '/or06FN3Dka5tukK1e9sl16pB3iy.jpg', backdropPath: '/7RyHsO4yDXtBv1zUU3mTpHeQ0d5.jpg', genres: ['action', 'adventure', 'scifi'], mood: ['intense', 'fun'], era: 'recent', ratingAvg: 8.3, ratingCount: 24000, popularityScore: 96, directors: ['Anthony Russo', 'Joe Russo'], cast: ['Robert Downey Jr.', 'Chris Evans', 'Scarlett Johansson'] },
  { id: '52', tmdbId: 324857, title: 'Spider-Man: Into the Spider-Verse', year: 2018, releaseDate: '2018-12-07', runtime: 117, posterPath: '/iiZZdoQBEYBv6id8su7ImL0oCbD.jpg', backdropPath: '/aUVCJ0HkcJLBdBk5ChZYI0zdvfI.jpg', genres: ['animation', 'action', 'adventure'], mood: ['fun', 'intense'], era: 'recent', ratingAvg: 8.4, ratingCount: 14500, popularityScore: 92, directors: ['Bob Persichetti', 'Peter Ramsey', 'Rodney Rothman'], cast: ['Shameik Moore', 'Jake Johnson'] },
  { id: '53', tmdbId: 361743, title: 'Top Gun: Maverick', year: 2022, releaseDate: '2022-05-24', runtime: 130, posterPath: '/62HCnUTziyWcpDaBO2i1DG17Vv.jpg', backdropPath: '/AaV1YIdWKJHvpLxzffrRhpBFhFT.jpg', genres: ['action', 'drama'], mood: ['intense', 'fun'], era: 'recent', ratingAvg: 8.3, ratingCount: 9500, popularityScore: 95, directors: ['Joseph Kosinski'], cast: ['Tom Cruise', 'Miles Teller', 'Jennifer Connelly'] },
  { id: '54', tmdbId: 508442, title: 'Soul', year: 2020, releaseDate: '2020-12-25', runtime: 100, posterPath: '/hm58Jw4Lw8OIeECIq5qyPYhAeRJ.jpg', backdropPath: '/l9VJrHfKSbLpUqHPVsXAi2E8ZIs.jpg', genres: ['animation', 'comedy', 'drama', 'family'], mood: ['calm', 'fun'], era: 'recent', ratingAvg: 8.0, ratingCount: 10500, popularityScore: 89, directors: ['Pete Docter'], cast: ['Jamie Foxx', 'Tina Fey'] },
  { id: '55', tmdbId: 475557, title: 'Joker', year: 2019, releaseDate: '2019-10-02', runtime: 122, posterPath: '/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg', backdropPath: '/n6bUvigpRFqSwmPp1m2YADdbRBc.jpg', genres: ['crime', 'thriller', 'drama'], mood: ['intense'], era: 'recent', ratingAvg: 8.2, ratingCount: 24500, popularityScore: 94, directors: ['Todd Phillips'], cast: ['Joaquin Phoenix', 'Robert De Niro'] },

  // CLASSIC ESSENTIALS
  { id: '56', tmdbId: 769, title: 'GoodFellas', year: 1990, releaseDate: '1990-09-19', runtime: 145, posterPath: '/aKuFiU82s5ISJpGZp7YkIr3kCUd.jpg', backdropPath: '/sw7mordbZxgITU877yTpZCud90M.jpg', genres: ['drama', 'crime'], mood: ['intense'], era: 'modern', ratingAvg: 8.5, ratingCount: 12500, popularityScore: 89, directors: ['Martin Scorsese'], cast: ['Robert De Niro', 'Ray Liotta', 'Joe Pesci'] },
  { id: '57', tmdbId: 185, title: 'A Clockwork Orange', year: 1971, releaseDate: '1971-12-19', runtime: 136, posterPath: '/4sHeTAp65WrSSuc05nRBKddhBxO.jpg', backdropPath: '/mNpLCa2kXJOkfkO2ehhDzBMYpkk.jpg', genres: ['scifi', 'drama'], mood: ['intense'], era: 'classic', ratingAvg: 8.2, ratingCount: 14000, popularityScore: 85, directors: ['Stanley Kubrick'], cast: ['Malcolm McDowell'] },
  { id: '58', tmdbId: 694, title: 'The Shining', year: 1980, releaseDate: '1980-05-23', runtime: 146, posterPath: '/xazWoLealQwEgqZ89MLZklLZD3k.jpg', backdropPath: '/mmd1HnuvAzFc4iuVJcnBrhDNEKr.jpg', genres: ['horror', 'thriller'], mood: ['intense'], era: 'classic', ratingAvg: 8.2, ratingCount: 16500, popularityScore: 90, directors: ['Stanley Kubrick'], cast: ['Jack Nicholson', 'Shelley Duvall'] },
  { id: '59', tmdbId: 857, title: 'Saving Private Ryan', year: 1998, releaseDate: '1998-07-24', runtime: 169, posterPath: '/uqx37cS8cpHg8U35f9U5IBlrCV3.jpg', backdropPath: '/bdD39MpSVhKjxarTxLSfX6baoMP.jpg', genres: ['drama', 'war', 'history'], mood: ['intense'], era: 'modern', ratingAvg: 8.2, ratingCount: 14500, popularityScore: 88, directors: ['Steven Spielberg'], cast: ['Tom Hanks', 'Matt Damon', 'Tom Sizemore'] },
  { id: '60', tmdbId: 329, title: 'Jurassic Park', year: 1993, releaseDate: '1993-06-11', runtime: 127, posterPath: '/oU7Oq2kFAAlGqbU4VoAE36g4hoI.jpg', backdropPath: '/9DJnC5u3i1hLFIi0brhTm2DvMnG.jpg', genres: ['adventure', 'scifi', 'thriller'], mood: ['fun', 'intense'], era: 'modern', ratingAvg: 7.9, ratingCount: 16000, popularityScore: 91, directors: ['Steven Spielberg'], cast: ['Sam Neill', 'Laura Dern', 'Jeff Goldblum'] },
];

// Availability per country with provider-specific IDs
interface AvailabilityEntry {
  services: string[];
  providerIds: Record<string, string>;
}

// Generate availability map - in production this comes from JustWatch/TMDB API
const generateAvailability = (): Record<string, Record<string, AvailabilityEntry>> => {
  const regions = ['US', 'SE', 'GB'];
  const providers = ['netflix', 'prime', 'disney', 'hbo', 'apple', 'hulu'];

  const availability: Record<string, Record<string, AvailabilityEntry>> = {};

  regions.forEach(region => {
    availability[region] = {};
    MOVIES_DATA.forEach(movie => {
      // Simulate semi-realistic availability
      const availableProviders = providers.filter(() => Math.random() > 0.5);
      if (availableProviders.length === 0) {
        availableProviders.push(providers[Math.floor(Math.random() * providers.length)]);
      }

      const providerIds: Record<string, string> = {};
      availableProviders.forEach(p => {
        providerIds[p] = `${p}-${movie.tmdbId}`;
      });

      availability[region][movie.id] = {
        services: availableProviders,
        providerIds,
      };
    });
  });

  return availability;
};

const AVAILABILITY_MAP = generateAvailability();

// Get availability map for a country
function getAvailabilityMap(countryCode: string): Record<string, AvailabilityEntry> {
  return AVAILABILITY_MAP[countryCode] || AVAILABILITY_MAP['US'];
}

// Build streaming offers with deep links for a movie
export function getStreamingOffers(movieId: string, countryCode: string): StreamingOffer[] {
  const availability = getAvailabilityMap(countryCode);
  const entry = availability[movieId];
  if (!entry) return [];

  return entry.services.map((providerId) => {
    const providerMovieId = entry.providerIds[providerId] || movieId;
    const linkConfig = PROVIDER_LINKS[providerId]?.[countryCode] || PROVIDER_LINKS[providerId]?.['DEFAULT'];

    let deepLink: string | undefined;
    let webUrl: string | undefined;

    if (linkConfig) {
      deepLink = linkConfig.deepLink.replace('{id}', providerMovieId).replace('{slug}', providerMovieId);
      webUrl = linkConfig.webUrl.replace('{id}', providerMovieId).replace('{slug}', providerMovieId);
    }

    return {
      providerId,
      type: 'stream' as const,
      deepLink,
      webUrl,
    };
  });
}

// Quality gate thresholds
const QUALITY_GATE = {
  minRatingCount: 1000,
  minRatingAvg: 6.5,
  minPopularity: 50, // Fallback if rating count is lower
};

// Apply quality gate filter
function applyQualityGate(movies: MovieData[]): MovieData[] {
  return movies.filter(movie => {
    // Must have poster
    if (!movie.posterPath) return false;

    // Pass if high vote count with decent rating
    if (movie.ratingCount >= QUALITY_GATE.minRatingCount && movie.ratingAvg >= QUALITY_GATE.minRatingAvg) {
      return true;
    }

    // Pass if very high popularity (trending) with decent rating
    if (movie.popularityScore >= QUALITY_GATE.minPopularity && movie.ratingAvg >= 7.0) {
      return true;
    }

    // Hidden gems: high rating with moderate votes
    if (movie.ratingAvg >= 8.0 && movie.ratingCount >= 500) {
      return true;
    }

    return false;
  });
}

// Get movies available in a country (quality filtered)
export function getMovies(countryCode: string): Movie[] {
  const availability = getAvailabilityMap(countryCode);

  // Apply quality gate
  const qualityMovies = applyQualityGate(MOVIES_DATA);

  return qualityMovies
    .filter((movie) => availability[movie.id])
    .map((movie): Movie => ({
      id: movie.id,
      tmdbId: movie.tmdbId,
      title: movie.title,
      year: movie.year,
      releaseDate: movie.releaseDate,
      runtime: movie.runtime,
      posterUrl: getPosterUrl(movie.posterPath, 'w500') || '',
      posterPath: movie.posterPath,
      backdropUrl: getBackdropUrl(movie.backdropPath),
      backdropPath: movie.backdropPath,
      genres: movie.genres,
      mood: movie.mood,
      era: movie.era,
      ratingAvg: movie.ratingAvg,
      ratingCount: movie.ratingCount,
      popularityScore: movie.popularityScore,
      directors: movie.directors,
      cast: movie.cast,
      overview: movie.overview,
    }));
}

// Get ALL movies (bypasses quality gate - for fallback only)
export function getAllMovies(countryCode: string): Movie[] {
  const availability = getAvailabilityMap(countryCode);

  return MOVIES_DATA
    .filter((movie) => availability[movie.id] && movie.posterPath)
    .map((movie): Movie => ({
      id: movie.id,
      tmdbId: movie.tmdbId,
      title: movie.title,
      year: movie.year,
      releaseDate: movie.releaseDate,
      runtime: movie.runtime,
      posterUrl: getPosterUrl(movie.posterPath, 'w500') || '',
      posterPath: movie.posterPath,
      backdropUrl: getBackdropUrl(movie.backdropPath),
      backdropPath: movie.backdropPath,
      genres: movie.genres,
      mood: movie.mood,
      era: movie.era,
      ratingAvg: movie.ratingAvg,
      ratingCount: movie.ratingCount,
      popularityScore: movie.popularityScore,
      directors: movie.directors,
      cast: movie.cast,
      overview: movie.overview,
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

// Get movies by bucket type (for feed engine)
export function getMoviesByBucket(
  countryCode: string,
  bucket: 'trending' | 'top_rated' | 'popular' | 'hidden_gems' | 'new_noteworthy'
): Movie[] {
  const movies = getMovies(countryCode);

  switch (bucket) {
    case 'trending':
      // High popularity, recent
      return movies
        .filter(m => m.popularityScore >= 85 && m.era === 'recent')
        .sort((a, b) => b.popularityScore - a.popularityScore);

    case 'top_rated':
      // Highest ratings regardless of era
      return movies
        .filter(m => m.ratingAvg >= 8.0)
        .sort((a, b) => b.ratingAvg - a.ratingAvg);

    case 'popular':
      // High engagement overall
      return movies
        .filter(m => m.ratingCount >= 15000)
        .sort((a, b) => b.ratingCount - a.ratingCount);

    case 'hidden_gems':
      // High rating, lower vote count
      return movies
        .filter(m => m.ratingAvg >= 7.8 && m.ratingCount < 15000)
        .sort((a, b) => b.ratingAvg - a.ratingAvg);

    case 'new_noteworthy':
      // Recent releases (2022+)
      return movies
        .filter(m => m.year >= 2022)
        .sort((a, b) => b.ratingAvg - a.ratingAvg);

    default:
      return movies;
  }
}
