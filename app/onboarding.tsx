/**
 * Onboarding Screen — First-time user setup wizard
 *
 * Guides new users through:
 * Step 1: App role selection (Scorer, Player, Organizer, Umpire)
 * Step 2: Quick cricket profile setup (name, playing role, styles)
 * Step 3: Confirmation
 *
 * Design: Apple-style glassmorphism with spring animations
 */
import { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuthContext } from "@/lib/auth-context";
import { useThemeContext } from "@/lib/theme-provider";
import { trpc } from "@/lib/trpc";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassInput } from "@/components/ui/glass-input";
import { GlassButton } from "@/components/ui/glass-button";
import { PillSelector, ChipToggle } from "@/components/ui/pill-selector";
import { LiquidGlassOverlay } from "@/components/ui/liquid-glass-overlay";
import { useResponsive } from "@/hooks/use-responsive";

const ONBOARDING_KEY = "@crickpro/onboarding_complete";

// Removed fixed SCREEN_WIDTH in favor of useResponsive()

// ─── App-level roles ───
type AppRole = "scorer" | "player" | "organizer" | "umpire";

const APP_ROLES: { id: AppRole; icon: string; title: string; desc: string }[] = [
  {
    id: "scorer",
    icon: "📋",
    title: "Scorer",
    desc: "Score matches ball-by-ball with full cricket rules",
  },
  {
    id: "player",
    icon: "🏏",
    title: "Player",
    desc: "Track your personal career stats and performances",
  },
  {
    id: "organizer",
    icon: "🏆",
    title: "Organizer",
    desc: "Create and manage leagues, tournaments, and teams",
  },
  {
    id: "umpire",
    icon: "⚖️",
    title: "Umpire",
    desc: "Officiate matches and record decisions",
  },
];

// ─── Cricket playing roles ───
type PlayerRole = "batsman" | "bowler" | "all-rounder" | "wicket-keeper";

const PLAYER_ROLES: { id: PlayerRole; icon: string; label: string }[] = [
  { id: "batsman", icon: "🏏", label: "Batsman" },
  { id: "bowler", icon: "⚾", label: "Bowler" },
  { id: "all-rounder", icon: "🌟", label: "All-Rounder" },
  { id: "wicket-keeper", icon: "🧤", label: "Wicket-Keeper" },
];

type BattingStyle = "right-handed" | "left-handed";
type BowlingStyle =
  | "right-arm-fast"
  | "right-arm-medium"
  | "right-arm-off-spin"
  | "right-arm-leg-spin"
  | "left-arm-fast"
  | "left-arm-medium"
  | "left-arm-orthodox-spin"
  | "left-arm-chinaman";

const BOWLING_STYLES: { id: BowlingStyle; label: string }[] = [
  { id: "right-arm-fast", label: "Right Arm Fast" },
  { id: "right-arm-medium", label: "Right Arm Medium" },
  { id: "right-arm-off-spin", label: "Right Arm Off Spin" },
  { id: "right-arm-leg-spin", label: "Right Arm Leg Spin" },
  { id: "left-arm-fast", label: "Left Arm Fast" },
  { id: "left-arm-medium", label: "Left Arm Medium" },
  { id: "left-arm-orthodox-spin", label: "Left Arm Orthodox Spin" },
  { id: "left-arm-chinaman", label: "Left Arm Chinaman" },
];

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <View className="flex-row items-center justify-center gap-2 py-4">
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          className={`h-1.5 rounded-full ${
            i === current
              ? "w-8 bg-[#0066FF]"
              : i < current
                ? "w-2 bg-[#0066FF]/40"
                : "w-2 bg-white/20 dark:bg-white/10"
          }`}
        />
      ))}
    </View>
  );
}

export default function OnboardingScreen() {
  const router = useRouter();
  const { user } = useAuthContext();
  const { colorScheme } = useThemeContext();
  const r = useResponsive();
  const isDark = colorScheme === "dark";
  const updateProfile = trpc.players.updateProfile.useMutation();

  const [step, setStep] = useState(0);
  const [appRole, setAppRole] = useState<AppRole | null>(null);
  const [displayName, setDisplayName] = useState(user?.name || "");
  const [playerRole, setPlayerRole] = useState<PlayerRole>("batsman");
  const [battingStyle, setBattingStyle] = useState<BattingStyle>("right-handed");
  const [bowlingStyle, setBowlingStyle] = useState<BowlingStyle | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Check if onboarding already completed — if so, redirect away
  useEffect(() => {
    (async () => {
      try {
        const done = await AsyncStorage.getItem(ONBOARDING_KEY);
        if (done === "true") {
          router.replace("/(tabs)");
        }
      } catch {}
    })();
  }, []);

  const totalSteps = 3;

  const canProceed = useCallback(() => {
    switch (step) {
      case 0: return appRole !== null;
      case 1: return displayName.trim().length > 0;
      case 2: return true;
      default: return false;
    }
  }, [step, appRole, displayName]);

  const handleNext = async () => {
    if (Platform.OS !== "web") await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step < totalSteps - 1) {
      setStep(s => s + 1);
    } else {
      await handleComplete();
    }
  };

  const handleBack = async () => {
    if (Platform.OS !== "web") await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step > 0) setStep(s => s - 1);
  };

  const handleComplete = async () => {
    setIsSaving(true);

    try {
      // Save profile via tRPC
      if (displayName || playerRole || battingStyle || bowlingStyle) {
        await updateProfile.mutateAsync({
          name: displayName || undefined,
          role: playerRole,
          battingStyle,
          bowlingStyle: bowlingStyle ?? undefined,
        });
      }

      // Persist app role and mark onboarding as complete
      await AsyncStorage.setItem(ONBOARDING_KEY, "true");
      if (appRole) {
        await AsyncStorage.setItem("@crickpro/app_role", appRole);
      }

      if (Platform.OS !== "web") {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // Navigate to the main app (replace so they can't go back)
      router.replace("/(tabs)");
    } catch (err) {
      console.error("[Onboarding] Save failed:", err);
      Alert.alert("Error", "Failed to save profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkip = async () => {
    if (Platform.OS !== "web") await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await AsyncStorage.setItem(ONBOARDING_KEY, "true");
    router.replace("/(tabs)");
  };

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: isDark ? "#0A0A0B" : "#F5F5F7" }}
      edges={["top", "left", "right"]}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Skip button */}
        <View className="flex-row justify-end px-6 pt-4">
          <TouchableOpacity
            onPress={handleSkip}
            className="px-4 py-2 rounded-2xl bg-white/50 dark:bg-white/[0.05] border border-white/30 dark:border-white/10"
          >
            <Text className="text-sm text-muted font-semibold">Skip</Text>
          </TouchableOpacity>
        </View>

        {/* Step indicator */}
        <StepIndicator current={step} total={totalSteps} />

        <View className="px-6 pb-8">
          {/* ──── STEP 1: App Role Selection ──── */}
          {step === 0 && (
            <View className="gap-6">
              <View className="items-center gap-3 pt-4">
                <View
                  className="w-20 h-20 rounded-full items-center justify-center"
                  style={{
                    backgroundColor: isDark ? "rgba(0,102,255,0.2)" : "rgba(0,102,255,0.1)",
                    shadowColor: "#0066FF",
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: isDark ? 0.5 : 0.3,
                    shadowRadius: 16,
                    elevation: 10,
                  }}
                >
                  <Text className="text-3xl">🏏</Text>
                </View>
                <Text className={`${r.isPhone ? "text-2xl" : "text-[36px]"} font-bold text-foreground text-center tracking-tight`}>
                  Welcome to CrickPro
                </Text>
                <Text className={`${r.isPhone ? "text-sm" : "text-base"} text-muted text-center ${r.isPhone ? "max-w-xs" : "max-w-lg"} leading-6`}>
                  Tell us how you&apos;ll use the app so we can tailor the experience for you
                </Text>
              </View>

              <View className="gap-3 pt-2">
                {APP_ROLES.map((role) => {
                  const selected = appRole === role.id;
                  return (
                    <TouchableOpacity
                      key={role.id}
                      className={`flex-row items-center gap-4 rounded-2xl p-4 ${
                        selected
                          ? "bg-[#0066FF]"
                          : "bg-white/50 dark:bg-white/[0.05] border border-white/30 dark:border-white/10"
                      }`}
                      style={
                        Platform.OS === "web" && !selected
                          ? ({
                              backdropFilter: "blur(12px) saturate(180%)",
                              WebkitBackdropFilter: "blur(12px) saturate(180%)",
                            } as any)
                          : {}
                      }
                      onPress={async () => {
                        if (Platform.OS !== "web") await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setAppRole(role.id);
                      }}
                    >
                      <View
                        className={`w-12 h-12 rounded-full items-center justify-center ${
                          selected ? "bg-white/20" : "bg-[#0066FF]/10"
                        }`}
                      >
                        <Text className="text-2xl">{role.icon}</Text>
                      </View>
                      <View className="flex-1">
                        <Text
                          className={`text-base font-bold ${
                            selected ? "text-white" : "text-foreground"
                          }`}
                        >
                          {role.title}
                        </Text>
                        <Text
                          className={`text-xs mt-0.5 ${
                            selected ? "text-white/70" : "text-muted"
                          }`}
                        >
                          {role.desc}
                        </Text>
                      </View>
                      {selected && (
                        <View className="w-6 h-6 rounded-full bg-white/30 items-center justify-center">
                          <Text className="text-white text-xs font-bold">✓</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* ──── STEP 2: Player Profile ──── */}
          {step === 1 && (
            <View className="gap-5">
              <View className="items-center gap-2 pt-4">
                <Text className="text-[28px] font-bold text-foreground text-center tracking-tight">
                  Set Up Your Profile
                </Text>
                <Text className="text-sm text-muted text-center max-w-xs leading-5">
                  Create your cricket identity — you can change this later
                </Text>
              </View>

              {/* Display Name */}
              <GlassCard
                intensity="high"
                padding="xl"
                radius="xl"
                className="gap-4"
                blurAmount={24}
                staggerIndex={0}
              >
                <Text className="text-sm font-bold text-foreground tracking-tight">👤 Basic Info</Text>
                <GlassInput
                  label="Your Name"
                  placeholder="How you want to appear"
                  value={displayName}
                  onChangeText={setDisplayName}
                  maxLength={50}
                  icon="📝"
                />
              </GlassCard>

              {/* Player Role */}
              <GlassCard
                intensity="high"
                padding="xl"
                radius="xl"
                className="gap-4"
                blurAmount={24}
                staggerIndex={1}
              >
                <Text className="text-sm font-bold text-foreground tracking-tight">🏏 Playing Role</Text>
                <PillSelector
                  selected={playerRole}
                  onSelect={(val) => {
                    setPlayerRole(val);
                    if (val === "batsman" || val === "wicket-keeper") {
                      setBowlingStyle(null);
                    } else if (!bowlingStyle) {
                      setBowlingStyle("right-arm-medium");
                    }
                  }}
                  options={PLAYER_ROLES}
                />
              </GlassCard>

              {/* Batting Style */}
              <GlassCard
                intensity="high"
                padding="xl"
                radius="xl"
                className="gap-4"
                blurAmount={24}
                staggerIndex={2}
              >
                <Text className="text-sm font-bold text-foreground tracking-tight">🦇 Batting</Text>
                <ChipToggle
                  selected={battingStyle}
                  onSelect={setBattingStyle}
                  options={[
                    { id: "right-handed" as BattingStyle, label: "Right Handed" },
                    { id: "left-handed" as BattingStyle, label: "Left Handed" },
                  ]}
                />
              </GlassCard>

              {/* Bowling Style (for bowlers & all-rounders) */}
              {(playerRole === "bowler" || playerRole === "all-rounder") && (
                <GlassCard
                  intensity="high"
                  padding="xl"
                  radius="xl"
                  className="gap-4"
                  blurAmount={24}
                  staggerIndex={3}
                >
                  <Text className="text-sm font-bold text-foreground tracking-tight">⚾ Bowling Style</Text>
                  <PillSelector
                    selected={bowlingStyle || "right-arm-medium"}
                    onSelect={(val) => setBowlingStyle(val)}
                    options={BOWLING_STYLES}
                    horizontal
                  />
                </GlassCard>
              )}
            </View>
          )}

          {/* ──── STEP 3: Confirmation ──── */}
          {step === 2 && (
            <View className="gap-6 pt-4">
              <View className="items-center gap-4">
                <View
                  className="w-24 h-24 rounded-full items-center justify-center"
                  style={{
                    backgroundColor: isDark ? "rgba(0,102,255,0.2)" : "rgba(0,102,255,0.1)",
                    shadowColor: "#0066FF",
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: isDark ? 0.5 : 0.3,
                    shadowRadius: 16,
                    elevation: 10,
                  }}
                >
                  <Text className="text-4xl">
                    {displayName ? displayName[0].toUpperCase() : "🏏"}
                  </Text>
                </View>
                <Text className="text-[28px] font-bold text-foreground text-center tracking-tight">
                  You&apos;re all set!
                </Text>
                <Text className="text-sm text-muted text-center max-w-xs leading-5">
                  Here&apos;s a quick summary of your profile
                </Text>
              </View>

              <GlassCard intensity="high" padding="xl" radius="xl" className="gap-4" blurAmount={24}>
                <LiquidGlassOverlay color="#0066FF" variant="sheen" speed={0.6} intensity={0.3} />

                {/* Summary rows */}
                {[
                  { icon: "🎯", label: "App Role", value: APP_ROLES.find((r) => r.id === appRole)?.title || appRole || "—" },
                  { icon: "📝", label: "Name", value: displayName || "—" },
                  { icon: "🏏", label: "Playing Role", value: PLAYER_ROLES.find((r) => r.id === playerRole)?.label || "—" },
                  { icon: "🦇", label: "Batting", value: battingStyle === "right-handed" ? "Right Handed" : "Left Handed" },
                  ...((playerRole === "bowler" || playerRole === "all-rounder") && bowlingStyle
                    ? [{ icon: "⚾", label: "Bowling", value: BOWLING_STYLES.find((b) => b.id === bowlingStyle)?.label || bowlingStyle }]
                    : []),
                ].map((item, idx) => (
                  <View
                    key={idx}
                    className="flex-row items-center gap-3 py-2 border-b border-white/10 dark:border-white/[0.06] last:border-b-0"
                  >
                    <Text className="text-lg w-8">{item.icon}</Text>
                    <Text className="text-sm text-muted flex-1">{item.label}</Text>
                    <Text className="text-sm font-semibold text-foreground">{item.value}</Text>
                  </View>
                ))}
              </GlassCard>

              <GlassCard intensity="subtle" padding="lg" radius="lg" glowColor="#0066FF">
                <Text className="text-xs text-muted text-center leading-5">
                  You can update all of these details later from your Profile settings. Ready to start?
                </Text>
              </GlassCard>
            </View>
          )}

          {/* ──── Navigation Buttons ──── */}
          <View className="flex-row gap-3 mt-8">
            {step > 0 && (
              <TouchableOpacity
                className="w-16 h-16 rounded-2xl items-center justify-center bg-white/50 dark:bg-white/[0.05] border border-white/30 dark:border-white/10"
                onPress={handleBack}
              >
                <Text className="text-foreground text-xl font-bold">←</Text>
              </TouchableOpacity>
            )}
            <GlassButton
              title={step === totalSteps - 1 ? "🚀 Get Started" : "Continue"}
              variant="primary"
              flex
              onPress={handleNext}
              disabled={!canProceed() || isSaving}
              loading={isSaving}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
