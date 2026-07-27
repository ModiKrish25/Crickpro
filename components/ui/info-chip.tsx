/**
 * InfoChip — Reusable label/badge/chip component
 *
 * A standardized pill-shaped label/badge used throughout the app
 * for status indicators, role badges, filter chips, and tags.
 * Supports multiple color variants, sizes, and optional icons.
 *
 * Design: Apple-style frosted pill badge with minimal footprint
 */
import { View, Text } from "react-native";
import { cn } from "@/lib/utils";

export type ChipColor =
  | "primary"    // #0066FF
  | "success"    // #34C759
  | "warning"    // #FF9F0A
  | "danger"     // #FF3B30
  | "purple"     // #5E5CE6
  | "muted";     // default text-muted

export interface InfoChipProps {
  /** Primary text content */
  label: string;
  /** Color variant — maps to preset accent colors */
  color?: ChipColor;
  /** Optional emoji or short icon text */
  icon?: string;
  /** Small size (10px text) vs default (11-12px) */
  small?: boolean;
  /** Full opacity background vs subtle background */
  solid?: boolean;
  /** Optional dot indicator (pulsing for LIVE) */
  dot?: boolean;
  /** Custom class name overrides */
  className?: string;
}

const COLOR_MAP: Record<ChipColor, { text: string; bg: string }> = {
  primary: { text: "text-[#0066FF]", bg: "bg-[#0066FF]/15" },
  success: { text: "text-[#34C759]", bg: "bg-[#34C759]/15" },
  warning: { text: "text-[#FF9F0A]", bg: "bg-[#FF9F0A]/15" },
  danger:  { text: "text-[#FF3B30]", bg: "bg-[#FF3B30]/15" },
  purple:  { text: "text-[#5E5CE6]", bg: "bg-[#5E5CE6]/15" },
  muted:   { text: "text-muted",     bg: "bg-white/20 dark:bg-white/[0.06]" },
};

export function InfoChip({
  label,
  color = "primary",
  icon,
  small = false,
  solid = false,
  dot = false,
  className,
}: InfoChipProps) {
  const colors = COLOR_MAP[color] || COLOR_MAP.primary;

  return (
    <View
      className={cn(
        "rounded-full items-center justify-center flex-row gap-1",
        solid
          ? colors.bg.replace("/15", "/100").replace("/20", "/100")
          : colors.bg,
        small ? "px-2 py-0.5" : "px-3 py-1",
        className,
      )}
    >
      {dot && (
        <View
          className={cn(
            "w-1.5 h-1.5 rounded-full",
            colors.text,
          )}
          style={{ backgroundColor: colors.text.replace("text-", "") === "#0066FF" ? "#0066FF" : colors.text.replace("text-", "") }}
        />
      )}
      {icon && <Text className={cn(small ? "text-[9px]" : "text-[10px]")}>{icon}</Text>}
      <Text
        className={cn(
          "font-bold uppercase tracking-wider",
          colors.text,
          small ? "text-[9px]" : "text-[10px]",
          solid && "text-white",
        )}
      >
        {label}
      </Text>
    </View>
  );
}

export default InfoChip;
