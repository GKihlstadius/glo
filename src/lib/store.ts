import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Country, UserPreferences, Session, MoodCard } from './types';

interface GloStore {
  // User preferences
  country: Country | null;
  hasCompletedOnboarding: boolean;
  savedMovies: string[];
  likedMovies: string[];
  passedMovies: string[];
  connectionPoints: number;
  preferredGenres: string[];
  hapticEnabled: boolean;
  hasPurchased: boolean;

  // Current session state (not persisted)
  currentSession: Session | null;
  deviceId: string;

  // Actions - User preferences
  setCountry: (country: Country) => void;
  completeOnboarding: () => void;
  saveMovie: (movieId: string) => void;
  unsaveMovie: (movieId: string) => void;
  likeMovie: (movieId: string) => void;
  passMovie: (movieId: string) => void;
  setPreferredGenres: (genres: string[]) => void;
  toggleHaptic: () => void;
  setPurchased: (purchased: boolean) => void;
  incrementConnectionPoints: () => void;

  // Actions - Session
  setCurrentSession: (session: Session | null) => void;
  setDeviceId: (id: string) => void;

  // Reset
  resetPreferences: () => void;
}

const initialState = {
  country: null,
  hasCompletedOnboarding: false,
  savedMovies: [],
  likedMovies: [],
  passedMovies: [],
  connectionPoints: 0,
  preferredGenres: [],
  hapticEnabled: true,
  hasPurchased: false,
  currentSession: null,
  deviceId: '',
};

export const useGloStore = create<GloStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setCountry: (country) => set({ country }),

      completeOnboarding: () => set({ hasCompletedOnboarding: true }),

      saveMovie: (movieId) =>
        set((state) => ({
          savedMovies: state.savedMovies.includes(movieId)
            ? state.savedMovies
            : [...state.savedMovies, movieId],
        })),

      unsaveMovie: (movieId) =>
        set((state) => ({
          savedMovies: state.savedMovies.filter((id) => id !== movieId),
        })),

      likeMovie: (movieId) =>
        set((state) => ({
          likedMovies: state.likedMovies.includes(movieId)
            ? state.likedMovies
            : [...state.likedMovies, movieId],
        })),

      passMovie: (movieId) =>
        set((state) => ({
          passedMovies: state.passedMovies.includes(movieId)
            ? state.passedMovies
            : [...state.passedMovies, movieId],
        })),

      setPreferredGenres: (genres) => set({ preferredGenres: genres }),

      toggleHaptic: () => set((state) => ({ hapticEnabled: !state.hapticEnabled })),

      setPurchased: (purchased) => set({ hasPurchased: purchased }),

      incrementConnectionPoints: () =>
        set((state) => ({ connectionPoints: state.connectionPoints + 1 })),

      setCurrentSession: (session) => set({ currentSession: session }),

      setDeviceId: (id) => set({ deviceId: id }),

      resetPreferences: () =>
        set({
          ...initialState,
          deviceId: get().deviceId, // Keep device ID
        }),
    }),
    {
      name: 'glo-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        country: state.country,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        savedMovies: state.savedMovies,
        likedMovies: state.likedMovies,
        passedMovies: state.passedMovies,
        connectionPoints: state.connectionPoints,
        preferredGenres: state.preferredGenres,
        hapticEnabled: state.hapticEnabled,
        hasPurchased: state.hasPurchased,
        deviceId: state.deviceId,
      }),
    }
  )
);

// Selectors for optimal re-renders
export const useCountry = () => useGloStore((s) => s.country);
export const useHasCompletedOnboarding = () => useGloStore((s) => s.hasCompletedOnboarding);
export const useSavedMovies = () => useGloStore((s) => s.savedMovies);
export const useLikedMovies = () => useGloStore((s) => s.likedMovies);
export const usePassedMovies = () => useGloStore((s) => s.passedMovies);
export const useConnectionPoints = () => useGloStore((s) => s.connectionPoints);
export const useHapticEnabled = () => useGloStore((s) => s.hapticEnabled);
export const useHasPurchased = () => useGloStore((s) => s.hasPurchased);
export const useCurrentSession = () => useGloStore((s) => s.currentSession);
