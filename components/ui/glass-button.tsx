/**
 * GlassButton — Reusable glassmorphism button with variants
 *
 * A standardized button component used throughout the app.
 * Supports three variants: primary, secondary, danger.
 * Includes spring press animation, optional haptic feedback,
 * loading state, and hover/shadow effects.
 *
 * Design: Apple-style glass buttons with depth and blur
 * Web: Uses plain View wrapper (not Animated.View) to avoid opacity:0 bug.
 */
import { TouchableOpacity, Text, ActivityIndicator, Platform, View } from "react-native";
import { cn } from "@/lib/utils";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

export type GlassButtonVariant = "primary" | "secondary" | "danger" | "ghost";

export interface GlassButtonProps {
  title: string;
  variant?: GlassButtonVariant;
  icon?: string;
  trailingIcon?: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  style?: any;
  haptic?: Haptics.ImpactFeedbackStyle;
  compact?: boolean;
  flex?: boolean;
}

const VARIANT_STYLES: Record<GlassButtonVariant, {
  container: string;
  text: string;
  shadow?: boolean;
  background?: any;
}> = {
  primary: {
    container: "bg-[#10B981] rounded-2xl items-center",
    text: "text-[#050B08] font-black",
    shadow: true,
  },
  secondary: {
    container: "bg-[#0C1914] border border-[#10B981]/30 rounded-2xl items-center",
    text: "text-white font-bold",
    background: Platform.OS === "web" ? {
      backdropFilter: "blur(12px) saturate(180%)",
      WebkitBackdropFilter: "blur(12px) saturate(180%)",
    } as any : {},
  },
  danger: {
    container: "bg-[#FF3B30] rounded-2xl items-center",
    text: "text-white font-bold",
    shadow: true,
  },
  ghost: {
    container: "rounded-2xl items-center",
    text: "text-[#0066FF] font-semibold",
  },
};

export function GlassButton({
  title,
  variant = "primary",
  icon,
  trailingIcon,
  onPress,
  disabled = false,
  loading = false,
  className,
  style,
  haptic,
  compact = false,
  flex,
}: GlassButtonProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const variantStyle = VARIANT_STYLES[variant];
  const shadowStyle = variantStyle.shadow ? {
    shadowColor: variant === "danger" ? "#FF3B30" : "#0066FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  } : {};

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 300, mass: 0.6 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 12, stiffness: 200, mass: 0.7 });
  };

  const handlePress = async () => {
    if (disabled || loading) return;
    if (haptic && Platform.OS !== "web") {
      await Haptics.impactAsync(haptic);
    }
    onPress?.();
  };

  const buttonContent = (
    <TouchableOpacity
      className={cn(
        variantStyle.container,
        compact ? "py-3 px-4" : "py-4",
        "flex-row justify-center items-center gap-2",
        (disabled || loading) && "opacity-50",
        className,
      )}
      style={{
        ...variantStyle.background,
        ...shadowStyle,
      }}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "primary" || variant === "danger" ? "#ffffff" : "#0066FF"}
          size="small"
        />
      ) : (
        <>
          {icon && <Text className="text-base">{icon}</Text>}
          <Text className={cn(variantStyle.text, compact ? "text-sm" : "text-base")}>
            {title}
          </Text>
          {trailingIcon && <Text className="text-base">{trailingIcon}</Text>}
        </>
      )}
    </TouchableOpacity>
  );

  // On web: skip Animated.View wrapper — Reanimated can leave it at opacity:0
  if (Platform.OS === "web") {
    return (
      <View className={cn(flex ? "flex-1" : "")} style={[{ opacity: 1 }, style]}>
        {buttonContent}
      </View>
    );
  }

  return (
    <Animated.View
      className={cn(flex ? "flex-1" : "", compact ? "" : "")}
      style={[animatedStyle, style]}
    >
      {buttonContent}
    </Animated.View>
  );
}

export default GlassButton;
