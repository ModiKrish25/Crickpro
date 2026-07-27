/**
 * Theme Settings Screen - Dark/Light mode selection with animated toggle
 * 
 * Features:
 * - Animated ThemeToggle with spring physics
 * - "Follow System" option to sync with device theme
 * - Visual preview cards showing light/dark appearance
 * - Persisted across sessions
 */
import { Text, View, TouchableOpacity, Platform } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useThemeContext } from "@/lib/theme-provider";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassHeader } from "@/components/ui/glass-header";
import Animated, { FadeInUp } from "react-native-reanimated";

export default function ThemeSettingsScreen() {
  const router = useRouter();
  const { colorScheme, setColorScheme, isUserSet, resetToSystem } = useThemeContext();
  const isDark = colorScheme === "dark";

  const handleToggle = async () => {
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setColorScheme(isDark ? "light" : "dark");
  };

  const handleFollowSystem = async () => {
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    resetToSystem();
  };

  return (
    <ScreenContainer className="p-6">
      <Animated.ScrollView
        entering={FadeInUp.duration(400).springify().damping(20).stiffness(200)}
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 gap-6 pb-8">
          {/* Back button */}
          <TouchableOpacity
            onPress={async () => {
              if (Platform.OS !== "web") {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              router.back();
            }}
          >
            <Text className="text-primary font-semibold">← Back</Text>
          </TouchableOpacity>

          <GlassHeader
            title="Theme & Display"
            subtitle="Customize your app appearance"
            size="md"
            animated
          />

          {/* Theme Toggle Card */}
          <GlassCard intensity="high" glowColor={isDark ? "#6366F1" : "#F59E0B"} padding="lg" className="items-center gap-6">
            {/* Preview circles */}
            <View className="flex-row items-center gap-8">
              {/* Light preview */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setColorScheme("light")}
              >
                <View className="items-center gap-2">
                  <View className="w-16 h-16 rounded-2xl bg-white border border-gray-200 items-center justify-center"
                    style={{
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 4,
                      elevation: 3,
                    }}
                  >
                    <Text className="text-2xl">☀️</Text>
                  </View>
                  <Text className={`text-xs font-semibold ${!isDark ? "text-primary" : "text-muted"}`}>
                    Light
                  </Text>
                  {!isDark && (
                    <View className="w-1.5 h-1.5 rounded-full bg-primary" />
                  )}
                </View>
              </TouchableOpacity>

              {/* Dark preview */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setColorScheme("dark")}
              >
                <View className="items-center gap-2">
                  <View className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-600 items-center justify-center"
                    style={{
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.3,
                      shadowRadius: 4,
                      elevation: 3,
                    }}
                  >
                    <Text className="text-2xl">🌙</Text>
                  </View>
                  <Text className={`text-xs font-semibold ${isDark ? "text-primary" : "text-muted"}`}>
                    Dark
                  </Text>
                  {isDark && (
                    <View className="w-1.5 h-1.5 rounded-full bg-primary" />
                  )}
                </View>
              </TouchableOpacity>
            </View>

            {/* Current scheme label */}
            <View className="items-center gap-1">
              <Text className="text-lg font-bold text-foreground">
                {isDark ? "Dark Mode" : "Light Mode"}
              </Text>
              <Text className="text-xs text-muted">
                {isUserSet
                  ? "Manually selected"
                  : "Following system theme"}
              </Text>
            </View>

            {/* The animated toggle */}
            <ThemeToggle
              isDark={isDark}
              onToggle={handleToggle}
              size="lg"
            />
          </GlassCard>

          {/* Follow System Toggle */}
          <GlassCard intensity="medium" padding="md" className="flex-row items-center gap-4">
            <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center">
              <Text className="text-lg">📱</Text>
            </View>
            <View className="flex-1">
              <Text className="text-foreground font-semibold">Follow System</Text>
              <Text className="text-xs text-muted">
                Auto-switch based on device settings
              </Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleFollowSystem}
              className={`rounded-xl px-4 py-2 ${
                !isUserSet ? "bg-primary" : "bg-white/10"
              }`}
            >
              <Text className={`text-xs font-bold ${
                !isUserSet ? "text-background" : "text-foreground"
              }`}>
                {!isUserSet ? "ON" : "OFF"}
              </Text>
            </TouchableOpacity>
          </GlassCard>

          {/* Info Card */}
          <GlassCard intensity="subtle" padding="md">
            <Text className="text-sm font-semibold text-foreground mb-2">
              💡 About Themes
            </Text>
            <Text className="text-xs text-muted leading-5">
              Dark mode reduces eye strain in low-light environments and can
              help save battery on OLED screens. Light mode offers better
              readability in bright conditions.
            </Text>
          </GlassCard>
        </View>
      </Animated.ScrollView>
    </ScreenContainer>
  );
}
