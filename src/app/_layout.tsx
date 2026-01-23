import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import { COLORS } from '@/lib/constants';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

const GloTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: COLORS.bg,
    card: COLORS.bgCard,
    text: COLORS.text,
    border: 'transparent',
  },
};

function RootLayoutNav() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Wait for store to hydrate
    if (useStore.persist.hasHydrated()) {
      setReady(true);
      SplashScreen.hideAsync();
    } else {
      const unsub = useStore.persist.onFinishHydration(() => {
        setReady(true);
        SplashScreen.hideAsync();
      });
      return unsub;
    }
  }, []);

  if (!ready) return null;

  return (
    <ThemeProvider value={GloTheme}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: COLORS.bg },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="settings" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="saved" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="liked" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="spellage" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="session" options={{ animation: 'fade', gestureEnabled: false }} />
        <Stack.Screen name="waiting-room" options={{ animation: 'slide_from_right', gestureEnabled: false }} />
        <Stack.Screen name="join" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="join/[code]" options={{ animation: 'fade', gestureEnabled: false }} />
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
