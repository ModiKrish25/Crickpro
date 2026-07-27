/**
 * Skeleton Loader - Premium glass skeleton loading state
 * 
 * Provides shimmer/skeleton loading placeholders that match
 * the glassmorphism aesthetic of the app.
 */
import { View, Platform } from "react-native";
import { cn } from "@/lib/utils";
import { useThemeContext } from "@/lib/theme-provider";
import { useResponsive } from "@/hooks/use-responsive";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useEffect } from "react";

interface SkeletonProps {
  className?: string;
  width?: number | string;
  height?: number | string;
  radius?: "sm" | "md" | "lg" | "xl" | "full";
}

const radiusMap = {
  sm: "rounded-lg",
  md: "rounded-xl",
  lg: "rounded-2xl",
  xl: "rounded-3xl",
  full: "rounded-full",
};

function SkeletonBlock({ className, width, height, radius = "lg" }: SkeletonProps) {
  const { colorScheme } = useThemeContext();
  const isDark = colorScheme === "dark";
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.7, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      className={cn(
        radiusMap[radius],
        isDark ? "bg-white/10" : "bg-black/[0.06]",
        className,
      )}
      style={[
        animatedStyle,
        {
          width: width || "100%",
          height: height || 20,
          ...(Platform.OS === "web" ? {
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
          } as any : {}),
        },
      ]}
    />
  );
}

/** Full card skeleton mimicking GlassCard layout */
export function SkeletonCard({
  lines = 3,
  hasAvatar = false,
  className,
}: {
  lines?: number;
  hasAvatar?: boolean;
  className?: string;
}) {
  const { isPhone } = useResponsive();
  return (
    <View className={cn("p-5 rounded-3xl gap-4 bg-white/30 dark:bg-white/[0.04]", className)}>
      <View className="flex-row items-center gap-3">
        {hasAvatar && (
          <SkeletonBlock width={48} height={48} radius="full" />
        )}
        <View className="flex-1 gap-2">
          <SkeletonBlock width="60%" height={16} radius="sm" />
          <SkeletonBlock width="40%" height={12} radius="sm" />
        </View>
      </View>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBlock
          key={i}
          width={i === lines - 1 ? "55%" : "100%"}
          height={14}
          radius="sm"
        />
      ))}
      <View className="flex-row gap-3">
        {Array.from({ length: isPhone ? 2 : 4 }).map((_, i) => (
          <View key={i} className="flex-1 gap-1">
            <SkeletonBlock width="100%" height={28} radius="sm" />
            <SkeletonBlock width="60%" height={10} radius="sm" />
          </View>
        ))}
      </View>
    </View>
  );
}

/** Skeleton for stat boxes (numbers) */
export function SkeletonStatBox({ className }: { className?: string }) {
  return (
    <View className={cn("flex-1 p-4 rounded-2xl bg-white/30 dark:bg-white/[0.04] items-center gap-2", className)}>
      <SkeletonBlock width={40} height={32} radius="sm" />
      <SkeletonBlock width="70%" height={10} radius="sm" />
    </View>
  );
}

/** Skeleton for scorecard match cards */
export function SkeletonMatchCard({ className }: { className?: string }) {
  return (
    <View className={cn("p-5 rounded-3xl gap-4 bg-white/30 dark:bg-white/[0.04]", className)}>
      <View className="flex-row justify-between">
        <SkeletonBlock width={80} height={14} radius="sm" />
        <SkeletonBlock width={60} height={14} radius="sm" />
      </View>
      <View className="flex-row items-center gap-4">
        <View className="flex-1 gap-1">
          <SkeletonBlock width="80%" height={14} radius="sm" />
          <SkeletonBlock width="50%" height={24} radius="sm" />
        </View>
        <SkeletonBlock width={32} height={32} radius="full" />
        <View className="flex-1 items-end gap-1">
          <SkeletonBlock width="80%" height={14} radius="sm" />
          <SkeletonBlock width="50%" height={24} radius="sm" />
        </View>
      </View>
    </View>
  );
}

/** Full page skeleton for the home dashboard */
export function SkeletonDashboard() {
  return (
    <View className="p-5 gap-5">
      <SkeletonBlock width="50%" height={36} radius="sm" />
      <SkeletonBlock width="30%" height={16} radius="sm" />
      <View className="flex-row gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonBlock key={i} className="flex-1" height={90} />
        ))}
      </View>
      <SkeletonMatchCard />
      <View className="flex-row gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonStatBox key={i} />
        ))}
      </View>
    </View>
  );
}

export default SkeletonBlock;
