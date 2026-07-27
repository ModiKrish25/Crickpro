/**
 * Divider — Section separator with optional label.
 *
 * Design: Subtle glass line with centered text label.
 */
import { View, Text } from "react-native";
import { cn } from "@/lib/utils";

interface DividerProps {
  /** Optional label text shown in the center */
  label?: string;
  /** Color override */
  color?: string;
  /** Additional class names */
  className?: string;
}

export function Divider({ label, color, className }: DividerProps) {
  const lineColor = color ?? "rgba(128,128,128,0.15)";

  if (!label) {
    return (
      <View
        className={cn("w-full", className)}
        style={{ height: 1, backgroundColor: lineColor }}
      />
    );
  }

  return (
    <View className={cn("flex-row items-center gap-3", className)}>
      <View style={{ flex: 1, height: 1, backgroundColor: lineColor }} />
      <Text className="text-xs font-medium text-muted">{label}</Text>
      <View style={{ flex: 1, height: 1, backgroundColor: lineColor }} />
    </View>
  );
}

export default Divider;
