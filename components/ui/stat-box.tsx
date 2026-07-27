/**
 * StatBox — Reusable small stat display box with colored tint background
 *
 * Displays a label and value in a compact rounded box with a tinted background.
 * Used in stat grids like the chase calculator, score summaries, etc.
 *
 * Design: Apple-style frosted stat tile with accent color tint
 */
import { View, Text } from "react-native";
import { cn } from "@/lib/utils";
import { useThemeContext } from "@/lib/theme-provider";

export interface StatBoxProps {
  /** Label shown above the value (uppercase, small) */
  label: string;
  /** The numeric/string value to display */
  value: string | number;
  /** Accent color for the label and background tint */
  color?: string;
  /** Whether this stat has a full rounded container vs inline */
  contained?: boolean;
  /** Custom class override */
  className?: string;
  /** Compact mode (smaller padding/font) */
  compact?: boolean;
  /** Center align text (default left-aligned for table layouts) */
  center?: boolean;
}

export function StatBox({
  label,
  value,
  color = "#0066FF",
  contained = true,
  className,
  compact = false,
  center = true,
}: StatBoxProps) {
  const { colorScheme } = useThemeContext();
  const isDark = colorScheme === "dark";

  if (!contained) {
    return (
      <View className={cn("items-center flex-1", className)}>
        <Text className="text-[10px] text-muted font-semibold tracking-wider">
          {label}
        </Text>
        <Text
          className="text-sm font-bold mt-0.5"
          style={{ color }}
        >
          {value}
        </Text>
      </View>
    );
  }

  return (
    <View
      className={cn(
        "rounded-xl items-center",
        compact ? "py-1.5 px-2" : "py-2.5",
        className || "flex-1",
      )}
      style={{
        backgroundColor: isDark ? `${color}12` : `${color}08`,
      }}
    >
      <Text
        className={cn(
          "font-bold uppercase tracking-wider mb-1",
          compact ? "text-[8px]" : "text-[9px]",
        )}
        style={{ color }}
      >
        {label}
      </Text>
      <Text
        className={cn(
          "font-bold text-foreground",
          compact ? "text-xs" : "text-sm",
        )}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
    </View>
  );
}

/**
 * StatGrid — Inline flex-row container for a row of StatBox components.
 * Provides consistent gap spacing between items.
 */
export function StatGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <View className={cn("flex-row gap-2", className)}>
      {children}
    </View>
  );
}

export default StatBox;
