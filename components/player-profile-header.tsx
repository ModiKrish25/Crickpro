import { View, Text } from "react-native";
import { useColors } from "@/hooks/use-colors";

export interface PlayerProfileHeaderProps {
  playerName: string;
  role: "batsman" | "bowler" | "all-rounder";
  teamName: string;
  jerseyNumber: number;
  matchesPlayed: number;
}

/**
 * Player Profile Header Component
 */
export function PlayerProfileHeader({
  playerName,
  role,
  teamName,
  jerseyNumber,
  matchesPlayed,
}: PlayerProfileHeaderProps) {
  const colors = useColors();

  return (
    <View style={{ backgroundColor: colors.primary }} className="p-6 gap-4">
      <View className="flex-row items-end gap-4">
        <View className="w-16 h-16 rounded-full bg-background items-center justify-center">
          <Text className="text-3xl font-bold text-primary">{jerseyNumber}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-3xl font-bold text-background">{playerName}</Text>
          <Text className="text-sm text-background opacity-80">{teamName}</Text>
        </View>
      </View>

      <View className="flex-row gap-4">
        <View className="flex-1">
          <Text className="text-xs text-background opacity-80">Role</Text>
          <Text className="text-lg font-semibold text-background capitalize">{role}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-xs text-background opacity-80">Matches</Text>
          <Text className="text-lg font-semibold text-background">{matchesPlayed}</Text>
        </View>
      </View>
    </View>
  );
}
