import { View, Text } from "react-native";
import { GlassCard } from "@/components/ui/glass-card";

export interface LeagueCardProps {
  id: string;
  name: string;
  format: "round-robin" | "knockout" | "group";
  totalTeams: number;
  matchesPlayed: number;
  matchesRemaining: number;
  startDate: string;
  onPress?: () => void;
}

/**
 * League Card Component - Displays league information with glassmorphism
 * Uses GlassCard's spring press animation when onPress is provided.
 */
export function LeagueCard({
  id,
  name,
  format,
  totalTeams,
  matchesPlayed,
  matchesRemaining,
  startDate,
  onPress,
}: LeagueCardProps) {

  return (
    <GlassCard
      intensity="medium"
      padding="md"
      className="gap-3"
      onPress={onPress}
    >
      <View className="flex-row justify-between items-start">
        <View className="flex-1">
          <Text className="text-lg font-semibold text-foreground">{name}</Text>
          <Text className="text-sm text-muted capitalize">{format} • {totalTeams} teams</Text>
        </View>
        <View className="bg-primary rounded-full px-3 py-1">
          <Text className="text-xs font-semibold text-background">{format.toUpperCase()}</Text>
        </View>
      </View>

      <View className="flex-row gap-4">
        <View className="flex-1">
          <Text className="text-xs text-muted">Matches Played</Text>
          <Text className="text-lg font-semibold text-foreground">{matchesPlayed}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-xs text-muted">Remaining</Text>
          <Text className="text-lg font-semibold text-foreground">{matchesRemaining}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-xs text-muted">Start Date</Text>
          <Text className="text-sm font-semibold text-foreground">{startDate}</Text>
        </View>
      </View>
    </GlassCard>
  );
}
