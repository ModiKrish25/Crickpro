/**
 * Home Screen - CrickPro Ultra-Premium Cricket Dashboard
 * 
 * Design Architecture:
 * - Pitch dark emerald charcoal palette matching exact user theme
 * - High-Impact Stadium Floodlight Hero Banner with background image & glow
 * - Live Match Broadcast Card with Stadium Pitch visual
 * - Quick Tools & Actions Grid with rich visual icons
 * - Cricket News Cards with thumbnail imagery
 * - Season Overview Statistics & Notifications
 */
import { ScrollView, Text, View, TouchableOpacity, RefreshControl, Platform, Image, ImageBackground } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useState, useCallback, useMemo } from "react";
import { useMatchRegistry, type MatchSummary } from "@/lib/stores/match-store";
import { GlassCard } from "@/components/ui/glass-card";
import { useResponsive } from "@/hooks/use-responsive";
import { useScrollPadding } from "@/hooks/use-scroll-padding";
import { NotificationsCenter, type AppNotification } from "@/components/notifications-center";

// Cricket News & Highlights with Image Thumbnails
const CRICKET_NEWS = [
  {
    id: "n1",
    category: "MATCH HIGHLIGHTS",
    title: "Super Over Thriller: Titans clinch victory on the final delivery!",
    date: "10 mins ago",
    badge: "🔥 HOT",
    readTime: "2 min read",
    imageUrl: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "n2",
    category: "PRO MASTERCLASS",
    title: "Mastering the Cover Drive: Bat position, footwork & timing breakdown",
    date: "1 hour ago",
    badge: "🏏 GUIDE",
    readTime: "4 min read",
    imageUrl: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "n3",
    category: "TOURNAMENT NEWS",
    title: "World Championship League 2026: Team registration now open",
    date: "3 hours ago",
    badge: "🏆 LEAGUE",
    readTime: "3 min read",
    imageUrl: "https://images.unsplash.com/photo-1569517282132-25d22f4573e6?q=80&w=800&auto=format&fit=crop",
  },
];

const MOCK_NOTIFICATIONS: AppNotification[] = [
  { id: "n1", type: "match", title: "Live Match Update", message: "Thunder Warriors are batting. Score: 158/4 (16.4 ov)", timestamp: "Just now", isRead: false },
  { id: "n2", type: "tournament", title: "League Update", message: "Summer Cricket League Round 3 fixtures published", timestamp: "2 hours ago", isRead: false },
];

export default function HomeScreen() {
  const router = useRouter();
  const { matches, getActiveMatch } = useMatchRegistry();
  const r = useResponsive();
  const activeMatch = getActiveMatch();
  const { paddingBottom } = useScrollPadding();
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>(MOCK_NOTIFICATIONS);
  const [selectedFilter, setSelectedFilter] = useState<"all" | "live" | "recent">("all");

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
      { label: "RUNS SCORED", value: String(totalRuns), color: "text-[#10B981]" },
      { label: "WICKETS", value: String(totalWickets), color: "text-[#FBBF24]" },
      { label: "AVG SR", value: "142.5", color: "text-emerald-300" },
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
    <ScreenContainer gradient glass>
      {/* Top Ambient Emerald Glow */}
      <View className="absolute top-0 left-0 right-0 h-64 pointer-events-none z-0">
        <View className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-[#10B981]/15 blur-3xl" />
        <View className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-[#059669]/15 blur-3xl" />
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
          
          {/* HEADER (CrickPro Brand + Create Button) */}
          <View className="flex-row items-center justify-between px-1 z-10">
            <View className="flex-row items-center gap-2.5">
              <View className="w-10 h-10 rounded-2xl bg-[#10B981] items-center justify-center shadow-lg shadow-emerald-500/30">
                <Text className="text-xl">🏏</Text>
              </View>
              <View>
                <Text className="text-2xl font-black text-white tracking-tight">CrickPro</Text>
                <Text className="text-[10px] font-black text-[#10B981] uppercase tracking-widest">LIVE SCORING HUB</Text>
              </View>
            </View>

            {/* Right Action Buttons */}
            <View className="flex-row items-center gap-2">
              <TouchableOpacity
                onPress={() => handleNav("/ai-chat")}
                className="w-10 h-10 rounded-2xl bg-[#0B1712] border border-[#10B981]/30 items-center justify-center active:scale-95 shadow-md"
              >
                <Text className="text-white text-lg">🤖</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleNav("/match/create")}
                className="bg-[#10B981] hover:bg-[#059669] px-4 py-2.5 rounded-xl flex-row items-center gap-1.5 active:scale-95 shadow-lg shadow-emerald-500/20"
              >
                <Text className="text-[#050B08] text-sm font-black">+</Text>
                <Text className="text-[#050B08] text-xs font-black uppercase tracking-wider">Create</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* STADIUM HERO BANNER WITH BACKGROUND IMAGE */}
          <TouchableOpacity
            onPress={() => handleNav("/match/create")}
            activeOpacity={0.9}
            className="rounded-3xl overflow-hidden border border-[#10B981]/30 shadow-2xl relative"
          >
            <ImageBackground
              source={{ uri: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=1200&auto=format&fit=crop" }}
              className="w-full p-6 justify-between min-h-[160px]"
              imageStyle={{ borderRadius: 24, opacity: 0.35 }}
            >
              {/* Dark Gradient Overlay */}
              <View className="absolute inset-0 bg-gradient-to-r from-[#050B08] via-[#0B1511]/90 to-transparent" />

              <View className="flex-row items-center justify-between z-10">
                <View className="gap-1 flex-1 pr-4">
                  <View className="bg-[#10B981]/25 border border-[#10B981]/50 px-3 py-1 rounded-full self-start">
                    <Text className="text-[10px] font-black text-[#10B981] uppercase tracking-wider">⚡ BALL-BY-BALL SCORING ENGINE</Text>
                  </View>
                  <Text className="text-2xl font-black text-white tracking-tight mt-1.5">Start New Match</Text>
                  <Text className="text-xs font-semibold text-slate-300 leading-relaxed">
                    Create a custom match with instant live scoring, DLS calculator & official player statistics
                  </Text>
                </View>

                <View className="w-14 h-14 rounded-2xl bg-[#10B981] items-center justify-center shadow-xl shadow-emerald-500/50 border-2 border-emerald-300">
                  <Text className="text-2xl">🏏</Text>
                </View>
              </View>

              {/* Bottom Action Bar */}
              <View className="flex-row items-center justify-between z-10 pt-4 mt-2 border-t border-white/10">
                <View className="flex-row items-center gap-2">
                  <Text className="text-xs font-black text-[#10B981]">PRO ENGINE READY</Text>
                  <Text className="text-xs font-bold text-slate-400">• T20, ODI & Custom</Text>
                </View>
                <View className="bg-[#10B981] px-3.5 py-1.5 rounded-xl flex-row items-center gap-1">
                  <Text className="text-xs font-black text-[#050B08]">START MATCH →</Text>
                </View>
              </View>
            </ImageBackground>
          </TouchableOpacity>

          {/* MATCH FILTER PILLS */}
          <View className="flex-row gap-2 px-1">
            {[
              { id: "all", label: "🔥 All Matches" },
              { id: "live", label: "🔴 Live Now" },
              { id: "recent", label: "🏆 Recent Results" },
            ].map((tab) => {
              const selected = selectedFilter === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  onPress={() => setSelectedFilter(tab.id as any)}
                  className={`px-4 py-2.5 rounded-xl border flex-row items-center gap-1.5 transition-all active:scale-95 ${
                    selected
                      ? "bg-[#10B981] border-[#10B981] shadow-md shadow-emerald-500/30"
                      : "bg-[#0B1712] border-[#142820]"
                  }`}
                >
                  <Text className={`text-xs font-black ${selected ? "text-[#050B08]" : "text-[#CBD5E1]"}`}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* FEATURED LIVE MATCH DISPLAY */}
          <View className="gap-3">
            <View className="flex-row items-center justify-between px-1">
              <Text className="text-xs font-black text-slate-400 uppercase tracking-widest">FEATURED MATCH</Text>
              <View className="flex-row items-center gap-1 bg-[#10B981]/20 border border-[#10B981]/40 px-2.5 py-0.5 rounded-full">
                <View className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                <Text className="text-[10px] font-black text-[#10B981]">LIVE NOW</Text>
              </View>
            </View>

            <GlassCard
              intensity="heavy"
              radius="xl"
              padding="lg"
              className="bg-[#0B1511] border-[#10B981]/20 shadow-2xl gap-4"
              onPress={() => handleViewMatch(featuredMatch)}
            >
              {/* Match Teams & Score Grid */}
              <View className="flex-row items-center justify-between py-1">
                {/* Team 1 */}
                <View className="items-center gap-1.5 flex-1">
                  <View className="w-14 h-14 rounded-2xl bg-[#060D0A] border border-[#10B981]/30 items-center justify-center shadow-lg">
                    <Text className="text-2xl">⚡</Text>
                  </View>
                  <Text className="text-sm font-black text-white text-center">{featuredMatch.team1}</Text>
                  <Text className="text-xs font-black text-[#10B981]">{featuredMatch.score1} <Text className="text-slate-400 text-[10px]">({featuredMatch.overs} ov)</Text></Text>
                </View>

                {/* Center VS Divider */}
                <View className="items-center gap-1 px-2">
                  <View className="w-8 h-8 rounded-full bg-[#10B981]/20 border border-[#10B981]/40 items-center justify-center">
                    <Text className="text-xs font-black text-[#10B981]">VS</Text>
                  </View>
                  <Text className="text-[10px] font-extrabold text-slate-400">CRR: {featuredMatch.crr1 || "9.48"}</Text>
                </View>

                {/* Team 2 */}
                <View className="items-center gap-1.5 flex-1">
                  <View className="w-14 h-14 rounded-2xl bg-[#060D0A] border border-white/10 items-center justify-center shadow-lg">
                    <Text className="text-2xl">🔥</Text>
                  </View>
                  <Text className="text-sm font-black text-white text-center">{featuredMatch.team2}</Text>
                  <Text className="text-xs font-black text-slate-200">{featuredMatch.score2 || "Yet to bat"}</Text>
                </View>
              </View>

              {/* Match Status Bar */}
              <View className="bg-[#060D0A] p-3 rounded-xl border border-white/5 flex-row items-center justify-between">
                <Text className="text-xs font-bold text-slate-200 flex-1 truncate">
                  Thunder Warriors need 25 runs in 20 balls
                </Text>
                <View className="bg-[#10B981] px-3 py-1 rounded-lg">
                  <Text className="text-xs font-black text-[#050B08]">OPEN SCORECARD ›</Text>
                </View>
              </View>
            </GlassCard>
          </View>

          {/* QUICK ACTIONS GRID WITH VISUAL ICONS */}
          <View className="gap-2.5">
            <Text className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">
              MATCH SCORING & TOOLS
            </Text>
            <View className="flex-row flex-wrap justify-between gap-y-3">
              {[
                { id: "create", title: "+ Start Match", desc: "Ball-by-ball scoring", icon: "⚡", bg: "rgba(16, 185, 129, 0.2)", path: "/match/create" },
                { id: "aichat", title: "CrickAI Coach", desc: "Rules & tactical AI", icon: "🤖", bg: "rgba(16, 185, 129, 0.2)", path: "/ai-chat" },
                { id: "community", title: "Community", desc: "Umpires & nets", icon: "🌐", bg: "rgba(16, 185, 129, 0.2)", path: "/(tabs)/community" },
                { id: "h2h", title: "Head to Head", desc: "Compare stats", icon: "⚔️", bg: "rgba(245, 158, 11, 0.2)", path: "/head-to-head" },
                { id: "leagues", title: "Tournaments", desc: "Leagues & tables", icon: "🏆", bg: "rgba(16, 185, 129, 0.2)", path: "/(tabs)/leagues" },
                { id: "stats", title: "Player Roster", desc: "Career stats", icon: "📊", bg: "rgba(16, 185, 129, 0.2)", path: "/(tabs)/stats" },
              ].map((a) => (
                <TouchableOpacity
                  key={a.id}
                  onPress={() => handleNav(a.path)}
                  style={{ width: "48%" as any }}
                  className="bg-[#0B1511] border border-[#10B981]/20 rounded-2xl p-3.5 gap-1.5 active:scale-95 hover:border-[#10B981]"
                >
                  <View className="w-9 h-9 rounded-xl items-center justify-center border border-[#10B981]/30" style={{ backgroundColor: a.bg }}>
                    <Text className="text-base">{a.icon}</Text>
                  </View>
                  <View className="gap-0.5">
                    <Text className="text-sm font-black text-white" numberOfLines={1}>{a.title}</Text>
                    <Text className="text-[10px] font-semibold text-slate-400" numberOfLines={1}>{a.desc}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* CRICKET TRENDING NEWS WITH IMAGE THUMBNAILS */}
          <View className="gap-3">
            <View className="flex-row items-center justify-between px-1">
              <Text className="text-lg font-black text-white tracking-tight">
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
                <TouchableOpacity
                  key={news.id}
                  onPress={() => handleNav("/(tabs)/leagues")}
                  activeOpacity={0.85}
                  className="w-72 bg-[#0B1511] border border-[#10B981]/20 rounded-2xl overflow-hidden gap-0 justify-between"
                >
                  {/* Thumbnail Image Header */}
                  <Image
                    source={{ uri: news.imageUrl }}
                    className="w-full h-32"
                    resizeMode="cover"
                  />

                  <View className="p-4 gap-2 flex-1 justify-between">
                    <View className="gap-1.5">
                      <View className="flex-row items-center justify-between">
                        <Text className="text-[10px] font-black text-[#10B981] tracking-wider">{news.category}</Text>
                        <View className="bg-[#10B981]/20 px-2 py-0.5 rounded-md">
                          <Text className="text-[10px] font-bold text-[#10B981]">{news.badge}</Text>
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
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* SEASON OVERVIEW */}
          <View className="gap-2.5">
            <View className="flex-row items-center justify-between px-1">
              <Text className="text-xs font-black text-slate-400 uppercase tracking-widest">
                SEASON OVERVIEW
              </Text>
              <TouchableOpacity onPress={() => handleNav("/(tabs)/stats")}>
                <Text className="text-xs font-black text-[#10B981] uppercase tracking-wider">
                  Full Stats ›
                </Text>
              </TouchableOpacity>
            </View>
            <View className="flex-row gap-2.5">
              {seasonStats.map((s) => (
                <GlassCard key={s.label} intensity="heavy" padding="md" radius="xl" className="flex-1 items-center gap-1 bg-[#0B1511] border-[#10B981]/20">
                  <Text className="text-[9px] font-black text-slate-400 tracking-wider">{s.label}</Text>
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
