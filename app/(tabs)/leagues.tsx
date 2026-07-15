import { ScrollView, Text, View, TouchableOpacity, FlatList, TextInput } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useState } from "react";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";
import { LeagueCard } from "@/components/league-card";
import { LeagueStandings } from "@/components/league-standings";
import { useColors } from "@/hooks/use-colors";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassHeader } from "@/components/ui/glass-header";
import { LiquidGlassOverlay } from "@/components/ui/liquid-glass-overlay";

/**
 * Leagues Screen - Browse and manage tournaments with glassmorphism
 */
export default function LeaguesScreen() {
  const router = useRouter();
  const colors = useColors();
  const [selectedLeague, setSelectedLeague] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [leagueName, setLeagueName] = useState("");
  const [selectedFormat, setSelectedFormat] = useState<"round-robin" | "knockout" | "group-stage">("round-robin");
  const [numTeams, setNumTeams] = useState("");

  // Mock data for demonstration
  const mockLeagues = [
    {
      id: "league1",
      name: "Summer Cricket League 2026",
      format: "round-robin" as const,
      totalTeams: 8,
      matchesPlayed: 12,
      matchesRemaining: 16,
      startDate: "Jun 2026",
    },
    {
      id: "league2",
      name: "City Championship",
      format: "knockout" as const,
      totalTeams: 16,
      matchesPlayed: 4,
      matchesRemaining: 12,
      startDate: "Jul 2026",
    },
  ];

  const mockStandings = [
    { rank: 1, teamId: "t1", teamName: "Thunder Warriors", played: 5, won: 4, lost: 1, points: 8, nrr: 0.45 },
    { rank: 2, teamId: "t2", teamName: "Phoenix Rising", played: 5, won: 3, lost: 2, points: 6, nrr: 0.32 },
    { rank: 3, teamId: "t3", teamName: "Dragon Force", played: 5, won: 3, lost: 2, points: 6, nrr: -0.15 },
    { rank: 4, teamId: "t4", teamName: "Eagle Squad", played: 5, won: 2, lost: 3, points: 4, nrr: -0.28 },
  ];

  const handleCreateLeague = async () => {
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (!leagueName.trim()) {
      alert("Please enter a league name");
      return;
    }
    alert(`League "${leagueName}" created successfully!`);
    setShowCreateForm(false);
    setLeagueName("");
  };

  const handleCancelCreate = async () => {
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowCreateForm(false);
    setLeagueName("");
  };

  if (showCreateForm) {
    return (
      <ScreenContainer className="p-6">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View className="flex-1 gap-6">
            <GlassHeader title="Create League" subtitle="Set up a new tournament" size="md" animated />

            <GlassCard intensity="medium" padding="lg" className="gap-4">
              <View className="gap-2">
                <Text className="text-sm font-semibold text-foreground">League Name</Text>
                <TextInput
                  className="border border-white/20 rounded-lg px-4 py-3 bg-white/5 text-foreground backdrop-blur"
                  placeholder="Enter league name"
                  value={leagueName}
                  onChangeText={setLeagueName}
                  placeholderTextColor={colors.muted}
                />
              </View>

              <View className="gap-2">
                <Text className="text-sm font-semibold text-foreground">Tournament Format</Text>
                <View className="gap-2">
                  {(["round-robin", "knockout", "group-stage"] as const).map((format) => (
                    <TouchableOpacity
                      key={format}
                      className={`border rounded-lg px-4 py-3 active:opacity-80 ${
                        selectedFormat === format
                          ? "bg-primary border-primary"
                          : "bg-white/5 border-white/20"
                      }`}
                      onPress={() => setSelectedFormat(format)}
                    >
                      <Text
                        className={`font-semibold ${
                          selectedFormat === format ? "text-background" : "text-foreground"
                        }`}
                      >
                        {format === "round-robin"
                          ? "Round-Robin"
                          : format === "knockout"
                            ? "Knockout"
                            : "Group Stage"}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View className="gap-2">
                <Text className="text-sm font-semibold text-foreground">Number of Teams</Text>
                <TextInput
                  className="border border-white/20 rounded-lg px-4 py-3 bg-white/5 text-foreground"
                  placeholder="Select number of teams"
                  value={numTeams}
                  onChangeText={setNumTeams}
                  keyboardType="numeric"
                  placeholderTextColor={colors.muted}
                />
              </View>
            </GlassCard>

            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 border border-white/20 rounded-lg py-3 items-center active:opacity-80"
                onPress={handleCancelCreate}
              >
                <Text className="text-foreground font-semibold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-primary rounded-lg py-3 items-center active:opacity-80"
                onPress={handleCreateLeague}
              >
                <Text className="text-background font-semibold">Create League</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  if (selectedLeague) {
    const league = mockLeagues.find((l) => l.id === selectedLeague);
    return (
      <ScreenContainer className="p-6">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View className="flex-1 gap-6">
            <TouchableOpacity
              onPress={async () => {
                if (Platform.OS !== "web") {
                  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                setSelectedLeague(null);
              }}
            >
              <Text className="text-primary font-semibold">← Back</Text>
            </TouchableOpacity>

            <View className="gap-2">
              <Text className="text-4xl font-bold text-foreground">{league?.name}</Text>
              <Text className="text-base text-muted capitalize">{league?.format} • {league?.totalTeams} teams</Text>
            </View>

            <GlassCard intensity="medium" padding="md" className="gap-3">
              <Text className="text-lg font-semibold text-foreground">League Progress</Text>
              <View className="flex-row gap-4">
                <View className="flex-1">
                  <Text className="text-xs text-muted">Matches Played</Text>
                  <Text className="text-2xl font-bold text-primary">{league?.matchesPlayed}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-muted">Remaining</Text>
                  <Text className="text-2xl font-bold text-primary">{league?.matchesRemaining}</Text>
                </View>
              </View>
            </GlassCard>

            <View className="gap-3">
              <Text className="text-lg font-semibold text-foreground">Standings</Text>
              <LeagueStandings teams={mockStandings} />
            </View>

            <View className="gap-3">
              <TouchableOpacity
                className="bg-primary rounded-lg py-3 items-center active:opacity-80"
                onPress={async () => {
                  if (Platform.OS !== "web") {
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  alert("Matches list would open here");
                }}
              >
                <Text className="text-background font-semibold">View Matches</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="border border-white/20 rounded-lg py-3 items-center active:opacity-80"
                onPress={async () => {
                  if (Platform.OS !== "web") {
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  alert("Team management would open here");
                }}
              >
                <Text className="text-foreground font-semibold">Manage Teams</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 gap-6">
          <GlassHeader title="Leagues" subtitle="Browse and manage tournaments" size="md" animated />

          <GlassCard
            intensity="high"
            glowColor="#8B5CF6"
            padding="md"
            className="items-center"
            onPress={async () => {
              if (Platform.OS !== "web") {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              setShowCreateForm(true);
            }}
          >
            <LiquidGlassOverlay color="#8B5CF6" variant="sheen" speed={0.8} />
            <Text className="text-foreground font-semibold text-lg">Create New League</Text>
          </GlassCard>

          <View className="gap-3">
            <Text className="text-lg font-semibold text-foreground">My Leagues</Text>
            {mockLeagues.length > 0 ? (
              <FlatList
                data={mockLeagues}
                renderItem={({ item }) => (
                  <LeagueCard
                    {...item}
                    onPress={() => setSelectedLeague(item.id)}
                  />
                )}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                contentContainerStyle={{ gap: 12 }}
              />
            ) : (
              <GlassCard intensity="subtle" padding="md" className="gap-3">
                <Text className="text-sm text-muted">No leagues yet</Text>
                <Text className="text-xs text-muted">Create or join a league to get started</Text>
              </GlassCard>
            )}
          </View>

          <View className="gap-3">
            <Text className="text-lg font-semibold text-foreground">Featured Leagues</Text>
            <GlassCard intensity="subtle" padding="md" className="gap-3">
              <Text className="text-sm text-muted">No featured leagues available</Text>
            </GlassCard>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

