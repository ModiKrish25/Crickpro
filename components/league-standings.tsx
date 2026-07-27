import { View, Text, FlatList } from "react-native";

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

export function LeagueStandings({ teams }: LeagueStandingsProps) {
  const renderTeamRow = ({ item }: { item: StandingsTeam }) => (
    <View className="flex-row items-center gap-3 py-3 border-b border-white/10 dark:border-white/[0.06] px-4">
      <View className="w-7 items-center">
        <View className={`w-7 h-7 rounded-full items-center justify-center ${
          item.rank <= 2 ? "bg-[#0066FF]/15" : "bg-white/50 dark:bg-white/[0.05]"
        }`}>
          <Text className={`text-xs font-bold ${item.rank <= 2 ? "text-[#0066FF]" : "text-muted"}`}>{item.rank}</Text>
        </View>
      </View>
      <View className="flex-1">
        <Text className="text-sm font-semibold text-foreground">{item.teamName}</Text>
      </View>
      <View className="flex-row gap-4">
        <View className="items-center"><Text className="text-[10px] text-muted">P</Text><Text className="text-sm font-semibold text-foreground">{item.played}</Text></View>
        <View className="items-center"><Text className="text-[10px] text-muted">W</Text><Text className="text-sm font-semibold text-[#34C759]">{item.won}</Text></View>
        <View className="items-center"><Text className="text-[10px] text-muted">L</Text><Text className="text-sm font-semibold text-[#FF3B30]">{item.lost}</Text></View>
        <View className="items-center"><Text className="text-[10px] text-muted">Pts</Text><Text className="text-sm font-semibold text-[#0066FF]">{item.points}</Text></View>
        <View className="items-center"><Text className="text-[10px] text-muted">NRR</Text><Text className="text-sm font-semibold text-foreground">{item.nrr.toFixed(2)}</Text></View>
      </View>
    </View>
  );

  return (
    <View className="rounded-2xl overflow-hidden bg-white/40 dark:bg-white/[0.03]">
      <View className="flex-row items-center gap-3 py-3 px-4" style={{ backgroundColor: "#0066FF" }}>
        <View className="w-7 items-center"><Text className="text-[10px] font-bold text-white">#</Text></View>
        <View className="flex-1"><Text className="text-[10px] font-bold text-white">Team</Text></View>
        <View className="flex-row gap-4">
          <View className="items-center"><Text className="text-[10px] font-bold text-white">P</Text></View>
          <View className="items-center"><Text className="text-[10px] font-bold text-white">W</Text></View>
          <View className="items-center"><Text className="text-[10px] font-bold text-white">L</Text></View>
          <View className="items-center"><Text className="text-[10px] font-bold text-white">Pts</Text></View>
          <View className="items-center"><Text className="text-[10px] font-bold text-white">NRR</Text></View>
        </View>
      </View>
      <FlatList data={teams} renderItem={renderTeamRow} keyExtractor={(item) => item.teamId} scrollEnabled={false} />
    </View>
  );
}
