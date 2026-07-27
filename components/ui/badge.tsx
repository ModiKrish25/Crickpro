/**
 * Badge — Small numeric/text indicator for notifications and statuses.
 *
 * Design: Pill-shaped, variant colors for different severity levels.
 * Can overlap another element (like an icon) or stand alone.
 */
import { View, Text } from "react-native";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "primary" | "success" | "warning" | "danger" | "info";

interface BadgeProps {
  /** Numeric count or short text */
  value?: number | string;
  /** Visual variant */
  variant?: BadgeVariant;
  /** Size */
  size?: "sm" | "md" | "lg";
  /** If true, renders as a standalone pill without positioning */
  standalone?: boolean;
  /** Additional class names */
  className?: string;
  /** Max number to display (shows 99+ if exceeded) */
  max?: number;
}

const VARIANT_STYLES: Record<BadgeVariant, { bg: string; text: string; border: string }> = {
  default: { bg: "bg-[#86868B]", text: "text-white", border: "border-[#86868B]" },
  primary: { bg: "bg-[#0066FF]", text: "text-white", border: "border-[#0066FF]" },
  success: { bg: "bg-[#34C759]", text: "text-white", border: "border-[#34C759]" },
  warning: { bg: "bg-[#FF9F0A]", text: "text-white", border: "border-[#FF9F0A]" },
  danger: { bg: "bg-[#FF3B30]", text: "text-white", border: "border-[#FF3B30]" },
  info: { bg: "bg-[#5E5CE6]", text: "text-white", border: "border-[#5E5CE6]" },
};

export function Badge({
  value,
  variant = "default",
  size = "md",
  standalone = false,
  className,
  max = 99,
}: BadgeProps) {
  if (value === undefined || value === null || value === "") return null;

  const styles = VARIANT_STYLES[variant];
  const displayValue =
    typeof value === "number" && value > max
      ? `${max}+`
      : String(value);

  const isDot = value === "" || value === 0;
  const sizeStyles = size === "sm"
    ? { minWidth: 16, height: 16, paddingHorizontal: 4, fontSize: 9 }
    : size === "lg"
      ? { minWidth: 26, height: 26, paddingHorizontal: 8, fontSize: 13 }
      : { minWidth: 20, height: 20, paddingHorizontal: 6, fontSize: 11 };

  if (isDot) {
    return (
      <View
        className={cn(
          "rounded-full",
          styles.bg,
          standalone ? "" : "absolute -top-1 -right-1",
          className,
        )}
        style={{ width: 8, height: 8 }}
      />
    );
  }

  return (
    <View
      className={cn(
        "rounded-full items-center justify-center border",
        styles.bg,
        styles.border,
        standalone ? "" : "absolute -top-1.5 -right-1.5",
        className,
      )}
      style={{
        minWidth: sizeStyles.minWidth,
        height: sizeStyles.height,
        paddingHorizontal: sizeStyles.paddingHorizontal,
      }}
    >
      <Text
        className={cn("font-bold", styles.text)}
        style={{ fontSize: sizeStyles.fontSize }}
      >
        {displayValue}
      </Text>
    </View>
  );
}

export default Badge;
