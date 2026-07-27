/**
 * Scorecard Screen - Premium match scoring hub (Responsive)
 *
 * Responsive glassmorphism layout for phone/tablet/desktop.
 * Matches layout adapts to screen width.
 */
import { ScrollView, Text, View, TouchableOpacity, Platform } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useState, useCallback, useMemo } from "react";
import { useMatchRegistry, type MatchSummary } from "@/lib/stores/match-store";
import { trpc } from "@/lib/trpc";
import { useAuthContext } from "@/lib/auth-context";
import { GlassCard } from "@/components/ui/glass-card";
import { LiquidGlassOverlay } from "@/components/ui/liquid-glass-overlay";
import { GlassFloatingButton } from "@/components/ui/glass-floating-button";
import { useResponsive } from "@/hooks/use-responsive";
import { useScrollPadding } from "@/hooks/use-scroll-padding";

export default function ScorecardScreen() {
  const { paddingBottom } = useScrollPadding(16);
  const router = useRouter();
  const { live, completed } = useMatchRegistry();
  const r = useResponsive();
  const { isAuthenticated } = useAuthContext();
  
  // Fetch matches from backend to supplement local store
  const { data: apiMatches } = trpc.match.list.useQuery({ limit: 50, offset: 0 }, {
    staleTime: 30_000, // 30s cache
    retry: 1,
    enabled: isAuthenticated, // Don't fetch until user is logged in
  });

  const [filterTab, setFilterTab] = useState<"all" | "live" | "completed">("all");

  const T = { section: r.isPhone ? "text-base sm:text-lg" : "text-xl", title: r.isPhone ? "text-2xl sm:text-3xl" : "text-4xl" };

  const handleAction = useCallback(async (cb: () => void) => {
    if (Platform.OS !== "web") await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    cb();
  }, []);

  const handleViewMatch = useCallback(async (match: MatchSummary) => {
    await handleAction(() => {
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
    });
  }, [handleAction, router]);

  const renderMatchCard = useCallback((match: MatchSummary, index = 0) => {
    const glowColors: Record<string, string> = { live: "#10B981", completed: "#9CA3AF", upcoming: "#10B981" };
    const glow = glowColors[match.status] || "#10B981";
    return (
      <GlassCard key={match.id} intensity="high" glowColor={glow} padding="md" radius="xl" className="gap-3"
        onPress={() => handleViewMatch(match)} blurAmount={24}
        staggerIndex={1 + index}>
        {match.status === "live" && <LiquidGlassOverlay color="#10B981" variant="pulse" speed={1.2} intensity={0.5} />}
        <View className="flex-row justify-between items-center">
          <Text className="text-[10px] font-extrabold text-[#9CA3AF] uppercase tracking-wider">{match.format}</Text>
          <View className="rounded-full px-2.5 py-0.5"
            style={{ backgroundColor: `${glow}15` }}>
            <Text className="text-[9px] font-black tracking-wider uppercase" style={{ color: glow }}>
              {match.status === "live" ? "● LIVE" : match.status === "completed" ? "COMPLETED" : "UPCOMING"}
            </Text>
          </View>
        </View>
        <View className={`flex-row items-center ${r.isPhone ? "gap-2" : "gap-4"}`}>
          <View className="flex-1">
            <Text className={`${r.isPhone ? "text-xs sm:text-sm" : "text-base"} font-bold text-[#F9FAFB]`}>{match.team1}</Text>
            {(match.team1Captain || match.team1Keeper) && (
              <View className="flex-row items-center gap-1.5 mt-0.5 flex-wrap">
                {match.team1Captain && <View className="bg-amber-400/15 rounded-md px-1.5 py-0.5"><Text className="text-[9px] font-semibold text-amber-600">👑 {match.team1Captain}</Text></View>}
                {match.team1Keeper && <View className="bg-blue-400/15 rounded-md px-1.5 py-0.5"><Text className="text-[9px] font-semibold text-blue-600">🧤 {match.team1Keeper}</Text></View>}
              </View>
            )}
            {match.score1 && <Text className={`${r.isPhone ? "text-lg sm:text-xl" : "text-2xl"} font-black text-[#10B981] tracking-tight tabular-nums`}>{match.score1}</Text>}
            {match.status !== "upcoming" && match.crr1 && <Text className="text-[9px] font-semibold text-[#9CA3AF] mt-0.5">CRR: {match.crr1}</Text>}
          </View>
          <View className="items-center px-1">
            <Text className="text-xs font-black text-[#9CA3AF]">VS</Text>
            {match.overs && match.status === "live" && <Text className="text-[9px] font-semibold text-[#9CA3AF] mt-1">{match.overs}</Text>}
            {match.date && match.status === "upcoming" && <Text className="text-[9px] font-semibold text-[#9CA3AF] mt-1">{match.date}</Text>}
          </View>
          <View className="flex-1 items-end">
            <Text className={`${r.isPhone ? "text-xs sm:text-sm" : "text-base"} font-bold text-[#F9FAFB]`}>{match.team2}</Text>
            {(match.team2Captain || match.team2Keeper) && (
              <View className="flex-row items-center gap-1.5 mt-0.5 flex-wrap justify-end">
                {match.team2Captain && <View className="bg-amber-400/15 rounded-md px-1.5 py-0.5"><Text className="text-[9px] font-semibold text-amber-600">👑 {match.team2Captain}</Text></View>}
                {match.team2Keeper && <View className="bg-blue-400/15 rounded-md px-1.5 py-0.5"><Text className="text-[9px] font-semibold text-blue-600">🧤 {match.team2Keeper}</Text></View>}
              </View>
            )}
            {match.score2 && <Text className={`${r.isPhone ? "text-lg sm:text-xl" : "text-2xl"} font-black text-[#10B981] tracking-tight tabular-nums`}>{match.score2}</Text>}
            {match.status !== "upcoming" && match.crr2 && <Text className="text-[9px] font-semibold text-[#9CA3AF] mt-0.5">CRR: {match.crr2}</Text>}
          </View>
        </View>
        {match.result && <Text className="text-xs font-bold text-[#34D399] text-center">{match.result}</Text>}
      </GlassCard>
    );
  }, [handleViewMatch, r.isPhone]);

  return (
    <ScreenContainer gradient glass>
      <ScrollView style={{ flex: 1, width: "100%", height: "100%" }} contentContainerStyle={{ flexGrow: 1, minHeight: "100%", paddingBottom }} showsVerticalScrollIndicator={false}>
        <View className={`flex-1 ${r.isPhone ? "gap-4" : "gap-6"}`}>
          {/* Header */}
          <View className="pt-2 pb-1">
            <Text className={`${T.title} font-extrabold text-foreground tracking-tight`}>Scorecard</Text>
            <Text className={`${r.isPhone ? "text-xs sm:text-sm" : "text-base"} font-semibold text-muted mt-0.5`}>Start scoring or view past matches</Text>
          </View>

          {/* New Match CTA */}
          <GlassCard intensity="high" glowColor="#10B981" padding="xl" radius="xl" gradientBorder
            className={`items-center ${r.isPhone ? "gap-2 py-6" : "gap-3 py-8"}`}
            onPress={() => handleAction(() => router.push("/match/create"))} blurAmount={30}
            staggerIndex={0}>
            <LiquidGlassOverlay color="#10B981" variant="sheen" speed={0.8} intensity={0.6} />
            <View className="w-14 h-14 rounded-full bg-[#10B981]/15 items-center justify-center mb-1">
              <Text className="text-3xl">🏏</Text>
            </View>
            <Text className="text-[#F9FAFB] font-extrabold text-lg sm:text-xl">Start New Match</Text>
            <Text className="text-[#9CA3AF] text-xs font-semibold">Create a match and begin ball-by-ball scoring</Text>
          </GlassCard>

          {/* Mobile Horizontal Filter Bar */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {[
              { id: "all", label: "All Matches" },
              { id: "live", label: "Live Now" },
              { id: "completed", label: "Recent Results" },
            ].map((tab) => {
              const active = filterTab === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  onPress={() => handleAction(() => setFilterTab(tab.id as any))}
                  className={`px-3.5 py-1.5 rounded-full border ${
                    active ? "bg-[#10B981] border-[#10B981]" : "bg-[#11201A] border-white/10"
                  }`}
                >
                  <Text className={`text-[11px] font-bold ${active ? "text-[#06120E]" : "text-[#9CA3AF]"}`}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Live Matches */}
          {(filterTab === "all" || filterTab === "live") && (
            live.length > 0 ? (
              <View className={r.isPhone ? "gap-3" : "gap-4"}>
                <Text className={`${T.section} font-extrabold text-foreground tracking-tight uppercase`}>Live Now</Text>
                {live.map((m) => renderMatchCard(m))}
              </View>
            ) : filterTab === "live" ? (
              <GlassCard intensity="subtle" padding="lg" radius="xl" className="items-center" blurAmount={16} staggerIndex={1}>
                <LiquidGlassOverlay variant="sheen" speed={0.5} intensity={0.3} />
                <Text className="text-xs font-semibold text-muted">No live matches in progress</Text>
              </GlassCard>
            ) : null
          )}

          {/* Completed Matches */}
          {(filterTab === "all" || filterTab === "completed") && (
            completed.length > 0 && (
              <View className={r.isPhone ? "gap-3" : "gap-4"}>
                <Text className={`${T.section} font-extrabold text-foreground tracking-tight uppercase`}>Recent Results</Text>
                {completed.map((m, idx) => renderMatchCard(m, live.length + idx))}
              </View>
            )
          )}

          {/* How Scoring Works */}
          <GlassCard intensity="subtle" padding="lg" radius="xl" glowColor="#0066FF" blurAmount={16} staggerIndex={2}>
            <Text className="text-xs font-bold text-[#0066FF] uppercase tracking-wider mb-1">📊 How Scoring Works</Text>
            <Text className="text-xs font-semibold text-muted leading-5">
              Tap runs (0-6), extras (wide, no-ball, bye, leg-bye), or wickets to record each delivery.{'\n'}
              The app automatically tracks overs, strike rotation, run rates, and more.
            </Text>
          </GlassCard>
        </View>
      </ScrollView>
      <GlassFloatingButton icon="🏏" label="New" onPress={() => handleAction(() => router.push("/match/create"))}
        glowColor="#0066FF" position="bottom-right" size="lg" />
    </ScreenContainer>
  );
}
