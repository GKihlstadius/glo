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
  providerIds: Record<string, string>; // providerId -> provider-specific movie ID
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

// Extended movie data with full Movie type compliance
interface MovieData {
  id: string;
  tmdbId: number;
  title: string;
  year: number;
  releaseDate: string;
  runtime: number;
  posterUrl: string;
  backdropUrl?: string;
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

const MOVIES_DATA: MovieData[] = [
  { id: '1', tmdbId: 550, title: 'The Midnight Garden', year: 2024, releaseDate: '2024-03-15', runtime: 118, posterUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&h=1200&fit=crop', genres: ['drama', 'mystery'], mood: ['calm'], era: 'recent', ratingAvg: 7.8, ratingCount: 2450, popularityScore: 75, directors: ['Sarah Chen'], cast: ['Emma Stone', 'Ryan Gosling'] },
  { id: '2', tmdbId: 551, title: 'Steel Horizon', year: 2024, releaseDate: '2024-05-20', runtime: 142, posterUrl: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800&h=1200&fit=crop', genres: ['action', 'scifi'], mood: ['intense'], era: 'recent', ratingAvg: 8.1, ratingCount: 5600, popularityScore: 88, directors: ['James Cameron'], cast: ['Chris Hemsworth', 'Zendaya'] },
  { id: '3', tmdbId: 552, title: 'Love in Transit', year: 2023, releaseDate: '2023-08-10', runtime: 96, posterUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=800&h=1200&fit=crop', genres: ['romance', 'comedy'], mood: ['fun', 'calm'], era: 'recent', ratingAvg: 7.2, ratingCount: 3200, popularityScore: 72, directors: ['Nancy Meyers'], cast: ['Florence Pugh', 'Andrew Garfield'] },
  { id: '4', tmdbId: 553, title: 'The Last Algorithm', year: 2024, releaseDate: '2024-01-12', runtime: 128, posterUrl: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=800&h=1200&fit=crop', genres: ['thriller', 'scifi'], mood: ['intense'], era: 'recent', ratingAvg: 7.9, ratingCount: 4100, popularityScore: 81, directors: ['Denis Villeneuve'], cast: ['Oscar Isaac', 'Saoirse Ronan'] },
  { id: '5', tmdbId: 554, title: 'Whispers of the Forest', year: 2023, releaseDate: '2023-11-05', runtime: 105, posterUrl: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=800&h=1200&fit=crop', genres: ['drama', 'fantasy'], mood: ['calm'], era: 'recent', ratingAvg: 7.5, ratingCount: 1800, popularityScore: 68, directors: ['Guillermo del Toro'], cast: ['Anya Taylor-Joy', 'Dev Patel'] },
  { id: '6', tmdbId: 555, title: "The Baker's Daughter", year: 2024, releaseDate: '2024-02-14', runtime: 112, posterUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&h=1200&fit=crop', genres: ['drama', 'romance'], mood: ['calm'], era: 'recent', ratingAvg: 7.3, ratingCount: 2100, popularityScore: 65, directors: ['Greta Gerwig'], cast: ['Margot Robbie', 'Timothée Chalamet'] },
  { id: '7', tmdbId: 556, title: 'Velocity', year: 2024, releaseDate: '2024-06-28', runtime: 98, posterUrl: 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=800&h=1200&fit=crop', genres: ['action', 'thriller'], mood: ['intense', 'fun'], era: 'recent', ratingAvg: 7.6, ratingCount: 3800, popularityScore: 79, directors: ['Chad Stahelski'], cast: ['Keanu Reeves', 'Ana de Armas'] },
  { id: '8', tmdbId: 557, title: 'Between Worlds', year: 2023, releaseDate: '2023-09-22', runtime: 134, posterUrl: 'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?w=800&h=1200&fit=crop', genres: ['fantasy', 'adventure'], mood: ['fun'], era: 'recent', ratingAvg: 7.7, ratingCount: 4500, popularityScore: 77, directors: ['Taika Waititi'], cast: ['Tom Holland', 'Daisy Ridley'] },
  { id: '9', tmdbId: 558, title: 'Laughing Matter', year: 2024, releaseDate: '2024-04-05', runtime: 88, posterUrl: 'https://images.unsplash.com/photo-1585647347483-22b66260dfff?w=800&h=1200&fit=crop', genres: ['comedy'], mood: ['fun'], era: 'recent', ratingAvg: 7.1, ratingCount: 2800, popularityScore: 71, directors: ['Judd Apatow'], cast: ['Pete Davidson', 'Sydney Sweeney'] },
  { id: '10', tmdbId: 559, title: 'The Silent Cartographer', year: 2024, releaseDate: '2024-07-15', runtime: 145, posterUrl: 'https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?w=800&h=1200&fit=crop', genres: ['drama', 'mystery'], mood: ['calm', 'intense'], era: 'recent', ratingAvg: 8.2, ratingCount: 6200, popularityScore: 82, directors: ['Christopher Nolan'], cast: ['Cillian Murphy', 'Emily Blunt'] },
  { id: '11', tmdbId: 560, title: 'Shadows in the Snow', year: 2023, releaseDate: '2023-12-08', runtime: 116, posterUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=1200&fit=crop', genres: ['thriller', 'drama'], mood: ['intense', 'calm'], era: 'recent', ratingAvg: 7.4, ratingCount: 2900, popularityScore: 74, directors: ['Taylor Sheridan'], cast: ['Jeremy Renner', 'Elizabeth Olsen'] },
  { id: '12', tmdbId: 561, title: 'Pixel Hearts', year: 2024, releaseDate: '2024-03-01', runtime: 92, posterUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&h=1200&fit=crop', genres: ['animation', 'comedy', 'romance'], mood: ['fun'], era: 'recent', ratingAvg: 8.0, ratingCount: 7500, popularityScore: 83, directors: ['Pete Docter'], cast: ['Voice Cast'] },
  { id: '13', tmdbId: 562, title: 'The Weight of Water', year: 2024, releaseDate: '2024-05-03', runtime: 108, posterUrl: 'https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=800&h=1200&fit=crop', genres: ['drama'], mood: ['calm'], era: 'recent', ratingAvg: 7.6, ratingCount: 1900, popularityScore: 69, directors: ['Barry Jenkins'], cast: ['Viola Davis', 'Mahershala Ali'] },
  { id: '14', tmdbId: 563, title: 'Neon Requiem', year: 2023, releaseDate: '2023-10-20', runtime: 121, posterUrl: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&h=1200&fit=crop', genres: ['action', 'scifi', 'thriller'], mood: ['intense'], era: 'recent', ratingAvg: 8.3, ratingCount: 8100, popularityScore: 86, directors: ['The Wachowskis'], cast: ['John David Washington', 'Lupita Nyongo'] },
  { id: '15', tmdbId: 564, title: "Summer of '89", year: 2024, releaseDate: '2024-06-14', runtime: 95, posterUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=1200&fit=crop', genres: ['drama', 'romance'], mood: ['calm', 'fun'], era: 'recent', ratingAvg: 7.3, ratingCount: 2400, popularityScore: 73, directors: ['Richard Linklater'], cast: ['Stranger Things Cast'] },
  { id: '16', tmdbId: 565, title: 'The Inheritance', year: 2024, releaseDate: '2024-08-09', runtime: 138, posterUrl: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&h=1200&fit=crop', genres: ['drama', 'mystery', 'thriller'], mood: ['intense', 'calm'], era: 'recent', ratingAvg: 7.7, ratingCount: 3400, popularityScore: 76, directors: ['Rian Johnson'], cast: ['Daniel Craig', 'Jamie Lee Curtis'] },
  { id: '17', tmdbId: 566, title: 'Orbit', year: 2024, releaseDate: '2024-09-27', runtime: 152, posterUrl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=800&h=1200&fit=crop', genres: ['scifi', 'drama', 'adventure'], mood: ['intense', 'calm'], era: 'recent', ratingAvg: 8.5, ratingCount: 9200, popularityScore: 91, directors: ['Alfonso Cuarón'], cast: ['Sandra Bullock', 'George Clooney'] },
  { id: '18', tmdbId: 567, title: 'The Art of Letting Go', year: 2023, releaseDate: '2023-07-21', runtime: 104, posterUrl: 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=800&h=1200&fit=crop', genres: ['drama', 'romance'], mood: ['calm'], era: 'recent', ratingAvg: 7.4, ratingCount: 1700, popularityScore: 67, directors: ['Sofia Coppola'], cast: ['Kirsten Dunst', 'Adam Driver'] },
  { id: '19', tmdbId: 568, title: 'Frostbite', year: 2024, releaseDate: '2024-10-31', runtime: 99, posterUrl: 'https://images.unsplash.com/photo-1478827536114-da961b7f86d2?w=800&h=1200&fit=crop', genres: ['horror', 'thriller'], mood: ['intense'], era: 'recent', ratingAvg: 7.5, ratingCount: 3100, popularityScore: 78, directors: ['Ari Aster'], cast: ['Florence Pugh', 'Jack Reynor'] },
  { id: '20', tmdbId: 569, title: 'The Grand Illusion', year: 2024, releaseDate: '2024-11-15', runtime: 126, posterUrl: 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=800&h=1200&fit=crop', genres: ['drama', 'mystery'], mood: ['calm', 'intense'], era: 'recent', ratingAvg: 7.9, ratingCount: 4800, popularityScore: 80, directors: ['David Fincher'], cast: ['Rooney Mara', 'Ben Affleck'] },
  { id: '21', tmdbId: 570, title: 'Echoes of Tomorrow', year: 2024, releaseDate: '2024-04-19', runtime: 115, posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&h=1200&fit=crop', genres: ['scifi', 'drama'], mood: ['calm', 'intense'], era: 'recent', ratingAvg: 7.6, ratingCount: 2600, popularityScore: 70, directors: ['Alex Garland'], cast: ['Alicia Vikander', 'Domhnall Gleeson'] },
  { id: '22', tmdbId: 571, title: 'The Comedian', year: 2023, releaseDate: '2023-06-02', runtime: 102, posterUrl: 'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=800&h=1200&fit=crop', genres: ['comedy', 'drama'], mood: ['fun'], era: 'recent', ratingAvg: 7.2, ratingCount: 2000, popularityScore: 66, directors: ['Todd Phillips'], cast: ['Joaquin Phoenix', 'Lady Gaga'] },
  { id: '23', tmdbId: 572, title: 'Dark Waters', year: 2024, releaseDate: '2024-02-23', runtime: 118, posterUrl: 'https://images.unsplash.com/photo-1551244072-5d12893278ab?w=800&h=1200&fit=crop', genres: ['thriller', 'mystery'], mood: ['intense'], era: 'recent', ratingAvg: 7.4, ratingCount: 2700, popularityScore: 74, directors: ['Todd Haynes'], cast: ['Mark Ruffalo', 'Anne Hathaway'] },
  { id: '24', tmdbId: 573, title: 'Golden Hour', year: 2024, releaseDate: '2024-07-04', runtime: 94, posterUrl: 'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=800&h=1200&fit=crop', genres: ['romance', 'drama'], mood: ['calm'], era: 'recent', ratingAvg: 7.5, ratingCount: 2200, popularityScore: 71, directors: ['Celine Sciamma'], cast: ['Adèle Exarchopoulos', 'Léa Seydoux'] },
  { id: '25', tmdbId: 574, title: 'The Recruit', year: 2023, releaseDate: '2023-09-08', runtime: 108, posterUrl: 'https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?w=800&h=1200&fit=crop', genres: ['action', 'thriller'], mood: ['intense', 'fun'], era: 'recent', ratingAvg: 7.7, ratingCount: 3500, popularityScore: 77, directors: ['Doug Liman'], cast: ['Tom Cruise', 'Rebecca Ferguson'] },
  { id: '26', tmdbId: 575, title: 'Parallel Lives', year: 2024, releaseDate: '2024-05-31', runtime: 125, posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&h=1200&fit=crop', genres: ['scifi', 'drama', 'romance'], mood: ['calm'], era: 'recent', ratingAvg: 7.3, ratingCount: 2300, popularityScore: 73, directors: ['Mike Mills'], cast: ['Joaquin Phoenix', 'Rooney Mara'] },
  { id: '27', tmdbId: 576, title: 'Wild Card', year: 2024, releaseDate: '2024-08-16', runtime: 96, posterUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&h=1200&fit=crop', genres: ['comedy', 'action'], mood: ['fun'], era: 'recent', ratingAvg: 7.1, ratingCount: 1900, popularityScore: 69, directors: ['Edgar Wright'], cast: ['Ryan Reynolds', 'Awkwafina'] },
  { id: '28', tmdbId: 577, title: 'The Last Light', year: 2023, releaseDate: '2023-11-24', runtime: 132, posterUrl: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=800&h=1200&fit=crop', genres: ['drama', 'thriller'], mood: ['intense', 'calm'], era: 'recent', ratingAvg: 8.0, ratingCount: 5400, popularityScore: 81, directors: ['Alejandro González Iñárritu'], cast: ['Leonardo DiCaprio', 'Jennifer Lawrence'] },
  { id: '29', tmdbId: 578, title: 'Starfall', year: 2024, releaseDate: '2024-12-20', runtime: 140, posterUrl: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=800&h=1200&fit=crop', genres: ['scifi', 'adventure'], mood: ['fun', 'intense'], era: 'recent', ratingAvg: 8.4, ratingCount: 8900, popularityScore: 85, directors: ['J.J. Abrams'], cast: ['Daisy Ridley', 'Oscar Isaac'] },
  { id: '30', tmdbId: 579, title: 'The Quiet Ones', year: 2024, releaseDate: '2024-10-11', runtime: 98, posterUrl: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800&h=1200&fit=crop', genres: ['horror', 'thriller'], mood: ['intense'], era: 'recent', ratingAvg: 7.2, ratingCount: 2500, popularityScore: 72, directors: ['Jordan Peele'], cast: ['Daniel Kaluuya', 'Keke Palmer'] },
];

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

// Get movies available in a country
export function getMovies(countryCode: string): Movie[] {
  const availability = getAvailabilityMap(countryCode);

  return MOVIES_DATA
    .filter((movie) => availability[movie.id])
    .map((movie): Movie => ({
      id: movie.id,
      tmdbId: movie.tmdbId,
      title: movie.title,
      year: movie.year,
      releaseDate: movie.releaseDate,
      runtime: movie.runtime,
      posterUrl: movie.posterUrl,
      backdropUrl: movie.backdropUrl,
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
