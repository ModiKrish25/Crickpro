
import { Platform } from "react-native";
import { enableScreens } from "react-native-screens";

if (Platform.OS === "web") {
  enableScreens(false);
}

import "@/global.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import { View } from "react-native";
import "@/lib/_core/nativewind-pressable";
import { ThemeProvider } from "@/lib/theme-provider";
import { AuthProvider } from "@/lib/auth-context";
import { AmbientGradient } from "@/components/ui/ambient-gradient";
import { DotGrid } from "@/components/ui/dot-grid";
import {
  SafeAreaFrameContext,
  SafeAreaInsetsContext,
  SafeAreaProvider,
  initialWindowMetrics,
} from "react-native-safe-area-context";
import type { EdgeInsets, Metrics, Rect } from "react-native-safe-area-context";

import { trpc, createTRPCClient } from "@/lib/trpc";
import { initManusRuntime, subscribeSafeAreaInsets } from "@/lib/_core/manus-runtime";
import { CricketPreloader } from "@/components/preloader/cricket-preloader";
import { WebScreenFix } from "@/components/web-screen-fix";
import { usePreloaderManager } from "@/hooks/use-preloader-manager";
import { useAuthContext } from "@/lib/auth-context";
import { ClerkProvider } from "@clerk/clerk-expo";
import { CLERK_PUBLISHABLE_KEY, tokenCache } from "@/constants/clerk";
import * as SplashScreen from "expo-splash-screen";


// Keep the native splash visible until the JS preloader is ready to render
// its first frame (dark background matches the splash). This eliminates
// the white flash between the two.
SplashScreen.preventAutoHideAsync();

const DEFAULT_WEB_INSETS: EdgeInsets = { top: 0, right: 0, bottom: 0, left: 0 };
const getWebFrame = (): Rect => ({
  x: 0,
  y: 0,
  width: typeof window !== "undefined" && window.innerWidth ? window.innerWidth : 1200,
  height: typeof window !== "undefined" && window.innerHeight ? window.innerHeight : 800,
});

/**
 * Preloader-aware wrapper — sits inside AuthProvider and the safe-area
 * tree so it can read auth loading state and overlay everything.
 */
function RootLayoutWithPreloader() {
  const { loading: authLoading } = useAuthContext();
  const { state, exitComplete, onRetry, onExitComplete } = usePreloaderManager({
    authLoading,
    appReady: true,
  });

  // Hide the native splash screen as soon as the preloader renders its first
  // frame. Both have the same dark background (#050806) so there is no visual jump.
  useEffect(() => {
    if (state.phase !== "hidden") {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [state.phase]);

  return (
    <View style={Platform.OS === "web" ? {
      flex: 1,
      height: "100%",
      width: "100%",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
    } : { flex: 1, height: "100%", width: "100%" }}>
      <Stack
        screenOptions={{
          headerShown: false,
          // On web: disable ALL animations — Reanimated-powered transitions leave
          // screens at translateY(100vh) initial position and never animate to 0.
          // On native: use standard slide animations.
          animation: Platform.OS === "web" ? "none" : "slide_from_right",
          animationDuration: Platform.OS === "web" ? 0 : 300,
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="oauth/callback" />
        <Stack.Screen name="sign-in" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="head-to-head" />
        <Stack.Screen
          name="match/create"
          options={{ animation: Platform.OS === "web" ? "none" : "slide_from_bottom" }}
        />
        <Stack.Screen
          name="match/live"
          options={{ animation: Platform.OS === "web" ? "none" : "slide_from_bottom" }}
        />
      </Stack>

      {/* Preloader overlays everything until exit is complete */}
      {!exitComplete && (
        <CricketPreloader
          state={state}
          onRetry={onRetry}
          onExitComplete={onExitComplete}
          appName="CRICKPRO"
          tagline="Every Ball. Every Moment."
        />
      )}
    </View>
  );
}



export const unstable_settings = {
  initialRouteName: "(tabs)",
};

export default function RootLayout() {
  const initialInsets = initialWindowMetrics?.insets ?? DEFAULT_WEB_INSETS;
  const initialFrame = initialWindowMetrics?.frame ?? getWebFrame();

  const [insets, setInsets] = useState<EdgeInsets>(initialInsets);
  const [frame, setFrame] = useState<Rect>(initialFrame);

  // Initialize Manus runtime for cookie injection from parent container
  useEffect(() => {
    initManusRuntime();
  }, []);

  const handleSafeAreaUpdate = useCallback((metrics: Metrics) => {
    setInsets(metrics.insets);
    if (metrics.frame && metrics.frame.width > 0 && metrics.frame.height > 0) {
      setFrame(metrics.frame);
    }
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const updateFrame = () => {
      setFrame(getWebFrame());
    };
    updateFrame();
    window.addEventListener("resize", updateFrame);
    const unsubscribe = subscribeSafeAreaInsets(handleSafeAreaUpdate);
    return () => {
      window.removeEventListener("resize", updateFrame);
      unsubscribe();
    };
  }, [handleSafeAreaUpdate]);

  // Create clients once and reuse them
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Disable automatic refetching on window focus for mobile
            refetchOnWindowFocus: false,
            // Retry failed requests once
            retry: 1,
          },
        },
      }),
  );
  const [trpcClient] = useState(() => createTRPCClient());

  // Ensure minimum 8px padding for top and bottom on mobile - compute ONCE on mount
  const providerInitialMetrics = useMemo(() => {
    const metrics = initialWindowMetrics ?? { insets: initialInsets, frame: initialFrame };
    return {
      ...metrics,
      insets: {
        ...metrics.insets,
        top: Math.max(metrics.insets.top, 16),
        bottom: Math.max(metrics.insets.bottom, 12),
      },
    };
  }, []);

  const content = (
    <GestureHandlerRootView style={Platform.OS === "web" ? {
      height: "100vh" as any,
      width: "100%",
      overflow: "hidden" as const,
      display: "flex" as const,
      flexDirection: "column" as const,
    } : { flex: 1, width: "100%" }}>
      <AmbientGradient intensity={0.4} />
      {Platform.OS === "web" && (
        <DotGrid
          dotSize={8}
          gap={20}
          proximity={100}
          shockRadius={200}
          shockStrength={4}
          resistance={600}
          returnDuration={1.2}
        />
      )}
      <View style={Platform.OS === "web" ? {
        flex: 1,
        height: "100%" as any,
        width: "100%",
        position: "relative" as const,
        zIndex: 1,
        display: "flex" as const,
        flexDirection: "column" as const,
        overflow: "hidden" as const,
      } : {
        flex: 1,
        width: "100%",
        position: "relative" as const,
        zIndex: 1,
      }}>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}>
            <AuthProvider>
              <RootLayoutWithPreloader />
              {/* Fix React Navigation screen transform bug on web */}
              <WebScreenFix />
              <StatusBar style="auto" />
            </AuthProvider>
          </ClerkProvider>
        </QueryClientProvider>
      </trpc.Provider>

      </View>
    </GestureHandlerRootView>
  );



  return (
    <ThemeProvider>
      <SafeAreaProvider initialMetrics={providerInitialMetrics}>{content}</SafeAreaProvider>
    </ThemeProvider>
  );
}
