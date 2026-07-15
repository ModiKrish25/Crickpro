/**
 * Edit Player Profile Screen
 * Allows users to set their cricket player profile details:
 * - Display name
 * - Player role (batsman, bowler, all-rounder, wicket-keeper)
 * - Batting style (right-handed, left-handed)
 * - Bowling style
 * - Jersey number
 * - City / Location
 * - Bio
 */
import { useState } from "react";
import {
  ScrollView,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Platform,
  Alert,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/use-colors";
import { useAuthContext } from "@/lib/auth-context";
import * as Auth from "@/lib/_core/auth";
import * as Haptics from "expo-haptics";

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

export default function EditProfileScreen() {
  const router = useRouter();
  const colors = useColors();
  const { user } = useAuthContext();

  const [displayName, setDisplayName] = useState(user?.name || "");
  const [role, setRole] = useState<PlayerRole>("batsman");
  const [battingStyle, setBattingStyle] = useState<BattingStyle>("right-handed");
  const [bowlingStyle, setBowlingStyle] = useState<BowlingStyle | null>(null);
  const [jerseyNumber, setJerseyNumber] = useState("");
  const [city, setCity] = useState("");
  const [bio, setBio] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (Platform.OS !== "web") {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setIsSaving(true);

    try {
      // Update local cache with the new display name
      if (user && displayName !== user.name) {
        await Auth.setUserInfo({
          ...user,
          name: displayName,
        });
      }

      // Simulate API save
      await new Promise(resolve => setTimeout(resolve, 800));

      Alert.alert("Profile Updated", "Your player profile has been saved successfully!");
      router.back();
    } catch (err) {
      console.error("[EditProfile] Save failed:", err);
      Alert.alert("Error", "Failed to save profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
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
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 gap-6">
          {/* Header */}
          <View className="flex-row items-center justify-between">
            <View className="gap-1">
              <TouchableOpacity onPress={handleCancel}>
                <Text className="text-primary font-semibold text-base">← Back</Text>
              </TouchableOpacity>
              <Text className="text-3xl font-bold text-foreground">Edit Profile</Text>
              <Text className="text-sm text-muted">Set up your cricket player profile</Text>
            </View>
          </View>

          {/* Avatar placeholder */}
          <View className="items-center gap-2">
            <View className="w-20 h-20 rounded-full bg-primary/10 items-center justify-center border-2 border-primary/20">
              <Text className="text-3xl font-bold text-primary">
                {displayName ? displayName[0].toUpperCase() : "?"}
              </Text>
            </View>
            <TouchableOpacity className="active:opacity-70">
              <Text className="text-sm text-primary font-semibold">Change Photo</Text>
            </TouchableOpacity>
          </View>

          {/* Display Name */}
          <View className="gap-2">
            <Text className="text-sm font-semibold text-foreground">Display Name</Text>
            <TextInput
              className="bg-surface border border-border rounded-xl px-4 py-3.5 text-foreground"
              placeholder="Your cricket name"
              placeholderTextColor={colors.muted + "80"}
              value={displayName}
              onChangeText={setDisplayName}
              maxLength={50}
            />
          </View>

          {/* Player Role */}
          <View className="gap-3">
            <Text className="text-sm font-semibold text-foreground">Player Role</Text>
            <View className="flex-row gap-2 flex-wrap">
              {ROLES.map((r) => (
                <TouchableOpacity
                  key={r.id}
                  className={`rounded-xl px-4 py-3 active:opacity-80 flex-row items-center gap-2 ${
                    role === r.id
                      ? "bg-primary"
                      : "bg-surface border border-border"
                  }`}
                  onPress={async () => {
                    if (Platform.OS !== "web") {
                      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    setRole(r.id);
                    // Auto-set bowling style visibility for non-bowlers
                    if (r.id === "batsman" || r.id === "wicket-keeper") {
                      setBowlingStyle(null);
                    } else if (!bowlingStyle) {
                      setBowlingStyle("right-arm-medium");
                    }
                  }}
                >
                  <Text className="text-base">{r.icon}</Text>
                  <Text className={`font-semibold ${role === r.id ? "text-background" : "text-foreground"}`}>
                    {r.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Batting Style */}
          <View className="gap-2">
            <Text className="text-sm font-semibold text-foreground">Batting Style</Text>
            <View className="flex-row gap-2">
              {BATTING_STYLES.map((bs) => (
                <TouchableOpacity
                  key={bs.id}
                  className={`flex-1 rounded-xl py-3 items-center active:opacity-80 ${
                    battingStyle === bs.id
                      ? "bg-primary"
                      : "bg-surface border border-border"
                  }`}
                  onPress={() => setBattingStyle(bs.id)}
                >
                  <Text className={`font-semibold ${battingStyle === bs.id ? "text-background" : "text-foreground"}`}>
                    {bs.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Bowling Style (for bowlers & all-rounders) */}
          {(role === "bowler" || role === "all-rounder") && (
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">Bowling Style</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pb-1">
                <View className="flex-row gap-2">
                  {BOWLING_STYLES.map((bw) => (
                    <TouchableOpacity
                      key={bw.id}
                      className={`rounded-xl px-4 py-3 active:opacity-80 ${
                        bowlingStyle === bw.id
                          ? "bg-primary"
                          : "bg-surface border border-border"
                      }`}
                      onPress={() => setBowlingStyle(bw.id)}
                    >
                      <Text className={`font-semibold whitespace-nowrap ${
                        bowlingStyle === bw.id ? "text-background" : "text-foreground"
                      }`}>
                        {bw.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          {/* Jersey Number */}
          <View className="gap-2">
            <Text className="text-sm font-semibold text-foreground">Jersey Number</Text>
            <TextInput
              className="bg-surface border border-border rounded-xl px-4 py-3.5 text-foreground"
              placeholder="e.g., 18"
              placeholderTextColor={colors.muted + "80"}
              value={jerseyNumber}
              onChangeText={setJerseyNumber}
              keyboardType="numeric"
              maxLength={3}
            />
          </View>

          {/* City */}
          <View className="gap-2">
            <Text className="text-sm font-semibold text-foreground">City / Location</Text>
            <TextInput
              className="bg-surface border border-border rounded-xl px-4 py-3.5 text-foreground"
              placeholder="Your city"
              placeholderTextColor={colors.muted + "80"}
              value={city}
              onChangeText={setCity}
              maxLength={100}
            />
          </View>

          {/* Bio */}
          <View className="gap-2">
            <Text className="text-sm font-semibold text-foreground">Bio</Text>
            <TextInput
              className="bg-surface border border-border rounded-xl px-4 py-3.5 text-foreground"
              placeholder="Tell us about yourself as a cricketer..."
              placeholderTextColor={colors.muted + "80"}
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={3}
              maxLength={500}
              textAlignVertical="top"
            />
            <Text className="text-[10px] text-muted text-right">{bio.length}/500</Text>
          </View>

          {/* Info note */}
          <View className="bg-primary/5 rounded-xl p-4 border border-primary/20">
            <Text className="text-xs text-muted leading-5">
              💡 Your profile helps other players and organizers know more about you. 
              You can update these details anytime.
            </Text>
          </View>

          {/* Action Buttons */}
          <View className="flex-row gap-3 mt-4">
            <TouchableOpacity
              className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-xl py-4 items-center active:opacity-80"
              onPress={handleCancel}
            >
              <Text className="text-foreground font-semibold">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 bg-primary rounded-xl py-4 items-center active:opacity-80"
              onPress={handleSave}
              disabled={isSaving}
            >
              <Text className="text-background font-semibold">
                {isSaving ? "Saving..." : "Save Profile"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
