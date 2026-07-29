/**
 * Profile Screen - Pitch Dark Emerald Charcoal Palette
 * 
 * Design Architecture:
 * - Matching exact user photo color scheme (#050B08 background, #10B981 Mint Green accents, #0B1511 cards)
 * - Guest Login View & Authenticated Player Passport
 */
import { ScrollView, Text, View, Platform, ActivityIndicator, TouchableOpacity } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useAuthContext } from "@/lib/auth-context";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { useScrollPadding } from "@/hooks/use-scroll-padding";

export default function ProfileScreen() {
  const { paddingBottom } = useScrollPadding();
  const { user, loading, isAuthenticated, login, logout } = useAuthContext();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleNavigate = async (screen: string) => {
    if (Platform.OS !== "web") await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    switch (screen) {
      case "editProfile": router.push("/(tabs)/profile/edit" as any); break;
      case "theme": router.push("/(tabs)/profile/theme" as any); break;
      case "stats": router.push("/(tabs)/stats" as any); break;
      case "leagues": router.push("/(tabs)/leagues" as any); break;
      case "h2h": router.push("/head-to-head" as any); break;
      case "aichat": router.push("/ai-chat" as any); break;
      default: alert(`${screen} feature coming in next update!`);
    }
  };

  const handleSignOut = async () => {
    if (Platform.OS !== "web") await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoggingOut(true);
    try { await logout(); } finally { setIsLoggingOut(false); }
  };

  if (loading) {
    return (
      <ScreenContainer className="px-4" gradient glass>
        <View className="flex-1 items-center justify-center gap-4">
          <ActivityIndicator size="large" color="#10B981" />
          <Text className="text-sm font-bold text-slate-400">Loading CrickPro profile...</Text>
        </View>
      </ScreenContainer>
    );
  }

  // Guest / Unauthenticated Screen
  if (!isAuthenticated) {
    return (
      <ScreenContainer gradient>
        <ScrollView style={{ flex: 1, width: "100%" }} contentContainerStyle={{ flexGrow: 1, paddingBottom: paddingBottom + 24 }} showsVerticalScrollIndicator={false}>
          <View className="flex-1 gap-6 justify-center pt-8">
            <GlassCard intensity="heavy" radius="xl" padding="xl" className="items-center gap-4 py-10 bg-[#0B1511] border-[#10B981]/30">
              <View className="w-24 h-24 rounded-full bg-[#10B981]/10 border-2 border-[#10B981]/40 items-center justify-center mb-1 shadow-lg shadow-emerald-500/20">
                <Text className="text-4xl">🏏</Text>
              </View>
              <View className="items-center gap-1">
                <Text className="text-3xl font-black text-white tracking-tight">CRICKPRO</Text>
                <Text className="text-xs font-black text-[#10B981] uppercase tracking-widest">Scoring & Tournament Platform</Text>
              </View>
              <Text className="text-sm font-semibold text-slate-300 text-center max-w-[280px] leading-5">
                Sign in to manage team rosters, track career stats, host leagues, and sync match data.
              </Text>
            </GlassCard>

            <TouchableOpacity
              onPress={async () => {
                if (Platform.OS !== "web") await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                await login();
              }}
              className="bg-[#10B981] hover:bg-[#059669] py-4 rounded-2xl items-center flex-row justify-center gap-3 shadow-xl shadow-emerald-500/20 active:scale-95"
            >
              <Text className="text-xl">🔐</Text>
              <Text className="text-[#050B08] font-black text-lg">Sign In / Register</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  // Authenticated Player Profile
  const initials = user?.name
    ? user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "CP";

  return (
    <ScreenContainer gradient>
      <ScrollView
        style={{ flex: 1, width: "100%" }}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: paddingBottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 gap-5 pt-2">
          
          {/* HEADER */}
          <View className="flex-row items-center justify-between px-1">
            <View className="gap-0.5">
              <Text className="text-3xl font-black text-white tracking-tight">Profile Hub</Text>
              <Text className="text-xs font-semibold text-slate-400">Player Passport & Account Settings</Text>
            </View>
            <TouchableOpacity
              onPress={() => handleNavigate("editProfile")}
              className="bg-[#10B981]/20 border border-[#10B981]/40 rounded-xl px-3 py-1.5 active:opacity-80"
            >
              <Text className="text-[#10B981] text-xs font-black">Edit ✏️</Text>
            </TouchableOpacity>
          </View>

          {/* PLAYER PASSPORT BANNER */}
          <GlassCard
            intensity="heavy"
            radius="xl"
            padding="lg"
            className="bg-[#0B1511] border-[#10B981]/30 gap-4 shadow-2xl"
          >
            <View className="flex-row items-center gap-4">
              {/* Avatar Ring */}
              <View className="w-16 h-16 rounded-full bg-[#10B981] border-2 border-white items-center justify-center shadow-lg shadow-emerald-500/30">
                <Text className="text-2xl font-black text-[#050B08]">{initials}</Text>
              </View>
              <View className="flex-1 gap-0.5">
                <View className="flex-row items-center gap-2">
                  <Text className="text-xl font-black text-white">{user?.name || "Cricket Pro Player"}</Text>
                  <View className="bg-[#10B981]/20 border border-[#10B981]/40 px-2 py-0.5 rounded-full">
                    <Text className="text-[10px] font-black text-[#10B981]">PRO LEVEL 5</Text>
                  </View>
                </View>
                <Text className="text-xs font-semibold text-slate-400">{user?.email || "cricketer@crickpro.com"}</Text>
              </View>
            </View>

            {/* Quick Stats Grid inside Passport */}
            <View className="flex-row items-center justify-between bg-[#060D0A] p-3.5 rounded-xl border border-white/5 pt-2">
              <View className="items-center">
                <Text className="text-[9px] font-black text-slate-400 uppercase tracking-wider">MATCHES</Text>
                <Text className="text-lg font-black text-white">14</Text>
              </View>
              <View className="w-px h-6 bg-white/10" />
              <View className="items-center">
                <Text className="text-[9px] font-black text-slate-400 uppercase tracking-wider">RUNS</Text>
                <Text className="text-lg font-black text-[#10B981]">640</Text>
              </View>
              <View className="w-px h-6 bg-white/10" />
              <View className="items-center">
                <Text className="text-[9px] font-black text-slate-400 uppercase tracking-wider">WICKETS</Text>
                <Text className="text-lg font-black text-[#FBBF24]">34</Text>
              </View>
              <View className="w-px h-6 bg-white/10" />
              <View className="items-center">
                <Text className="text-[9px] font-black text-slate-400 uppercase tracking-wider">HIGH SCORE</Text>
                <Text className="text-lg font-black text-[#10B981]">98*</Text>
              </View>
            </View>
          </GlassCard>

          {/* CRICKET MANAGEMENT SECTION */}
          <View className="gap-2">
            <Text className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Cricket Management</Text>
            {[
              { icon: "🤖", title: "CrickAI Coach Assistant", desc: "Ask rules, DLS calculations & tactical advice", screen: "aichat" },
              { icon: "👤", title: "Edit Player Profile", desc: "Update batting stance, bowling style & jersey", screen: "editProfile" },
              { icon: "⚔️", title: "Player Head to Head", desc: "Compare stats against rival batters & bowlers", screen: "h2h" },
              { icon: "🏆", title: "My Tournaments", desc: "Leagues you participate in or organize", screen: "leagues" },
              { icon: "📊", title: "Career Statistics", desc: "Deep dive into your batting & bowling charts", screen: "stats" },
            ].map((item) => (
              <GlassCard
                key={item.title}
                intensity="heavy"
                padding="md"
                radius="xl"
                className="flex-row items-center gap-3.5 bg-[#0B1511] border-[#10B981]/20"
                onPress={() => handleNavigate(item.screen)}
              >
                <View className="w-10 h-10 rounded-xl bg-[#10B981]/15 items-center justify-center border border-[#10B981]/30">
                  <Text className="text-lg">{item.icon}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-extrabold text-white">{item.title}</Text>
                  <Text className="text-xs font-semibold text-slate-400">{item.desc}</Text>
                </View>
                <Text className="text-slate-400 font-extrabold">›</Text>
              </GlassCard>
            ))}
          </View>

          {/* APP PREFERENCES SECTION */}
          <View className="gap-2">
            <Text className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">App Preferences</Text>
            {[
              { icon: "🎨", title: "Theme & Display", desc: "Switch theme & accent colors", screen: "theme" },
              { icon: "🔔", title: "Match Alerts & Sounds", desc: "Configure scoring haptics & notifications", screen: "notifications" },
            ].map((item) => (
              <GlassCard
                key={item.title}
                intensity="heavy"
                padding="md"
                radius="xl"
                className="flex-row items-center gap-3.5 bg-[#0B1511] border-[#10B981]/20"
                onPress={() => handleNavigate(item.screen)}
              >
                <View className="w-10 h-10 rounded-xl bg-[#10B981]/15 items-center justify-center border border-[#10B981]/30">
                  <Text className="text-lg">{item.icon}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-extrabold text-white">{item.title}</Text>
                  <Text className="text-xs font-semibold text-slate-400">{item.desc}</Text>
                </View>
                <Text className="text-slate-400 font-extrabold">›</Text>
              </GlassCard>
            ))}
          </View>

          {/* SIGN OUT */}
          <TouchableOpacity
            onPress={handleSignOut}
            className="bg-red-500/15 border border-red-500/30 rounded-2xl py-3.5 items-center mt-2 active:opacity-80"
          >
            {isLoggingOut ? (
              <ActivityIndicator size="small" color="#EF4444" />
            ) : (
              <Text className="text-red-400 font-extrabold text-sm uppercase tracking-wider">Sign Out Account</Text>
            )}
          </TouchableOpacity>

        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
