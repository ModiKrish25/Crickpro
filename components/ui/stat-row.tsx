/**
 * StatRow — Reusable label-value row component
 *
 * A standardized row used throughout the app for displaying
 * statistics, profile fields, summary items, etc.
 * Features glass-consistent styling, optional accent colors,
 * and change indicators.
 *
 * Design: Apple-style settings/info row with subtle borders
 */
import { View, Text } from "react-native";
import { cn } from "@/lib/utils";

export interface StatRowProps {
  /** Label displayed on the left */
  label: string;
  /** Value displayed on the right */
  value: string | number;
  /** Optional accent color for the value text */
  valueColor?: string;
  /** Optional emoji/icon prefix for the label */
  icon?: string;
  /** Show a bottom border (last items may hide it) */
  showBorder?: boolean;
  /** Whether this field has been changed (shows orange indicator) */
  changed?: boolean;
  /** Custom styles */
  className?: string;
  /** Label text size */
  labelSize?: "sm" | "xs";
  /** Value text size */
  valueSize?: "sm" | "base" | "lg";
}

export function StatRow({
  label,
  value,
  valueColor,
  icon,
  showBorder = true,
  changed,
  className,
  labelSize = "sm",
  valueSize = "base",
}: StatRowProps) {
  const labelSizeClass = labelSize === "xs" ? "text-xs" : "text-sm";
  const valueSizeClass = {
    sm: "text-sm",
    base: "text-lg",
    lg: "text-2xl",
  }[valueSize];

  return (
    <View
      className={cn(
        "flex-row justify-between items-center py-1.5",
        showBorder && "border-b border-white/10 dark:border-white/[0.06]",
        changed && "bg-[#FF9F0A]/[0.03] rounded-sm",
        className,
      )}
    >
      <Text className={cn("text-muted", labelSizeClass)}>
        {icon ? `${icon} ` : ""}{label}
      </Text>
      <View className="flex-row items-center gap-2">
        <Text
          className={cn("font-bold text-foreground tracking-tight", valueSizeClass)}
          style={valueColor ? { color: valueColor } : undefined}
        >
          {value}
        </Text>
        {changed && <Text className="text-[#FF9F0A] text-xs">✱</Text>}
      </View>
    </View>
  );
}

export default StatRow;
