/**
 * GlassFloatingButton — Premium glass floating action button.
 * 
 * Inspired by iOS 17+ floating action buttons and Apple Music's FAB.
 * Features:
 * - Frosted glass background with backdrop blur
 * - Gradient glow border
 * - Spring press animation
 * - Shadow depth
 * - Positioned fixed/bottom-right by default
 */
import { TouchableOpacity, View, Text, Platform, type ViewStyle } from "react-native";
import { cn } from "@/lib/utils";
import { useThemeContext } from "@/lib/theme-provider";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

export interface GlassFloatingButtonProps {
  /** Icon/text to display */
  label: string;
  /** Emoji or short text */
  icon?: string;
  /** Press handler */
  onPress: () => void;
  /** Glow color */
  glowColor?: string;
  /** Position */
  position?: "bottom-right" | "bottom-left" | "bottom-center";
  /** Size */
  size?: "sm" | "md" | "lg";
  /** Custom className */
  className?: string;
  /** Disabled state */
  disabled?: boolean;
}

export function GlassFloatingButton({
  label,
  icon,
  onPress,
  glowColor = "#0066FF",
  position = "bottom-right",
  size = "md",
  className,
  disabled = false,
}: GlassFloatingButtonProps) {
  const { colorScheme } = useThemeContext();
  const isDark = colorScheme === "dark";
  const scale = useSharedValue(1);

  const positionClasses: Record<string, string> = {
    "bottom-right": "bottom-6 right-6",
    "bottom-left": "bottom-6 left-6",
    "bottom-center": "bottom-6 self-center",
  };

  const sizeClasses: Record<string, string> = {
    sm: "w-12 h-12 rounded-2xl",
    md: "w-14 h-14 rounded-2xl",
    lg: "w-16 h-16 rounded-[20px]",
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.92, { damping: 15, stiffness: 300, mass: 0.5 });
  };
  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 12, stiffness: 200, mass: 0.7 });
  };

  return (
    <Animated.View
      className={cn("absolute z-50", positionClasses[position], className)}
      style={animatedStyle}
    >
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        activeOpacity={0.9}
        className={cn(
          sizeClasses[size],
          "items-center justify-center",
          isDark ? "bg-white/[0.08]" : "bg-white/80",
        )}
        style={{
          borderWidth: 1,
          borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.5)",
          ...(Platform.OS === "web" ? {
            backdropFilter: "blur(24px) saturate(180%)",
            WebkitBackdropFilter: "blur(24px) saturate(180%)",
          } : {}),
          shadowColor: glowColor,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: isDark ? 0.5 : 0.25,
          shadowRadius: 16,
          elevation: 10,
        } as ViewStyle}
      >
        {icon ? (
          <Text className={cn(size === "lg" ? "text-2xl" : size === "md" ? "text-xl" : "text-lg")}>
            {icon}
          </Text>
        ) : (
          <Text
            className={cn(
              "font-bold tracking-tight",
              size === "lg" ? "text-lg" : size === "md" ? "text-base" : "text-sm",
              isDark ? "text-white" : "text-foreground",
            )}
            numberOfLines={1}
          >
            {label}
          </Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}
