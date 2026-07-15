import { ScrollView, Text, View, TouchableOpacity, FlatList } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useState } from "react";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";
import { PlayerStatsCard } from "@/components/player-stats-card";
import { PlayerProfileHeader } from "@/components/player-profile-header";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassHeader } from "@/components/ui/glass-header";
import { LiquidGlassOverlay } from "@/components/ui/liquid-glass-overlay";

/**
 * Stats Screen - View player statistics and achievements with glassmorphism
 */
export default function StatsScreen() {
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);

  // Mock player data
  const mockPlayers = [
    {
      id: "p1",
      name: "Rohit Sharma",
      role: "batsman" as const,
      team: "Team A",
      jersey: 45,
      matchesPlayed: 12,
      battingStats: {
        runs: 580,
        average: 48.33,
        strikeRate: 142.5,
        fours: 28,
        sixes: 12,
        highestScore: 89,
      },
    },
    {
      id: "p2",
      name: "Jasprit Bumrah",
      role: "bowler" as const,
      team: "Team A",
      jersey: 93,
      matchesPlayed: 12,
      bowlingStats: {
        wickets: 18,
        runs: 245,
        economyRate: 6.8,
        average: 13.6,
        bestFigures: "4/28",
      },
    },
    {
      id: "p3",
      name: "Virat Kohli",
      role: "all-rounder" as const,
      team: "Team B",
      jersey: 18,
      matchesPlayed: 12,
      battingStats: {
        runs: 625,
        average: 52.08,
        strikeRate: 138.2,
        fours: 32,
        sixes: 8,
        highestScore: 95,
      },
      bowlingStats: {
        wickets: 3,
        runs: 142,
        economyRate: 7.1,
        average: 47.33,
        bestFigures: "2/31",
      },
    },
  ];

  if (selectedPlayer) {
    const player = mockPlayers.find((p) => p.id === selectedPlayer);
    if (!player) return null;

    return (
      <ScreenContainer className="p-0">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <PlayerProfileHeader
            playerName={player.name}
            role={player.role}
            teamName={player.team}
            jerseyNumber={player.jersey}
            matchesPlayed={player.matchesPlayed}
          />

          <View className="p-6 gap-6">
            <TouchableOpacity
              onPress={async () => {
                if (Platform.OS !== "web") {
                  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                setSelectedPlayer(null);
              }}
            >
              <Text className="text-primary font-semibold">← Back to Stats</Text>
            </TouchableOpacity>

            {/* Batting Stats - Glass Card */}
            {player.battingStats && (
              <GlassCard intensity="medium" padding="md" className="gap-4">
                <LiquidGlassOverlay variant="sheen" speed={0.6} />
                <Text className="text-lg font-semibold text-foreground">Batting Statistics</Text>
                <View className="gap-3">
                  <View className="flex-row justify-between">
                    <Text className="text-sm text-muted">Total Runs</Text>
                    <Text className="text-lg font-semibold text-foreground">{player.battingStats.runs}</Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-sm text-muted">Average</Text>
                    <Text className="text-lg font-semibold text-foreground">{player.battingStats.average.toFixed(2)}</Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-sm text-muted">Strike Rate</Text>
                    <Text className="text-lg font-semibold text-foreground">{player.battingStats.strikeRate.toFixed(1)}</Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-sm text-muted">Fours</Text>
                    <Text className="text-lg font-semibold text-foreground">{player.battingStats.fours}</Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-sm text-muted">Sixes</Text>
                    <Text className="text-lg font-semibold text-foreground">{player.battingStats.sixes}</Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-sm text-muted">Highest Score</Text>
                    <Text className="text-lg font-semibold text-foreground">{player.battingStats.highestScore}</Text>
                  </View>
                </View>
              </GlassCard>
            )}

            {/* Bowling Stats - Glass Card */}
            {player.bowlingStats && (
              <GlassCard intensity="medium" padding="md" className="gap-4">
                <LiquidGlassOverlay variant="sheen" speed={0.6} />
                <Text className="text-lg font-semibold text-foreground">Bowling Statistics</Text>
                <View className="gap-3">
                  <View className="flex-row justify-between">
                    <Text className="text-sm text-muted">Wickets Taken</Text>
                    <Text className="text-lg font-semibold text-foreground">{player.bowlingStats.wickets}</Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-sm text-muted">Runs Conceded</Text>
                    <Text className="text-lg font-semibold text-foreground">{player.bowlingStats.runs}</Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-sm text-muted">Economy Rate</Text>
                    <Text className="text-lg font-semibold text-foreground">{player.bowlingStats.economyRate.toFixed(2)}</Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-sm text-muted">Bowling Average</Text>
                    <Text className="text-lg font-semibold text-foreground">{player.bowlingStats.average.toFixed(2)}</Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-sm text-muted">Best Figures</Text>
                    <Text className="text-lg font-semibold text-foreground">{player.bowlingStats.bestFigures}</Text>
                  </View>
                </View>
              </GlassCard>
            )}
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 gap-6">
          <GlassHeader title="Statistics" subtitle="Player career stats and achievements" size="md" animated />

          <GlassCard intensity="high" glowColor="#F97316" padding="lg" className="items-center gap-4">
            <LiquidGlassOverlay color="#F97316" variant="sheen" speed={0.7} />
            <View className="items-center gap-2">
              <Text className="text-5xl font-bold text-primary">3</Text>
              <Text className="text-sm text-muted">Players in Database</Text>
            </View>
          </GlassCard>

          <View className="gap-3">
            <Text className="text-lg font-semibold text-foreground">Top Performers</Text>
            <FlatList
              data={mockPlayers}
              renderItem={({ item }) => (
                <PlayerStatsCard
                  playerId={item.id}
                  playerName={item.name}
                  role={item.role}
                  matchesPlayed={item.matchesPlayed}
                  battingStats={item.battingStats}
                  bowlingStats={item.bowlingStats}
                  onPress={() => setSelectedPlayer(item.id)}
                />
              )}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              contentContainerStyle={{ gap: 12 }}
            />
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

