/**
 * Leagues Screen - Premium tournament management with enhanced glass effects
 * 
 * Design: Apple-inspired glassmorphism, linear.app clean lists
 * - Floating glass league cards with backdrop blur
 * - Premium create form with glass inputs
 * - Animated section transitions
 * - Fixtures & Results view
 * - Team registration and roster management
 * - Organizer dashboard
 */
import { ScrollView, Text, View, TouchableOpacity, RefreshControl, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useState, useCallback, useMemo } from "react";
import * as Haptics from "expo-haptics";

import { LeagueCard } from "@/components/league-card";
import { LeagueStandings } from "@/components/league-standings";
import { LeagueFixtures, type LeagueFixture } from "@/components/league-fixtures";
import { LeagueTeams, type LeagueTeam } from "@/components/league-teams";
import { OrganizerDashboard } from "@/components/organizer-dashboard";
import { GlassCard } from "@/components/ui/glass-card";
import { LiquidGlassOverlay } from "@/components/ui/liquid-glass-overlay";
import { GlassInput } from "@/components/ui/glass-input";
import { PillSelector } from "@/components/ui/pill-selector";
import { GlassButton } from "@/components/ui/glass-button";
import { useResponsive } from "@/hooks/use-responsive";
import { useScrollPadding } from "@/hooks/use-scroll-padding";
import { useThemeContext } from "@/lib/theme-provider";
import { trpc } from "@/lib/trpc";
import { useAuthContext } from "@/lib/auth-context";

type LeagueView = "list" | "create" | "detail" | "organizer";

interface League {
  id: string;
  name: string;
  format: "round-robin" | "knockout" | "group-stage";
  totalTeams: number;
  matchesPlayed: number;
  matchesRemaining: number;
  startDate: string;
  venues: string[];
  umpires: string[];
}

export default function LeaguesScreen() {
  const { paddingBottom } = useScrollPadding();
  const r = useResponsive();
  const { colorScheme } = useThemeContext();
  const isDark = colorScheme === "dark";
  const { isAuthenticated } = useAuthContext();
  const [refreshing, setRefreshing] = useState(false);
  const [activeView, setActiveView] = useState<LeagueView>("list");
  const [selectedLeague, setSelectedLeague] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [leagueName, setLeagueName] = useState("");
  const [selectedFormat, setSelectedFormat] = useState<"round-robin" | "knockout" | "group-stage">("round-robin");
  const [numTeams, setNumTeams] = useState("");

  // Fetch leagues from backend
  const { data: apiLeagues } = trpc.leagues.list.useQuery({ limit: 50, offset: 0 }, {
    staleTime: 30_000, retry: 1, enabled: isAuthenticated,
  });
  const createLeagueMutation = trpc.leagues.create.useMutation();

  const [mockLeagues, setMockLeagues] = useState<League[]>([
    { id: "league1", name: "Summer Cricket League 2026", format: "round-robin", totalTeams: 8, matchesPlayed: 12, matchesRemaining: 16, startDate: "Jun 2026", venues: ["Central Park Ground", "Riverside Stadium"], umpires: ["Richard Kettleborough", "Aleem Dar"] },
    { id: "league2", name: "City Championship", format: "knockout", totalTeams: 16, matchesPlayed: 4, matchesRemaining: 12, startDate: "Jul 2026", venues: ["City Stadium"], umpires: ["Kumar Dharmasena"] },
  ]);

  // Merge API leagues with mock data
  const allLeagues = [
    ...(apiLeagues?.map((l: any) => {
      // Map backend format strings to frontend union type
      let displayFormat: "round-robin" | "knockout" | "group-stage" = "round-robin";
      const rawFormat = String(l.format || "").toLowerCase();
      if (rawFormat === "knockout") displayFormat = "knockout";
      else if (rawFormat === "league" || rawFormat === "round-robin") displayFormat = "round-robin";
      return {
        id: `api_${l.id}`,
        name: l.name,
        format: displayFormat,
        totalTeams: l.numberOfTeams || 4,
        matchesPlayed: 0,
        matchesRemaining: 0,
        startDate: l.createdAt ? new Date(l.createdAt).toLocaleDateString() : "TBD",
        venues: [] as string[],
        umpires: [] as string[],
      };
    }) || []),
    ...mockLeagues,
  ];

  const [mockFixtures] = useState<LeagueFixture[]>([
    { id: "f1", round: 1, team1: "Thunder Warriors", team2: "Phoenix Rising", date: "Jul 10", status: "completed", score1: "142/5", score2: "138/7", result: "Thunder Warriors won by 4 runs", manOfTheMatch: "Rohit Sharma" },
    { id: "f2", round: 1, team1: "Dragon Force", team2: "Eagle Squad", date: "Jul 11", status: "completed", score1: "98/10", score2: "101/3", result: "Eagle Squad won by 7 wickets" },
    { id: "f3", round: 2, team1: "Thunder Warriors", team2: "Dragon Force", date: "Jul 15", status: "scheduled", venue: "Central Park Ground" },
    { id: "f4", round: 2, team1: "Phoenix Rising", team2: "Eagle Squad", date: "Jul 16", status: "scheduled", venue: "Riverside Stadium" },
    { id: "f5", round: 3, team1: "Thunder Warriors", team2: "Eagle Squad", date: "Jul 20", status: "live", venue: "City Stadium" },
  ]);

  const [mockTeams, setMockTeams] = useState<LeagueTeam[]>([
    { id: "t1", name: "Thunder Warriors", shortName: "TW", players: [
      { id: "tp1", name: "Rohit Sharma", role: "batsman", battingStyle: "right-handed", jerseyNumber: 45, isCaptain: true, status: "active" },
      { id: "tp2", name: "Virat Kohli", role: "batsman", battingStyle: "right-handed", jerseyNumber: 18, status: "active" },
      { id: "tp3", name: "Jasprit Bumrah", role: "bowler", bowlingStyle: "right-arm-fast", jerseyNumber: 93, isViceCaptain: true, status: "active" },
      { id: "tp4", name: "MS Dhoni", role: "wicket-keeper", jerseyNumber: 7, isKeeper: true, status: "active" },
      { id: "tp5", name: "Sachin Tendulkar", role: "batsman", jerseyNumber: 10, status: "active" },
      { id: "tp6", name: "New Player", role: "all-rounder", status: "pending" },
    ], captainName: "Rohit Sharma", viceCaptainName: "Jasprit Bumrah", matchesPlayed: 5, wins: 4, losses: 1 },
    { id: "t2", name: "Phoenix Rising", shortName: "PR", players: [
      { id: "tp7", name: "Steve Smith", role: "batsman", isCaptain: true, status: "active" },
      { id: "tp8", name: "Pat Cummins", role: "bowler", isViceCaptain: true, status: "active" },
      { id: "tp9", name: "Alex Carey", role: "wicket-keeper", isKeeper: true, status: "active" },
    ], captainName: "Steve Smith", viceCaptainName: "Pat Cummins", matchesPlayed: 5, wins: 3, losses: 2 },
    { id: "t3", name: "Dragon Force", shortName: "DF", players: [
      { id: "tp10", name: "Kane Williamson", role: "batsman", isCaptain: true, status: "active" },
      { id: "tp11", name: "Trent Boult", role: "bowler", status: "active" },
    ], captainName: "Kane Williamson", matchesPlayed: 5, wins: 3, losses: 2 },
  ]);

  const [mockStandings] = useState<{ name: string; played: number; won: number; lost: number; pts: number; nrr: number }[]>([
    { name: "Thunder Warriors", played: 5, won: 4, lost: 1, pts: 8, nrr: 0.45 },
    { name: "Phoenix Rising", played: 5, won: 3, lost: 2, pts: 6, nrr: 0.32 },
    { name: "Dragon Force", played: 5, won: 3, lost: 2, pts: 6, nrr: -0.15 },
    { name: "Eagle Squad", played: 5, won: 2, lost: 3, pts: 4, nrr: -0.28 },
  ]);

  const [leagueCategory, setLeagueCategory] = useState<"all" | "active" | "upcoming" | "completed">("all");

  const filteredLeagues = useMemo(() => {
    if (leagueCategory === "all") return allLeagues;
    if (leagueCategory === "active") return allLeagues.filter(l => l.matchesPlayed > 0 && l.matchesRemaining > 0);
    if (leagueCategory === "upcoming") return allLeagues.filter(l => l.matchesPlayed === 0);
    if (leagueCategory === "completed") return allLeagues.filter(l => l.matchesRemaining === 0);
    return allLeagues;
  }, [allLeagues, leagueCategory]);

  const handleAction = useCallback(async (cb: () => void) => {
    if (Platform.OS !== "web") await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    cb();
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    setRefreshing(false);
  }, []);

  const T = { title: r.isPhone ? "text-2xl sm:text-3xl" : "text-4xl", section: r.isPhone ? "text-base sm:text-lg" : "text-xl" };

  const league = selectedLeague ? allLeagues.find(l => l.id === selectedLeague) : null;

  // ──── CREATE FORM VIEW ────
  if (showCreateForm) {
    return (
      <ScreenContainer gradient glass>
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
        <ScrollView style={{ flex: 1, width: "100%", height: "100%" }} contentContainerStyle={{ flexGrow: 1, minHeight: "100%", paddingBottom }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={isDark ? "#FFF" : "#0066FF"} colors={["#0066FF"]} />}
        >
          <View className={`flex-1 ${r.isPhone ? "gap-4" : "gap-5"}`}>
            <View className="pt-2 pb-1">
              <Text className={`${T.title} font-extrabold text-foreground tracking-tight`}>Create League</Text>
              <Text className={`${r.isPhone ? "text-xs sm:text-sm" : "text-base"} font-semibold text-muted mt-0.5`}>Set up a new tournament</Text>
            </View>
            <GlassCard intensity="high" padding="xl" radius="xl" className="gap-5" blurAmount={24} staggerIndex={0}>
              <GlassInput label="League Name" placeholder="Enter league name" value={leagueName} onChangeText={setLeagueName} icon="🏆" />
              <View className="gap-2">
                <Text className="text-xs font-bold text-foreground uppercase tracking-wider">Tournament Format</Text>
                <PillSelector
                  selected={selectedFormat}
                  onSelect={setSelectedFormat}
                  options={[
                    { id: "round-robin" as const, label: "Round-Robin" },
                    { id: "knockout" as const, label: "Knockout" },
                    { id: "group-stage" as const, label: "Group Stage" },
                  ]}
                  compact
                />
              </View>
              <GlassInput label="Number of Teams" placeholder="Enter number of teams" value={numTeams} onChangeText={setNumTeams} keyboardType="numeric" icon="👥" />
            </GlassCard>
            <View className="flex-row gap-3">
              <GlassButton title="Cancel" variant="secondary" flex onPress={() => handleAction(() => { setShowCreateForm(false); setLeagueName(""); })} />
              <GlassButton title="Create League" variant="primary" flex onPress={() => handleAction(async () => {
                if (!leagueName.trim()) { alert("Please enter a league name"); return; }
                const newLeague: League = { id: `league${Date.now()}`, name: leagueName.trim(), format: selectedFormat, totalTeams: parseInt(numTeams) || 4, matchesPlayed: 0, matchesRemaining: 0, startDate: new Date().toLocaleDateString(), venues: [], umpires: [] };
                setMockLeagues(prev => [...prev, newLeague]);
                // Persist to backend if authenticated
                if (isAuthenticated) {
                  try {
                    await createLeagueMutation.mutateAsync({
                      name: leagueName.trim(),
                      format: selectedFormat === "group-stage" ? "league" : selectedFormat,
                      matchFormat: "T20",
                      numberOfTeams: parseInt(numTeams) || 4,
                      description: undefined,
                    });
                  } catch (e) {
                    console.warn("[Leagues] API persistence failed:", e);
                  }
                }
                alert(`League "${leagueName}" created!`); setShowCreateForm(false); setLeagueName(""); setNumTeams("");
              })} />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      </ScreenContainer>
    );
  }

  // ──── ORGANIZER DASHBOARD VIEW ────
  if (activeView === "organizer" && league) {
    return (
      <ScreenContainer gradient glass>
        <ScrollView style={{ flex: 1, width: "100%", height: "100%" }} contentContainerStyle={{ flexGrow: 1, minHeight: "100%", paddingBottom }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={isDark ? "#FFF" : "#0066FF"} colors={["#0066FF"]} />}
        >
          <View className="flex-1 p-5 gap-5">
            <TouchableOpacity onPress={() => handleAction(() => setActiveView("detail"))}>
              <Text className="text-[#0066FF] font-bold text-xs uppercase tracking-wider">← Back to League</Text>
            </TouchableOpacity>
            <OrganizerDashboard
              leagueName={league.name}
              format={league.format}
              totalTeams={mockTeams.length}
              totalMatches={mockFixtures.length}
              completedMatches={mockFixtures.filter(f => f.status === "completed").length}
              teams={mockStandings}
              upcomingMatches={mockFixtures.filter(f => f.status === "scheduled").map(f => ({ team1: f.team1, team2: f.team2, date: f.date, venue: f.venue }))}
              recentResults={mockFixtures.filter(f => f.status === "completed").map(f => ({ team1: f.team1, team2: f.team2, score1: f.score1 || "0/0", score2: f.score2 || "0/0", result: f.result || "" }))}
              venues={league.venues}
              umpires={league.umpires}
              onAddFixture={() => handleAction(() => alert("Add Fixture dialog would open"))}
              onManageTeams={() => handleAction(() => alert("Team management would open"))}
              onManageVenues={() => {}}
              onManageUmpires={() => {}}
              onBroadcast={(msg) => handleAction(() => alert(`Broadcast sent: "${msg}"`))}
              onViewFixtures={() => handleAction(() => setActiveView("detail"))}
              onViewStandings={() => handleAction(() => setActiveView("detail"))}
            />
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  // ──── LEAGUE DETAIL VIEW ────
  if (selectedLeague) {
    return (
      <ScreenContainer gradient glass>
        <ScrollView style={{ flex: 1, width: "100%", height: "100%" }} contentContainerStyle={{ flexGrow: 1, minHeight: "100%", paddingBottom }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={isDark ? "#FFF" : "#0066FF"} colors={["#0066FF"]} />}
        >
          <View className="flex-1 gap-5 p-5">
            <View className="flex-row items-center justify-between">
              <TouchableOpacity onPress={() => handleAction(() => { setSelectedLeague(null); setActiveView("list"); })}>
                <Text className="text-[#0066FF] font-bold text-xs uppercase tracking-wider">← Back to Leagues</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="bg-[#5E5CE6]/10 rounded-full px-3 py-1.5"
                onPress={() => handleAction(() => setActiveView("organizer"))}
              >
                <Text className="text-[#5E5CE6] text-[10px] font-extrabold uppercase tracking-wider">🎯 Dashboard</Text>
              </TouchableOpacity>
            </View>

            <View className="gap-1">
              <Text className="text-2xl font-extrabold text-foreground tracking-tight">{league?.name}</Text>
              <Text className="text-xs font-semibold text-muted capitalize">{league?.format?.replace("-", " ")} • {league?.totalTeams} teams • {league?.startDate}</Text>
            </View>

            {/* League Progress */}
            <GlassCard intensity="high" padding="lg" radius="xl" className="gap-4" blurAmount={24} staggerIndex={1}>
              <Text className="text-base font-extrabold text-foreground uppercase tracking-wide">League Progress</Text>
              <View className="flex-row gap-4">
                <View className="flex-1"><Text className="text-[10px] font-bold text-muted uppercase tracking-wider">Matches Played</Text><Text className="text-xl sm:text-2xl font-black text-[#0066FF] tracking-tight">{league?.matchesPlayed}</Text></View>
                <View className="flex-1"><Text className="text-[10px] font-bold text-muted uppercase tracking-wider">Remaining</Text><Text className="text-xl sm:text-2xl font-black text-[#0066FF] tracking-tight">{league?.matchesRemaining}</Text></View>
                <View className="flex-1"><Text className="text-[10px] font-bold text-muted uppercase tracking-wider">Teams</Text><Text className="text-xl sm:text-2xl font-black text-[#34C759] tracking-tight">{league?.totalTeams}</Text></View>
              </View>
            </GlassCard>

            {/* Standings */}
            <View className="gap-3">
              <Text className="text-base font-extrabold text-foreground tracking-tight uppercase">Standings</Text>
              <GlassCard intensity="high" padding="none" radius="xl" className="overflow-hidden" blurAmount={20} staggerIndex={2}>
                <LeagueStandings teams={mockStandings.map((t, i) => ({
                  rank: i + 1,
                  teamId: `t${i}`,
                  teamName: t.name,
                  played: t.played,
                  won: t.won,
                  lost: t.lost,
                  points: t.pts,
                  nrr: t.nrr,
                }))} />
              </GlassCard>
            </View>

            {/* Fixtures & Results */}
            <View className="gap-3">
              <Text className="text-base font-extrabold text-foreground tracking-tight uppercase">Fixtures & Results</Text>
              <LeagueFixtures
                fixtures={mockFixtures}
                leagueName={league?.name}
                onMatchPress={(f) => handleAction(() => alert(`${f.team1} vs ${f.team2}: ${f.result || f.status}`))}
                onAddFixture={() => alert("Add Fixture dialog")}
                organizerMode
              />
            </View>

            {/* Teams & Rosters */}
            <View className="gap-3">
              <Text className="text-base font-extrabold text-foreground tracking-tight uppercase">Teams</Text>
              <LeagueTeams
                teams={mockTeams}
                organizerMode
                onAddPlayer={(teamId) => handleAction(() => alert(`Add player to team ${teamId}`))}
                onRemovePlayer={(teamId, playerId) => handleAction(() => {
                  setMockTeams(prev => prev.map(t => ({ ...t, players: t.players.filter(p => p.id !== playerId) })));
                })}
                onAssignCaptain={(teamId, playerId) => handleAction(() => {
                  setMockTeams(prev => prev.map(t => t.id === teamId ? { ...t, players: t.players.map(p => ({ ...p, isCaptain: p.id === playerId })), captainName: t.players.find(p => p.id === playerId)?.name } : t));
                })}
                onAssignViceCaptain={(teamId, playerId) => handleAction(() => {
                  setMockTeams(prev => prev.map(t => t.id === teamId ? { ...t, players: t.players.map(p => ({ ...p, isViceCaptain: p.id === playerId })), viceCaptainName: t.players.find(p => p.id === playerId)?.name } : t));
                })}
                onAssignKeeper={(teamId, playerId) => handleAction(() => {
                  setMockTeams(prev => prev.map(t => t.id === teamId ? { ...t, players: t.players.map(p => ({ ...p, isKeeper: p.id === playerId })) } : t));
                })}
                onApproveJoin={(teamId, playerId) => handleAction(() => {
                  setMockTeams(prev => prev.map(t => t.id === teamId ? { ...t, players: t.players.map(p => p.id === playerId ? { ...p, status: "active" as const } : p) } : t));
                })}
                onRejectJoin={(teamId, playerId) => handleAction(() => {
                  setMockTeams(prev => prev.map(t => t.id === teamId ? { ...t, players: t.players.filter(p => p.id !== playerId) } : t));
                })}
              />
            </View>
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  // ──── MAIN LEAGUES LIST ────
  return (
    <ScreenContainer gradient glass>
      <ScrollView style={{ flex: 1, width: "100%", height: "100%" }} contentContainerStyle={{ flexGrow: 1, minHeight: "100%", paddingBottom }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={isDark ? "#FFF" : "#0066FF"} colors={["#0066FF"]} />}
      >
        <View className="flex-1 gap-5 p-5">
          <View className="pt-2 pb-1">
            <Text className={`${T.title} font-extrabold text-foreground tracking-tight`}>Leagues</Text>
            <Text className={`${r.isPhone ? "text-xs sm:text-sm" : "text-base"} font-semibold text-muted mt-0.5`}>Browse and manage tournaments</Text>
          </View>

          <GlassCard intensity="high" glowColor="#10B981" padding="lg" radius="xl" gradientBorder
            className="items-center" onPress={() => handleAction(() => setShowCreateForm(true))}
            blurAmount={30} staggerIndex={0}
          >
            <LiquidGlassOverlay color="#10B981" variant="sheen" speed={0.8} intensity={0.6} />
            <View className="w-12 h-12 rounded-full bg-[#10B981]/15 items-center justify-center mb-2">
              <Text className="text-xl">🏆</Text>
            </View>
            <Text className="text-[#F9FAFB] font-bold text-base">Create New League</Text>
            <Text className="text-[#9CA3AF] text-xs font-semibold mt-0.5">Set up a tournament with custom rules</Text>
          </GlassCard>

          {/* Mobile Horizontal Filter Bar */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {[
              { id: "all", label: "All Leagues" },
              { id: "active", label: "Active" },
              { id: "upcoming", label: "Upcoming" },
              { id: "completed", label: "Completed" },
            ].map((tab) => {
              const active = leagueCategory === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  onPress={() => handleAction(() => setLeagueCategory(tab.id as any))}
                  className={`px-3.5 py-1.5 rounded-full border ${
                    active ? "bg-[#10B981] border-[#10B981]" : "bg-[#11201A] border-white/10"
                  }`}
                >
                  <Text className={`text-[11px] font-bold ${active ? "text-[#06120E]" : "text-[#9CA3AF]"}`}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View className="gap-3">
            <Text className="text-base sm:text-lg font-extrabold text-foreground tracking-tight uppercase">My Leagues</Text>
            {filteredLeagues.map((item, index) => (
              <LeagueCard
                key={item.id}
                id={item.id}
                name={item.name}
                format={item.format === "group-stage" ? "group" : item.format}
                totalTeams={item.totalTeams}
                matchesPlayed={item.matchesPlayed}
                matchesRemaining={item.matchesRemaining}
                startDate={item.startDate}
                onPress={() => { setSelectedLeague(item.id); setActiveView("detail"); }}
                staggerIndex={1 + index}
              />
            ))}
          </View>

          <View className="gap-3">
            <Text className="text-base sm:text-lg font-extrabold text-foreground tracking-tight uppercase">Featured</Text>
            <GlassCard intensity="subtle" padding="lg" radius="xl" blurAmount={16} staggerIndex={2}>
              <Text className="text-xs font-semibold text-muted">No featured leagues available</Text>
            </GlassCard>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
