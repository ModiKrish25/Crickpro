/**
 * Match Creation Screen - Multi-Step Flow with Dark Emerald Aesthetics
 * 
 * Multi-Step Flow:
 * 1. Match Format
 * 2. Teams
 * 3. Venue & Details
 * 4. Toss
 * 5. Playing XI
 * 6. Start Match Summary
 */
import { ScrollView, Text, View, TouchableOpacity, TextInput, Platform, KeyboardAvoidingView } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useRouter } from "expo-router";
import { useState, useCallback } from "react";
import * as Haptics from "expo-haptics";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";
import { GlassInput } from "@/components/ui/glass-input";
import { useResponsive } from "@/hooks/use-responsive";
import { useScrollPadding } from "@/hooks/use-scroll-padding";
import { trpc } from "@/lib/trpc";
import { useAuthContext } from "@/lib/auth-context";

import { MatchFormat as EngineMatchFormat, validateMatchInput, TossDecision, type MatchInputValidation } from "@/lib/cricket/advanced-rules-engine";

function toEngineFormat(fmt: string): EngineMatchFormat {
  const map: Record<string, EngineMatchFormat> = {
    "T20": EngineMatchFormat.T20,
    "ODI": EngineMatchFormat.ODI,
    "T10": EngineMatchFormat.T10,
    "the_hundred": EngineMatchFormat.THE_HUNDRED,
    "test": EngineMatchFormat.TEST,
    "custom": EngineMatchFormat.CUSTOM,
  };
  return map[fmt] ?? EngineMatchFormat.T20;
}

type FrontendMatchFormat = "T20" | "ODI" | "T10" | "the_hundred" | "test" | "custom";

interface FormatOption {
  id: FrontendMatchFormat;
  label: string;
  overs: number;
  description: string;
  custom?: boolean;
  noOvers?: boolean;
}

const FORMAT_OPTIONS: FormatOption[] = [
  { id: "T20", label: "T20", overs: 20, description: "20 overs per side • ~3 hrs" },
  { id: "ODI", label: "ODI", overs: 50, description: "50 overs per side • ~8 hrs" },
  { id: "T10", label: "T10", overs: 10, description: "10 overs per side • ~1.5 hrs" },
  { id: "the_hundred", label: "The Hundred", overs: 100, description: "100 balls per side • ~2.5 hrs", noOvers: true },
  { id: "test", label: "Test", overs: 0, description: "Unlimited overs • Multi-day", noOvers: true },
  { id: "custom", label: "Custom", overs: 0, description: "Custom overs & rules", custom: true },
];

const STEPS = [
  { id: 1, name: "Format" },
  { id: 2, name: "Teams" },
  { id: 3, name: "Venue" },
  { id: 4, name: "Toss" },
  { id: 5, name: "Roster" },
  { id: 6, name: "Start" },
];

export default function CreateMatchScreen() {
  const { paddingBottom } = useScrollPadding();
  const router = useRouter();
  const r = useResponsive();
  const { isAuthenticated } = useAuthContext();
  const createMatchMutation = trpc.match.create.useMutation();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Step 1: Format
  const [format, setFormat] = useState<FrontendMatchFormat>("T20");
  const [maxOvers, setMaxOvers] = useState("20");

  // Step 2: Teams
  const [team1Name, setTeam1Name] = useState("Thunder Warriors");
  const [team2Name, setTeam2Name] = useState("Phoenix Rising");

  // Step 3: Venue & Details
  const [venue, setVenue] = useState("Central Park Ground");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [ballsPerOver, setBallsPerOver] = useState("6");
  const [playersPerSide, setPlayersPerSide] = useState("11");

  // Step 4: Toss
  const [tossWinner, setTossWinner] = useState<string>("");
  const [tossDecision, setTossDecision] = useState<TossDecision>(TossDecision.BAT);

  // Step 5: Playing XI
  const [searchRoster, setSearchRoster] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleAction = useCallback(async (cb: () => void) => {
    if (Platform.OS !== "web") await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    cb();
  }, []);

  const handleNextStep = async () => {
    if (Platform.OS !== "web") await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (currentStep === 1) {
      if (format === "custom" && (!maxOvers || parseInt(maxOvers, 10) <= 0)) {
        setFieldErrors({ customOvers: "Please enter valid overs" });
        return;
      }
    } else if (currentStep === 2) {
      if (!team1Name.trim() || !team2Name.trim()) {
        setFieldErrors({ team1: !team1Name.trim() ? "Enter Team 1" : "", team2: !team2Name.trim() ? "Enter Team 2" : "" });
        return;
      }
    } else if (currentStep === 4) {
      if (!tossWinner) {
        setTossWinner(team1Name);
      }
    }

    setFieldErrors({});
    if (currentStep < 6) {
      setCurrentStep(prev => prev + 1);
    } else {
      await handleStartMatch();
    }
  };

  const handlePrevStep = async () => {
    if (Platform.OS !== "web") await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    } else {
      router.back();
    }
  };

  const handleStartMatch = async () => {
    setIsSubmitting(true);
    const t1 = team1Name.trim() || "Team A";
    const t2 = team2Name.trim() || "Team B";

    try {
      let dbMatchId: string | undefined;
      if (isAuthenticated) {
        try {
          const result = await createMatchMutation.mutateAsync({
            format: toEngineFormat(format),
            team1: t1,
            team2: t2,
            customOvers: format === "custom" ? parseInt(maxOvers, 10) : undefined,
            venue: venue.trim() || undefined,
          });
          dbMatchId = result.matchId;
        } catch (e) {
          console.warn("[Create Match] API error:", e);
        }
      }

      router.push({
        pathname: "/match/live",
        params: {
          team1: t1,
          team2: t2,
          format,
          overs: format === "custom" ? maxOvers : format === "T20" ? "20" : format === "ODI" ? "50" : "10",
          venue: venue.trim(),
          tossWinner: tossWinner || t1,
          tossDecision,
          playersPerSide: playersPerSide || "11",
          ballsPerOver: ballsPerOver || "6",
          dbMatchId,
        },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const targetPlayerCount = Math.max(1, parseInt(playersPerSide, 10) || 11);
  const rosterNames = [
    "Rohit Sharma (C)", "Virat Kohli", "Suryakumar Yadav", "Hardik Pandya (VC)", "Rishabh Pant (WK)", 
    "Jasprit Bumrah", "Ravindra Jadeja", "Mohammed Shami", "Kuldeep Yadav", "Arshdeep Singh", "Mohammed Siraj"
  ].slice(0, targetPlayerCount);

  return (
    <ScreenContainer gradient glass>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Step Progress Bar Header */}
        <View className="pt-2 pb-3 gap-2">
          <View className="flex-row items-center justify-between">
            <Text className="text-xs font-black text-indigo-400 uppercase tracking-widest">
              STEP {currentStep} OF 6 • {STEPS[currentStep - 1].name.toUpperCase()}
            </Text>
            <Text className="text-xs font-bold text-slate-300">{Math.round((currentStep / 6) * 100)}% Complete</Text>
          </View>
          
          {/* Progress Chips */}
          <View className="flex-row gap-1.5">
            {STEPS.map((s) => (
              <View
                key={s.id}
                className={`h-1.5 flex-1 rounded-full ${
                  s.id <= currentStep ? "bg-gradient-to-r from-blue-500 to-indigo-600 shadow-md shadow-indigo-500/50" : "bg-white/10"
                }`}
              />
            ))}
          </View>
        </View>

        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingBottom: paddingBottom + 90 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 gap-5">
            {/* STEP 1: MATCH FORMAT */}
            {currentStep === 1 && (
              <GlassCard intensity="high" padding="xl" radius="xl" className="gap-5 bg-[#1C1C1E] border-white/15">
                <Text className="text-xl font-black text-white tracking-tight">Select Match Format</Text>
                <View className="flex-row flex-wrap gap-2.5">
                  {FORMAT_OPTIONS.map((fmt) => {
                    const selected = format === fmt.id;
                    return (
                      <TouchableOpacity
                        key={fmt.id}
                        onPress={() => handleAction(() => {
                          setFormat(fmt.id);
                          if (!fmt.custom && !fmt.noOvers) setMaxOvers(String(fmt.overs));
                        })}
                        className={`rounded-2xl p-4 min-w-[47%] border ${
                          selected
                            ? "bg-gradient-to-r from-blue-500 to-indigo-600 border-indigo-400 shadow-lg shadow-indigo-500/50"
                            : "bg-[#2C2C2E] border-white/15 active:opacity-80"
                        }`}
                      >
                        <Text className={`font-black text-lg ${selected ? "text-white" : "text-slate-100"}`}>
                          {fmt.label}
                        </Text>
                        <Text className={`text-xs mt-1 font-bold ${selected ? "text-white/80" : "text-slate-400"}`}>
                          {fmt.description}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {format === "custom" && (
                  <View className="gap-1 mt-2">
                    <GlassInput
                      label="Custom Overs Per Side"
                      placeholder="e.g. 15"
                      value={maxOvers}
                      onChangeText={setMaxOvers}
                      keyboardType="numeric"
                      icon="🔄"
                    />
                    {fieldErrors.customOvers && (
                      <Text className="text-xs text-red-400 px-1 font-semibold">{fieldErrors.customOvers}</Text>
                    )}
                  </View>
                )}
              </GlassCard>
            )}

            {/* STEP 2: TEAMS */}
            {currentStep === 2 && (
              <GlassCard intensity="high" padding="xl" radius="xl" className="gap-5 bg-[#1C1C1E] border-white/15">
                <Text className="text-xl font-black text-white tracking-tight">Team Identities</Text>
                <View className="gap-4">
                  <View className="gap-1">
                    <GlassInput
                      label="Team 1 (Batting First)"
                      placeholder="e.g. Thunder Warriors"
                      value={team1Name}
                      onChangeText={setTeam1Name}
                      icon="🛡️"
                    />
                    {fieldErrors.team1 && <Text className="text-xs text-red-400 px-1 font-semibold">{fieldErrors.team1}</Text>}
                  </View>

                  <View className="gap-1">
                    <GlassInput
                      label="Team 2 (Batting Second)"
                      placeholder="e.g. Phoenix Rising"
                      value={team2Name}
                      onChangeText={setTeam2Name}
                      icon="⚡"
                    />
                    {fieldErrors.team2 && <Text className="text-xs text-red-400 px-1 font-semibold">{fieldErrors.team2}</Text>}
                  </View>
                </View>
              </GlassCard>
            )}

            {/* STEP 3: VENUE & DETAILS */}
            {currentStep === 3 && (
              <GlassCard intensity="high" padding="xl" radius="xl" className="gap-5 bg-[#1C1C1E] border-white/15">
                <Text className="text-xl font-black text-white tracking-tight">Venue & Details</Text>
                <GlassInput
                  label="Venue Name"
                  placeholder="e.g. Central Park Ground"
                  value={venue}
                  onChangeText={setVenue}
                  icon="🏟️"
                />

                <TouchableOpacity
                  className="bg-[#2C2C2E] border border-white/15 rounded-2xl p-4 flex-row items-center justify-between"
                  onPress={() => handleAction(() => setShowAdvanced(!showAdvanced))}
                >
                  <Text className="text-sm font-bold text-white">Advanced Rules (Balls & Players)</Text>
                  <Text className="text-xs font-bold text-indigo-400">{showAdvanced ? "Hide ▲" : "Show ▼"}</Text>
                </TouchableOpacity>

                {showAdvanced && (
                  <View className="gap-3 bg-black/40 p-4 rounded-2xl border border-white/10">
                    <View className="gap-1">
                      <Text className="text-xs font-bold text-slate-400">Balls per over</Text>
                      <TextInput
                        className="bg-[#2C2C2E] text-white border border-white/15 rounded-xl p-3 font-bold"
                        value={ballsPerOver}
                        onChangeText={setBallsPerOver}
                        keyboardType="numeric"
                      />
                    </View>

                    <View className="gap-1">
                      <Text className="text-xs font-bold text-slate-400">Players per side</Text>
                      <TextInput
                        className="bg-[#2C2C2E] text-white border border-white/15 rounded-xl p-3 font-bold"
                        value={playersPerSide}
                        onChangeText={setPlayersPerSide}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                )}
              </GlassCard>
            )}

            {/* STEP 4: TOSS */}
            {currentStep === 4 && (
              <GlassCard intensity="high" padding="xl" radius="xl" className="gap-5 items-center text-center bg-[#1C1C1E] border-white/15">
                <Text className="text-xl font-black text-white tracking-tight">Coin Toss</Text>
                <View className="w-16 h-16 rounded-full bg-indigo-500/20 border-2 border-indigo-400 items-center justify-center">
                  <Text className="text-2xl">🪙</Text>
                </View>
                
                <Text className="text-sm font-bold text-slate-300">Who won the toss?</Text>
                <View className="flex-row gap-3 w-full">
                  <TouchableOpacity
                    className={`flex-1 p-4 rounded-2xl border items-center ${
                      tossWinner === team1Name ? "bg-gradient-to-r from-blue-500 to-indigo-600 border-indigo-400 shadow-md shadow-indigo-500/40" : "bg-[#2C2C2E] border-white/15"
                    }`}
                    onPress={() => handleAction(() => setTossWinner(team1Name))}
                  >
                    <Text className={`font-bold ${tossWinner === team1Name ? "text-white" : "text-slate-200"}`}>
                      {team1Name}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    className={`flex-1 p-4 rounded-2xl border items-center ${
                      tossWinner === team2Name ? "bg-gradient-to-r from-blue-500 to-indigo-600 border-indigo-400 shadow-md shadow-indigo-500/40" : "bg-[#2C2C2E] border-white/15"
                    }`}
                    onPress={() => handleAction(() => setTossWinner(team2Name))}
                  >
                    <Text className={`font-bold ${tossWinner === team2Name ? "text-white" : "text-slate-200"}`}>
                      {team2Name}
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text className="text-sm font-bold text-slate-300 mt-2">Opted to</Text>
                <View className="flex-row gap-3 w-full">
                  <TouchableOpacity
                    className={`flex-1 p-3 rounded-xl border items-center ${
                      tossDecision === TossDecision.BAT ? "bg-gradient-to-r from-blue-500 to-indigo-600 border-indigo-400 shadow-md shadow-indigo-500/40" : "bg-[#2C2C2E] border-white/15"
                    }`}
                    onPress={() => handleAction(() => setTossDecision(TossDecision.BAT))}
                  >
                    <Text className={`font-bold ${tossDecision === TossDecision.BAT ? "text-white" : "text-slate-200"}`}>
                      🏏 Bat First
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    className={`flex-1 p-3 rounded-xl border items-center ${
                      tossDecision === TossDecision.BOWL ? "bg-gradient-to-r from-blue-500 to-indigo-600 border-indigo-400 shadow-md shadow-indigo-500/40" : "bg-[#2C2C2E] border-white/15"
                    }`}
                    onPress={() => handleAction(() => setTossDecision(TossDecision.BOWL))}
                  >
                    <Text className={`font-bold ${tossDecision === TossDecision.BOWL ? "text-white" : "text-slate-200"}`}>
                      ⚾ Bowl First
                    </Text>
                  </TouchableOpacity>
                </View>
              </GlassCard>
            )}

            {/* STEP 5: PLAYING SQUAD */}
            {currentStep === 5 && (
              <GlassCard intensity="high" padding="xl" radius="xl" className="gap-4 bg-[#1C1C1E] border-white/15">
                <View className="flex-row items-center justify-between">
                  <Text className="text-xl font-black text-white">
                    {targetPlayerCount === 11 ? "Playing XI" : `Playing ${targetPlayerCount}`}
                  </Text>
                  <View className="bg-indigo-500/20 rounded-full px-3 py-1 border border-indigo-400/40">
                    <Text className="text-xs font-black text-indigo-400">
                      {targetPlayerCount}/{targetPlayerCount} SELECTED
                    </Text>
                  </View>
                </View>

                <GlassInput
                  placeholder="Search roster players..."
                  value={searchRoster}
                  onChangeText={setSearchRoster}
                  icon="🔍"
                />

                <View className="gap-2 mt-1">
                  {rosterNames.map((name, i) => (
                    <View key={name} className="bg-[#2C2C2E] border border-white/15 rounded-xl p-3 flex-row items-center justify-between">
                      <View className="flex-row items-center gap-3">
                        <View className="w-8 h-8 rounded-full bg-indigo-500/20 items-center justify-center">
                          <Text className="text-xs font-bold text-indigo-300">{i + 1}</Text>
                        </View>
                        <Text className="text-sm font-bold text-white">{name}</Text>
                      </View>
                      <View className="w-5 h-5 rounded-md bg-indigo-500 items-center justify-center">
                        <Text className="text-xs text-white font-black">✓</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </GlassCard>
            )}

            {/* STEP 6: START MATCH SUMMARY */}
            {currentStep === 6 && (
              <GlassCard intensity="high" padding="xl" radius="xl" className="gap-5 bg-[#1C1C1E] border-white/15">
                <Text className="text-xl font-black text-white tracking-tight">Match Ready</Text>
                
                <View className="bg-[#2C2C2E] border border-white/15 rounded-2xl p-4 gap-3">
                  <View className="flex-row justify-between border-b border-white/10 pb-2">
                    <Text className="text-xs font-bold text-slate-400">FORMAT</Text>
                    <Text className="text-sm font-extrabold text-indigo-400">{format} ({maxOvers} Overs)</Text>
                  </View>

                  <View className="flex-row justify-between border-b border-white/10 pb-2">
                    <Text className="text-xs font-bold text-slate-400">TEAMS</Text>
                    <Text className="text-sm font-extrabold text-white">{team1Name} vs {team2Name}</Text>
                  </View>

                  <View className="flex-row justify-between border-b border-white/10 pb-2">
                    <Text className="text-xs font-bold text-slate-400">PLAYERS PER SIDE</Text>
                    <Text className="text-sm font-extrabold text-white">{targetPlayerCount} a-side ({ballsPerOver || "6"} b/ov)</Text>
                  </View>

                  <View className="flex-row justify-between border-b border-white/10 pb-2">
                    <Text className="text-xs font-bold text-slate-400">VENUE</Text>
                    <Text className="text-sm font-extrabold text-white">{venue || "Central Park Ground"}</Text>
                  </View>

                  <View className="flex-row justify-between">
                    <Text className="text-xs font-bold text-slate-400">TOSS</Text>
                    <Text className="text-sm font-extrabold text-amber-400">{tossWinner || team1Name} opted to {tossDecision}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 border border-indigo-400 rounded-2xl py-4 items-center shadow-lg shadow-indigo-500/50 active:scale-95"
                  onPress={handleStartMatch}
                >
                  <Text className="text-white font-black text-lg uppercase tracking-wider">
                    {isSubmitting ? "Starting..." : "🚀 Launch Live Match"}
                  </Text>
                </TouchableOpacity>
              </GlassCard>
            )}
          </View>
        </ScrollView>

        {/* Sticky Bottom Navigation Buttons */}
        <View className="absolute bottom-4 left-4 right-4 flex-row gap-3">
          <TouchableOpacity
            onPress={handlePrevStep}
            className="flex-1 bg-[#2C2C2E] border border-white/20 py-3.5 rounded-2xl items-center active:scale-95"
          >
            <Text className="text-white font-extrabold text-sm">
              {currentStep === 1 ? "Cancel" : "← Back"}
            </Text>
          </TouchableOpacity>

          {currentStep < 6 && (
            <TouchableOpacity
              onPress={handleNextStep}
              className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 border border-indigo-400 py-3.5 rounded-2xl items-center shadow-lg shadow-indigo-500/50 active:scale-95"
            >
              <Text className="text-white font-black text-sm">
                Next Step →
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
