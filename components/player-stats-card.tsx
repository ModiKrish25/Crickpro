import { View, Text, TouchableOpacity } from "react-native";
import { GlassCard } from "@/components/ui/glass-card";

export interface PlayerStatsCardProps {
  playerId: string;
  playerName: string;
  role: "batsman" | "bowler" | "all-rounder";
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
  onPress?: () => void;
}

/**
 * Player Stats Card Component - Displays player statistics with glassmorphism
 */
export function PlayerStatsCard({
  playerId,
  playerName,
  role,
  matchesPlayed,
  battingStats,
  bowlingStats,
  onPress,
}: PlayerStatsCardProps) {
  return (
    <GlassCard
      intensity="medium"
      padding="md"
      className="gap-3"
      onPress={onPress}
    >
        <View className="flex-row justify-between items-start">
          <View className="flex-1">
            <Text className="text-lg font-semibold text-foreground">{playerName}</Text>
            <Text className="text-sm text-muted capitalize">{role} • {matchesPlayed} matches</Text>
          </View>
          <View className="bg-primary rounded-full px-3 py-1">
            <Text className="text-xs font-semibold text-background">{role.toUpperCase()}</Text>
          </View>
        </View>

        {/* Batting Stats */}
        {battingStats && (
          <View className="gap-2">
            <Text className="text-xs font-semibold text-muted uppercase">Batting</Text>
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Text className="text-xs text-muted">Runs</Text>
                <Text className="text-lg font-semibold text-foreground">{battingStats.runs}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-xs text-muted">Average</Text>
                <Text className="text-lg font-semibold text-foreground">{battingStats.average.toFixed(2)}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-xs text-muted">SR</Text>
                <Text className="text-lg font-semibold text-foreground">{battingStats.strikeRate.toFixed(1)}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-xs text-muted">HS</Text>
                <Text className="text-lg font-semibold text-foreground">{battingStats.highestScore}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Bowling Stats */}
        {bowlingStats && (
          <View className="gap-2">
            <Text className="text-xs font-semibold text-muted uppercase">Bowling</Text>
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Text className="text-xs text-muted">Wickets</Text>
                <Text className="text-lg font-semibold text-foreground">{bowlingStats.wickets}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-xs text-muted">Economy</Text>
                <Text className="text-lg font-semibold text-foreground">{bowlingStats.economyRate.toFixed(2)}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-xs text-muted">Average</Text>
                <Text className="text-lg font-semibold text-foreground">{bowlingStats.average.toFixed(2)}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-xs text-muted">Best</Text>
                <Text className="text-lg font-semibold text-foreground">{bowlingStats.bestFigures}</Text>
              </View>
            </View>
          </View>
        )}
      </GlassCard>
  );
}
