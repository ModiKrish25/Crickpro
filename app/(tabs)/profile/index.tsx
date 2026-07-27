/**
 * Profile Screen - Premium user profile with enhanced glass effects
 * 
 * Design: Apple-style settings with glass cards, premium avatar
 * All elements use frosted glass with backdrop blur
 */
import { ScrollView, Text, View, Platform, ActivityIndicator } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useAuthContext } from "@/lib/auth-context";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { LiquidGlassOverlay } from "@/components/ui/liquid-glass-overlay";
import { useScrollPadding } from "@/hooks/use-scroll-padding";

export default function ProfileScreen() {
  const { paddingBottom } = useScrollPadding();
  const { user, loading, isAuthenticated, login, logout } = useAuthContext();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleAction = async (cb: () => void) => {
    if (Platform.OS !== "web") await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    cb();
  };

  const handleSignOut = async () => {
    if (Platform.OS !== "web") await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoggingOut(true);
    try { await logout(); } finally { setIsLoggingOut(false); }
  };

  const handleNavigate = async (screen: string) => {
    await handleAction(() => {
      switch (screen) {
        case "editProfile": router.push("/(tabs)/profile/edit"); break;
        case "theme": router.push("/(tabs)/profile/theme"); break;
        default: alert("Coming soon! This feature is under development.");
      }
    });
  };

  if (loading) {
    return (
      <ScreenContainer className="px-4" gradient glass>
        <View className="flex-1 items-center justify-center gap-4">
          <ActivityIndicator size="large" color="#0066FF" />
          <Text className="text-sm text-muted">Loading profile...</Text>
        </View>
      </ScreenContainer>
    );
  }

  // Not Authenticated
  if (!isAuthenticated) {
    return (
      <ScreenContainer className="px-4 pt-2" gradient glass>
        <ScrollView style={{ flex: 1, width: "100%", height: "100%" }} contentContainerStyle={{ flexGrow: 1, minHeight: "100%", paddingBottom }} showsVerticalScrollIndicator={false}>
          <View className="flex-1 gap-6 justify-center pt-10">
            <GlassCard intensity="high" glowColor="#0066FF" padding="xl" radius="xl" className="items-center gap-4 py-8" blurAmount={30} staggerIndex={0}>
              <LiquidGlassOverlay color="#0066FF" variant="sheen" speed={0.8} intensity={0.6} />
              <View className="w-24 h-24 rounded-full bg-[#0066FF]/10 items-center justify-center mb-1">
                <Text className="text-4xl">🏏</Text>
              </View>
              <Text className="text-3xl font-bold text-foreground tracking-tight">CrickPro</Text>
              <Text className="text-sm text-muted text-center max-w-[240px] leading-5">
                Cricket Scoring & Tournament Management
              </Text>
            </GlassCard>

            <GlassCard intensity="medium" padding="xl" radius="xl" className="gap-4" blurAmount={20} staggerIndex={1}>
              <LiquidGlassOverlay variant="sheen" speed={0.6} intensity={0.3} />
              <Text className="text-lg font-bold text-foreground text-center">Welcome to CrickPro!</Text>
              <Text className="text-sm text-muted text-center leading-5">
                Sign in to start scoring matches, track your career statistics, manage teams, and participate in tournaments.
              </Text>

              <View className="flex-row gap-3 mt-2">
                {[
                  { icon: "🏏", label: "Live Scoring" },
                  { icon: "📊", label: "Career Stats" },
                  { icon: "🏆", label: "Leagues" },
                ].map(({ icon, label }) => (
                  <GlassCard key={label} intensity="subtle" padding="sm" radius="lg" className="flex-1 items-center gap-1" highlight={false} glowAccents={false} depth={false}>
                    <Text className="text-xl">{icon}</Text>
                    <Text className="text-[10px] text-muted text-center">{label}</Text>
                  </GlassCard>
                ))}
              </View>
            </GlassCard>

            <GlassCard
              intensity="high"
              glowColor="#0066FF"
              padding="xl"
              radius="xl"
              gradientBorder
              className="items-center flex-row justify-center gap-3"
              onPress={async () => {
                if (Platform.OS !== "web") await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                await login();
              }}
              blurAmount={24}
              staggerIndex={2}
            >
              <Text className="text-xl">🔐</Text>
              <Text className="text-foreground font-bold text-lg">Sign In / Sign Up</Text>
            </GlassCard>
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  // Authenticated
  const initials = user?.name
    ? user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <ScreenContainer className="px-4 pt-2" gradient glass>
      <ScrollView style={{ flex: 1, width: "100%", height: "100%" }} contentContainerStyle={{ flexGrow: 1, minHeight: "100%", paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <View className="flex-1 gap-5">
          <View className="pt-2 pb-1">
            <Text className="text-[34px] font-bold text-foreground tracking-tight">Profile</Text>
            <Text className="text-base text-muted mt-1">Manage your account and preferences</Text>
          </View>

          {/* User Info Card - Enhanced glass */}
          <GlassCard intensity="high" glowColor="#0066FF" padding="lg" radius="xl" gradientBorder blurAmount={30} onPress={() => handleNavigate("editProfile")} staggerIndex={0}>
            <LiquidGlassOverlay color="#0066FF" variant="sheen" speed={0.5} intensity={0.4} />
            <View className="flex-row items-center gap-4">
              <View className="w-16 h-16 rounded-full bg-[#0066FF] items-center justify-center">
                <Text className="text-xl font-bold text-white">{initials}</Text>
              </View>
              <View className="flex-1 gap-0.5">
                <Text className="text-xl font-bold text-foreground">{user?.name || "Cricket Player"}</Text>
                <Text className="text-sm text-muted">{user?.email || "No email set"}</Text>
                {user?.loginMethod && (
                  <View className="flex-row items-center gap-1.5 mt-0.5">
                    <View className="bg-[#0066FF]/15 rounded-full px-2 py-0.5">
                      <Text className="text-[10px] font-semibold text-[#0066FF] capitalize">{user.loginMethod}</Text>
                    </View>
                  </View>
                )}
              </View>
              <Text className="text-muted text-lg">›</Text>
            </View>
          </GlassCard>

          {/* Account Section */}
          <View className="gap-1">
            <Text className="text-xs font-bold text-muted uppercase tracking-wider px-1 mb-1">Account</Text>
            
            {[
              { icon: "👤", label: "Edit Profile", desc: "Name, photo, cricket role", screen: "editProfile" },
              { icon: "🏏", label: "My Teams", desc: "Teams you manage or play for", screen: "myTeams" },
              { icon: "📊", label: "My Statistics", desc: "Career batting & bowling stats", screen: "myStats" },
            ].map(({ icon, label, desc, screen }, idx) => (
              <GlassCard
                key={label}
                intensity="high"
                padding="md"
                radius="xl"
                className="flex-row items-center gap-3"
                onPress={() => handleNavigate(screen)}
                blurAmount={20}
                staggerIndex={1 + idx}
              >
                <View className="w-10 h-10 rounded-full bg-white/50 dark:bg-white/[0.08] items-center justify-center">
                  <Text className="text-lg">{icon}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-foreground font-semibold">{label}</Text>
                  <Text className="text-xs text-muted">{desc}</Text>
                </View>
                <Text className="text-muted text-lg">›</Text>
              </GlassCard>
            ))}
          </View>

          {/* Settings Section */}
          <View className="gap-1">
            <Text className="text-xs font-bold text-muted uppercase tracking-wider px-1 mb-1">Settings</Text>
            
            {[
              { icon: "🔔", label: "Notifications", desc: "Match alerts, tournament updates", screen: "notifications" },
              { icon: "🎨", label: "Theme & Display", desc: "Light/dark mode, font size", screen: "theme" },
              { icon: "❓", label: "Help & Support", desc: "FAQ, contact us", screen: "help" },
            ].map(({ icon, label, desc, screen }, idx) => (
              <GlassCard
                key={label}
                intensity="high"
                padding="md"
                radius="xl"
                className="flex-row items-center gap-3"
                onPress={() => handleNavigate(screen)}
                blurAmount={20}
                staggerIndex={4 + idx}
              >
                <View className="w-10 h-10 rounded-full bg-white/50 dark:bg-white/[0.08] items-center justify-center">
                  <Text className="text-lg">{icon}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-foreground font-semibold">{label}</Text>
                  <Text className="text-xs text-muted">{desc}</Text>
                </View>
                <Text className="text-muted text-lg">›</Text>
              </GlassCard>
            ))}
          </View>

          {/* Sign Out */}
          <View className="mt-2">
            <GlassCard intensity="subtle" padding="md" radius="xl" className="items-center" onPress={handleSignOut} blurAmount={16} staggerIndex={7}>
              {isLoggingOut ? (
                <ActivityIndicator size="small" color="#FF3B30" />
              ) : (
                <Text className="text-[#FF3B30] font-semibold text-base">Sign Out</Text>
              )}
            </GlassCard>
            <Text className="text-xs text-muted text-center mt-3">
              Signed in as {user?.name || "Cricket Player"}
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
