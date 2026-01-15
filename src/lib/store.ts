import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Country, Session } from './types';
import { COUNTRIES } from './constants';
import { Platform, NativeModules } from 'react-native';

interface GloStore {
  // Region - auto-detected
  country: Country;

  // Swipe history
  savedMovies: string[];
  likedMovies: string[];
  passedMovies: string[];

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
    (set) => ({
      country: defaultCountry,
      savedMovies: [],
      likedMovies: [],
      passedMovies: [],
      hapticEnabled: true,
      currentSession: null,
      deviceId: Math.random().toString(36).slice(2),

      setCountry: (country) => set({ country }),

      saveMovie: (id) =>
        set((s) => ({
          savedMovies: s.savedMovies.includes(id) ? s.savedMovies : [...s.savedMovies, id],
        })),

      unsaveMovie: (id) =>
        set((s) => ({
          savedMovies: s.savedMovies.filter((x) => x !== id),
        })),

      likeMovie: (id) =>
        set((s) => ({
          likedMovies: s.likedMovies.includes(id) ? s.likedMovies : [...s.likedMovies, id],
        })),

      passMovie: (id) =>
        set((s) => ({
          passedMovies: s.passedMovies.includes(id) ? s.passedMovies : [...s.passedMovies, id],
        })),

      toggleHaptic: () => set((s) => ({ hapticEnabled: !s.hapticEnabled })),

      setSession: (session) => set({ currentSession: session }),

      reset: () =>
        set({
          savedMovies: [],
          likedMovies: [],
          passedMovies: [],
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
        hapticEnabled: s.hapticEnabled,
        deviceId: s.deviceId,
      }),
    }
  )
);
