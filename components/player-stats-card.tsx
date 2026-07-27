import { View, Text } from "react-native";
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
  staggerIndex?: number;
}

export function PlayerStatsCard({
  playerName,
  role,
  matchesPlayed,
  battingStats,
  bowlingStats,
  onPress,
  staggerIndex = -1,
}: PlayerStatsCardProps) {
  return (
    <GlassCard intensity="medium" padding="md" radius="xl" className="gap-3" onPress={onPress} staggerIndex={staggerIndex}>
      <View className="flex-row justify-between items-start">
        <View className="flex-1">
          <Text className="text-lg font-bold text-foreground tracking-tight">{playerName}</Text>
          <Text className="text-sm text-muted capitalize">{role} • {matchesPlayed} matches</Text>
        </View>
        <View className="bg-[#0066FF]/10 rounded-full px-3 py-1">
          <Text className="text-[10px] font-semibold text-[#0066FF]">{role.toUpperCase()}</Text>
        </View>
      </View>

      {battingStats && (
        <View className="gap-2">
          <Text className="text-[10px] font-bold text-muted uppercase tracking-wider">Batting</Text>
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Text className="text-[10px] text-muted">Runs</Text>
              <Text className="text-lg font-bold text-[#0066FF]">{battingStats.runs}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-[10px] text-muted">Average</Text>
              <Text className="text-lg font-bold text-foreground">{battingStats.average.toFixed(2)}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-[10px] text-muted">SR</Text>
              <Text className="text-lg font-bold text-foreground">{battingStats.strikeRate.toFixed(1)}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-[10px] text-muted">HS</Text>
              <Text className="text-lg font-bold text-foreground">{battingStats.highestScore}</Text>
            </View>
          </View>
        </View>
      )}

      {bowlingStats && (
        <View className="gap-2">
          <Text className="text-[10px] font-bold text-muted uppercase tracking-wider">Bowling</Text>
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Text className="text-[10px] text-muted">Wickets</Text>
              <Text className="text-lg font-bold text-[#FF3B30]">{bowlingStats.wickets}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-[10px] text-muted">Economy</Text>
              <Text className="text-lg font-bold text-foreground">{bowlingStats.economyRate.toFixed(2)}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-[10px] text-muted">Average</Text>
              <Text className="text-lg font-bold text-foreground">{bowlingStats.average.toFixed(2)}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-[10px] text-muted">Best</Text>
              <Text className="text-lg font-bold text-[#34C759]">{bowlingStats.bestFigures}</Text>
            </View>
          </View>
        </View>
      )}
    </GlassCard>
  );
}
