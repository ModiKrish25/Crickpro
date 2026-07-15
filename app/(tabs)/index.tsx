/**
 * Home Screen - CrickPro Dashboard
 * Displays active matches, quick actions, stats summary,
 * and recent scorecards with a polished sports-app feel
 */
import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";
import { useMatchRegistry, type MatchSummary } from "@/lib/stores/match-store";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassHeader } from "@/components/ui/glass-header";
import { LiquidGlassOverlay } from "@/components/ui/liquid-glass-overlay";

/**
 * Home Screen - Main dashboard for CrickPro with glassmorphism design
 */
export default function HomeScreen() {
  const router = useRouter();
  const { matches, live, completed, getActiveMatch, getRecentScorecards } = useMatchRegistry();
  const activeMatch = getActiveMatch();
  const recentScorecards = getRecentScorecards();

  const handleStartMatch = async () => {
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push("/match/create");
  };

  const handleViewScorecard = async () => {
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push("/(tabs)/scorecard");
  };

  const handleJoinLeague = async () => {
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push("/(tabs)/leagues");
  };

  const handleViewStats = async () => {
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push("/(tabs)/stats");
  };

  const handleViewMatch = async (match: MatchSummary) => {
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push({
      pathname: "/match/live",
      params: {
        team1: match.team1,
        team2: match.team2,
        format: match.format.toLowerCase(),
        overs: match.format === "T20" ? "20" : match.format === "ODI" ? "50" : "10",
      },
    });
  };

  return (
    <ScreenContainer className="p-5">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 gap-6">
          {/* Glass Header */}
          <GlassHeader
            title="CrickPro"
            subtitle="Welcome back! 👋 Cricket Scoring & Tournament Management"
            size="lg"
            animated
          />

          {/* Quick Actions Grid - Glass Cards */}
          <View className="flex-row gap-3">
            <GlassCard intensity="high" glowColor="#0a7ea4" padding="lg" className="flex-1 items-center" onPress={handleStartMatch}>
              <LiquidGlassOverlay color="#0a7ea4" variant="sheen" speed={0.8} />
              <Text className="text-3xl mb-2">🏏</Text>
              <Text className="text-foreground font-bold text-sm">New Match</Text>
              <Text className="text-foreground/60 text-[10px] mt-0.5">Start scoring</Text>
            </GlassCard>

            <GlassCard intensity="high" glowColor="#10B981" padding="lg" className="flex-1 items-center" onPress={handleViewScorecard}>
              <LiquidGlassOverlay color="#10B981" variant="sheen" speed={0.9} />
              <Text className="text-3xl mb-2">📊</Text>
              <Text className="text-foreground font-bold text-sm">Scorecard</Text>
              <Text className="text-foreground/60 text-[10px] mt-0.5">View matches</Text>
            </GlassCard>
          </View>

          <View className="flex-row gap-3">
            <GlassCard intensity="high" glowColor="#8B5CF6" padding="lg" className="flex-1 items-center" onPress={handleJoinLeague}>
              <LiquidGlassOverlay color="#8B5CF6" variant="sheen" speed={0.7} />
              <Text className="text-3xl mb-2">🏆</Text>
              <Text className="text-foreground font-bold text-sm">Leagues</Text>
              <Text className="text-foreground/60 text-[10px] mt-0.5">Tournaments</Text>
            </GlassCard>

            <GlassCard intensity="high" glowColor="#F97316" padding="lg" className="flex-1 items-center" onPress={handleViewStats}>
              <LiquidGlassOverlay color="#F97316" variant="sheen" speed={0.75} />
              <Text className="text-3xl mb-2">📈</Text>
              <Text className="text-foreground font-bold text-sm">Stats</Text>
              <Text className="text-foreground/60 text-[10px] mt-0.5">Performance</Text>
            </GlassCard>
          </View>

          {/* Active Match Card - Glass with green glow */}
          {activeMatch ? (
            <GlassCard intensity="medium" glowColor="#10B981" padding="lg" className="gap-0" onPress={() => handleViewMatch(activeMatch)}>
                <LiquidGlassOverlay color="#10B981" variant="pulse" />
                <View className="flex-row justify-between items-center mb-3">
                  <Text className="text-lg font-bold text-foreground">Active Match</Text>
                  <View className="bg-green-500 rounded-full px-2.5 py-0.5">
                    <Text className="text-[10px] font-bold text-white">LIVE</Text>
                  </View>
                </View>

                <View className="flex-row items-center gap-4">
                  <View className="flex-1 items-center">
                    <Text className="text-base font-bold text-foreground">{activeMatch.team1}</Text>
                    <Text className="text-2xl font-bold text-primary">{activeMatch.score1 || "—"}</Text>
                    {activeMatch.crr1 && (
                      <Text className="text-[10px] text-muted mt-0.5">CRR: {activeMatch.crr1}</Text>
                    )}
                  </View>

                  <View className="items-center">
                    <View className="w-8 h-8 rounded-full bg-primary/10 items-center justify-center">
                      <Text className="text-xs font-bold text-primary">VS</Text>
                    </View>
                    {activeMatch.overs && (
                      <Text className="text-xs text-muted mt-1">{activeMatch.overs}</Text>
                    )}
                  </View>

                  <View className="flex-1 items-center">
                    <Text className="text-base font-bold text-foreground">{activeMatch.team2}</Text>
                    <Text className="text-2xl font-bold text-primary">{activeMatch.score2 || "—"}</Text>
                    {activeMatch.crr2 && (
                      <Text className="text-[10px] text-muted mt-0.5">CRR: {activeMatch.crr2}</Text>
                    )}
                  </View>
                </View>

                <Text className="text-xs text-muted text-center mt-3">
                  Tap to view live scorecard
                </Text>
              </GlassCard>
          ) : matches.length === 0 ? (
            /* Empty state */
            <GlassCard intensity="subtle" padding="lg" className="items-center gap-2">
              <Text className="text-3xl">🏏</Text>
              <Text className="text-base font-semibold text-muted text-center">No active matches</Text>
              <Text className="text-xs text-muted text-center">Create a new match to start scoring</Text>
            </GlassCard>
          ) : null}

          {/* Stats Summary - Glass Cards */}
          <View className="gap-3">
            <Text className="text-lg font-bold text-foreground">Your Season Stats</Text>
            <View className="flex-row gap-3">
              <GlassCard intensity="medium" padding="sm" className="flex-1 items-center">
                <Text className="text-2xl font-bold text-primary">12</Text>
                <Text className="text-[10px] text-muted mt-0.5 text-center">Matches</Text>
              </GlassCard>
              <GlassCard intensity="medium" padding="sm" className="flex-1 items-center">
                <Text className="text-2xl font-bold text-green-500">485</Text>
                <Text className="text-[10px] text-muted mt-0.5 text-center">Runs</Text>
              </GlassCard>
              <GlassCard intensity="medium" padding="sm" className="flex-1 items-center">
                <Text className="text-2xl font-bold text-orange-500">28</Text>
                <Text className="text-[10px] text-muted mt-0.5 text-center">Wickets</Text>
              </GlassCard>
              <GlassCard intensity="medium" padding="sm" className="flex-1 items-center">
                <Text className="text-2xl font-bold text-purple-500">8</Text>
                <Text className="text-[10px] text-muted mt-0.5 text-center">Wins</Text>
              </GlassCard>
            </View>
          </View>

          {/* Recent Scorecards - Glass Cards */}
          {recentScorecards.length > 0 && (
            <View className="gap-3">
              <Text className="text-lg font-bold text-foreground">Recent Results</Text>
              {recentScorecards.map((match) => (
                <GlassCard
                  key={match.id}
                  intensity="medium"
                  padding="md"
                  onPress={() => handleViewMatch(match)}
                >
                  <Text className="text-base font-bold text-foreground">{match.team1} vs {match.team2}</Text>
                  <View className="flex-row justify-between items-center mt-2">
                    <Text className="text-sm text-muted">{match.team1}: {match.score1 || "—"} {match.overs ? `(${match.overs})` : ""}</Text>
                    <Text className="text-sm text-muted">{match.team2}: {match.score2 || "—"}</Text>
                  </View>
                  {match.result && (
                    <Text className="text-xs font-bold text-green-600 mt-2">
                      {match.result}
                    </Text>
                  )}
                </GlassCard>
              ))}
            </View>
          )}

          {/* Upcoming Fixtures - Glass Card */}
          <View className="gap-3">
            <Text className="text-lg font-bold text-foreground">Upcoming Fixtures</Text>
            <GlassCard intensity="medium" padding="md" className="flex-row items-center gap-4">
              <LiquidGlassOverlay color="#0a7ea4" variant="sheen" speed={0.6} />
              <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center">
                <Text className="text-lg">📅</Text>
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold text-foreground">Summer League Final</Text>
                <Text className="text-xs text-muted">Jul 20, 2026 at 3:00 PM</Text>
              </View>
              <TouchableOpacity
                className="bg-primary rounded-lg px-3 py-1.5 active:opacity-80"
                onPress={handleJoinLeague}
              >
                <Text className="text-xs font-bold text-background">Join</Text>
              </TouchableOpacity>
            </GlassCard>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
