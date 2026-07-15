import { View, Text, ScrollView, FlatList } from "react-native";
import { useColors } from "@/hooks/use-colors";

export interface StandingsTeam {
  rank: number;
  teamId: string;
  teamName: string;
  played: number;
  won: number;
  lost: number;
  points: number;
  nrr: number;
}

export interface LeagueStandingsProps {
  teams: StandingsTeam[];
}

/**
 * League Standings Component - Displays league table
 */
export function LeagueStandings({ teams }: LeagueStandingsProps) {
  const colors = useColors();

  const renderTeamRow = ({ item }: { item: StandingsTeam }) => (
    <View className="flex-row items-center gap-3 py-3 border-b border-border px-4">
      <View className="w-6 items-center">
        <Text className="text-sm font-semibold text-muted">{item.rank}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-sm font-semibold text-foreground">{item.teamName}</Text>
      </View>
      <View className="flex-row gap-4">
        <View className="items-center">
          <Text className="text-xs text-muted">P</Text>
          <Text className="text-sm font-semibold text-foreground">{item.played}</Text>
        </View>
        <View className="items-center">
          <Text className="text-xs text-muted">W</Text>
          <Text className="text-sm font-semibold text-success">{item.won}</Text>
        </View>
        <View className="items-center">
          <Text className="text-xs text-muted">L</Text>
          <Text className="text-sm font-semibold text-error">{item.lost}</Text>
        </View>
        <View className="items-center">
          <Text className="text-xs text-muted">Pts</Text>
          <Text className="text-sm font-semibold text-primary">{item.points}</Text>
        </View>
        <View className="items-center">
          <Text className="text-xs text-muted">NRR</Text>
          <Text className="text-sm font-semibold text-foreground">{item.nrr.toFixed(2)}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View className="bg-surface rounded-xl overflow-hidden">
      {/* Header Row */}
      <View className="flex-row items-center gap-3 py-3 bg-primary px-4">
        <View className="w-6 items-center">
          <Text className="text-xs font-semibold text-background">#</Text>
        </View>
        <View className="flex-1">
          <Text className="text-xs font-semibold text-background">Team</Text>
        </View>
        <View className="flex-row gap-4">
          <View className="items-center">
            <Text className="text-xs font-semibold text-background">P</Text>
          </View>
          <View className="items-center">
            <Text className="text-xs font-semibold text-background">W</Text>
          </View>
          <View className="items-center">
            <Text className="text-xs font-semibold text-background">L</Text>
          </View>
          <View className="items-center">
            <Text className="text-xs font-semibold text-background">Pts</Text>
          </View>
          <View className="items-center">
            <Text className="text-xs font-semibold text-background">NRR</Text>
          </View>
        </View>
      </View>

      {/* Team Rows */}
      <FlatList
        data={teams}
        renderItem={renderTeamRow}
        keyExtractor={(item) => item.teamId}
        scrollEnabled={false}
      />
    </View>
  );
}
