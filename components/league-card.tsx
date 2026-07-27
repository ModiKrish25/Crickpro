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
  staggerIndex?: number;
}

export function LeagueCard({
  name,
  format,
  totalTeams,
  matchesPlayed,
  matchesRemaining,
  startDate,
  onPress,
  staggerIndex = -1,
}: LeagueCardProps) {
  return (
    <GlassCard intensity="medium" padding="md" radius="xl" className="gap-3" onPress={onPress} staggerIndex={staggerIndex}>
      <View className="flex-row justify-between items-start">
        <View className="flex-1">
          <Text className="text-lg font-bold text-foreground tracking-tight">{name}</Text>
          <Text className="text-sm text-muted capitalize">{format} • {totalTeams} teams</Text>
        </View>
        <View className="bg-[#0066FF]/10 rounded-full px-3 py-1">
          <Text className="text-[10px] font-semibold text-[#0066FF]">{format.toUpperCase()}</Text>
        </View>
      </View>
      <View className="flex-row gap-4">
        <View className="flex-1">
          <Text className="text-[10px] text-muted">Matches</Text>
          <Text className="text-lg font-bold text-foreground">{matchesPlayed}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-[10px] text-muted">Remaining</Text>
          <Text className="text-lg font-bold text-foreground">{matchesRemaining}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-[10px] text-muted">Start Date</Text>
          <Text className="text-sm font-bold text-foreground">{startDate}</Text>
        </View>
      </View>
    </GlassCard>
  );
}
