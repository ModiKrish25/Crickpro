/**
 * Edit Player Profile Screen — Premium glass redesign
 * 
 * Design: Apple-inspired glassmorphism, floating cards, frosted inputs
 * - Floating glass section cards with backdrop blur
 * - Frosted GlassInput with floating labels
 * - Premium role/toggle selectors with pill design
 * - Animated staggered entrance
 * - Gradient CTA buttons with spring press
 * - Haptic feedback throughout
 */
import { useState, useEffect, useRef, useCallback } from "react";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  Platform,
  Alert,
  BackHandler,
  KeyboardAvoidingView,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useRouter } from "expo-router";
import { useAuthContext } from "@/lib/auth-context";
import * as Auth from "@/lib/_core/auth";
import * as Haptics from "expo-haptics";
import { trpc } from "@/lib/trpc";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassInput } from "@/components/ui/glass-input";
import { GlassModal } from "@/components/ui/glass-modal";
import { LiquidGlassOverlay } from "@/components/ui/liquid-glass-overlay";
import { useThemeContext } from "@/lib/theme-provider";
import { useResponsive } from "@/hooks/use-responsive";
import { useScrollPadding } from "@/hooks/use-scroll-padding";
import { PillSelector, ChipToggle } from "@/components/ui/pill-selector";
import { GlassButton } from "@/components/ui/glass-button";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeInUp,
} from "react-native-reanimated";

type PlayerRole = "batsman" | "bowler" | "all-rounder" | "wicket-keeper";
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

const ROLES: { id: PlayerRole; icon: string; label: string }[] = [
  { id: "batsman", icon: "🏏", label: "Batsman" },
  { id: "bowler", icon: "⚾", label: "Bowler" },
  { id: "all-rounder", icon: "🌟", label: "All-Rounder" },
  { id: "wicket-keeper", icon: "🧤", label: "Wicket-Keeper" },
];

const BATTING_STYLES: { id: BattingStyle; label: string }[] = [
  { id: "right-handed", label: "Right Handed" },
  { id: "left-handed", label: "Left Handed" },
];

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




/**
 * Shape of the form's initial values — used to detect unsaved changes.
 */
interface FormSnapshot {
  displayName: string;
  role: PlayerRole;
  battingStyle: BattingStyle;
  bowlingStyle: BowlingStyle | null;
  jerseyNumber: string;
  city: string;
  bio: string;
}

function deepEqual(a: FormSnapshot, b: FormSnapshot): boolean {
  return (
    a.displayName === b.displayName &&
    a.role === b.role &&
    a.battingStyle === b.battingStyle &&
    a.bowlingStyle === b.bowlingStyle &&
    a.jerseyNumber === b.jerseyNumber &&
    a.city === b.city &&
    a.bio === b.bio
  );
}

export default function EditProfileScreen() {
  const router = useRouter();
  const { user } = useAuthContext();
  const { colorScheme } = useThemeContext();
  const r = useResponsive();
  const isDark = colorScheme === "dark";
  const updateProfile = trpc.players.updateProfile.useMutation();
  const { paddingBottom } = useScrollPadding();
  const { data: profile } = trpc.players.getProfile.useQuery();

  const [displayName, setDisplayName] = useState(user?.name || "");
  const [role, setRole] = useState<PlayerRole>("batsman");
  const [battingStyle, setBattingStyle] = useState<BattingStyle>("right-handed");
  const [bowlingStyle, setBowlingStyle] = useState<BowlingStyle | null>(null);
  const [jerseyNumber, setJerseyNumber] = useState("");
  const [city, setCity] = useState("");
  const [bio, setBio] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);

  // Snapshot of initial values — frozen once on first load
  const initialSnapshot = useRef<FormSnapshot | null>(null);

  // Spring scale for save button
  const saveScale = useSharedValue(1);
  const saveAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: saveScale.value }],
  }));

  // Build the current form values into a snapshot
  const currentSnapshot = useCallback((): FormSnapshot => ({
    displayName,
    role,
    battingStyle,
    bowlingStyle,
    jerseyNumber,
    city,
    bio,
  }), [displayName, role, battingStyle, bowlingStyle, jerseyNumber, city, bio]);

  /** True when the user has made any change from the initial loaded values */
  const hasUnsavedChanges = useCallback((): boolean => {
    if (!initialSnapshot.current) return false;
    return !deepEqual(initialSnapshot.current, currentSnapshot());
  }, [currentSnapshot]);

  // Pre-fill form with existing profile data once loaded
  useEffect(() => {
    if (profile && !isInitialized) {
      setIsInitialized(true);
      if (profile.name) setDisplayName(profile.name);
      if (profile.role) setRole(profile.role as PlayerRole);
      if (profile.jerseyNumber) setJerseyNumber(String(profile.jerseyNumber));
      if (profile.battingStyle) setBattingStyle(profile.battingStyle as BattingStyle);
      if (profile.bowlingStyle) setBowlingStyle(profile.bowlingStyle as BowlingStyle);
      if (profile.city) setCity(profile.city);
      if (profile.bio) setBio(profile.bio);
    }
  }, [profile, isInitialized]);

  // Freeze the initial snapshot AFTER the form is populated from the profile.
  useEffect(() => {
    if (isInitialized && !initialSnapshot.current) {
      initialSnapshot.current = { displayName, role, battingStyle, bowlingStyle, jerseyNumber, city, bio };
    }
  }, [isInitialized]);

  // Intercept Android hardware back button
  useEffect(() => {
    const onBackPress = () => {
      if (hasUnsavedChanges()) {
        setShowUnsavedModal(true);
        return true; // prevent default
      }
      return false;
    };
    const subscription = BackHandler.addEventListener("hardwareBackPress", onBackPress);
    return () => subscription.remove();
  }, [hasUnsavedChanges]);

  const handleSave = async () => {
    if (Platform.OS !== "web") {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    saveScale.value = withSpring(0.95, { damping: 12, stiffness: 200 });
    setTimeout(() => saveScale.value = withSpring(1, { damping: 10, stiffness: 150 }), 150);
    setIsSaving(true);

    try {
      if (user && displayName !== user.name) {
        await Auth.setUserInfo({ ...user, name: displayName });
      }

      const parsedJersey = parseInt(jerseyNumber, 10);

      await updateProfile.mutateAsync({
        name: displayName,
        role: role as "batsman" | "bowler" | "all-rounder" | "wicket-keeper",
        jerseyNumber: !isNaN(parsedJersey) && parsedJersey > 0 ? parsedJersey : undefined,
        battingStyle: battingStyle as "right-handed" | "left-handed",
        bowlingStyle: bowlingStyle ?? undefined,
        city: city || undefined,
        bio: bio || undefined,
      });

      Alert.alert("Profile Updated", "Your player profile has been saved successfully!");
      router.back();
    } catch (err) {
      console.error("[EditProfile] Save failed:", err);
      Alert.alert("Error", "Failed to save profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  /** Confirm navigation away, showing the unsaved-changes dialog if needed */
  const attemptGoBack = useCallback(async () => {
    if (hasUnsavedChanges()) {
      if (Platform.OS !== "web") {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
      setShowUnsavedModal(true);
    } else {
      if (Platform.OS !== "web") {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      router.back();
    }
  }, [hasUnsavedChanges, router]);

  /** Discard changes and leave */
  const handleDiscard = useCallback(async () => {
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setShowUnsavedModal(false);
    router.back();
  }, [router]);

  /** Dismiss discard dialog and stay on screen */
  const handleKeepEditing = useCallback(async () => {
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowUnsavedModal(false);
  }, []);

  return (
    <ScreenContainer gradient glass>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
      <Animated.ScrollView
        entering={FadeInUp.duration(400).springify().damping(20).stiffness(200)}
        contentContainerStyle={{ flexGrow: 1, paddingBottom }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 gap-5">
          {/* Header */}
          <View className="pt-2 pb-1">
            <TouchableOpacity onPress={attemptGoBack} className="mb-2">
              <Text className="text-[#0066FF] font-semibold">← Back</Text>
            </TouchableOpacity>
            <Text className={`${r.isPhone ? "text-[30px]" : "text-[40px]"} font-bold text-foreground tracking-tight`}>
              Edit Profile
            </Text>
            <Text className={`${r.isPhone ? "text-base" : "text-lg"} text-muted mt-1`}>
              Set up your cricket player profile
            </Text>
          </View>

          {/* Avatar Section - Premium Glass */}
          <GlassCard
            intensity="high"
            glowColor="#0066FF"
            padding="xl"
            radius="xl"
            gradientBorder
            className="items-center gap-4 py-8"
            blurAmount={30}
            staggerIndex={0}
          >
            <LiquidGlassOverlay color="#0066FF" variant="sheen" speed={0.8} intensity={0.6} />
            <View
              className="w-24 h-24 rounded-full items-center justify-center"
              style={{
                backgroundColor: isDark ? "rgba(0,102,255,0.2)" : "rgba(0,102,255,0.1)",
                borderWidth: 2,
                borderColor: isDark ? "rgba(0,102,255,0.3)" : "rgba(0,102,255,0.2)",
                shadowColor: "#0066FF",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: isDark ? 0.5 : 0.25,
                shadowRadius: 12,
                elevation: 8,
              }}
            >
              <Text className="text-4xl font-bold text-[#0066FF]">
                {displayName ? displayName[0].toUpperCase() : "?"}
              </Text>
            </View>
            <TouchableOpacity className="active:opacity-70">
              <Text className="text-sm text-[#0066FF] font-semibold">Change Photo</Text>
            </TouchableOpacity>
          </GlassCard>

          {/* Basic Info */}
          <GlassCard intensity="high" padding="xl" radius="xl" className="gap-5" blurAmount={24} staggerIndex={1}>
            <Text className="text-lg font-bold text-foreground tracking-tight">👤 Basic Info</Text>
            <GlassInput
              label="Display Name"
              placeholder="Your cricket name"
              value={displayName}
              onChangeText={setDisplayName}
              maxLength={50}
              icon="📝"
            />
            <GlassInput
              label="Jersey Number"
              placeholder="e.g., 18"
              value={jerseyNumber}
              onChangeText={setJerseyNumber}
              keyboardType="numeric"
              maxLength={3}
              icon="🔢"
            />
            <GlassInput
              label="City / Location"
              placeholder="Your city"
              value={city}
              onChangeText={setCity}
              maxLength={100}
              icon="📍"
            />
          </GlassCard>

          {/* Player Role */}
          <GlassCard intensity="high" padding="xl" radius="xl" className="gap-4" blurAmount={24} staggerIndex={2}>
            <LiquidGlassOverlay variant="sheen" speed={0.6} intensity={0.3} />
            <Text className="text-lg font-bold text-foreground tracking-tight">🏏 Player Role</Text>
            <PillSelector
              selected={role}
              onSelect={(val) => {
                setRole(val);
                if (val === "batsman" || val === "wicket-keeper") {
                  setBowlingStyle(null);
                } else if (!bowlingStyle) {
                  setBowlingStyle("right-arm-medium");
                }
              }}
              options={ROLES}
            />
          </GlassCard>

          {/* Batting Style */}
          <GlassCard intensity="high" padding="xl" radius="xl" className="gap-4" blurAmount={24} staggerIndex={3}>
            <Text className="text-lg font-bold text-foreground tracking-tight">🦇 Batting Style</Text>
            <ChipToggle
              selected={battingStyle}
              onSelect={setBattingStyle}
              options={BATTING_STYLES}
            />
          </GlassCard>

          {/* Bowling Style (for bowlers & all-rounders) */}
          {(role === "bowler" || role === "all-rounder") && (
            <GlassCard intensity="high" padding="xl" radius="xl" className="gap-4" blurAmount={24} staggerIndex={4}>
              <Text className="text-lg font-bold text-foreground tracking-tight">⚾ Bowling Style</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pb-1">
                <View className="flex-row gap-2">
                  {BOWLING_STYLES.map((bw) => (
                    <TouchableOpacity
                      key={bw.id}
                      className={`rounded-2xl px-4 py-3 ${
                        bowlingStyle === bw.id
                          ? "bg-[#0066FF]"
                          : "bg-white/50 dark:bg-white/[0.05] border border-white/30 dark:border-white/10"
                      }`}
                      style={Platform.OS === "web" && bowlingStyle !== bw.id ? {
                        backdropFilter: "blur(12px) saturate(180%)",
                        WebkitBackdropFilter: "blur(12px) saturate(180%)",
                      } as any : {}}
                      onPress={async () => {
                        if (Platform.OS !== "web") await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setBowlingStyle(bw.id);
                      }}
                    >
                      <Text className={`font-semibold whitespace-nowrap ${
                        bowlingStyle === bw.id ? "text-white" : "text-foreground"
                      }`}>
                        {bw.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </GlassCard>
          )}

          {/* Bio */}
          <GlassCard intensity="high" padding="xl" radius="xl" className="gap-4" blurAmount={24} staggerIndex={5}>
            <Text className="text-lg font-bold text-foreground tracking-tight">💬 Bio</Text>
            <GlassInput
              placeholder="Tell us about yourself as a cricketer..."
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={4}
              maxLength={500}
              icon="✍️"
            />
            <Text className="text-xs text-muted text-right">{bio.length}/500</Text>
          </GlassCard>

          {/* Info note */}
          <GlassCard intensity="subtle" padding="lg" radius="lg" glowColor="#0066FF" staggerIndex={6}>
            <Text className="text-xs text-muted leading-5">
              💡 Your profile helps other players and organizers know more about you. You can update these details anytime.
            </Text>
          </GlassCard>

          {/* Action Buttons */}
          <View className="flex-row gap-3 mt-2 pb-6">
            <GlassButton
              title="Cancel"
              variant="secondary"
              flex
              onPress={attemptGoBack}
            />
            <Animated.View className="flex-1" style={saveAnimatedStyle}>
              <GlassButton
                title={isSaving ? "Saving..." : "Save Profile"}
                variant="primary"
                onPress={handleSave}
                disabled={isSaving}
                loading={isSaving}
              />
            </Animated.View>
          </View>
        </View>
      </Animated.ScrollView>
      </KeyboardAvoidingView>

      {/* ── Unsaved Changes Confirmation Modal ── */}
      <GlassModal
        visible={showUnsavedModal}
        onClose={handleKeepEditing}
        title="Unsaved Changes"
        subtitle="You have unsaved profile changes. What would you like to do?"
        glowColor={isDark ? "#FF9F0A" : "#FF9500"}
        showClose
        footer={
          <View className="gap-3">
            <GlassButton title="Discard Changes" variant="danger" onPress={handleDiscard} />
            <GlassButton title="Keep Editing" variant="ghost" onPress={handleKeepEditing} />
          </View>
        }
      >
        <View className="gap-3 py-2">
          {(
            [
              { label: "Name", value: displayName, key: "displayName" as const },
              { label: "Role", value: role, key: "role" as const },
              { label: "Jersey", value: jerseyNumber || "—", key: "jerseyNumber" as const },
              { label: "City", value: city || "—", key: "city" as const },
            ] as const
          ).map((item) => {
            const snap = initialSnapshot.current;
            const changed = snap !== null && item.value !== snap[item.key];
            return (
              <View key={item.label} className="flex-row justify-between items-center">
                <Text className="text-sm text-muted">{item.label}</Text>
                <View className="flex-row items-center gap-2">
                  <Text
                    className={`text-sm font-semibold ${
                      changed ? "text-[#FF9F0A]" : "text-foreground"
                    }`}
                    numberOfLines={1}
                  >
                    {String(item.value)}
                  </Text>
                  {changed && <Text className="text-[#FF9F0A] text-xs">✱</Text>}
                </View>
              </View>
            );
          })}
        </View>
      </GlassModal>
    </ScreenContainer>
  );
}
