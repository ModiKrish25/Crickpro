/**
 * Match Creation Screen - Pitch Dark Emerald Charcoal Palette (Matching Exact User Image Scheme)
 * 
 * Multi-Step Flow:
 * 1. Match Format (T20, ODI, T10, The Hundred, Test, Custom)
 * 2. Teams (Team 1, Team 2, Swap Teams)
 * 3. Venue & Details (Venue name, balls/over, players/side)
 * 4. Coin Toss (Winner, Bat/Bowl decision)
 * 5. Playing XI Roster (Interactive XI list)
 * 6. Start Match Summary (Launch live scoring)
 */
import { ScrollView, Text, View, TouchableOpacity, TextInput, Platform, KeyboardAvoidingView } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useRouter } from "expo-router";
import { useState, useCallback } from "react";
import * as Haptics from "expo-haptics";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassInput } from "@/components/ui/glass-input";
import { useScrollPadding } from "@/hooks/use-scroll-padding";
import { trpc } from "@/lib/trpc";
import { useAuthContext } from "@/lib/auth-context";

import { MatchFormat as EngineMatchFormat, TossDecision } from "@/lib/cricket/advanced-rules-engine";

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
  icon: string;
  tag: string;
  custom?: boolean;
  noOvers?: boolean;
}

const FORMAT_OPTIONS: FormatOption[] = [
  { id: "T20", label: "T20 Match", overs: 20, description: "20 overs per side • ~3 hrs", icon: "⚡", tag: "POPULAR" },
  { id: "ODI", label: "One Day International", overs: 50, description: "50 overs per side • ~8 hrs", icon: "🏏", tag: "CLASSIC" },
  { id: "T10", label: "T10 League", overs: 10, description: "10 overs per side • ~1.5 hrs", icon: "💥", tag: "EXPRESS" },
  { id: "the_hundred", label: "The Hundred", overs: 100, description: "100 balls per side • ~2.5 hrs", icon: "💯", tag: "100 BALLS", noOvers: true },
  { id: "test", label: "Test Match", overs: 0, description: "Unlimited overs • Multi-day", icon: "🛡️", tag: "RED BALL", noOvers: true },
  { id: "custom", label: "Custom Format", overs: 0, description: "Custom overs & rules", icon: "⚙️", tag: "BUILD YOURS", custom: true },
];

const STEPS = [
  { id: 1, name: "Format", icon: "🏆" },
  { id: 2, name: "Teams", icon: "🛡️" },
  { id: 3, name: "Venue", icon: "🏟️" },
  { id: 4, name: "Toss", icon: "🪙" },
  { id: 5, name: "Roster", icon: "📋" },
  { id: 6, name: "Start", icon: "🚀" },
];

export default function CreateMatchScreen() {
  const { paddingBottom } = useScrollPadding();
  const router = useRouter();
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

  const swapTeams = useCallback(() => {
    handleAction(() => {
      setTeam1Name(team2Name);
      setTeam2Name(team1Name);
    });
  }, [team1Name, team2Name, handleAction]);

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
        <View className="pt-2 pb-4 gap-3">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <View className="w-8 h-8 rounded-full bg-[#10B981]/20 border border-[#10B981]/40 items-center justify-center">
                <Text className="text-sm">{STEPS[currentStep - 1].icon}</Text>
              </View>
              <View>
                <Text className="text-[10px] font-black text-[#10B981] uppercase tracking-widest">
                  STEP {currentStep} OF 6
                </Text>
                <Text className="text-sm font-black text-white tracking-tight">
                  {STEPS[currentStep - 1].name} Setup
                </Text>
              </View>
            </View>
            <View className="bg-[#0B1712] border border-[#142820] px-3 py-1 rounded-full">
              <Text className="text-xs font-black text-[#10B981]">{Math.round((currentStep / 6) * 100)}% Complete</Text>
            </View>
          </View>
          
          {/* Progress Chips */}
          <View className="flex-row gap-1.5">
            {STEPS.map((s) => (
              <View
                key={s.id}
                className={`h-2 flex-1 rounded-full transition-all ${
                  s.id <= currentStep
                    ? "bg-[#10B981] shadow-lg shadow-emerald-500/40"
                    : "bg-white/10"
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
              <GlassCard intensity="heavy" padding="xl" radius="xl" className="gap-5 bg-[#0B1511] border-[#10B981]/20 shadow-2xl">
                <View className="flex-row items-center justify-between border-b border-white/10 pb-3">
                  <View className="gap-0.5">
                    <Text className="text-xl font-black text-white tracking-tight">Select Match Format</Text>
                    <Text className="text-xs font-semibold text-slate-400">Choose overs structure and match duration</Text>
                  </View>
                  <View className="bg-[#10B981]/20 border border-[#10B981]/40 px-2.5 py-1 rounded-full">
                    <Text className="text-[10px] font-black text-[#10B981]">OFFICIAL RULES</Text>
                  </View>
                </View>

                <View className="flex-row flex-wrap gap-3">
                  {FORMAT_OPTIONS.map((fmt) => {
                    const selected = format === fmt.id;
                    return (
                      <TouchableOpacity
                        key={fmt.id}
                        onPress={() => handleAction(() => {
                          setFormat(fmt.id);
                          if (!fmt.custom && !fmt.noOvers) setMaxOvers(String(fmt.overs));
                        })}
                        className={`rounded-2xl p-4 min-w-[47%] flex-1 border transition-all active:scale-95 ${
                          selected
                            ? "bg-[#0B1D15] border-[#10B981] shadow-xl shadow-emerald-500/20"
                            : "bg-[#060D0A] border-white/10 hover:border-[#10B981]/40"
                        }`}
                      >
                        <View className="flex-row items-center justify-between mb-2">
                          <Text className="text-2xl">{fmt.icon}</Text>
                          <View className={`px-2 py-0.5 rounded-full border ${selected ? "bg-[#10B981]/30 border-[#10B981]" : "bg-white/10 border-white/15"}`}>
                            <Text className={`text-[9px] font-black ${selected ? "text-[#10B981]" : "text-slate-400"}`}>{fmt.tag}</Text>
                          </View>
                        </View>
                        <Text className={`font-black text-lg ${selected ? "text-white" : "text-slate-100"}`}>
                          {fmt.label}
                        </Text>
                        <Text className={`text-xs mt-1 font-bold leading-relaxed ${selected ? "text-emerald-300" : "text-slate-400"}`}>
                          {fmt.description}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {format === "custom" && (
                  <View className="gap-2 mt-2 bg-[#060D0A] border border-[#10B981]/30 p-4 rounded-2xl">
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
              <GlassCard intensity="heavy" padding="xl" radius="xl" className="gap-5 bg-[#0B1511] border-[#10B981]/20 shadow-2xl">
                <View className="flex-row items-center justify-between border-b border-white/10 pb-3">
                  <View className="gap-0.5">
                    <Text className="text-xl font-black text-white tracking-tight">Team Identities</Text>
                    <Text className="text-xs font-semibold text-slate-400">Set team names and batting order for toss</Text>
                  </View>
                  <TouchableOpacity
                    onPress={swapTeams}
                    className="flex-row items-center gap-1.5 bg-[#10B981]/20 border border-[#10B981]/40 px-3 py-1.5 rounded-full active:scale-95"
                  >
                    <Text className="text-xs font-black text-[#10B981]">⇄ Swap Teams</Text>
                  </TouchableOpacity>
                </View>

                <View className="gap-4">
                  <View className="gap-1.5">
                    <Text className="text-xs font-black text-[#10B981] uppercase tracking-wider">TEAM 1 (BATTING FIRST AT START)</Text>
                    <GlassInput
                      placeholder="e.g. Thunder Warriors"
                      value={team1Name}
                      onChangeText={setTeam1Name}
                      icon="🛡️"
                    />
                    {fieldErrors.team1 && <Text className="text-xs text-red-400 px-1 font-semibold">{fieldErrors.team1}</Text>}
                  </View>

                  <View className="items-center my-1">
                    <View className="w-8 h-8 rounded-full bg-[#10B981]/20 border border-[#10B981]/40 items-center justify-center">
                      <Text className="text-xs font-black text-[#10B981]">VS</Text>
                    </View>
                  </View>

                  <View className="gap-1.5">
                    <Text className="text-xs font-black text-[#10B981] uppercase tracking-wider">TEAM 2 (BOWLING FIRST AT START)</Text>
                    <GlassInput
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
              <GlassCard intensity="heavy" padding="xl" radius="xl" className="gap-5 bg-[#0B1511] border-[#10B981]/20 shadow-2xl">
                <View className="border-b border-white/10 pb-3 gap-0.5">
                  <Text className="text-xl font-black text-white tracking-tight">Venue & Match Settings</Text>
                  <Text className="text-xs font-semibold text-slate-400">Enter ground details and match rules</Text>
                </View>

                <GlassInput
                  label="Stadium / Ground Name"
                  placeholder="e.g. Central Park Ground, NY"
                  value={venue}
                  onChangeText={setVenue}
                  icon="🏟️"
                />

                {/* Popular Venues Suggestions */}
                <View className="gap-2">
                  <Text className="text-xs font-bold text-slate-400">Quick Venue Presets:</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {["Central Park Oval", "Lord's Cricket Ground", "Eden Gardens", "Melbourne Oval"].map((preset) => (
                      <TouchableOpacity
                        key={preset}
                        onPress={() => setVenue(preset)}
                        className={`px-3 py-1.5 rounded-full border text-xs font-bold ${
                          venue === preset
                            ? "bg-[#10B981]/20 border-[#10B981] text-[#10B981]"
                            : "bg-[#060D0A] border-white/10 text-slate-300 hover:bg-white/10"
                        }`}
                      >
                        <Text className={`text-xs font-bold ${venue === preset ? "text-[#10B981]" : "text-slate-300"}`}>
                          📍 {preset}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <TouchableOpacity
                  className="bg-[#060D0A] border border-[#10B981]/20 rounded-2xl p-4 flex-row items-center justify-between active:opacity-80 mt-2"
                  onPress={() => handleAction(() => setShowAdvanced(!showAdvanced))}
                >
                  <View className="flex-row items-center gap-2.5">
                    <Text className="text-lg">⚙️</Text>
                    <View>
                      <Text className="text-sm font-black text-white">Advanced Rules (Balls & Players)</Text>
                      <Text className="text-xs font-semibold text-slate-400">Custom balls per over and roster limit</Text>
                    </View>
                  </View>
                  <Text className="text-xs font-black text-[#10B981]">{showAdvanced ? "Hide ▲" : "Configure ▼"}</Text>
                </TouchableOpacity>

                {showAdvanced && (
                  <View className="gap-3 bg-[#050B08] p-4 rounded-2xl border border-white/10">
                    <View className="gap-1">
                      <Text className="text-xs font-bold text-slate-300">Balls Per Over (Default: 6)</Text>
                      <TextInput
                        className="bg-[#0B1511] text-white border border-[#10B981]/30 rounded-xl p-3 font-extrabold text-base"
                        value={ballsPerOver}
                        onChangeText={setBallsPerOver}
                        keyboardType="numeric"
                      />
                    </View>

                    <View className="gap-1">
                      <Text className="text-xs font-bold text-slate-300">Players Per Side (Default: 11)</Text>
                      <TextInput
                        className="bg-[#0B1511] text-white border border-[#10B981]/30 rounded-xl p-3 font-extrabold text-base"
                        value={playersPerSide}
                        onChangeText={setPlayersPerSide}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                )}
              </GlassCard>
            )}

            {/* STEP 4: COIN TOSS */}
            {currentStep === 4 && (
              <GlassCard intensity="heavy" padding="xl" radius="xl" className="gap-5 items-center bg-[#0B1511] border-[#10B981]/20 shadow-2xl">
                <View className="w-full border-b border-white/10 pb-3 items-center gap-0.5">
                  <Text className="text-xl font-black text-white tracking-tight">Coin Toss</Text>
                  <Text className="text-xs font-semibold text-slate-400">Select toss winner and elected decision</Text>
                </View>

                {/* Animated Coin Badge */}
                <View className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 border-4 border-yellow-200 items-center justify-center shadow-xl shadow-amber-500/30 my-1">
                  <Text className="text-3xl">🪙</Text>
                </View>

                <View className="w-full gap-2">
                  <Text className="text-xs font-black text-[#10B981] uppercase tracking-wider text-center">WHO WON THE TOSS?</Text>
                  <View className="flex-row gap-3 w-full">
                    {[team1Name, team2Name].map((tName) => {
                      const isWinner = tossWinner === tName || (!tossWinner && tName === team1Name);
                      return (
                        <TouchableOpacity
                          key={tName}
                          className={`flex-1 p-4 rounded-2xl border items-center gap-1 transition-all active:scale-95 ${
                            isWinner
                              ? "bg-[#10B981] border-[#10B981] shadow-lg shadow-emerald-500/20"
                              : "bg-[#060D0A] border-white/10 hover:border-white/30"
                          }`}
                          onPress={() => handleAction(() => setTossWinner(tName))}
                        >
                          <Text className="text-lg">🛡️</Text>
                          <Text className={`font-black text-sm text-center ${isWinner ? "text-[#050B08]" : "text-slate-300"}`}>
                            {tName}
                          </Text>
                          {isWinner && <Text className="text-[10px] font-black text-[#050B08]">✓ TOSS WINNER</Text>}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                <View className="w-full gap-2 mt-2">
                  <Text className="text-xs font-black text-[#10B981] uppercase tracking-wider text-center">OPTED TO</Text>
                  <View className="flex-row gap-3 w-full">
                    <TouchableOpacity
                      className={`flex-1 p-4 rounded-2xl border items-center flex-row justify-center gap-2 active:scale-95 ${
                        tossDecision === TossDecision.BAT
                          ? "bg-[#10B981] border-[#10B981] shadow-lg shadow-emerald-500/20"
                          : "bg-[#060D0A] border-white/10"
                      }`}
                      onPress={() => handleAction(() => setTossDecision(TossDecision.BAT))}
                    >
                      <Text className="text-lg">🏏</Text>
                      <Text className={`font-black text-base ${tossDecision === TossDecision.BAT ? "text-[#050B08]" : "text-slate-300"}`}>
                        Bat First
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      className={`flex-1 p-4 rounded-2xl border items-center flex-row justify-center gap-2 active:scale-95 ${
                        tossDecision === TossDecision.BOWL
                          ? "bg-[#10B981] border-[#10B981] shadow-lg shadow-emerald-500/20"
                          : "bg-[#060D0A] border-white/10"
                      }`}
                      onPress={() => handleAction(() => setTossDecision(TossDecision.BOWL))}
                    >
                      <Text className="text-lg">⚾</Text>
                      <Text className={`font-black text-base ${tossDecision === TossDecision.BOWL ? "text-[#050B08]" : "text-slate-300"}`}>
                        Bowl First
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </GlassCard>
            )}

            {/* STEP 5: PLAYING SQUAD */}
            {currentStep === 5 && (
              <GlassCard intensity="heavy" padding="xl" radius="xl" className="gap-4 bg-[#0B1511] border-[#10B981]/20 shadow-2xl">
                <View className="flex-row items-center justify-between border-b border-white/10 pb-3">
                  <View>
                    <Text className="text-xl font-black text-white">
                      {targetPlayerCount === 11 ? "Playing XI Squad" : `Playing ${targetPlayerCount} Squad`}
                    </Text>
                    <Text className="text-xs font-semibold text-slate-400">Confirmed lineup for starting match</Text>
                  </View>
                  <View className="bg-[#10B981]/20 rounded-full px-3 py-1 border border-[#10B981]/40">
                    <Text className="text-xs font-black text-[#10B981]">
                      {targetPlayerCount}/{targetPlayerCount} CONFIRMED
                    </Text>
                  </View>
                </View>

                <GlassInput
                  placeholder="Search player name or role..."
                  value={searchRoster}
                  onChangeText={setSearchRoster}
                  icon="🔍"
                />

                <View className="gap-2 mt-1">
                  {rosterNames
                    .filter((n) => n.toLowerCase().includes(searchRoster.toLowerCase()))
                    .map((name, i) => (
                      <View key={name} className="bg-[#060D0A] border border-white/10 rounded-xl p-3.5 flex-row items-center justify-between">
                        <View className="flex-row items-center gap-3">
                          <View className="w-8 h-8 rounded-full bg-[#10B981]/20 border border-[#10B981]/40 items-center justify-center">
                            <Text className="text-xs font-black text-[#10B981]">{i + 1}</Text>
                          </View>
                          <Text className="text-sm font-black text-white">{name}</Text>
                        </View>
                        <View className="flex-row items-center gap-2">
                          <View className="bg-white/10 px-2 py-0.5 rounded">
                            <Text className="text-[10px] font-black text-slate-300">CONFIRMED</Text>
                          </View>
                          <View className="w-6 h-6 rounded-md bg-[#10B981] items-center justify-center">
                            <Text className="text-xs text-[#050B08] font-black">✓</Text>
                          </View>
                        </View>
                      </View>
                    ))}
                </View>
              </GlassCard>
            )}

            {/* STEP 6: START MATCH SUMMARY */}
            {currentStep === 6 && (
              <GlassCard intensity="heavy" padding="xl" radius="xl" className="gap-5 bg-[#0B1511] border-[#10B981]/20 shadow-2xl">
                <View className="border-b border-white/10 pb-3 gap-0.5">
                  <Text className="text-xl font-black text-white tracking-tight">Match Ready to Launch</Text>
                  <Text className="text-xs font-semibold text-slate-400">Review configuration before starting live scoring</Text>
                </View>
                
                <View className="bg-[#060D0A] border border-white/10 rounded-2xl p-5 gap-3.5">
                  <View className="flex-row items-center justify-between border-b border-white/10 pb-3">
                    <Text className="text-xs font-black text-slate-400 uppercase tracking-wider">FORMAT</Text>
                    <View className="bg-[#10B981]/20 border border-[#10B981]/40 px-3 py-1 rounded-full">
                      <Text className="text-sm font-black text-[#10B981]">{format} ({maxOvers} Overs)</Text>
                    </View>
                  </View>

                  <View className="flex-row items-center justify-between border-b border-white/10 pb-3">
                    <Text className="text-xs font-black text-slate-400 uppercase tracking-wider">TEAMS</Text>
                    <Text className="text-sm font-black text-white">{team1Name} <Text className="text-[#10B981]">vs</Text> {team2Name}</Text>
                  </View>

                  <View className="flex-row items-center justify-between border-b border-white/10 pb-3">
                    <Text className="text-xs font-black text-slate-400 uppercase tracking-wider">RULES & ROSTER</Text>
                    <Text className="text-sm font-black text-white">{targetPlayerCount} Players ({ballsPerOver || "6"} b/ov)</Text>
                  </View>

                  <View className="flex-row items-center justify-between border-b border-white/10 pb-3">
                    <Text className="text-xs font-black text-slate-400 uppercase tracking-wider">VENUE</Text>
                    <Text className="text-sm font-black text-white">📍 {venue || "Central Park Ground"}</Text>
                  </View>

                  <View className="flex-row items-center justify-between">
                    <Text className="text-xs font-black text-slate-400 uppercase tracking-wider">TOSS RESULT</Text>
                    <Text className="text-sm font-black text-[#FBBF24]">🪙 {tossWinner || team1Name} opted to {tossDecision}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  disabled={isSubmitting}
                  className="bg-[#10B981] hover:bg-[#059669] border border-emerald-300 rounded-2xl py-4 items-center shadow-xl shadow-emerald-500/20 active:scale-95 mt-2"
                  onPress={handleStartMatch}
                >
                  <Text className="text-[#050B08] font-black text-lg uppercase tracking-wider">
                    {isSubmitting ? "Initializing..." : "🚀 Launch Live Scoring"}
                  </Text>
                </TouchableOpacity>
              </GlassCard>
            )}
          </View>
        </ScrollView>

        {/* Sticky Bottom Navigation Buttons */}
        <View className="absolute bottom-4 left-4 right-4 flex-row gap-3 z-50">
          <TouchableOpacity
            onPress={handlePrevStep}
            className="flex-1 bg-[#060D0A] border border-white/20 py-4 rounded-2xl items-center active:scale-95 shadow-lg"
          >
            <Text className="text-white font-extrabold text-sm">
              {currentStep === 1 ? "Cancel" : "← Back"}
            </Text>
          </TouchableOpacity>

          {currentStep < 6 && (
            <TouchableOpacity
              onPress={handleNextStep}
              className="flex-1 bg-[#10B981] hover:bg-[#059669] border border-emerald-300 py-4 rounded-2xl items-center shadow-xl shadow-emerald-500/20 active:scale-95"
            >
              <Text className="text-[#050B08] font-black text-sm uppercase tracking-wider">
                Next Step →
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
