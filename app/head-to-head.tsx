/**
 * Head-to-Head Statistics View - Compare two players side by side
 * 
 * Premium glassmorphism comparison view showing:
 * - Player profiles side by side
 * - Batting stats comparison
 * - Bowling stats comparison
 * - Head-to-head record from matches they've played together
 * 
 * Design: Apple-style split comparison, glass cards
 */
import { ScrollView, Text, View, TouchableOpacity, Platform } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useState, useMemo } from "react";
import * as Haptics from "expo-haptics";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassSearchBar } from "@/components/ui/glass-search-bar";
import { LiquidGlassOverlay } from "@/components/ui/liquid-glass-overlay";
import { useThemeContext } from "@/lib/theme-provider";
import { useScrollPadding } from "@/hooks/use-scroll-padding";

interface PlayerComparison {
  id: string;
  name: string;
  role: PlayerRole;
  team: string;
  matchesPlayed: number;
  battingStats?: {
    runs: number;
    average: number;
    strikeRate: number;
    fours: number;
    sixes: number;
    highestScore: number;
    innings: number;
    notOuts: number;
    fifties: number;
    centuries: number;
  };
  bowlingStats?: {
    wickets: number;
    runs: number;
    economyRate: number;
    average: number;
    bestFigures: string;
    overs: number;
    fiveWicketHauls: number;
  };
  headToHead?: {
    matchesAgainst: number;
    runsScored: number;
    wicketsTaken: number;
    highestScore: number;
    bestBowling: string;
  };
}

const MOCK_PLAYERS: PlayerComparison[] = [
  {
    id: "p1",
    name: "Rohit Sharma",
    role: "batsman",
    team: "Team A",
    matchesPlayed: 12,
    battingStats: { runs: 580, average: 48.33, strikeRate: 142.5, fours: 28, sixes: 12, highestScore: 89, innings: 12, notOuts: 0, fifties: 3, centuries: 0 },
  },
  {
    id: "p2",
    name: "Jasprit Bumrah",
    role: "bowler",
    team: "Team A",
    matchesPlayed: 12,
    bowlingStats: { wickets: 18, runs: 245, economyRate: 6.8, average: 13.6, bestFigures: "4/28", overs: 40, fiveWicketHauls: 0 },
  },
  {
    id: "p3",
    name: "Virat Kohli",
    role: "all-rounder",
    team: "Team B",
    matchesPlayed: 12,
    battingStats: { runs: 625, average: 52.08, strikeRate: 138.2, fours: 32, sixes: 8, highestScore: 95, innings: 12, notOuts: 0, fifties: 4, centuries: 0 },
    bowlingStats: { wickets: 3, runs: 142, economyRate: 7.1, average: 47.33, bestFigures: "2/31", overs: 20, fiveWicketHauls: 0 },
    headToHead: { matchesAgainst: 8, runsScored: 320, wicketsTaken: 1, highestScore: 78, bestBowling: "1/22" },
  },
  {
    id: "p4",
    name: "MS Dhoni",
    role: "wicket-keeper",
    team: "Team C",
    matchesPlayed: 15,
    battingStats: { runs: 450, average: 45.0, strikeRate: 135.0, fours: 20, sixes: 10, highestScore: 82, innings: 12, notOuts: 2, fifties: 2, centuries: 0 },
  },
];

type CompareField = {
  label: string;
  player1Value: string;
  player2Value: string;
  player1Color?: string;
  player2Color?: string;
  highlight?: "p1" | "p2" | "tie";
};

type PlayerRole = "batsman" | "bowler" | "all-rounder" | "wicket-keeper";

export default function HeadToHeadScreen() {
  const { paddingBottom } = useScrollPadding();
  const { colorScheme } = useThemeContext();
  const isDark = colorScheme === "dark";
  const [searchQuery, setSearchQuery] = useState("");
  const [player1Id, setPlayer1Id] = useState<string>("p3");
  const [player2Id, setPlayer2Id] = useState<string>("p1");
  const [showPlayerPicker, setShowPlayerPicker] = useState<1 | 2 | null>(null);

  const filteredPlayers = useMemo(() => {
    if (!searchQuery.trim()) return MOCK_PLAYERS;
    return MOCK_PLAYERS.filter(p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const player1 = MOCK_PLAYERS.find(p => p.id === player1Id);
  const player2 = MOCK_PLAYERS.find(p => p.id === player2Id);

  const handleAction = async (cb: () => void) => {
    if (Platform.OS !== "web") await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    cb();
  };

  const comparisonFields: CompareField[] = useMemo(() => {
    if (!player1 || !player2) return [];
    const fields: CompareField[] = [];

    // Matches
    fields.push({
      label: "Matches",
      player1Value: String(player1.matchesPlayed),
      player2Value: String(player2.matchesPlayed),
      highlight: player1.matchesPlayed > player2.matchesPlayed ? "p1" : player1.matchesPlayed < player2.matchesPlayed ? "p2" : "tie",
    });

    // Batting
    if (player1.battingStats || player2.battingStats) {
      const b1 = player1.battingStats || { runs: 0, average: 0, strikeRate: 0, fours: 0, sixes: 0, highestScore: 0, innings: 0, notOuts: 0, fifties: 0, centuries: 0 };
      const b2 = player2.battingStats || { runs: 0, average: 0, strikeRate: 0, fours: 0, sixes: 0, highestScore: 0, innings: 0, notOuts: 0, fifties: 0, centuries: 0 };
      fields.push({ label: "Total Runs", player1Value: String(b1.runs), player2Value: String(b2.runs), highlight: b1.runs > b2.runs ? "p1" : b1.runs < b2.runs ? "p2" : "tie" });
      fields.push({ label: "Average", player1Value: b1.average.toFixed(2), player2Value: b2.average.toFixed(2), highlight: b1.average > b2.average ? "p1" : b1.average < b2.average ? "p2" : "tie" });
      fields.push({ label: "Strike Rate", player1Value: b1.strikeRate.toFixed(1), player2Value: b2.strikeRate.toFixed(1), highlight: b1.strikeRate > b2.strikeRate ? "p1" : b1.strikeRate < b2.strikeRate ? "p2" : "tie" });
      fields.push({ label: "Highest Score", player1Value: String(b1.highestScore), player2Value: String(b2.highestScore), highlight: b1.highestScore > b2.highestScore ? "p1" : b1.highestScore < b2.highestScore ? "p2" : "tie" });
      fields.push({ label: "Fours / Sixes", player1Value: `${b1.fours}/${b1.sixes}`, player2Value: `${b2.fours}/${b2.sixes}` });
      fields.push({ label: "50s / 100s", player1Value: `${b1.fifties}/${b1.centuries}`, player2Value: `${b2.fifties}/${b2.centuries}` });
    }

    // Bowling
    if (player1.bowlingStats || player2.bowlingStats) {
      const bl1 = player1.bowlingStats || { wickets: 0, runs: 0, economyRate: 0, average: 0, bestFigures: "-", overs: 0, fiveWicketHauls: 0 };
      const bl2 = player2.bowlingStats || { wickets: 0, runs: 0, economyRate: 0, average: 0, bestFigures: "-", overs: 0, fiveWicketHauls: 0 };
      fields.push({ label: "Wickets", player1Value: String(bl1.wickets), player2Value: String(bl2.wickets), highlight: bl1.wickets > bl2.wickets ? "p1" : bl1.wickets < bl2.wickets ? "p2" : "tie" });
      fields.push({ label: "Economy", player1Value: bl1.economyRate.toFixed(2), player2Value: bl2.economyRate.toFixed(2), highlight: bl1.economyRate < bl2.economyRate ? "p1" : bl1.economyRate > bl2.economyRate ? "p2" : "tie" });
      fields.push({ label: "Bowling Avg", player1Value: bl1.average.toFixed(2), player2Value: bl2.average.toFixed(2), highlight: bl1.average < bl2.average ? "p1" : bl1.average > bl2.average ? "p2" : "tie" });
      fields.push({ label: "Best Figures", player1Value: bl1.bestFigures, player2Value: bl2.bestFigures });
      fields.push({ label: "5W Hauls", player1Value: String(bl1.fiveWicketHauls), player2Value: String(bl2.fiveWicketHauls), highlight: bl1.fiveWicketHauls > bl2.fiveWicketHauls ? "p1" : bl1.fiveWicketHauls < bl2.fiveWicketHauls ? "p2" : "tie" });
    }

    // Head-to-head
    if (player1.headToHead || player2.headToHead) {
      const h1 = player1.headToHead || { matchesAgainst: 0, runsScored: 0, wicketsTaken: 0, highestScore: 0, bestBowling: "-" };
      const h2 = player2.headToHead || { matchesAgainst: 0, runsScored: 0, wicketsTaken: 0, highestScore: 0, bestBowling: "-" };
      fields.push({ label: "Matches vs Each Other", player1Value: String(h1.matchesAgainst), player2Value: String(h2.matchesAgainst) });
      fields.push({ label: "Runs vs Each Other", player1Value: String(h1.runsScored), player2Value: String(h2.runsScored) });
      fields.push({ label: "Highest vs Each Other", player1Value: String(h1.highestScore), player2Value: String(h2.highestScore) });
      fields.push({ label: "Wickets vs Each Other", player1Value: String(h1.wicketsTaken), player2Value: String(h2.wicketsTaken) });
    }

    return fields;
  }, [player1, player2]);

  if (showPlayerPicker) {
    const selectingP1 = showPlayerPicker === 1;
    return (
      <ScreenContainer gradient glass>
        <View className="flex-1 p-5 gap-4">
          <TouchableOpacity onPress={() => handleAction(() => setShowPlayerPicker(null))}>
            <Text className="text-[#0066FF] font-semibold">← Back</Text>
          </TouchableOpacity>
          <Text className="text-xl font-bold text-foreground tracking-tight">
            Select Player {showPlayerPicker}
          </Text>
          <GlassSearchBar
            placeholder="Search players..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <ScrollView showsVerticalScrollIndicator={false}>
            <View className="gap-2">
              {filteredPlayers.map((p) => {
                const isSelected = selectingP1 ? p.id === player1Id : p.id === player2Id;
                const isOtherSelected = selectingP1 ? p.id === player2Id : p.id === player1Id;
                return (
                  <TouchableOpacity
                    key={p.id}
                    className={`rounded-2xl p-4 flex-row items-center gap-3 ${
                      isSelected
                        ? "bg-[#0066FF]"
                        : isOtherSelected
                          ? "bg-white/20 dark:bg-white/[0.03] opacity-40"
                          : "bg-white/50 dark:bg-white/[0.05] border border-white/30 dark:border-white/10"
                    }`}
                    disabled={isOtherSelected}
                    onPress={() => {
                      handleAction(() => {
                        if (selectingP1) setPlayer1Id(p.id);
                        else setPlayer2Id(p.id);
                        setShowPlayerPicker(null);
                        setSearchQuery("");
                      });
                    }}
                  >
                    <View className={`w-12 h-12 rounded-full items-center justify-center ${isSelected ? "bg-white/20" : "bg-[#0066FF]/10"}`}>
                      <Text className="text-xl font-bold text-foreground">{p.name[0]}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className={`font-bold ${isSelected ? "text-white" : "text-foreground"}`}>{p.name}</Text>
                      <Text className={`text-xs ${isSelected ? "text-white/70" : "text-muted"} capitalize`}>
                        {p.role} • {p.team} • {p.matchesPlayed} matches
                      </Text>
                    </View>
                    {isSelected && <Text className="text-white font-bold">✓</Text>}
                    {isOtherSelected && <Text className="text-muted text-xs">Already selected</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>
      </ScreenContainer>
    );
  }

  if (!player1 || !player2) return null;

  return (
    <ScreenContainer gradient glass>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom }} showsVerticalScrollIndicator={false}>
        <View className="flex-1 p-5 gap-5">
          {/* Header */}
          <View className="gap-1">
            <Text className="text-2xl font-bold text-foreground tracking-tight">⚔️ Head-to-Head</Text>
            <Text className="text-sm text-muted">Compare player statistics side by side</Text>
          </View>

          {/* Player selection cards */}
          <View className="flex-row gap-3">
            {/* Player 1 */}
            <TouchableOpacity
              className="flex-1 rounded-2xl p-4 items-center gap-2"
              style={{
                backgroundColor: isDark ? "rgba(0,102,255,0.12)" : "rgba(0,102,255,0.08)",
                borderColor: "#0066FF",
                borderWidth: 1,
              }}
              onPress={() => handleAction(() => { setSearchQuery(""); setShowPlayerPicker(1); })}
            >
              <View className="w-14 h-14 rounded-full bg-[#0066FF]/20 items-center justify-center">
                <Text className="text-2xl font-bold text-[#0066FF]">{player1.name[0]}</Text>
              </View>
              <Text className="text-sm font-bold text-foreground text-center" numberOfLines={1}>{player1.name}</Text>
              <Text className="text-[10px] text-muted capitalize">{player1.role} • {player1.team}</Text>
            </TouchableOpacity>

            {/* VS Badge */}
            <View className="items-center justify-center">
              <View className="w-10 h-10 rounded-full bg-[#FF3B30]/10 items-center justify-center">
                <Text className="text-[10px] font-bold text-[#FF3B30]">VS</Text>
              </View>
            </View>

            {/* Player 2 */}
            <TouchableOpacity
              className="flex-1 rounded-2xl p-4 items-center gap-2"
              style={{
                backgroundColor: isDark ? "rgba(255,59,48,0.12)" : "rgba(255,59,48,0.08)",
                borderColor: "#FF3B30",
                borderWidth: 1,
              }}
              onPress={() => handleAction(() => { setSearchQuery(""); setShowPlayerPicker(2); })}
            >
              <View className="w-14 h-14 rounded-full bg-[#FF3B30]/20 items-center justify-center">
                <Text className="text-2xl font-bold text-[#FF3B30]">{player2.name[0]}</Text>
              </View>
              <Text className="text-sm font-bold text-foreground text-center" numberOfLines={1}>{player2.name}</Text>
              <Text className="text-[10px] text-muted capitalize">{player2.role} • {player2.team}</Text>
            </TouchableOpacity>
          </View>

          {/* Comparison Table */}
          <GlassCard intensity="high" padding="none" radius="xl" className="overflow-hidden" blurAmount={24}>
            <View className="px-4 py-3 bg-[#0066FF]/10">
              <Text className="text-xs font-bold text-[#0066FF] uppercase tracking-wider">📊 Stats Comparison</Text>
            </View>
            <View className="px-4 py-1">
              {comparisonFields.map((field, idx) => (
                <View
                  key={field.label}
                  className={`flex-row items-center py-3 ${idx < comparisonFields.length - 1 ? "border-b border-white/10 dark:border-white/[0.06]" : ""}`}
                >
                  {/* Player 1 value */}
                  <Text
                    className={`flex-1 text-right text-sm font-bold ${
                      field.highlight === "p1"
                        ? "text-[#0066FF]"
                        : field.highlight === "tie"
                          ? "text-[#FF9F0A]"
                          : "text-foreground"
                    }`}
                  >
                    {field.player1Value}
                  </Text>
                  {/* Label */}
                  <Text className="w-24 text-center text-[10px] font-semibold text-muted uppercase">
                    {field.label}
                  </Text>
                  {/* Player 2 value */}
                  <Text
                    className={`flex-1 text-left text-sm font-bold ${
                      field.highlight === "p2"
                        ? "text-[#FF3B30]"
                        : field.highlight === "tie"
                          ? "text-[#FF9F0A]"
                          : "text-foreground"
                    }`}
                  >
                    {field.player2Value}
                  </Text>
                </View>
              ))}
            </View>
          </GlassCard>

          {/* Winner indicator */}
          {(() => {
            const p1Wins = comparisonFields.filter(f => f.highlight === "p1").length;
            const p2Wins = comparisonFields.filter(f => f.highlight === "p2").length;
            if (p1Wins === 0 && p2Wins === 0) return null;
            return (
              <GlassCard intensity="medium" padding="lg" radius="xl" className="items-center gap-2" glowColor={p1Wins >= p2Wins ? "#0066FF" : "#FF3B30"}>
                <LiquidGlassOverlay color={p1Wins >= p2Wins ? "#0066FF" : "#FF3B30"} variant="sheen" speed={0.6} intensity={0.3} />
                <Text className="text-lg font-bold text-foreground">🏆 Overall Winner</Text>
                <Text className={`text-2xl font-bold ${p1Wins >= p2Wins ? "text-[#0066FF]" : "text-[#FF3B30]"}`}>
                  {p1Wins >= p2Wins ? player1.name : player2.name}
                </Text>
                <Text className="text-xs text-muted">
                  {p1Wins} categories won vs {p2Wins} categories
                </Text>
              </GlassCard>
            );
          })()}

          {/* Info */}
          <Text className="text-xs text-muted text-center leading-5">
            Tap a player above to change the selection. Green numbers indicate the leader in each category.
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
