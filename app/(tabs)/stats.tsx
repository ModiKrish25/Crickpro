/**
 * Stats Screen - Premium player statistics with enhanced glass effects
 * 
 * Design: Glass cards with accent glows, clean data visualization
 * All elements use frosted glass with backdrop blur
 * - Player comparison / head-to-head link
 * - Pull-to-refresh
 */
import { ScrollView, Text, View, TouchableOpacity, FlatList, RefreshControl, Platform } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useState, useCallback, useMemo } from "react";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { PlayerStatsCard } from "@/components/player-stats-card";
import { PlayerProfileHeader } from "@/components/player-profile-header";
import { GlassCard } from "@/components/ui/glass-card";
import { LiquidGlassOverlay } from "@/components/ui/liquid-glass-overlay";
import { GlassSearchBar } from "@/components/ui/glass-search-bar";
import { StatRow } from "@/components/ui/stat-row";
import { GlassButton } from "@/components/ui/glass-button";
import { trpc } from "@/lib/trpc";
import { useAuthContext } from "@/lib/auth-context";
import { useResponsive } from "@/hooks/use-responsive";
import { useScrollPadding } from "@/hooks/use-scroll-padding";
import { useThemeContext } from "@/lib/theme-provider";

type MockPlayer = {
  id: string;
  name: string;
  role: "batsman" | "bowler" | "all-rounder";
  team: string;
  jersey: number;
  matchesPlayed: number;
  battingStats?: {
    runs: number;
    average: number;
    strikeRate: number;
    fours: number;
    sixes: number;
    highestScore: number;
  };
  bowlingStats?: {
    wickets: number;
    runs: number;
    economyRate: number;
    average: number;
    bestFigures: string;
  };
};

export default function StatsScreen() {
  const { paddingBottom } = useScrollPadding();
  const router = useRouter();
  const r = useResponsive();
  const { colorScheme } = useThemeContext();
  const isDark = colorScheme === "dark";
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const { isAuthenticated } = useAuthContext();
  const updateProfile = trpc.players.updateProfile.useMutation();

  // Fetch real career stats from backend (enabled only when authenticated with a valid player ID)
  const { data: careerStats, refetch: refetchCareerStats } = trpc.players.getCareerStats.useQuery(
    { playerId: 0 },
    // Query is disabled by default because we don't have a real player ID yet.
    // When auth is fully wired to expose the player ID, change playerId and set enabled: true.
    { enabled: false, retry: 1 },
  );

  const [mockPlayers, setMockPlayers] = useState<MockPlayer[]>([
    { id: "p1", name: "Rohit Sharma", role: "batsman", team: "Thunder Warriors", jersey: 45, matchesPlayed: 12,
      battingStats: { runs: 580, average: 48.33, strikeRate: 142.5, fours: 28, sixes: 12, highestScore: 89 } },
    { id: "p2", name: "Jasprit Bumrah", role: "bowler", team: "Thunder Warriors", jersey: 93, matchesPlayed: 12,
      bowlingStats: { wickets: 18, runs: 245, economyRate: 6.8, average: 13.6, bestFigures: "4/28" } },
    { id: "p3", name: "Virat Kohli", role: "all-rounder", team: "Phoenix Rising", jersey: 18, matchesPlayed: 12,
      battingStats: { runs: 625, average: 52.08, strikeRate: 138.2, fours: 32, sixes: 8, highestScore: 95 },
      bowlingStats: { wickets: 3, runs: 142, economyRate: 7.1, average: 47.33, bestFigures: "2/31" } },
  ]);

  // Merge API career stats into mock players when available
  const allPlayers = useMemo(() => {
    if (!careerStats || careerStats.length === 0) return mockPlayers;
    // Map backend stats to frontend player format when we have real stats
    // For now, we use mock data supplemented with API stats
    const apiPlayerMap = new Map<string, MockPlayer>();
    for (const stat of careerStats as any[]) {
      if (stat.playerId && stat.runsScored != null) {
        const id = `api_${stat.playerId}`;
        apiPlayerMap.set(id, {
          id,
          name: `Player #${stat.playerId}`,
          role: "batsman",
          team: "Your Team",
          jersey: 0,
          matchesPlayed: stat.matchesPlayed || 0,
          battingStats: {
            runs: stat.runsScored || 0,
            average: (stat.average || 0) / 100,
            strikeRate: (stat.strikeRate || 0) / 100,
            fours: stat.fours || 0,
            sixes: stat.sixes || 0,
            highestScore: stat.highestScore || 0,
          },
        });
      }
    }
    return [...mockPlayers, ...Array.from(apiPlayerMap.values())];
  }, [careerStats, mockPlayers]);

  const [roleFilter, setRoleFilter] = useState<"all" | "batsman" | "bowler" | "all-rounder">("all");

  const filteredPlayers = useMemo(() => {
    let result = allPlayers;
    if (roleFilter !== "all") {
      result = result.filter(p => p.role === roleFilter);
    }
    if (searchQuery.trim()) {
      result = result.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return result;
  }, [allPlayers, roleFilter, searchQuery]);

  const handleAction = useCallback(async (cb: () => void) => {
    if (Platform.OS !== "web") await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    cb();
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    if (isAuthenticated) {
      try { await refetchCareerStats(); } catch {}
    }
    await new Promise(resolve => setTimeout(resolve, 800));
    setRefreshing(false);
  }, [isAuthenticated, refetchCareerStats]);

  const handleNameSave = useCallback((playerId: string, newName: string) => {
    const prevPlayers = mockPlayers;
    setMockPlayers((prev) => prev.map((p) => (p.id === playerId ? { ...p, name: newName } : p)));
    if (isAuthenticated) {
      updateProfile.mutate({ name: newName }, { onError: () => { setMockPlayers(prevPlayers); } });
    }
  }, [mockPlayers, isAuthenticated, updateProfile]);

  const handleRoleSave = useCallback((playerId: string, newRole: MockPlayer["role"]) => {
    const prevPlayers = mockPlayers;
    setMockPlayers((prev) => prev.map((p) => (p.id === playerId ? { ...p, role: newRole } : p)));
    if (isAuthenticated) {
      updateProfile.mutate({ role: newRole }, { onError: () => { setMockPlayers(prevPlayers); } });
    }
  }, [mockPlayers, isAuthenticated, updateProfile]);

  const handleJerseySave = useCallback((playerId: string, newJersey: number) => {
    const prevPlayers = mockPlayers;
    setMockPlayers((prev) => prev.map((p) => (p.id === playerId ? { ...p, jersey: newJersey } : p)));
    if (isAuthenticated) {
      updateProfile.mutate({ jerseyNumber: newJersey }, { onError: () => { setMockPlayers(prevPlayers); } });
    }
  }, [mockPlayers, isAuthenticated, updateProfile]);

  // Player Detail View
  if (selectedPlayer) {
    const player = mockPlayers.find((p) => p.id === selectedPlayer);
    if (!player) return null;

    return (
      <ScreenContainer className="p-0" gradient glass>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={isDark ? "#FFF" : "#0066FF"} colors={["#0066FF"]} />}
        >
          <PlayerProfileHeader
            playerName={player.name}
            role={player.role}
            teamName={player.team}
            jerseyNumber={player.jersey}
            matchesPlayed={player.matchesPlayed}
            onNameSave={(newName) => handleNameSave(player.id, newName)}
            onRoleSave={(newRole) => handleRoleSave(player.id, newRole)}
            onJerseySave={(newJersey) => handleJerseySave(player.id, newJersey)}
          />
          <View className="px-4 pt-5 gap-5 pb-20">
            <TouchableOpacity onPress={() => handleAction(() => setSelectedPlayer(null))}>
              <Text className="text-[#0066FF] font-bold text-xs uppercase tracking-wider">← Back to Stats</Text>
            </TouchableOpacity>

            <GlassButton
              title="Compare with Another Player"
              variant="primary"
              icon="⚔️"
              onPress={() => handleAction(() => (router as any).push("/head-to-head"))}
            />

            {player.battingStats && (
              <GlassCard intensity="high" padding="lg" radius="xl" className="gap-4" blurAmount={24} staggerIndex={0}>
                <LiquidGlassOverlay variant="sheen" speed={0.6} intensity={0.4} />
                <Text className="text-base sm:text-lg font-extrabold text-foreground tracking-tight uppercase">🏏 Batting Statistics</Text>
                <View className="gap-3">
                  {[
                    { label: "Total Runs", value: player.battingStats.runs, color: "#0066FF" },
                    { label: "Average", value: isFinite(player.battingStats.average) ? player.battingStats.average.toFixed(2) : "0.00", color: "#34C759" },
                    { label: "Strike Rate", value: isFinite(player.battingStats.strikeRate) ? player.battingStats.strikeRate.toFixed(1) : "0.0", color: "#FF9F0A" },
                    { label: "Fours", value: player.battingStats.fours, color: "#5E5CE6" },
                    { label: "Sixes", value: player.battingStats.sixes, color: "#FF3B30" },
                    { label: "Highest Score", value: player.battingStats.highestScore, color: "#0066FF" },
                  ].map((stat) => (
                    <StatRow
                      key={stat.label}
                      label={stat.label}
                      value={stat.value}
                      valueColor={stat.color}
                      valueSize="base"
                    />
                  ))}
                </View>
              </GlassCard>
            )}

            {player.bowlingStats && (
              <GlassCard intensity="high" padding="lg" radius="xl" className="gap-4" blurAmount={24} staggerIndex={1}>
                <LiquidGlassOverlay variant="sheen" speed={0.6} intensity={0.4} />
                <Text className="text-base sm:text-lg font-extrabold text-foreground tracking-tight uppercase">⚾ Bowling Statistics</Text>
                <View className="gap-3">
                  {[
                    { label: "Wickets Taken", value: player.bowlingStats.wickets, color: "#FF3B30" },
                    { label: "Runs Conceded", value: player.bowlingStats.runs, color: "#86868B" },
                    { label: "Economy Rate", value: isFinite(player.bowlingStats.economyRate) ? player.bowlingStats.economyRate.toFixed(2) : "0.00", color: "#34C759" },
                    { label: "Bowling Average", value: isFinite(player.bowlingStats.average) ? player.bowlingStats.average.toFixed(2) : "0.00", color: "#0066FF" },
                    { label: "Best Figures", value: player.bowlingStats.bestFigures, color: "#FF9F0A" },
                  ].map((stat) => (
                    <StatRow
                      key={stat.label}
                      label={stat.label}
                      value={stat.value}
                      valueColor={stat.color}
                      valueSize="base"
                    />
                  ))}
                </View>
              </GlassCard>
            )}
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  // Main Stats List
  return (
    <ScreenContainer gradient glass>
      <ScrollView style={{ flex: 1, width: "100%", height: "100%" }} contentContainerStyle={{ flexGrow: 1, minHeight: "100%", paddingBottom }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={isDark ? "#FFF" : "#0066FF"} colors={["#0066FF"]} />}
      >
        <View className={`flex-1 ${r.isPhone ? "gap-4" : "gap-5"} p-5`}>
          <View className="pt-2 pb-1">
            <Text className={`${r.isPhone ? "text-2xl sm:text-3xl" : "text-4xl"} font-extrabold text-foreground tracking-tight`}>Statistics</Text>
            <Text className={`${r.isPhone ? "text-xs sm:text-sm" : "text-base"} font-semibold text-muted mt-0.5`}>Player career stats and achievements</Text>
          </View>

          {/* Head-to-Head CTA */}
          <GlassCard intensity="high" glowColor="#10B981" padding="md" radius="xl" gradientBorder className="flex-row items-center gap-3"
            onPress={() => handleAction(() => (router as any).push("/head-to-head"))} blurAmount={24}
          >
            <View className="w-10 h-10 rounded-full bg-[#10B981]/15 items-center justify-center">
              <Text className="text-xl">⚔️</Text>
            </View>
            <View className="flex-1">
              <Text className="text-xs sm:text-sm font-bold text-[#F9FAFB]">Compare Players</Text>
              <Text className="text-[10px] font-semibold text-[#9CA3AF]">Head-to-head statistics comparison</Text>
            </View>
            <Text className="text-base text-[#9CA3AF]">›</Text>
          </GlassCard>

          {/* Glass Search Bar */}
          <GlassSearchBar placeholder="Search players..." value={searchQuery} onChangeText={setSearchQuery} />

          {/* Mobile Horizontal Role Filter Bar */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {[
              { id: "all", label: "All Players" },
              { id: "batsman", label: "Batsmen" },
              { id: "bowler", label: "Bowlers" },
              { id: "all-rounder", label: "All-Rounders" },
            ].map((tab) => {
              const active = roleFilter === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  onPress={() => handleAction(() => setRoleFilter(tab.id as any))}
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

          <GlassCard intensity="high" glowColor="#10B981" padding="xl" radius="xl" className="items-center gap-2" blurAmount={24} staggerIndex={0}>
            <LiquidGlassOverlay color="#10B981" variant="sheen" speed={0.7} intensity={0.5} />
            <View className="items-center gap-0.5">
              <Text className="text-4xl sm:text-5xl font-black text-[#10B981] tracking-tight tabular-nums">{filteredPlayers.length}</Text>
              <Text className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">Players in Roster</Text>
            </View>
          </GlassCard>

          <View className="gap-3">
            <Text className="text-base sm:text-lg font-extrabold text-foreground tracking-tight uppercase">Top Performers</Text>
            <FlatList
              data={filteredPlayers}
              renderItem={({ item, index }) => (
                <PlayerStatsCard
                  playerId={item.id}
                  playerName={item.name}
                  role={item.role}
                  matchesPlayed={item.matchesPlayed}
                  battingStats={item.battingStats}
                  bowlingStats={item.bowlingStats}
                  onPress={() => handleAction(() => setSelectedPlayer(item.id))}
                  staggerIndex={1 + index}
                />
              )}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              contentContainerStyle={{ gap: 12 }}
              ListEmptyComponent={
                <GlassCard intensity="subtle" padding="xl" radius="xl" className="items-center gap-2" blurAmount={16}>
                  <Text className="text-sm font-semibold text-muted">No players found</Text>
                  <Text className="text-xs text-muted">Try a different search or role filter</Text>
                </GlassCard>
              }
            />
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
