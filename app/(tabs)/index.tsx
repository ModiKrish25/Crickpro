/**
 * Home Screen - CrickPro Ultra-Premium Cricket Dashboard
 * 
 * Design Architecture:
 * - Top Brand Header with Live Match Status Badge & Profile Trigger
 * - High-Impact Stadium Hero Banner featuring stadium-hero.png
 * - Quick Actions Grid with Cricket Emojis & Haptics
 * - Live Matches & Fixtures Carousel
 * - Cricket Trending News & Highlights Section
 * - Cricket Pro Masterclass & Skill Guides
 * - Dynamic Season Statistics & Notifications Center
 */
import { ScrollView, Text, View, TouchableOpacity, RefreshControl, Image, ImageBackground, Platform } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useMatchRegistry, type MatchSummary } from "@/lib/stores/match-store";
import { GlassCard } from "@/components/ui/glass-card";
import { LiquidGlassOverlay } from "@/components/ui/liquid-glass-overlay";
import { useResponsive } from "@/hooks/use-responsive";
import { useScrollPadding } from "@/hooks/use-scroll-padding";
import { NotificationsCenter, type AppNotification } from "@/components/notifications-center";
import { useAuthContext } from "@/lib/auth-context";

// Quick Action Items
const ACTIONS = [
  { id: "create", title: "+ Start Match", desc: "Ball-by-ball live scoring", icon: "⚡", bg: "rgba(255, 159, 10, 0.15)", path: "/match/create" },
  { id: "aichat", title: "CrickAI Coach", desc: "Rules, DLS & tactical AI", icon: "🤖", bg: "rgba(236, 72, 153, 0.15)", path: "/ai-chat" },
  { id: "community", title: "Community", desc: "Umpires, scorers & nets", icon: "🌐", bg: "rgba(16, 185, 129, 0.15)", path: "/(tabs)/community" },
  { id: "h2h", title: "Head to Head", desc: "Compare player statistics", icon: "⚔️", bg: "rgba(59, 130, 246, 0.15)", path: "/head-to-head" },
  { id: "leagues", title: "Tournaments", desc: "Leagues, fixtures & tables", icon: "🏆", bg: "rgba(245, 158, 11, 0.15)", path: "/(tabs)/leagues" },
  { id: "stats", title: "Player Roster", desc: "Career statistics & records", icon: "📊", bg: "rgba(139, 92, 246, 0.15)", path: "/(tabs)/stats" },
];

// Carousel Match Cards Data
const CAROUSEL_MATCHES = [
  {
    id: "m1",
    tag: "T20 CHAMPIONSHIP",
    time: "LIVE 16.4 ov",
    isLive: true,
    team1: { name: "Thunder Warriors", code: "THU", score: "158/4", bg: "#1E3A8A", icon: "⚡" },
    team2: { name: "Phoenix Rising", code: "PHX", score: "134/6", bg: "#991B1B", icon: "🔥" },
    statusText: "Thunder Warriors need 25 runs in 20 balls",
    broadcast: "CrickPro Pass • Live HD Stream",
  },
  {
    id: "m2",
    tag: "ODS LEAGUE",
    time: "TODAY 7:30 PM",
    isLive: false,
    team1: { name: "Toronto Titans", code: "TOR", score: "—", bg: "#991B1B", icon: "🍁" },
    team2: { name: "Vancouver Vipers", code: "VAN", score: "—", bg: "#065F46", icon: "🏔️" },
    statusText: "Starts in 2h 45m • Pitch Report Ready",
    broadcast: "CrickPro Pass • Matchday 12",
  },
  {
    id: "m3",
    tag: "SUPER LEAGUE",
    time: "RESULT",
    isLive: false,
    team1: { name: "Mumbai Kings", code: "MI", score: "186/5", bg: "#1D4ED8", icon: "👑" },
    team2: { name: "Chennai Super", code: "CSK", score: "182/8", bg: "#D97706", icon: "🦁" },
    statusText: "Mumbai Kings won by 4 runs",
    broadcast: "Highlights Available",
  },
];

// Trending News & Cricket Stories
const CRICKET_NEWS = [
  {
    id: "n1",
    category: "MATCH HIGHLIGHTS",
    title: "Super Over Thriller: Titans clinch victory on the final delivery!",
    date: "10 mins ago",
    badge: "🔥 HOT",
    readTime: "2 min read",
    gradient: "from-blue-900/60 to-purple-900/60",
  },
  {
    id: "n2",
    category: "PRO MASTERCLASS",
    title: "Mastering the Cover Drive: Bat position, footwork & timing breakdown",
    date: "1 hour ago",
    badge: "🏏 GUIDE",
    readTime: "4 min read",
    gradient: "from-emerald-900/60 to-teal-900/60",
  },
  {
    id: "n3",
    category: "TOURNAMENT NEWS",
    title: "World Championship League 2026: Team registration now open",
    date: "3 hours ago",
    badge: "🏆 LEAGUE",
    readTime: "3 min read",
    gradient: "from-amber-900/60 to-rose-900/60",
  },
];

// Cricket Skills & Pro Tips
const CRICKET_TIPS = [
  { id: "t1", title: "Death Bowling Tactics", desc: "Nailing wider yorkers & slower cutters", icon: "⚾", tag: "BOWLING" },
  { id: "t2", title: "Powerplay Hitting", desc: "Exploiting field restrictions in first 6 overs", icon: "💥", tag: "BATTING" },
  { id: "t3", title: "DRS & LBW Rules", desc: "Understanding impact, pitch line & ball tracking", icon: "🎯", tag: "RULES" },
];

const MOCK_NOTIFICATIONS: AppNotification[] = [
  { id: "n1", type: "match", title: "Live Match Update", message: "Thunder Warriors are batting. Score: 158/4 (16.4 ov)", timestamp: "Just now", isRead: false },
  { id: "n2", type: "tournament", title: "League Update", message: "Summer Cricket League Round 3 fixtures published", timestamp: "2 hours ago", isRead: false },
];

export default function HomeScreen() {
  const router = useRouter();
  const { matches, getActiveMatch, getRecentScorecards } = useMatchRegistry();
  const { user } = useAuthContext();
  const r = useResponsive();
  const activeMatch = getActiveMatch();
  const { paddingBottom } = useScrollPadding();
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>(MOCK_NOTIFICATIONS);
  const [subscribed, setSubscribed] = useState(false);
  const [heroSlideIndex, setHeroSlideIndex] = useState(0);

  // Automated Hero Carousel Timer (slides every 4 seconds)
  useEffect(() => {
    const timer = setInterval(() => {
      setHeroSlideIndex((prev) => (prev + 1) % 3);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

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
          team1: match.team1,
          team2: match.team2,
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

  const userName = user?.name ? user.name.split(" ")[0] : "Player";

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
      { label: "MATCHES", value: String(totalMatches), color: "text-white" },
      { label: "RUNS SCORED", value: String(totalRuns), color: "text-[#FF9F0A]" },
      { label: "WICKETS", value: String(totalWickets), color: "text-amber-400" },
      { label: "AVG SR", value: "142.5", color: "text-[#3B82F6]" },
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
      <View className="absolute top-0 left-0 right-0 h-52 pointer-events-none z-0">
        <View className="absolute -top-16 -left-16 w-60 h-60 rounded-full bg-amber-600/20 blur-3xl" />
        <View className="absolute -top-16 -right-16 w-60 h-60 rounded-full bg-emerald-600/20 blur-3xl" />
      </View>

      <ScrollView
        style={{ flex: 1, width: "100%" }}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: paddingBottom + 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#FF9F0A"
            colors={["#FF9F0A"]}
          />
        }
      >
        <View className={`flex-1 ${r.isPhone ? "gap-5" : "gap-6"} pt-2`}>
          
          {/* HEADER (Cricket Live 11 + Search & Share Icons) */}
          <View className="flex-row items-center justify-between px-1">
            <View className="flex-row items-center gap-2.5">
              <Text className="text-2xl font-black text-white tracking-tight">Cricket Live 11</Text>
              <View className="bg-[#10B981]/20 border border-[#10B981]/40 rounded-full px-2 py-0.5 flex-row items-center gap-1">
                <View className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                <Text className="text-[10px] font-black text-[#10B981]">LIVE</Text>
              </View>
            </View>

            {/* Right Action Icons (Chatbot Avatar, Search & Share) */}
            <View className="flex-row items-center gap-2">
              <TouchableOpacity
                onPress={() => handleNav("/ai-chat")}
                className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 to-blue-500 border border-cyan-400/40 items-center justify-center active:scale-95 shadow-md shadow-indigo-500/50"
              >
                <Text className="text-white text-base">🤖</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => alert("Search cricket matches & teams")}
                className="w-9 h-9 rounded-full bg-white/10 border border-white/15 items-center justify-center active:opacity-75"
              >
                <Text className="text-white text-xs font-bold">🔍</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => alert("Share match live link")}
                className="w-9 h-9 rounded-full bg-white/10 border border-white/15 items-center justify-center active:opacity-75"
              >
                <Text className="text-white text-xs font-bold">🔗</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* FEATURED MATCH SCORE CARD (Exact Reference Image Design) */}
          <GlassCard
            intensity="heavy"
            radius="xl"
            padding="lg"
            className="bg-gradient-to-br from-[#1E293B]/90 via-[#0F172A] to-[#0B0E17] border-white/15 shadow-2xl gap-4"
            onPress={() => handleViewMatch(featuredMatch)}
          >
            {/* Centered Top Live Badge */}
            <View className="items-center z-10">
              <View className="flex-row items-center gap-1.5 bg-[#10B981]/20 border border-[#10B981]/40 rounded-full px-3 py-1 backdrop-blur-md">
                <View className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                <Text className="text-xs font-black text-[#10B981] tracking-wider">Live 09:00</Text>
              </View>
            </View>

            {/* Match Teams & Score Grid */}
            <View className="flex-row items-center justify-between py-2 z-10">
              {/* Left Team (England / Thunder) */}
              <View className="items-center gap-1.5 flex-1">
                <View className="w-14 h-14 rounded-full bg-white/10 border-2 border-white/20 items-center justify-center shadow-lg">
                  <Text className="text-2xl">🏴󠁧󠁢󠁥󠁮󠁧󠁿</Text>
                </View>
                <Text className="text-base font-black text-white">{featuredMatch.team1.split(" ")[0] || "England"}</Text>
                <Text className="text-xs font-extrabold text-slate-400">({featuredMatch.overs} ov) <Text className="text-white font-black">{featuredMatch.score1}</Text></Text>
              </View>

              {/* Center VS Avatar */}
              <View className="w-10 h-10 rounded-full bg-indigo-600/30 border border-indigo-400/40 items-center justify-center">
                <Text className="text-xs font-black text-indigo-300">VS</Text>
              </View>

              {/* Right Team (Pakistan / Phoenix) */}
              <View className="items-center gap-1.5 flex-1">
                <View className="w-14 h-14 rounded-full bg-white/10 border-2 border-white/20 items-center justify-center shadow-lg">
                  <Text className="text-2xl">🇵🇰</Text>
                </View>
                <Text className="text-base font-black text-white">{featuredMatch.team2.split(" ")[0] || "Pakistan"}</Text>
                <Text className="text-xs font-extrabold text-slate-400">30.5 ov <Text className="text-white font-black">{featuredMatch.score2 || "200/3"}</Text></Text>
              </View>
            </View>

            {/* Carousel Progress Indicators */}
            <View className="flex-row justify-center items-center gap-1.5 pt-1 z-10">
              <View className="w-6 h-1 rounded-full bg-indigo-500" />
              <View className="w-2 h-1 rounded-full bg-white/20" />
              <View className="w-2 h-1 rounded-full bg-white/20" />
              <View className="w-2 h-1 rounded-full bg-white/20" />
            </View>
          </GlassCard>

          {/* OTHER LIVE MATCHES SECTION */}
          <View className="gap-3">
            <View className="flex-row items-center justify-between px-1">
              <Text className="text-lg font-black text-white tracking-tight">Other Live matches</Text>
              <TouchableOpacity onPress={() => handleNav("/(tabs)/leagues")}>
                <Text className="text-xs font-bold text-slate-400 hover:text-white">See all</Text>
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 2 }}>
              {[
                { id: "om1", series: "Nexon Series", flag1: "🇧🇩", flag2: "🇵🇰", code1: "Ban", code2: "Pak", format: "2nd T20" },
                { id: "om2", series: "Walton Series", flag1: "🇮🇳", flag2: "🇴🇲", code1: "Ind", code2: "Oma", format: "2nd T20" },
                { id: "om3", series: "Vision Series", flag1: "🇭🇰", flag2: "🇳🇵", code1: "Hon", code2: "Nep", format: "2nd T20" },
              ].map((item) => (
                <GlassCard key={item.id} intensity="heavy" radius="xl" padding="md" className="w-36 bg-[#151A28] border-white/10 gap-2 items-center">
                  <Text className="text-[10px] font-extrabold text-slate-400">{item.series}</Text>
                  <View className="flex-row items-center gap-2 my-1">
                    <Text className="text-base">{item.flag1}</Text>
                    <Text className="text-[9px] font-black text-slate-500">VS</Text>
                    <Text className="text-base">{item.flag2}</Text>
                  </View>
                  <Text className="text-xs font-black text-white">{item.code1} <Text className="text-slate-400 font-normal">vs</Text> {item.code2}</Text>
                  <View className="bg-[#10B981]/20 border border-[#10B981]/30 rounded-full px-2 py-0.5 mt-1">
                    <Text className="text-[9px] font-black text-[#10B981]">{item.format} • Live</Text>
                  </View>
                </GlassCard>
              ))}
            </ScrollView>
          </View>

          {/* LATEST NEWS SECTION */}
          <View className="gap-3">
            <View className="flex-row items-center justify-between px-1">
              <Text className="text-lg font-black text-white tracking-tight">Latest News</Text>
              <TouchableOpacity onPress={() => handleNav("/(tabs)/leagues")}>
                <Text className="text-xs font-bold text-slate-400 hover:text-white">See all</Text>
              </TouchableOpacity>
            </View>

            <GlassCard intensity="heavy" radius="xl" padding="none" className="overflow-hidden border-white/15 bg-black">
              <ImageBackground
                source={require("@/assets/images/stadium-hero.png")}
                style={{ width: "100%", height: 160 }}
                imageStyle={{ opacity: 0.9 }}
              >
                <View className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent p-4 justify-end">
                  <Text className="text-base font-black text-white">Super Over Thriller: Titans clinch victory on the final delivery!</Text>
                  <Text className="text-xs font-extrabold text-slate-300 mt-1">10 mins ago • 2 min read</Text>
                </View>
              </ImageBackground>
            </GlassCard>
          </View>

          {/* QUICK ACTIONS GRID */}
          <View className="gap-2.5">
            <Text className="text-xs font-extrabold text-slate-400 uppercase tracking-wider px-1">
              Scoring & Match Hub
            </Text>
            <View className="flex-row flex-wrap gap-2.5">
              {[
                { id: "create", title: "+ Start Match", desc: "Ball-by-ball live scoring", icon: "⚡", bg: "rgba(255, 159, 10, 0.15)", path: "/match/create" },
                { id: "aichat", title: "CrickAI Coach", desc: "Rules, DLS & tactical AI", icon: "🤖", bg: "rgba(236, 72, 153, 0.15)", path: "/ai-chat" },
                { id: "community", title: "Community", desc: "Umpires, scorers & nets", icon: "🌐", bg: "rgba(16, 185, 129, 0.15)", path: "/(tabs)/community" },
                { id: "h2h", title: "Head to Head", desc: "Compare player statistics", icon: "⚔️", bg: "rgba(59, 130, 246, 0.15)", path: "/head-to-head" },
                { id: "leagues", title: "Tournaments", desc: "Leagues, fixtures & tables", icon: "🏆", bg: "rgba(245, 158, 11, 0.15)", path: "/(tabs)/leagues" },
                { id: "stats", title: "Player Roster", desc: "Career statistics & records", icon: "📊", bg: "rgba(139, 92, 246, 0.15)", path: "/(tabs)/stats" },
              ].map((a) => (
                <TouchableOpacity
                  key={a.id}
                  onPress={() => handleNav(a.path)}
                  className="flex-1 min-w-[45%] bg-[#1C1C1E] border border-white/15 rounded-2xl p-4 gap-2 active:scale-95"
                >
                  <View className="w-10 h-10 rounded-xl items-center justify-center border border-white/10" style={{ backgroundColor: a.bg }}>
                    <Text className="text-lg">{a.icon}</Text>
                  </View>
                  <View className="gap-0.5">
                    <Text className="text-base font-extrabold text-white">{a.title}</Text>
                    <Text className="text-[11px] font-semibold text-slate-400">{a.desc}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* LIVE MATCHES & FIXTURES CAROUSEL */}
          <View className="gap-3">
            <View className="flex-row items-center justify-between px-1">
              <Text className="text-lg font-extrabold text-white tracking-tight">
                Live Matches & Fixtures
              </Text>
              <TouchableOpacity onPress={() => handleNav("/(tabs)/leagues")}>
                <Text className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  View All ›
                </Text>
              </TouchableOpacity>
            </View>

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
                  className="w-64 bg-[#12141C]/90 border-white/15 gap-3"
                  onPress={() => handleNav("/(tabs)/leagues")}
                >
                  {/* Card Header: Category & Live Indicator */}
                  <View className="flex-row items-center justify-between">
                    <Text className="text-[11px] font-extrabold text-emerald-400 tracking-wider">{item.tag}</Text>
                    <View className={`px-2 py-0.5 rounded-full ${item.isLive ? 'bg-red-500/20 border border-red-500/40' : 'bg-white/10'}`}>
                      <Text className={`text-[10px] font-extrabold ${item.isLive ? 'text-red-400' : 'text-slate-300'}`}>{item.time}</Text>
                    </View>
                  </View>

                  {/* Team Scores */}
                  <View className="gap-2 bg-black/40 p-2.5 rounded-xl border border-white/5">
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-2">
                        <View className="w-6 h-6 rounded-full items-center justify-center" style={{ backgroundColor: item.team1.bg }}>
                          <Text className="text-xs">{item.team1.icon}</Text>
                        </View>
                        <Text className="text-sm font-extrabold text-white">{item.team1.code}</Text>
                      </View>
                      <Text className="text-sm font-black text-white">{item.team1.score}</Text>
                    </View>

                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-2">
                        <View className="w-6 h-6 rounded-full items-center justify-center" style={{ backgroundColor: item.team2.bg }}>
                          <Text className="text-xs">{item.team2.icon}</Text>
                        </View>
                        <Text className="text-sm font-extrabold text-white">{item.team2.code}</Text>
                      </View>
                      <Text className="text-sm font-black text-white">{item.team2.score}</Text>
                    </View>
                  </View>

                  {/* Footer Status */}
                  <Text className="text-[11px] font-semibold text-slate-300 truncate">
                    {item.statusText}
                  </Text>
                </GlassCard>
              ))}
            </ScrollView>
          </View>

          {/* CRICKET TRENDING NEWS & HIGHLIGHTS */}
          <View className="gap-3">
            <View className="flex-row items-center justify-between px-1">
              <Text className="text-lg font-extrabold text-white tracking-tight">
                Cricket News & Highlights
              </Text>
              <Text className="text-xs font-bold text-slate-400">Fresh Stories</Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12, paddingHorizontal: 2 }}
            >
              {CRICKET_NEWS.map((news) => (
                <GlassCard
                  key={news.id}
                  intensity="heavy"
                  radius="xl"
                  padding="md"
                  className="w-72 bg-[#0F1420] border-white/15 gap-2.5 justify-between"
                  onPress={() => handleNav("/(tabs)/leagues")}
                >
                  <View className="gap-2">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-[10px] font-black text-emerald-400 tracking-wider">{news.category}</Text>
                      <View className="bg-emerald-500/20 px-2 py-0.5 rounded-md">
                        <Text className="text-[10px] font-bold text-emerald-300">{news.badge}</Text>
                      </View>
                    </View>
                    <Text className="text-sm font-extrabold text-white leading-snug">
                      {news.title}
                    </Text>
                  </View>

                  <View className="flex-row items-center justify-between pt-2 border-t border-white/10">
                    <Text className="text-[10px] font-medium text-slate-400">{news.date}</Text>
                    <Text className="text-[10px] font-bold text-slate-300">{news.readTime}</Text>
                  </View>
                </GlassCard>
              ))}
            </ScrollView>
          </View>

          {/* CRICKET PRO SKILLS & MASTERCLASS */}
          <View className="gap-2.5">
            <Text className="text-xs font-extrabold text-slate-400 uppercase tracking-wider px-1">
              Pro Skill Guides & Rules
            </Text>
            <View className="gap-2">
              {CRICKET_TIPS.map((tip) => (
                <GlassCard
                  key={tip.id}
                  intensity="medium"
                  radius="xl"
                  padding="md"
                  className="flex-row items-center justify-between bg-[#111522]/90 border-white/10 active:opacity-80"
                  onPress={() => handleNav("/(tabs)/stats")}
                >
                  <View className="flex-row items-center gap-3">
                    <View className="w-10 h-10 rounded-xl bg-white/10 items-center justify-center border border-white/15">
                      <Text className="text-lg">{tip.icon}</Text>
                    </View>
                    <View className="gap-0.5">
                      <Text className="text-sm font-extrabold text-white">{tip.title}</Text>
                      <Text className="text-xs font-semibold text-slate-400">{tip.desc}</Text>
                    </View>
                  </View>
                  <View className="bg-white/10 px-2.5 py-1 rounded-md">
                    <Text className="text-[10px] font-black text-slate-300 tracking-wider">{tip.tag}</Text>
                  </View>
                </GlassCard>
              ))}
            </View>
          </View>

          {/* SEASON OVERVIEW */}
          <View className="gap-2.5">
            <View className="flex-row items-center justify-between px-1">
              <Text className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                Season Overview
              </Text>
              <TouchableOpacity onPress={() => handleNav("/(tabs)/stats")}>
                <Text className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  Full Stats ›
                </Text>
              </TouchableOpacity>
            </View>
            <View className="flex-row gap-2.5">
              {seasonStats.map((s) => (
                <GlassCard key={s.label} intensity="heavy" padding="md" radius="xl" className="flex-1 items-center gap-1 bg-[#121622]/90 border-white/10">
                  <Text className="text-[9px] font-extrabold text-slate-400 tracking-wider">{s.label}</Text>
                  <Text className={`text-xl font-black ${s.color} tracking-tight tabular-nums`}>{s.value}</Text>
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
