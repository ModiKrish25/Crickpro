/**
 * Profile Screen - Auth-aware user profile and settings with glassmorphism
 * - When not authenticated: shows login prompt
 * - When authenticated: shows user profile with account management
 */ import { ScrollView, Text, View, Platform, ActivityIndicator } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useAuthContext } from "@/lib/auth-context";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassHeader } from "@/components/ui/glass-header";
import { LiquidGlassOverlay } from "@/components/ui/liquid-glass-overlay";

export default function ProfileScreen() {
  const { user, loading, isAuthenticated, login, logout } = useAuthContext();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleSignIn = async () => {
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    await login();
  };

  const handleSignOut = async () => {
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleNavigate = async (screen: string) => {
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    switch (screen) {
      case "editProfile":
        router.push("/(tabs)/profile/edit");
        break;
      case "theme":
        router.push("/(tabs)/profile/theme");
        break;
      case "myTeams":
      case "myStats":
      case "notifications":
      case "help":
        alert("Coming soon! This feature is under development.");
        break;
    }
  };

  // Loading state
  if (loading) {
    return (
      <ScreenContainer className="p-6">
        <View className="flex-1 items-center justify-center gap-4">
          <ActivityIndicator size="large" color="#0a7ea4" />
          <Text className="text-sm text-muted">Loading profile...</Text>
        </View>
      </ScreenContainer>
    );
  }

  // ---------- NOT AUTHENTICATED ----------
  if (!isAuthenticated) {
    return (
      <ScreenContainer className="p-6">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
          <View className="flex-1 gap-8 justify-center">
            {/* Brand Header */}
            <View className="items-center gap-4">
              <GlassCard intensity="high" glowColor="#0a7ea4" padding="lg" className="items-center">
                <LiquidGlassOverlay color="#0a7ea4" variant="sheen" speed={0.8} />
                <View className="w-20 h-20 rounded-2xl bg-primary/20 items-center justify-center mb-2">
                  <Text className="text-4xl">🏏</Text>
                </View>
                <Text className="text-2xl font-bold text-foreground">CrickPro</Text>
                <Text className="text-sm text-muted">Cricket Scoring & Tournament Management</Text>
              </GlassCard>
            </View>

            {/* Sign In Prompt */}
            <GlassCard intensity="medium" padding="lg" className="gap-4">
              <LiquidGlassOverlay variant="sheen" speed={0.6} />
              <Text className="text-lg font-bold text-foreground text-center">
                Welcome to CrickPro!
              </Text>
              <Text className="text-sm text-muted text-center leading-5">
                Sign in to start scoring matches, track your career statistics,
                manage teams, and participate in tournaments.
              </Text>

              <View className="flex-row gap-3 mt-2">
                <GlassCard intensity="subtle" padding="sm" className="flex-1 items-center gap-1">
                  <Text className="text-2xl">🏏</Text>
                  <Text className="text-xs text-muted text-center">Live Scoring</Text>
                </GlassCard>
                <GlassCard intensity="subtle" padding="sm" className="flex-1 items-center gap-1">
                  <Text className="text-2xl">📊</Text>
                  <Text className="text-xs text-muted text-center">Career Stats</Text>
                </GlassCard>
                <GlassCard intensity="subtle" padding="sm" className="flex-1 items-center gap-1">
                  <Text className="text-2xl">🏆</Text>
                  <Text className="text-xs text-muted text-center">Leagues</Text>
                </GlassCard>
              </View>
            </GlassCard>

            {/* Sign In Button */}
            <GlassCard
              intensity="high"
              glowColor="#0a7ea4"
              padding="lg"
              className="items-center flex-row justify-center gap-3"
              onPress={handleSignIn}
            >
              <Text className="text-2xl">🔐</Text>
              <Text className="text-foreground font-bold text-lg">Sign In / Sign Up</Text>
            </GlassCard>
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  // ---------- AUTHENTICATED ----------
  const initials = user?.name
    ? user.name
        .split(" ")
        .map(n => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  return (
    <ScreenContainer className="p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="flex-1 gap-6 pb-8">
          <GlassHeader title="Profile" subtitle="Manage your account and preferences" size="md" animated />

          {/* User Info Card */}
          <GlassCard
            intensity="medium"
            glowColor="#0a7ea4"
            padding="md"
            onPress={() => handleNavigate("editProfile")}
          >
              <LiquidGlassOverlay color="#0a7ea4" variant="sheen" speed={0.5} />
              <View className="flex-row items-center gap-4">
                {/* Avatar */}
                <View className="w-16 h-16 rounded-full bg-primary items-center justify-center">
                  <Text className="text-2xl font-bold text-background">{initials}</Text>
                </View>

                <View className="flex-1 gap-0.5">
                  <Text className="text-xl font-bold text-foreground">
                    {user?.name || "Cricket Player"}
                  </Text>
                  <Text className="text-sm text-muted">{user?.email || "No email set"}</Text>
                  {user?.loginMethod && (
                    <View className="flex-row items-center gap-1.5 mt-0.5">
                      <View className="bg-primary/20 rounded-full px-2 py-0.5">
                        <Text className="text-[10px] font-semibold text-primary capitalize">
                          {user.loginMethod}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>

                <Text className="text-muted text-lg">›</Text>
              </View>
            </GlassCard>

          {/* Account Section */}
          <View className="gap-1">
            <Text className="text-xs font-bold text-muted uppercase tracking-wider px-1 mb-1">
              Account
            </Text>

            <GlassCard
              intensity="medium"
              padding="sm"
              className="flex-row items-center gap-3"
              onPress={() => handleNavigate("editProfile")}
            >
              <Text className="text-lg">👤</Text>
              <View className="flex-1">
                <Text className="text-foreground font-semibold">Edit Profile</Text>
                <Text className="text-xs text-muted">Name, photo, cricket role</Text>
              </View>
              <Text className="text-muted">›</Text>
            </GlassCard>

            <GlassCard
              intensity="medium"
              padding="sm"
              className="flex-row items-center gap-3"
              onPress={() => handleNavigate("myTeams")}
            >
              <Text className="text-lg">🏏</Text>
              <View className="flex-1">
                <Text className="text-foreground font-semibold">My Teams</Text>
                <Text className="text-xs text-muted">Teams you manage or play for</Text>
              </View>
              <Text className="text-muted">›</Text>
            </GlassCard>

            <GlassCard
              intensity="medium"
              padding="sm"
              className="flex-row items-center gap-3"
              onPress={() => handleNavigate("myStats")}
            >
              <Text className="text-lg">📊</Text>
              <View className="flex-1">
                <Text className="text-foreground font-semibold">My Statistics</Text>
                <Text className="text-xs text-muted">Career batting & bowling stats</Text>
              </View>
              <Text className="text-muted">›</Text>
            </GlassCard>
          </View>

          {/* Settings Section */}
          <View className="gap-1">
            <Text className="text-xs font-bold text-muted uppercase tracking-wider px-1 mb-1">
              Settings
            </Text>

            <GlassCard
              intensity="medium"
              padding="sm"
              className="flex-row items-center gap-3"
              onPress={() => handleNavigate("notifications")}
            >
              <Text className="text-lg">🔔</Text>
              <View className="flex-1">
                <Text className="text-foreground font-semibold">Notifications</Text>
                <Text className="text-xs text-muted">Match alerts, tournament updates</Text>
              </View>
              <Text className="text-muted">›</Text>
            </GlassCard>

            <GlassCard
              intensity="medium"
              padding="sm"
              className="flex-row items-center gap-3"
              onPress={() => handleNavigate("theme")}
            >
              <Text className="text-lg">🎨</Text>
              <View className="flex-1">
                <Text className="text-foreground font-semibold">Theme & Display</Text>
                <Text className="text-xs text-muted">Light/dark mode, font size</Text>
              </View>
              <Text className="text-muted">›</Text>
            </GlassCard>

            <GlassCard
              intensity="medium"
              padding="sm"
              className="flex-row items-center gap-3"
              onPress={() => handleNavigate("help")}
            >
              <Text className="text-lg">❓</Text>
              <View className="flex-1">
                <Text className="text-foreground font-semibold">Help & Support</Text>
                <Text className="text-xs text-muted">FAQ, contact us</Text>
              </View>
              <Text className="text-muted">›</Text>
            </GlassCard>
          </View>

          {/* Sign Out Button */}
          <View className="mt-4">
            <GlassCard
              intensity="subtle"
              className="items-center py-4"
              onPress={handleSignOut}
            >
                {isLoggingOut ? (
                  <ActivityIndicator size="small" color="#EF4444" />
                ) : (
                  <Text className="text-error font-semibold text-base">Sign Out</Text>
                )}
              </GlassCard>

            {/* Logged in info */}
            <Text className="text-xs text-muted text-center mt-3">
              Signed in as {user?.name || "Cricket Player"}
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
