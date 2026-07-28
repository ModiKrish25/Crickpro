/**
 * Stats Screen - Premium Player Statistics & Leaderboards (CrickPro MLS UI)
 * 
 * Design: High-contrast stat cards, role filter pills, search bar,
 * leaderboard badges (🥇 #1, 🥈 #2, 🥉 #3), and head-to-head comparison link.
 */
import { ScrollView, Text, View, TouchableOpacity, RefreshControl, Platform } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useState, useCallback, useMemo } from "react";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { PlayerStatsCard } from "@/components/player-stats-card";
import { PlayerProfileHeader } from "@/components/player-profile-header";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassSearchBar } from "@/components/ui/glass-search-bar";
import { GlassButton } from "@/components/ui/glass-button";
import { useResponsive } from "@/hooks/use-responsive";
import { useScrollPadding } from "@/hooks/use-scroll-padding";
import { useThemeContext } from "@/lib/theme-provider";
import { trpc } from "@/lib/trpc";
import { useAuthContext } from "@/lib/auth-context";

type MockPlayer = {
  id: string;
  name: string;
  role: "batsman" | "bowler" | "all-rounder";
  team: string;
  jersey: number;
  matchesPlayed: number;
  rank?: number;
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
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "batsman" | "bowler" | "all-rounder">("all");
  const [refreshing, setRefreshing] = useState(false);

  const [mockPlayers, setMockPlayers] = useState<MockPlayer[]>([
    { id: "p1", name: "Rohit Sharma", role: "batsman", team: "Thunder Warriors", jersey: 45, matchesPlayed: 14, rank: 1,
      battingStats: { runs: 680, average: 52.3, strikeRate: 148.5, fours: 34, sixes: 18, highestScore: 98 } },
    { id: "p2", name: "Virat Kohli", role: "batsman", team: "Phoenix Rising", jersey: 18, matchesPlayed: 14, rank: 2,
      battingStats: { runs: 625, average: 52.08, strikeRate: 138.2, fours: 32, sixes: 10, highestScore: 95 } },
    { id: "p3", name: "Jasprit Bumrah", role: "bowler", team: "Thunder Warriors", jersey: 93, matchesPlayed: 14, rank: 1,
      bowlingStats: { wickets: 24, runs: 285, economyRate: 6.2, average: 11.8, bestFigures: "5/18" } },
    { id: "p4", name: "Hardik Pandya", role: "all-rounder", team: "Thunder Warriors", jersey: 33, matchesPlayed: 12, rank: 3,
      battingStats: { runs: 340, average: 34.0, strikeRate: 162.4, fours: 18, sixes: 14, highestScore: 62 },
      bowlingStats: { wickets: 12, runs: 210, economyRate: 7.8, average: 17.5, bestFigures: "3/24" } },
    { id: "p5", name: "Rashid Khan", role: "bowler", team: "Phoenix Rising", jersey: 19, matchesPlayed: 13, rank: 2,
      bowlingStats: { wickets: 21, runs: 310, economyRate: 6.5, average: 14.7, bestFigures: "4/20" } },
  ]);

  const filteredPlayers = useMemo(() => {
    let result = mockPlayers;
    if (roleFilter !== "all") {
      result = result.filter(p => p.role === roleFilter);
    }
    if (searchQuery.trim()) {
      result = result.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.team.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return result;
  }, [mockPlayers, roleFilter, searchQuery]);

  const handleNav = useCallback(async (path: string) => {
    if (Platform.OS !== "web") await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(path as any);
  }, [router]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    setRefreshing(false);
  }, []);

  // Detailed Player Profile View
  if (selectedPlayer) {
    const player = mockPlayers.find((p) => p.id === selectedPlayer);
    if (!player) return null;

    return (
      <ScreenContainer className="p-0" gradient glass>
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: paddingBottom + 24 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#10B981" />}
        >
          <PlayerProfileHeader
            playerName={player.name}
            role={player.role}
            teamName={player.team}
            jerseyNumber={player.jersey}
            matchesPlayed={player.matchesPlayed}
          />

          <View className="px-4 pt-4 gap-4">
            <TouchableOpacity onPress={() => setSelectedPlayer(null)} className="self-start">
              <Text className="text-emerald-400 font-extrabold text-xs uppercase tracking-wider">← Back to Player Roster</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleNav("/head-to-head")}
              className="bg-emerald-500 py-3 rounded-xl flex-row items-center justify-center gap-2"
            >
              <Text className="text-black text-sm font-extrabold">⚔️ Compare Player Head-to-Head</Text>
            </TouchableOpacity>

            {/* Batting Stats Card */}
            {player.battingStats && (
              <GlassCard intensity="heavy" padding="lg" radius="xl" className="bg-[#121622] border-white/15 gap-3">
                <Text className="text-base font-black text-white uppercase tracking-wider">🏏 Batting Statistics</Text>
                <View className="flex-row flex-wrap gap-3 pt-1">
                  {[
                    { label: "RUNS", val: player.battingStats.runs, color: "text-emerald-400" },
                    { label: "AVG", val: player.battingStats.average, color: "text-blue-400" },
                    { label: "STRIKE RATE", val: player.battingStats.strikeRate, color: "text-amber-400" },
                    { label: "HIGHEST", val: player.battingStats.highestScore, color: "text-purple-400" },
                    { label: "4s / 6s", val: `${player.battingStats.fours} / ${player.battingStats.sixes}`, color: "text-white" },
                  ].map((s) => (
                    <View key={s.label} className="w-[47%] bg-black/40 p-3 rounded-xl border border-white/5 gap-0.5">
                      <Text className="text-[10px] font-extrabold text-slate-400">{s.label}</Text>
                      <Text className={`text-xl font-black ${s.color}`}>{s.val}</Text>
                    </View>
                  ))}
                </View>
              </GlassCard>
            )}

            {/* Bowling Stats Card */}
            {player.bowlingStats && (
              <GlassCard intensity="heavy" padding="lg" radius="xl" className="bg-[#121622] border-white/15 gap-3">
                <Text className="text-base font-black text-white uppercase tracking-wider">⚾ Bowling Statistics</Text>
                <View className="flex-row flex-wrap gap-3 pt-1">
                  {[
                    { label: "WICKETS", val: player.bowlingStats.wickets, color: "text-amber-400" },
                    { label: "ECONOMY", val: player.bowlingStats.economyRate, color: "text-emerald-400" },
                    { label: "AVERAGE", val: player.bowlingStats.average, color: "text-blue-400" },
                    { label: "BEST FIGURES", val: player.bowlingStats.bestFigures, color: "text-purple-400" },
                  ].map((s) => (
                    <View key={s.label} className="w-[47%] bg-black/40 p-3 rounded-xl border border-white/5 gap-0.5">
                      <Text className="text-[10px] font-extrabold text-slate-400">{s.label}</Text>
                      <Text className={`text-xl font-black ${s.color}`}>{s.val}</Text>
                    </View>
                  ))}
                </View>
              </GlassCard>
            )}
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer gradient>
      <ScrollView
        style={{ flex: 1, width: "100%" }}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: paddingBottom + 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#10B981" />}
      >
        <View className="flex-1 gap-5 pt-2">
          
          {/* HEADER */}
          <View className="flex-row items-center justify-between px-1">
            <View className="gap-0.5">
              <Text className="text-3xl font-black text-white tracking-tight">Player Roster</Text>
              <Text className="text-xs font-semibold text-slate-400">Career Statistics & Leaderboards</Text>
            </View>
            <TouchableOpacity
              onPress={() => handleNav("/head-to-head")}
              className="bg-emerald-500/20 border border-emerald-500/40 rounded-xl px-3 py-1.5 flex-row items-center gap-1 active:opacity-80"
            >
              <Text className="text-emerald-400 text-xs font-black">⚔️ Compare</Text>
            </TouchableOpacity>
          </View>

          {/* SEARCH BAR */}
          <GlassSearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search player name or team..."
          />

          {/* ROLE FILTER PILLS */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 2 }}>
            {[
              { id: "all", label: "👥 All Players" },
              { id: "batsman", label: "🏏 Batsmen" },
              { id: "bowler", label: "⚾ Bowlers" },
              { id: "all-rounder", label: "⚡ All-Rounders" },
            ].map((tab) => {
              const active = roleFilter === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setRoleFilter(tab.id as any);
                  }}
                  className={`px-4 py-2 rounded-xl border ${active ? 'bg-emerald-500 border-emerald-400' : 'bg-white/5 border-white/10'}`}
                >
                  <Text className={`text-xs font-black ${active ? 'text-black' : 'text-slate-300'}`}>{tab.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* PLAYER CARDS LIST */}
          <View className="gap-3">
            {filteredPlayers.map((p, idx) => (
              <GlassCard
                key={p.id}
                intensity="heavy"
                radius="xl"
                padding="md"
                className="bg-[#121622]/90 border-white/15 gap-3"
                onPress={() => setSelectedPlayer(p.id)}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-3">
                    {/* Rank Badge */}
                    <View className="w-9 h-9 rounded-full bg-emerald-500/20 border border-emerald-500/30 items-center justify-center">
                      <Text className="text-xs font-black text-emerald-400">
                        {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}
                      </Text>
                    </View>
                    <View>
                      <Text className="text-base font-black text-white">{p.name}</Text>
                      <Text className="text-[11px] font-semibold text-slate-400">{p.team} • #{p.jersey} • {p.role.toUpperCase()}</Text>
                    </View>
                  </View>

                  <View className="bg-white/10 px-2.5 py-1 rounded-md">
                    <Text className="text-[10px] font-extrabold text-slate-300">{p.matchesPlayed} M</Text>
                  </View>
                </View>

                {/* Key Stat Badges */}
                <View className="flex-row items-center justify-between bg-black/40 p-2.5 rounded-xl border border-white/5">
                  {p.battingStats && (
                    <View>
                      <Text className="text-[9px] font-extrabold text-slate-400">RUNS</Text>
                      <Text className="text-base font-black text-emerald-400">{p.battingStats.runs}</Text>
                    </View>
                  )}
                  {p.battingStats && (
                    <View>
                      <Text className="text-[9px] font-extrabold text-slate-400">STRIKE RATE</Text>
                      <Text className="text-base font-black text-amber-400">{p.battingStats.strikeRate}</Text>
                    </View>
                  )}
                  {p.bowlingStats && (
                    <View>
                      <Text className="text-[9px] font-extrabold text-slate-400">WICKETS</Text>
                      <Text className="text-base font-black text-blue-400">{p.bowlingStats.wickets}</Text>
                    </View>
                  )}
                  {p.bowlingStats && (
                    <View>
                      <Text className="text-[9px] font-extrabold text-slate-400">ECON</Text>
                      <Text className="text-base font-black text-purple-400">{p.bowlingStats.economyRate}</Text>
                    </View>
                  )}
                </View>
              </GlassCard>
            ))}
          </View>

        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
