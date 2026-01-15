import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, router, useRootNavigationState, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from '@/lib/useColorScheme';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { useEffect, useState } from 'react';
import { useGloStore, useHasCompletedOnboarding } from '@/lib/store';
import { COLORS } from '@/lib/constants';

export const unstable_settings = {
  initialRouteName: 'index',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

// Custom dark theme for Glo
const GloDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: COLORS.background,
    card: COLORS.backgroundCard,
    primary: COLORS.primary,
    text: COLORS.textPrimary,
    border: 'rgba(255,255,255,0.1)',
  },
};

function useProtectedRoute() {
  const segments = useSegments();
  const navigationState = useRootNavigationState();
  const hasCompletedOnboarding = useHasCompletedOnboarding();
  const [hasHydrated, setHasHydrated] = useState(false);

  // Wait for store to hydrate from AsyncStorage
  useEffect(() => {
    const unsubscribe = useGloStore.persist.onFinishHydration(() => {
      setHasHydrated(true);
      SplashScreen.hideAsync();
    });

    // If already hydrated
    if (useGloStore.persist.hasHydrated()) {
      setHasHydrated(true);
      SplashScreen.hideAsync();
    }

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!navigationState?.key || !hasHydrated) return;

    const inOnboarding = segments[0] === 'onboarding';

    if (!hasCompletedOnboarding && !inOnboarding) {
      // Redirect to onboarding if not completed
      router.replace('/onboarding');
    } else if (hasCompletedOnboarding && inOnboarding) {
      // Redirect to home if onboarding is complete
      router.replace('/');
    }
  }, [hasCompletedOnboarding, segments, navigationState?.key, hasHydrated]);
}

function RootLayoutNav() {
  useProtectedRoute();

  return (
    <ThemeProvider value={GloDarkTheme}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: COLORS.background },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
        <Stack.Screen name="settings" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="saved" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="purchase" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="couch" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="game" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="session" options={{ animation: 'slide_from_right', gestureEnabled: false }} />
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <KeyboardProvider>
          <StatusBar style="light" />
          <RootLayoutNav />
        </KeyboardProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
