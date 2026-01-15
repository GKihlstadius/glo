import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Country, Session, TasteProfile } from './types';
import { COUNTRIES } from './constants';
import { Platform, NativeModules } from 'react-native';
import { createDefaultTasteProfile, updateTasteProfile } from './feed-engine';
import { getMovie } from './movies';

interface GloStore {
  // Region - auto-detected
  country: Country;

  // Swipe history
  savedMovies: string[];
  likedMovies: string[];
  passedMovies: string[];

  // Taste profile for feed personalization
  tasteProfile: TasteProfile;

  // Settings
  hapticEnabled: boolean;

  // Session
  currentSession: Session | null;
  deviceId: string;

  // Actions
  setCountry: (country: Country) => void;
  saveMovie: (id: string) => void;
  unsaveMovie: (id: string) => void;
  likeMovie: (id: string) => void;
  passMovie: (id: string) => void;
  toggleHaptic: () => void;
  setSession: (session: Session | null) => void;
  reset: () => void;
}

// Auto-detect country from device locale
function detectCountry(): Country {
  let regionCode = 'US';

  try {
    if (Platform.OS === 'ios') {
      regionCode = NativeModules.SettingsManager?.settings?.AppleLocale?.split('_')[1] ||
                   NativeModules.SettingsManager?.settings?.AppleLanguages?.[0]?.split('-')[1] ||
                   'US';
    } else if (Platform.OS === 'android') {
      regionCode = NativeModules.I18nManager?.localeIdentifier?.split('_')[1] || 'US';
    }
  } catch {
    regionCode = 'US';
  }

  return COUNTRIES.find((c) => c.code === regionCode) || COUNTRIES.find((c) => c.code === 'US')!;
}

const defaultCountry = detectCountry();

export const useStore = create<GloStore>()(
  persist(
    (set, get) => ({
      country: defaultCountry,
      savedMovies: [],
      likedMovies: [],
      passedMovies: [],
      tasteProfile: createDefaultTasteProfile(),
      hapticEnabled: true,
      currentSession: null,
      deviceId: Math.random().toString(36).slice(2),

      setCountry: (country) => set({ country }),

      saveMovie: (id) =>
        set((s) => {
          const movie = getMovie(id, s.country.code);
          const newProfile = movie
            ? updateTasteProfile(s.tasteProfile, movie, 'save')
            : s.tasteProfile;

          return {
            savedMovies: s.savedMovies.includes(id) ? s.savedMovies : [...s.savedMovies, id],
            tasteProfile: newProfile,
          };
        }),

      unsaveMovie: (id) =>
        set((s) => ({
          savedMovies: s.savedMovies.filter((x) => x !== id),
        })),

      likeMovie: (id) =>
        set((s) => {
          const movie = getMovie(id, s.country.code);
          const newProfile = movie
            ? updateTasteProfile(s.tasteProfile, movie, 'like')
            : s.tasteProfile;

          return {
            likedMovies: s.likedMovies.includes(id) ? s.likedMovies : [...s.likedMovies, id],
            tasteProfile: newProfile,
          };
        }),

      passMovie: (id) =>
        set((s) => {
          const movie = getMovie(id, s.country.code);
          const newProfile = movie
            ? updateTasteProfile(s.tasteProfile, movie, 'pass')
            : s.tasteProfile;

          return {
            passedMovies: s.passedMovies.includes(id) ? s.passedMovies : [...s.passedMovies, id],
            tasteProfile: newProfile,
          };
        }),

      toggleHaptic: () => set((s) => ({ hapticEnabled: !s.hapticEnabled })),

      setSession: (session) => set({ currentSession: session }),

      reset: () =>
        set({
          savedMovies: [],
          likedMovies: [],
          passedMovies: [],
          tasteProfile: createDefaultTasteProfile(),
          currentSession: null,
        }),
    }),
    {
      name: 'glo',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        country: s.country,
        savedMovies: s.savedMovies,
        likedMovies: s.likedMovies,
        passedMovies: s.passedMovies,
        tasteProfile: s.tasteProfile,
        hapticEnabled: s.hapticEnabled,
        deviceId: s.deviceId,
      }),
    }
  )
);
