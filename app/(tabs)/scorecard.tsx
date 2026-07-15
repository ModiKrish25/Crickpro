/**
 * Scorecard Screen - Match scoring hub
 * Start new matches, view active matches, and access recent scorecards
 */
import { ScrollView, Text, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";
import { useMatchRegistry, type MatchSummary } from "@/lib/stores/match-store";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassHeader } from "@/components/ui/glass-header";
import { LiquidGlassOverlay } from "@/components/ui/liquid-glass-overlay";

export default function ScorecardScreen() {
  const router = useRouter();
  const { live, completed, upcoming } = useMatchRegistry();

  const handleStartNewMatch = async () => {
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push("/match/create");
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

  const renderMatchCard = (match: MatchSummary) => {
    const statusColors: Record<string, string> = {
      live: "bg-green-500",
      completed: "bg-gray-500",
      upcoming: "bg-blue-500",
    };

    const glowColors: Record<string, string> = {
      live: "#10B981",
      completed: "#6B7280",
      upcoming: "#3B82F6",
    };

    return (
      <GlassCard
        key={match.id}
        intensity="medium"
        glowColor={glowColors[match.status] || "#0a7ea4"}
        padding="md"
        className="gap-3"
        onPress={() => handleViewMatch(match)}
      >
          {match.status === "live" && (
            <LiquidGlassOverlay color="#10B981" variant="pulse" />
          )}
          <View className="flex-row justify-between items-center">
            <Text className="text-sm font-bold text-muted uppercase">{match.format}</Text>
            <View className={`${statusColors[match.status]} rounded-full px-3 py-0.5`}>
              <Text className="text-xs font-bold text-white">
                {match.status === "live" ? "LIVE" : match.status === "completed" ? "COMPLETED" : "UPCOMING"}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center gap-3">
            <View className="flex-1">
              <Text className="text-lg font-bold text-foreground">{match.team1}</Text>
              {match.score1 && (
                <Text className="text-sm font-semibold text-primary">{match.score1}</Text>
              )}
              {match.status !== "upcoming" && match.crr1 && (
                <Text className="text-[10px] text-muted mt-0.5">CRR: {match.crr1}</Text>
              )}
            </View>

            <View className="items-center">
              <Text className="text-xs font-bold text-muted">VS</Text>
              {match.overs && match.status === "live" && (
                <Text className="text-xs text-muted mt-1">{match.overs}</Text>
              )}
              {match.date && match.status === "upcoming" && (
                <Text className="text-xs text-muted mt-1">{match.date}</Text>
              )}
            </View>

            <View className="flex-1 items-end">
              <Text className="text-lg font-bold text-foreground">{match.team2}</Text>
              {match.score2 && (
                <Text className="text-sm font-semibold text-primary">{match.score2}</Text>
              )}
              {match.status !== "upcoming" && match.crr2 && (
                <Text className="text-[10px] text-muted mt-0.5">CRR: {match.crr2}</Text>
              )}
            </View>
          </View>

          {match.result && (
            <Text className="text-xs font-semibold text-success text-center">
              {match.result}
            </Text>
          )}
        </GlassCard>
    );
  };

  return (
    <ScreenContainer className="p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="flex-1 gap-6">
          {/* Glass Header */}
          <GlassHeader
            title="Scorecard"
            subtitle="Start scoring or view past matches"
            size="md"
            animated
          />

          {/* Start New Match - Glass Card */}
          <GlassCard
            intensity="high"
            glowColor="#0a7ea4"
            padding="lg"
            className="items-center gap-1"
            onPress={handleStartNewMatch}
          >
            <LiquidGlassOverlay color="#0a7ea4" variant="sheen" speed={0.8} />
            <Text className="text-2xl mb-1">🏏</Text>
            <Text className="text-foreground font-bold text-lg">Start New Match</Text>
            <Text className="text-foreground/60 text-xs mt-1">
              Create a match and begin ball-by-ball scoring
            </Text>
          </GlassCard>

          {/* Live Matches */}
          {live.length > 0 ? (
            <View className="gap-3">
              <Text className="text-lg font-semibold text-foreground">Live Now</Text>
              {live.map(renderMatchCard)}
            </View>
          ) : (
            <GlassCard intensity="subtle" padding="md" className="items-center">
              <LiquidGlassOverlay variant="sheen" speed={0.5} />
              <Text className="text-sm text-muted">No live matches. Start a new match above!</Text>
            </GlassCard>
          )}

          {/* Completed Matches */}
          {completed.length > 0 && (
            <View className="gap-3">
              <Text className="text-lg font-semibold text-foreground">Recent Results</Text>
              {completed.map(renderMatchCard)}
            </View>
          )}

          {/* Upcoming */}
          {upcoming.length > 0 && (
            <View className="gap-3">
              <Text className="text-lg font-semibold text-foreground">Upcoming</Text>
              {upcoming.map(renderMatchCard)}
            </View>
          )}

          {/* Quick Info - Glass Card */}
          <GlassCard intensity="subtle" padding="md" glowColor="#0a7ea4">
            <Text className="text-sm font-semibold text-primary mb-1">📊 How Scoring Works</Text>
            <Text className="text-xs text-muted">
              Tap runs (0-6), extras (wide, no-ball, bye, leg-bye), or wickets to record each delivery.
              The app automatically tracks overs, strike rotation, run rates, and more.
            </Text>
          </GlassCard>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
