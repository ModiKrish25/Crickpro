/**
 * Home Screen - CrickPro Premium Dashboard (MLS Inspired UI)
 * 
 * Styled after the premium MLS sports app design:
 * - Top Brand Header with Logo Emblem, "Home" Title & Hamburger Menu
 * - Date Subheader & Horizontal Match Cards Carousel (Regular Season / Live Matches with Team Logos & Abbr)
 * - Featured Promo Banner / Hero Card ("One Pass. All The Can't-Miss Action.")
 * - "Your Next Watch" Highlight Video / Stream Card with Live Score Overlay & Floating Badge
 * - Quick Actions Bar & Season Stats Summary
 */
import { ScrollView, Text, View, TouchableOpacity, RefreshControl, Image, ImageBackground, Platform } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useState, useCallback, useMemo } from "react";
import { useMatchRegistry, type MatchSummary } from "@/lib/stores/match-store";
import { GlassCard } from "@/components/ui/glass-card";
import { LiquidGlassOverlay } from "@/components/ui/liquid-glass-overlay";
import { useResponsive } from "@/hooks/use-responsive";
import { useScrollPadding } from "@/hooks/use-scroll-padding";
import { NotificationsCenter, type AppNotification } from "@/components/notifications-center";
import { useAuthContext } from "@/lib/auth-context";

// Quick Action Items
const ACTIONS = [
  { title: "+ Start Match", desc: "Ball-by-ball scoring", color: "#10B981", path: "/match/create" },
  { title: "Head to Head", desc: "Compare player stats", color: "#34D399", path: "/head-to-head" },
  { title: "Tournaments", desc: "Leagues & fixtures", color: "#F59E0B", path: "/(tabs)/leagues" },
  { title: "Player Roster", desc: "Career statistics", color: "#3B82F6", path: "/(tabs)/stats" },
];

// Carousel Match Cards Mock / Dynamic Data
const CAROUSEL_MATCHES = [
  {
    id: "m1",
    tag: "Regular Season",
    time: "1:30 AM",
    team1: { name: "Thunder Warriors", code: "NE", bg: "#1E3A8A", text: "⚡" },
    team2: { name: "Red Bulls NY", code: "RBNY", bg: "#991B1B", text: "🐂" },
    broadcast: "CrickPro TV - Season Pass",
  },
  {
    id: "m2",
    tag: "Regular Season",
    time: "1:30 AM",
    team1: { name: "Toronto Titans", code: "TOR", bg: "#991B1B", text: "🍁" },
    team2: { name: "Vancouver Vipers", code: "VAN", bg: "#065F46", text: "🏔️" },
    broadcast: "CrickPro TV - Season Pass",
  },
  {
    id: "m3",
    tag: "T20 Championship",
    time: "LIVE 16.4 ov",
    team1: { name: "Mumbai Kings", code: "MI", bg: "#1D4ED8", text: "👑" },
    team2: { name: "Chennai Super", code: "CSK", bg: "#D97706", text: "🦁" },
    broadcast: "CrickPro Pass - Live Score",
  },
];

const MOCK_NOTIFICATIONS: AppNotification[] = [
  { id: "n1", type: "match", title: "Match in Progress", message: "Thunder Warriors are batting. Score: 158/4 (16.4 ov)", timestamp: "Just now", isRead: false },
  { id: "n2", type: "tournament", title: "League Update", message: "Summer Cricket League - Round 3 fixtures published", timestamp: "2 hours ago", isRead: false },
];

export default function HomeScreen() {
  const router = useRouter();
  const { matches, getActiveMatch, getRecentScorecards, upcoming } = useMatchRegistry();
  const { user } = useAuthContext();
  const r = useResponsive();
  const activeMatch = getActiveMatch();
  const recentScorecards = getRecentScorecards();
  const { paddingBottom } = useScrollPadding();
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>(MOCK_NOTIFICATIONS);
  const [subscribed, setSubscribed] = useState(false);

  const handleNav = useCallback(async (path: string) => {
    if (Platform.OS !== "web") await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(path as any);
  }, [router]);

  const handleViewMatch = useCallback(async (match: MatchSummary) => {
    if (Platform.OS !== "web") await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (match.status === "completed" && match.hasDetails) {
      router.push({ pathname: "/(tabs)/scorecard/detail", params: { matchId: match.id } });
    } else {
      router.push({
        pathname: "/match/live",
        params: {
          team1: match.team1, team2: match.team2,
          format: match.format.toLowerCase(),
          overs: match.format === "T20" ? "20" : match.format === "ODI" ? "50" : "10",
        },
      });
    }
  }, [router]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    setRefreshing(false);
  }, []);

  const userName = user?.name ? user.name.split(" ")[0] : "Cricketer";

  // Calculate dynamic season stats based on stored matches
  const seasonStats = useMemo(() => {
    const totalMatches = matches.length || 14;
    const totalRuns = matches.reduce((acc, m) => {
      const r1 = parseInt((m.score1 || "0").split("/")[0] || "0", 10);
      const r2 = parseInt((m.score2 || "0").split("/")[0] || "0", 10);
      return acc + (isNaN(r1) ? 0 : r1) + (isNaN(r2) ? 0 : r2);
    }, 0) || 640;
    const totalWickets = matches.reduce((acc, m) => {
      const w1 = parseInt((m.score1 || "0").split("/")[1] || "0", 10);
      const w2 = parseInt((m.score2 || "0").split("/")[1] || "0", 10);
      return acc + (isNaN(w1) ? 0 : w1) + (isNaN(w2) ? 0 : w2);
    }, 0) || 34;

    return [
      { label: "MATCHES", value: String(totalMatches), color: "text-[#F9FAFB]" },
      { label: "RUNS SCORED", value: String(totalRuns), color: "text-[#10B981]" },
      { label: "WICKETS", value: String(totalWickets), color: "text-[#F59E0B]" },
    ];
  }, [matches]);

  const featuredMatch = activeMatch || (matches.length > 0 ? matches[0] : {
    id: "demo_live",
    team1: "Thunder Warriors",
    team2: "Phoenix Rising",
    score1: "158/4",
    score2: "134/6",
    status: "live" as const,
    format: "T20",
    overs: "16.4",
    crr1: "9.48",
    crr2: "8.04",
    hasDetails: true,
  });

  return (
    <ScreenContainer gradient>
      {/* Top Ambient Glow Gradient Backdrop */}
      <View 
        className="absolute top-0 left-0 right-0 h-44 pointer-events-none opacity-40 z-0"
        style={{
          backgroundColor: "transparent",
        }}
      >
        <View className="absolute -top-12 -left-12 w-48 h-48 rounded-full bg-blue-600/30 blur-3xl" />
        <View className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-rose-600/30 blur-3xl" />
      </View>

      <ScrollView
        style={{ flex: 1, width: "100%" }}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: paddingBottom + 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#10B981"
            colors={["#10B981"]}
          />
        }
      >
        <View className={`flex-1 ${r.isPhone ? "gap-5" : "gap-6"} pt-2`}>
          
          {/* HEADER (Brand Logo Emblem + "Home" Title + Hamburger Menu Button) */}
          <View className="flex-row items-center justify-between px-1">
            <View className="flex-row items-center gap-3">
              {/* Brand Shield Badge */}
              <View className="w-10 h-10 rounded-full border-2 border-white/30 bg-black/40 items-center justify-center shadow-lg shadow-black/50">
                <Text className="text-white text-xs font-black tracking-tighter">CPRO</Text>
              </View>
              {/* Title */}
              <Text className="text-3xl font-extrabold text-white tracking-tight">Home</Text>
            </View>

            {/* Menu Trigger Button */}
            <TouchableOpacity
              onPress={() => handleNav("/(tabs)/profile")}
              className="w-10 h-10 rounded-full bg-white/10 border border-white/15 items-center justify-center active:opacity-75"
            >
              <Text className="text-white text-lg font-bold">☰</Text>
            </TouchableOpacity>
          </View>

          {/* DATE SUBHEADER & HORIZONTAL MATCH CAROUSEL */}
          <View className="gap-3">
            <Text className="text-lg font-extrabold text-white tracking-tight px-1">
              Sun, Mar 30
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12, paddingHorizontal: 2 }}
            >
              {CAROUSEL_MATCHES.map((item) => (
                <GlassCard
                  key={item.id}
                  intensity="heavy"
                  radius="xl"
                  padding="md"
                  className="w-56 bg-[#12141C]/90 border-white/15 gap-2.5"
                  onPress={() => handleNav("/(tabs)/leagues")}
                >
                  {/* Card Header: Category & Time */}
                  <View className="flex-row items-center justify-between">
                    <Text className="text-[11px] font-semibold text-slate-400">{item.tag}</Text>
                    <Text className="text-[11px] font-bold text-slate-200">{item.time}</Text>
                  </View>

                  {/* Team 1 Row */}
                  <View className="flex-row items-center gap-2.5 py-0.5">
                    <View 
                      className="w-7 h-7 rounded-full items-center justify-center border border-white/20" 
                      style={{ backgroundColor: item.team1.bg }}
                    >
                      <Text className="text-xs">{item.team1.text}</Text>
                    </View>
                    <Text className="text-base font-extrabold text-white tracking-wide">{item.team1.code}</Text>
                  </View>

                  {/* Team 2 Row */}
                  <View className="flex-row items-center gap-2.5 py-0.5">
                    <View 
                      className="w-7 h-7 rounded-full items-center justify-center border border-white/20"
                      style={{ backgroundColor: item.team2.bg }}
                    >
                      <Text className="text-xs">{item.team2.text}</Text>
                    </View>
                    <Text className="text-base font-extrabold text-white tracking-wide">{item.team2.code}</Text>
                  </View>

                  {/* Card Footer: Broadcast Info */}
                  <Text className="text-[10px] font-medium text-slate-400 pt-1 border-t border-white/10">
                    {item.broadcast}
                  </Text>
                </GlassCard>
              ))}
            </ScrollView>
          </View>

          {/* FEATURED PROMO BANNER / HERO CARD */}
          <GlassCard
            intensity="heavy"
            radius="xl"
            padding="none"
            className="overflow-hidden border-white/15 bg-[#0D111A]"
          >
            <View className="relative p-5 min-h-[160px] justify-between">
              {/* Background Glow Graphic */}
              <View className="absolute inset-0 bg-gradient-to-r from-blue-900/60 via-purple-900/40 to-emerald-900/40" />
              <View className="absolute right-0 top-0 bottom-0 w-1/2 bg-indigo-500/10 rounded-full blur-2xl" />

              {/* Banner Top Logo */}
              <View className="flex-row items-center gap-1.5 z-10">
                <Text className="text-white font-extrabold text-sm">tv</Text>
                <View className="w-[1px] h-3 bg-white/40" />
                <Text className="text-white/80 font-bold text-[10px] uppercase tracking-wider">SEASON PASS</Text>
              </View>

              {/* Banner Headline Text */}
              <View className="z-10 gap-0.5 my-2">
                <Text className="text-2xl font-black text-white tracking-tight leading-tight">
                  One Pass.
                </Text>
                <Text className="text-sm font-semibold text-slate-200">
                  All The Can't-Miss Action.
                </Text>
              </View>

              {/* Subscribe Pill Button */}
              <View className="z-10 flex-row items-center justify-between">
                <TouchableOpacity
                  onPress={async () => {
                    if (Platform.OS !== "web") await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setSubscribed(!subscribed);
                  }}
                  className="bg-white/20 border border-white/30 rounded-xl px-6 py-2 active:opacity-80"
                >
                  <Text className="text-white font-bold text-xs">
                    {subscribed ? "Subscribed ✓" : "Subscribe"}
                  </Text>
                </TouchableOpacity>

                <Text className="text-[9px] text-white/50 italic">Subscription required</Text>
              </View>
            </View>
          </GlassCard>

          {/* "YOUR NEXT WATCH" SECTION */}
          <View className="gap-3">
            <View className="flex-row items-center justify-between px-1">
              <Text className="text-xl font-extrabold text-white tracking-tight">
                Your Next Watch
              </Text>
              <TouchableOpacity 
                onPress={() => handleNav("/(tabs)/leagues")}
                className="flex-row items-center gap-1 active:opacity-75"
              >
                <Text className="text-sm font-bold text-slate-400">All Videos</Text>
                <Text className="text-sm text-slate-400 font-extrabold">›</Text>
              </TouchableOpacity>
            </View>

            {/* Video Highlight Card */}
            <GlassCard
              intensity="heavy"
              radius="xl"
              padding="none"
              className="overflow-hidden border-white/15 bg-black"
              onPress={() => handleViewMatch(featuredMatch)}
            >
              <View className="relative min-h-[220px] justify-between p-4">
                {/* Simulated Stadium Field Graphic Background */}
                <View className="absolute inset-0 bg-emerald-950/80">
                  {/* Pitch pattern lines */}
                  <View className="absolute inset-x-0 top-1/2 h-16 bg-emerald-800/40 border-y border-emerald-500/20" />
                  <View className="absolute left-1/4 top-0 bottom-0 w-32 bg-emerald-700/20 blur-sm" />
                </View>

                {/* Scoreboard Pill (Top Left Overlay) */}
                <View className="z-10 flex-row items-center bg-black/80 border border-white/20 rounded-md overflow-hidden self-start">
                  <View className="px-2.5 py-1 bg-white/10 border-r border-white/20">
                    <Text className="text-xs font-black text-white">0</Text>
                  </View>
                  <View className="px-2.5 py-1 bg-white/10 border-r border-white/20">
                    <Text className="text-xs font-black text-white">0</Text>
                  </View>
                  <View className="px-2.5 py-1 bg-emerald-600">
                    <Text className="text-xs font-black text-white tracking-wider">SD</Text>
                  </View>
                </View>

                {/* Live Match Info Overlay (Center Bottom) */}
                <View className="z-10 bg-black/60 border border-white/15 rounded-xl p-3 flex-row items-center justify-between">
                  <View className="gap-0.5">
                    <Text className="text-xs font-extrabold text-white">
                      {featuredMatch.team1} vs {featuredMatch.team2}
                    </Text>
                    <Text className="text-[11px] font-semibold text-emerald-400">
                      LIVE • {featuredMatch.score1} ({featuredMatch.overs} ov)
                    </Text>
                  </View>

                  <View className="bg-emerald-500 rounded-lg px-3 py-1.5">
                    <Text className="text-xs font-black text-black uppercase">Watch →</Text>
                  </View>
                </View>

                {/* Floating Bottom-Right Badge Icon */}
                <View className="absolute right-4 bottom-16 z-20 w-11 h-11 rounded-full bg-white items-center justify-center shadow-xl shadow-black/80 border border-white/50">
                  <Text className="text-black text-lg">🪄</Text>
                </View>
              </View>
            </GlassCard>
          </View>

          {/* QUICK ACTIONS BAR */}
          <View className="gap-2.5">
            <Text className="text-xs font-extrabold text-slate-400 uppercase tracking-wider px-1">
              Quick Actions
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 10, paddingHorizontal: 2 }}
            >
              {ACTIONS.map((a) => (
                <TouchableOpacity
                  key={a.title}
                  onPress={() => handleNav(a.path)}
                  className="bg-[#111622] border border-white/10 rounded-2xl p-4 min-w-[140px] gap-1 active:scale-95"
                >
                  <Text className="text-base font-extrabold text-white">{a.title}</Text>
                  <Text className="text-[11px] font-semibold text-slate-400">{a.desc}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* SEASON STATS OVERVIEW */}
          <View className="gap-2.5">
            <View className="flex-row items-center justify-between px-1">
              <Text className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                Season Overview
              </Text>
              <TouchableOpacity onPress={() => handleNav("/(tabs)/stats")}>
                <Text className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  Full Stats
                </Text>
              </TouchableOpacity>
            </View>
            <View className="flex-row gap-3">
              {seasonStats.map((s) => (
                <GlassCard key={s.label} intensity="heavy" padding="md" radius="xl" className="flex-1 items-center gap-1 bg-[#121622]/90 border-white/10">
                  <Text className="text-[10px] font-extrabold text-slate-400 tracking-wider">{s.label}</Text>
                  <Text className={`text-2xl font-black ${s.color} tracking-tight tabular-nums`}>{s.value}</Text>
                </GlassCard>
              ))}
            </View>
          </View>

          {/* NOTIFICATIONS CENTER */}
          <NotificationsCenter
            notifications={notifications}
            maxDisplay={2}
            onMarkRead={(id) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))}
            onMarkAllRead={() => setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))}
            showInHome
          />

        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
