/**
 * Matches & Leagues Screen - Premium Tournament Hub (Matches & Leagues Exact UI)
 * 
 * Design: Pitch dark emerald charcoal palette matching exact user screenshot mockup.
 */
import { ScrollView, Text, View, TouchableOpacity, RefreshControl, Platform } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useState, useCallback } from "react";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

import { LeagueStandings } from "@/components/league-standings";
import { LeagueFixtures, type LeagueFixture } from "@/components/league-fixtures";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassInput } from "@/components/ui/glass-input";
import { useScrollPadding } from "@/hooks/use-scroll-padding";
import { trpc } from "@/lib/trpc";
import { useAuthContext } from "@/lib/auth-context";

type MatchCategory = "all" | "live" | "leagues" | "fixtures" | "standings";

interface League {
  id: string;
  name: string;
  format: "round-robin" | "knockout" | "group-stage";
  totalTeams: number;
  matchesPlayed: number;
  matchesRemaining: number;
  startDate: string;
  venues: string[];
  status: "ACTIVE" | "UPCOMING" | "COMPLETED";
}

export default function LeaguesScreen() {
  const { paddingBottom } = useScrollPadding();
  const router = useRouter();
  const { isAuthenticated } = useAuthContext();
  const [refreshing, setRefreshing] = useState(false);
  const [category, setCategory] = useState<MatchCategory>("all");
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Form states
  const [leagueName, setLeagueName] = useState("");
  const [selectedFormat, setSelectedFormat] = useState<"round-robin" | "knockout" | "group-stage">("round-robin");

  // Fetch leagues from backend
  const { refetch } = trpc.leagues.list.useQuery({ limit: 50, offset: 0 }, {
    staleTime: 30_000, retry: 1, enabled: isAuthenticated,
  });

  const mockLeagues: League[] = [
    { id: "l1", name: "Summer T20 Championship 2026", format: "round-robin", totalTeams: 8, matchesPlayed: 14, matchesRemaining: 18, startDate: "Jun 15", venues: ["Central Park Ground", "Riverside Oval"], status: "ACTIVE" },
    { id: "l2", name: "National Premier Knockout", format: "knockout", totalTeams: 16, matchesPlayed: 6, matchesRemaining: 10, startDate: "Jul 01", venues: ["National Cricket Stadium"], status: "ACTIVE" },
    { id: "l3", name: "Corporate Masters Cup", format: "group-stage", totalTeams: 12, matchesPlayed: 0, matchesRemaining: 24, startDate: "Aug 10", venues: ["City Sports Club"], status: "UPCOMING" },
  ];

  const mockFixtures: LeagueFixture[] = [
    { id: "f1", round: 1, team1: "Thunder Warriors", team2: "Phoenix Rising", date: "TODAY 7:30 PM", status: "live", score1: "158/4 (16.4 ov)", score2: "134/6 (15.0 ov)", result: "Thunder Warriors need 25 runs in 20 balls", venue: "Central Park Stadium" },
    { id: "f2", round: 1, team1: "Toronto Titans", team2: "Vancouver Vipers", date: "TOMORROW 4:00 PM", status: "scheduled", venue: "Riverside Oval" },
    { id: "f3", round: 2, team1: "Mumbai Kings", team2: "Chennai Super", date: "YESTERDAY", status: "completed", score1: "186/5", score2: "182/8", result: "Mumbai Kings won by 4 runs", manOfTheMatch: "Rohit Sharma", venue: "National Stadium" },
  ];

  const mockStandingsTeams = [
    { rank: 1, teamId: "t1", teamName: "Thunder Warriors", played: 5, won: 4, lost: 1, points: 8, nrr: 1.45 },
    { rank: 2, teamId: "t2", teamName: "Phoenix Rising", played: 5, won: 3, lost: 2, points: 6, nrr: 0.82 },
    { rank: 3, teamId: "t3", teamName: "Dragon Force", played: 5, won: 2, lost: 3, points: 4, nrr: -0.34 },
    { rank: 4, teamId: "t4", teamName: "Eagle Squad", played: 5, won: 1, lost: 4, points: 2, nrr: -1.88 },
  ];

  const handleNav = useCallback(async (path: string) => {
    if (Platform.OS !== "web") await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(path as any);
  }, [router]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    if (isAuthenticated) await refetch();
    setTimeout(() => setRefreshing(false), 800);
  }, [isAuthenticated, refetch]);

  return (
    <ScreenContainer gradient>
      <ScrollView
        style={{ flex: 1, width: "100%" }}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: paddingBottom + 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#10B981" />}
      >
        <View className="flex-1 gap-5 pt-2">
          
          {/* HEADER (Exact User Screenshot Style) */}
          <View className="flex-row items-center justify-between px-1">
            <View className="gap-0.5">
              <Text className="text-3xl font-black text-white tracking-tight">Matches & Leagues</Text>
              <Text className="text-xs font-bold text-slate-400">Tournaments, Fixtures & Leaderboards</Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowCreateForm(!showCreateForm)}
              className="bg-[#10B981] hover:bg-[#059669] rounded-xl px-4 py-2 flex-row items-center gap-1.5 active:scale-95 shadow-lg shadow-emerald-500/20"
            >
              <Text className="text-[#050B08] text-sm font-black">+ Create</Text>
            </TouchableOpacity>
          </View>

          {/* CATEGORY SELECTOR TABS (Exact User Screenshot Style) */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 2 }}>
            {[
              { id: "all", label: "🔥 All Matches" },
              { id: "live", label: "🔴 Live & Recent" },
              { id: "leagues", label: "🏆 Tournaments" },
              { id: "fixtures", label: "📅 Fixtures" },
              { id: "standings", label: "📊 Standings" },
            ].map((tab) => {
              const active = category === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setCategory(tab.id as MatchCategory);
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

          {/* CREATE TOURNAMENT FORM */}
          {showCreateForm && (
            <GlassCard intensity="heavy" radius="xl" padding="lg" className="bg-[#0B1511] border-[#10B981]/30 gap-4">
              <Text className="text-lg font-black text-white">Create New Tournament</Text>
              
              <View className="gap-1.5">
                <Text className="text-xs font-extrabold text-slate-400">Tournament Name</Text>
                <GlassInput value={leagueName} onChangeText={setLeagueName} placeholder="e.g. Summer T20 Trophy 2026" />
              </View>

              <View className="gap-1.5">
                <Text className="text-xs font-extrabold text-slate-400">Format</Text>
                <View className="flex-row gap-2">
                  {[
                    { id: "round-robin", label: "Round Robin" },
                    { id: "knockout", label: "Knockout" },
                    { id: "group-stage", label: "Group Stage" },
                  ].map((fmt) => (
                    <TouchableOpacity
                      key={fmt.id}
                      onPress={() => setSelectedFormat(fmt.id as any)}
                      className={`flex-1 py-2 rounded-lg border items-center ${selectedFormat === fmt.id ? 'bg-[#10B981]/20 border-[#10B981]' : 'bg-black/30 border-white/10'}`}
                    >
                      <Text className={`text-xs font-bold ${selectedFormat === fmt.id ? 'text-[#10B981]' : 'text-slate-400'}`}>{fmt.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity
                onPress={() => {
                  alert("Tournament created successfully!");
                  setShowCreateForm(false);
                }}
                className="bg-[#10B981] py-3 rounded-xl items-center mt-2"
              >
                <Text className="text-[#050B08] font-black text-sm uppercase">Create Tournament</Text>
              </TouchableOpacity>
            </GlassCard>
          )}

          {/* TOURNAMENT CARDS SECTION (Exact User Screenshot Style) */}
          {(category === "all" || category === "leagues") && (
            <View className="gap-3">
              <Text className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">
                ACTIVE LEAGUES & TOURNAMENTS
              </Text>
              {mockLeagues.map((league) => (
                <GlassCard
                  key={league.id}
                  intensity="heavy"
                  radius="xl"
                  padding="md"
                  className="bg-[#0B1511]/95 border-[#10B981]/20 gap-3"
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2.5">
                      <View className="w-9 h-9 rounded-xl bg-[#10B981]/20 border border-[#10B981]/40 items-center justify-center">
                        <Text className="text-base">🏆</Text>
                      </View>
                      <View>
                        <Text className="text-lg font-black text-white tracking-tight">{league.name}</Text>
                        <Text className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">{league.format.toUpperCase()} • {league.totalTeams} TEAMS</Text>
                      </View>
                    </View>
                    <View className="bg-[#10B981]/15 border border-[#10B981]/40 px-3 py-1 rounded-md">
                      <Text className="text-[10px] font-black text-[#10B981] uppercase tracking-wider">{league.status}</Text>
                    </View>
                  </View>

                  {/* Inner Stats Bar (Exact Match with Image) */}
                  <View className="flex-row items-center justify-between bg-[#060D0A] p-3 rounded-xl border border-white/5">
                    <View>
                      <Text className="text-[10px] font-black text-slate-400 uppercase tracking-wider">PLAYED</Text>
                      <Text className="text-base font-black text-white">{league.matchesPlayed} Matches</Text>
                    </View>
                    <View>
                      <Text className="text-[10px] font-black text-slate-400 uppercase tracking-wider">REMAINING</Text>
                      <Text className="text-base font-black text-[#FBBF24]">{league.matchesRemaining} Matches</Text>
                    </View>
                    <View>
                      <Text className="text-[10px] font-black text-slate-400 uppercase tracking-wider">START DATE</Text>
                      <Text className="text-base font-black text-white">{league.startDate}</Text>
                    </View>
                  </View>
                </GlassCard>
              ))}
            </View>
          )}

          {/* FIXTURES & LIVE MATCHES SECTION */}
          {(category === "all" || category === "live" || category === "fixtures") && (
            <View className="gap-3">
              <Text className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Live & Scheduled Matches</Text>
              <LeagueFixtures fixtures={mockFixtures} onMatchPress={(f: LeagueFixture) => handleNav("/match/live")} />
            </View>
          )}

          {/* STANDINGS SECTION */}
          {(category === "all" || category === "standings") && (
            <View className="gap-3">
              <Text className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">League Points Table</Text>
              <LeagueStandings teams={mockStandingsTeams} />
            </View>
          )}

        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
