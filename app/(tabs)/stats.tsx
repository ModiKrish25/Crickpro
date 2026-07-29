/**
 * Stats Screen - Premium Player Statistics & Leaderboards
 * 
 * Design: Pitch dark emerald charcoal palette matching exact user theme
 * Active pills: Mint Green #10B981 / Gold #FBBF24 with dark text
 */
import { ScrollView, Text, View, TouchableOpacity, RefreshControl, Platform } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useState, useCallback, useMemo } from "react";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { PlayerProfileHeader } from "@/components/player-profile-header";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassSearchBar } from "@/components/ui/glass-search-bar";
import { useScrollPadding } from "@/hooks/use-scroll-padding";

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
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "batsman" | "bowler" | "all-rounder">("all");
  const [refreshing, setRefreshing] = useState(false);

  const [mockPlayers] = useState<MockPlayer[]>([
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
              <Text className="text-[#10B981] font-black text-xs uppercase tracking-wider">← Back to Player Roster</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleNav("/head-to-head")}
              className="bg-[#10B981] hover:bg-[#059669] py-3.5 rounded-xl flex-row items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95"
            >
              <Text className="text-[#050B08] text-sm font-black uppercase tracking-wider">⚔️ Compare Player Head-to-Head</Text>
            </TouchableOpacity>

            {/* Batting Stats Card */}
            {player.battingStats && (
              <GlassCard intensity="heavy" padding="lg" radius="xl" className="bg-[#0B1511] border-[#10B981]/20 gap-3">
                <Text className="text-base font-black text-white uppercase tracking-wider">🏏 Batting Statistics</Text>
                <View className="flex-row flex-wrap gap-3 pt-1">
                  {[
                    { label: "RUNS", val: player.battingStats.runs, color: "text-[#10B981]" },
                    { label: "AVG", val: player.battingStats.average, color: "text-white" },
                    { label: "STRIKE RATE", val: player.battingStats.strikeRate, color: "text-[#FBBF24]" },
                    { label: "HIGHEST", val: player.battingStats.highestScore, color: "text-[#10B981]" },
                    { label: "4s / 6s", val: `${player.battingStats.fours} / ${player.battingStats.sixes}`, color: "text-white" },
                  ].map((s) => (
                    <View key={s.label} className="w-[47%] bg-[#060D0A] p-3 rounded-xl border border-white/5 gap-0.5">
                      <Text className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{s.label}</Text>
                      <Text className={`text-xl font-black ${s.color}`}>{s.val}</Text>
                    </View>
                  ))}
                </View>
              </GlassCard>
            )}

            {/* Bowling Stats Card */}
            {player.bowlingStats && (
              <GlassCard intensity="heavy" padding="lg" radius="xl" className="bg-[#0B1511] border-[#10B981]/20 gap-3">
                <Text className="text-base font-black text-white uppercase tracking-wider">⚾ Bowling Statistics</Text>
                <View className="flex-row flex-wrap gap-3 pt-1">
                  {[
                    { label: "WICKETS", val: player.bowlingStats.wickets, color: "text-[#FBBF24]" },
                    { label: "ECONOMY", val: player.bowlingStats.economyRate, color: "text-[#10B981]" },
                    { label: "AVERAGE", val: player.bowlingStats.average, color: "text-white" },
                    { label: "BEST FIGURES", val: player.bowlingStats.bestFigures, color: "text-[#FBBF24]" },
                  ].map((s) => (
                    <View key={s.label} className="w-[47%] bg-[#060D0A] p-3 rounded-xl border border-white/5 gap-0.5">
                      <Text className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{s.label}</Text>
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
              className="bg-[#10B981]/20 border border-[#10B981]/40 rounded-xl px-3.5 py-2 flex-row items-center gap-1 active:scale-95"
            >
              <Text className="text-[#10B981] text-xs font-black">⚔️ Compare</Text>
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
                  className={`px-4 py-2.5 rounded-xl border flex-row items-center transition-all active:scale-95 ${
                    active
                      ? "bg-[#10B981] border-[#10B981] shadow-md shadow-emerald-500/30"
                      : "bg-[#0B1712] border-[#142820]"
                  }`}
                >
                  <Text className={`text-xs font-black ${active ? "text-[#050B08]" : "text-[#CBD5E1]"}`}>
                    {tab.label}
                  </Text>
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
                className="bg-[#0B1511]/95 border-[#10B981]/20 gap-3"
                onPress={() => setSelectedPlayer(p.id)}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-3">
                    {/* Rank Badge */}
                    <View className="w-9 h-9 rounded-full bg-[#10B981]/20 border border-[#10B981]/40 items-center justify-center">
                      <Text className="text-xs font-black text-[#10B981]">
                        {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}
                      </Text>
                    </View>
                    <View>
                      <Text className="text-base font-black text-white">{p.name}</Text>
                      <Text className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{p.team} • #{p.jersey} • {p.role.toUpperCase()}</Text>
                    </View>
                  </View>

                  <View className="bg-[#10B981]/20 border border-[#10B981]/40 px-2.5 py-1 rounded-md">
                    <Text className="text-[10px] font-black text-[#10B981]">{p.matchesPlayed} MATCHES</Text>
                  </View>
                </View>

                {/* Key Stat Badges */}
                <View className="flex-row items-center justify-between bg-[#060D0A] p-3 rounded-xl border border-white/5">
                  {p.battingStats && (
                    <View>
                      <Text className="text-[9px] font-black text-slate-400 uppercase tracking-wider">RUNS</Text>
                      <Text className="text-base font-black text-[#10B981]">{p.battingStats.runs}</Text>
                    </View>
                  )}
                  {p.battingStats && (
                    <View>
                      <Text className="text-[9px] font-black text-slate-400 uppercase tracking-wider">STRIKE RATE</Text>
                      <Text className="text-base font-black text-[#FBBF24]">{p.battingStats.strikeRate}</Text>
                    </View>
                  )}
                  {p.bowlingStats && (
                    <View>
                      <Text className="text-[9px] font-black text-slate-400 uppercase tracking-wider">WICKETS</Text>
                      <Text className="text-base font-black text-[#FBBF24]">{p.bowlingStats.wickets}</Text>
                    </View>
                  )}
                  {p.bowlingStats && (
                    <View>
                      <Text className="text-[9px] font-black text-slate-400 uppercase tracking-wider">ECON</Text>
                      <Text className="text-base font-black text-[#10B981]">{p.bowlingStats.economyRate}</Text>
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
