/**
 * Match Creation Screen
 * Create a new match with full format options, team names, and configuration
 * Supports: T20, ODI, T10, The Hundred, Test, Custom overs
 */
import { ScrollView, Text, View, TouchableOpacity, TextInput, Platform } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";

const FORMAT_OPTIONS = [
  { id: "T20", label: "T20", overs: 20, description: "20 overs per side • ~3 hrs" },
  { id: "ODI", label: "ODI", overs: 50, description: "50 overs per side • ~8 hrs" },
  { id: "T10", label: "T10", overs: 10, description: "10 overs per side • ~1.5 hrs" },
  { id: "the_hundred", label: "The Hundred", overs: 100, description: "100 balls per side • ~2.5 hrs", noOvers: true },
  { id: "test", label: "Test", overs: 0, description: "Unlimited overs • Up to 5 days", noOvers: true },
  { id: "custom", label: "Custom", overs: 0, description: "Set your own rules", custom: true },
] as const;

type MatchFormat = "T20" | "ODI" | "T10" | "the_hundred" | "test" | "custom";

/**
 * Match Creation Screen
 * Complete form for setting up a new cricket match
 */
export default function CreateMatchScreen() {
  const router = useRouter();
  const colors = useColors();
  const [team1Name, setTeam1Name] = useState("");
  const [team2Name, setTeam2Name] = useState("");
  const [format, setFormat] = useState<MatchFormat>("T20");
  const [maxOvers, setMaxOvers] = useState("20");
  const [venue, setVenue] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [ballsPerOver, setBallsPerOver] = useState("6");
  const [playersPerSide, setPlayersPerSide] = useState("11");
  const [inningsCount, setInningsCount] = useState("1");

  const getOversForFormat = (fmt: MatchFormat): string => {
    switch (fmt) {
      case "T20": return "20";
      case "ODI": return "50";
      case "T10": return "10";
      case "the_hundred": return "100 (balls)";
      case "test": return "Unlimited";
      default: return maxOvers;
    }
  };

  const handleCreateMatch = async () => {
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const t1 = team1Name.trim() || "Team A";
    const t2 = team2Name.trim() || "Team B";

    if (t1 === t2) {
      alert("Team names must be different");
      return;
    }

    // Navigate to live match with all parameters
    router.push({
      pathname: "/match/live",
      params: {
        team1: t1,
        team2: t2,
        format: format,
        overs: format === "custom" ? maxOvers : String(getOversForFormat(format)),
        venue: venue.trim(),
        ballsPerOver: showAdvanced ? ballsPerOver : "6",
        playersPerSide: showAdvanced ? playersPerSide : "11",
        inningsCount: showAdvanced ? inningsCount : "1",
      },
    });
  };

  const handleCancel = async () => {
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  };

  return (
    <ScreenContainer className="p-6">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 gap-6">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-4xl font-bold text-foreground">Create Match</Text>
            <Text className="text-base text-muted">
              Set up a new cricket match
            </Text>
          </View>

          {/* Teams */}
          <View className="bg-surface rounded-xl p-4 gap-4 border border-border/50">
            <Text className="text-lg font-semibold text-foreground">🏏 Teams</Text>
            <View className="gap-2">
              <Text className="text-sm font-semibold text-muted">Team 1 (Batting First)</Text>
              <TextInput
                className="bg-background border border-border rounded-xl px-4 py-3.5 text-foreground"
                placeholder="Enter team 1 name"
                placeholderTextColor={colors.muted + "80"}
                value={team1Name}
                onChangeText={setTeam1Name}
                maxLength={30}
              />
            </View>
            <View className="gap-2">
              <Text className="text-sm font-semibold text-muted">Team 2 (Batting Second)</Text>
              <TextInput
                className="bg-background border border-border rounded-xl px-4 py-3.5 text-foreground"
                placeholder="Enter team 2 name"
                placeholderTextColor={colors.muted + "80"}
                value={team2Name}
                onChangeText={setTeam2Name}
                maxLength={30}
              />
            </View>
          </View>

          {/* Match Format */}
          <View className="bg-surface rounded-xl p-4 gap-4 border border-border/50">
            <Text className="text-lg font-semibold text-foreground">📋 Match Format</Text>
            <View className="flex-row gap-2 flex-wrap">
              {FORMAT_OPTIONS.map((fmt) => (
                <TouchableOpacity
                  key={fmt.id}
                  className={`rounded-xl px-4 py-3 active:opacity-80 ${
                    format === fmt.id
                      ? "bg-primary"
                      : "bg-background border border-border"
                  }`}
                  style={{ minWidth: "47%" }}
                  onPress={async () => {
                    if (Platform.OS !== "web") {
                      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    setFormat(fmt.id);
                    if (!fmt.custom && !fmt.noOvers) {
                      setMaxOvers(String(fmt.overs));
                    }
                  }}
                >
                  <Text className={`font-bold text-base ${
                    format === fmt.id ? "text-background" : "text-foreground"
                  }`}>
                    {fmt.label}
                  </Text>
                  <Text className={`text-xs mt-0.5 ${
                    format === fmt.id ? "text-background/80" : "text-muted"
                  }`}>
                    {fmt.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Custom Overs Input */}
            {format === "custom" && (
              <View className="gap-2">
                <Text className="text-sm font-semibold text-muted">Overs per side</Text>
                <TextInput
                  className="bg-background border border-border rounded-xl px-4 py-3.5 text-foreground"
                  placeholder="Enter max overs (e.g., 15)"
                  placeholderTextColor={colors.muted + "80"}
                  value={maxOvers}
                  onChangeText={setMaxOvers}
                  keyboardType="numeric"
                />
              </View>
            )}

            <View className="bg-background rounded-xl p-3">
              <View className="flex-row justify-between items-center">
                <Text className="text-sm text-muted">Overs per side</Text>
                <Text className="text-lg font-bold text-primary">{getOversForFormat(format)}</Text>
              </View>
            </View>
          </View>

          {/* Venue (Optional) */}
          <View className="bg-surface rounded-xl p-4 gap-4 border border-border/50">
            <Text className="text-lg font-semibold text-foreground">📍 Venue (Optional)</Text>
            <TextInput
              className="bg-background border border-border rounded-xl px-4 py-3.5 text-foreground"
              placeholder="Enter venue name"
              placeholderTextColor={colors.muted + "80"}
              value={venue}
              onChangeText={setVenue}
              maxLength={50}
            />
          </View>

          {/* Advanced Settings Toggle */}
          <TouchableOpacity
            className="bg-surface rounded-xl p-4 border border-border/50 active:opacity-80"
            onPress={async () => {
              if (Platform.OS !== "web") {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              setShowAdvanced(!showAdvanced);
            }}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <Text className="text-lg">⚙️</Text>
                <Text className="text-lg font-semibold text-foreground">Advanced Settings</Text>
              </View>
              <Text className="text-lg text-muted">{showAdvanced ? "▲" : "▼"}</Text>
            </View>
          </TouchableOpacity>

          {/* Advanced Settings Panel */}
          {showAdvanced && (
            <View className="bg-surface rounded-xl p-4 gap-5 border border-border/50">
              {/* Balls per over */}
              <View className="gap-2">
                <Text className="text-sm font-semibold text-muted">Balls per over</Text>
                <View className="flex-row gap-2">
                  {[4, 5, 6, 8].map(n => (
                    <TouchableOpacity
                      key={n}
                      className={`px-4 py-2 rounded-lg ${ballsPerOver === String(n) ? "bg-primary" : "bg-background border border-border"}`}
                      onPress={async () => {
                        if (Platform.OS !== "web") await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setBallsPerOver(String(n));
                      }}
                    >
                      <Text className={`font-bold ${ballsPerOver === String(n) ? "text-background" : "text-foreground"}`}>{n}</Text>
                    </TouchableOpacity>
                  ))}
                  <TextInput
                    className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-foreground text-center"
                    placeholder="Custom"
                    placeholderTextColor={colors.muted + "80"}
                    value={[4, 5, 6, 8].includes(Number(ballsPerOver)) ? "" : ballsPerOver}
                    onChangeText={t => setBallsPerOver(t)}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* Players per side */}
              <View className="gap-2">
                <Text className="text-sm font-semibold text-muted">Players per side</Text>
                <View className="flex-row gap-2">
                  {[8, 11].map(n => (
                    <TouchableOpacity
                      key={n}
                      className={`px-4 py-2 rounded-lg ${playersPerSide === String(n) ? "bg-primary" : "bg-background border border-border"}`}
                      onPress={async () => {
                        if (Platform.OS !== "web") await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setPlayersPerSide(String(n));
                      }}
                    >
                      <Text className={`font-bold ${playersPerSide === String(n) ? "text-background" : "text-foreground"}`}>{n}</Text>
                    </TouchableOpacity>
                  ))}
                  <TextInput
                    className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-foreground text-center"
                    placeholder="Custom"
                    placeholderTextColor={colors.muted + "80"}
                    value={[8, 11].includes(Number(playersPerSide)) ? "" : playersPerSide}
                    onChangeText={t => setPlayersPerSide(t)}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* Innings Count */}
              <View className="gap-2">
                <Text className="text-sm font-semibold text-muted">Innings per side</Text>
                <View className="flex-row gap-2">
                  {[1, 2].map(n => (
                    <TouchableOpacity
                      key={n}
                      className={`px-4 py-2 rounded-lg ${inningsCount === String(n) ? "bg-primary" : "bg-background border border-border"}`}
                      onPress={async () => {
                        if (Platform.OS !== "web") await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setInningsCount(String(n));
                      }}
                    >
                      <Text className={`font-bold ${inningsCount === String(n) ? "text-background" : "text-foreground"}`}>{n === 1 ? "Single" : "Double"}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Presets note */}
              <View className="bg-primary/5 rounded-xl p-3 border border-primary/20">
                <Text className="text-xs text-muted">
                  💡 These settings only apply to custom matches. Preset formats use standard cricket rules.
                </Text>
              </View>
            </View>
          )}

          {/* Quick Tips */}
          <View className="bg-primary/5 rounded-xl p-4 border border-primary/20">
            <Text className="text-sm font-semibold text-primary mb-1">💡 Tips</Text>
            <Text className="text-xs text-muted">
              After creating the match, you'll do a coin toss and then start scoring ball-by-ball.
              All cricket rules (extras, dismissals, powerplays, run rates) are automatically handled!
            </Text>
          </View>

          {/* Action Buttons */}
          <View className="flex-row gap-3 mt-2 pb-6">
            <TouchableOpacity
              className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-xl py-4 items-center active:opacity-80"
              onPress={handleCancel}
            >
              <Text className="text-foreground font-semibold text-base">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 bg-primary rounded-xl py-4 items-center active:opacity-80"
              onPress={handleCreateMatch}
            >
              <Text className="text-background font-semibold text-base">Create Match</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
