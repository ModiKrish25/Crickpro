/**
 * DeliveryButton — Scoring button for recording a cricket delivery.
 *
 * Design: Large glass button with run value, optional extras/wicket styling.
 * Used in the live scorecard for tapping runs (0-6), extras, and wickets.
 */
import { View, Text, TouchableOpacity, Platform } from "react-native";
import { cn } from "@/lib/utils";
import * as Haptics from "expo-haptics";

type DeliveryButtonVariant = "run" | "extra" | "wicket" | "action";

interface DeliveryButtonProps {
  /** Display value (e.g. "4", "W", "WD") */
  value: string;
  /** Subtitle shown below value */
  subtitle?: string;
  /** Visual variant */
  variant?: DeliveryButtonVariant;
  /** Size */
  size?: "sm" | "md" | "lg" | "xl";
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Whether to show haptic feedback on press */
  haptic?: boolean;
  /** Additional class names */
  className?: string;
  /** Called when pressed */
  onPress?: () => void;
}

const VARIANT_STYLES: Record<DeliveryButtonVariant, { bg: string; text: string; border: string; glow: string }> = {
  run: {
    bg: "bg-white/50 dark:bg-white/[0.06]",
    text: "text-foreground",
    border: "border-white/30 dark:border-white/10",
    glow: "#0066FF",
  },
  extra: {
    bg: "bg-[#FF9F0A]/10",
    text: "text-[#FF9F0A]",
    border: "border-[#FF9F0A]/30",
    glow: "#FF9F0A",
  },
  wicket: {
    bg: "bg-[#FF3B30]/10",
    text: "text-[#FF3B30]",
    border: "border-[#FF3B30]/30",
    glow: "#FF3B30",
  },
  action: {
    bg: "bg-[#0066FF]",
    text: "text-white",
    border: "border-[#0066FF]",
    glow: "#0066FF",
  },
};

const SIZE_CONFIG = {
  sm: { dim: 40, font: 14, subFont: 8, borderRadius: 12 },
  md: { dim: 52, font: 18, subFont: 9, borderRadius: 14 },
  lg: { dim: 64, font: 24, subFont: 10, borderRadius: 16 },
  xl: { dim: 80, font: 32, subFont: 11, borderRadius: 20 },
};

export function DeliveryButton({
  value,
  subtitle,
  variant = "run",
  size = "lg",
  disabled = false,
  haptic = true,
  className,
  onPress,
}: DeliveryButtonProps) {
  const styles = VARIANT_STYLES[variant];
  const config = SIZE_CONFIG[size];

  const handlePress = async () => {
    if (disabled) return;
    if (haptic && Platform.OS !== "web") {
      await Haptics.impactAsync(
        variant === "wicket"
          ? Haptics.ImpactFeedbackStyle.Heavy
          : variant === "extra"
            ? Haptics.ImpactFeedbackStyle.Medium
            : Haptics.ImpactFeedbackStyle.Light,
      );
    }
    onPress?.();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.6}
      className={cn(
        "items-center justify-center rounded-2xl border",
        styles.bg,
        styles.border,
        disabled && "opacity-30",
        className,
      )}
      style={{
        width: config.dim,
        height: config.dim,
        borderRadius: config.borderRadius,
        ...(variant === "action"
          ? {
              shadowColor: styles.glow,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 6,
            }
          : {}),
      }}
    >
      <Text
        className={cn("font-bold", styles.text)}
        style={{ fontSize: config.font }}
      >
        {value}
      </Text>
      {subtitle && (
        <Text
          className={cn("font-medium", styles.text)}
          style={{
            fontSize: config.subFont,
            opacity: 0.7,
            marginTop: -1,
          }}
        >
          {subtitle}
        </Text>
      )}
    </TouchableOpacity>
  );
}

export default DeliveryButton;
