/**
 * PillSelector — Reusable pill/chip option selector
 *
 * A standardized selector for choosing between multiple options
 * displayed as glass-style pill buttons. Supports single selection,
 * icons, wrapping layout, and both horizontal-scroll and multi-line
 * layouts.
 *
 * Design: Apple-style frosted glass pills with active state highlight
 *
 * Also exports ChipToggle for binary (two-option) selectors.
 */
import { View, Text, TouchableOpacity, ScrollView, Platform } from "react-native";
import { cn } from "@/lib/utils";
import * as Haptics from "expo-haptics";

export interface PillOption<T extends string = string> {
  id: T;
  label: string;
  icon?: string;
}

export interface PillSelectorProps<T extends string = string> {
  /** Currently selected option id */
  selected: T;
  /** Selection callback */
  onSelect: (value: T) => void;
  /** Available options */
  options: readonly PillOption<T>[] | PillOption<T>[];
  /** Class name for the wrapper */
  className?: string;
  /** Enable horizontal scrolling instead of wrapping */
  horizontal?: boolean;
  /** Show as compact pills (less padding) */
  compact?: boolean;
  /** Show icons inline with labels */
  showIcons?: boolean;
  /** Disable haptic feedback */
  noHaptics?: boolean;
}

/**
 * PillSelector — multiple option selector (wraps by default, scrollable horizontally)
 *
 * Pills have a frosted glass look when inactive and solid primary fill when active.
 * Used for: role selection, format selection, filter toggles, etc.
 */
export function PillSelector<T extends string = string>({
  selected,
  onSelect,
  options,
  className,
  horizontal = false,
  compact = false,
  showIcons = true,
  noHaptics = false,
}: PillSelectorProps<T>) {
  const handlePress = async (id: T) => {
    if (!noHaptics && Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onSelect(id);
  };

  const pillContent = options.map((opt) => {
    const isActive = selected === opt.id;
    return (
      <TouchableOpacity
        key={opt.id}
        className={cn(
          "rounded-2xl flex-row items-center gap-2",
          isActive
            ? "bg-[#10B981]"
            : "bg-[#0B1712] border border-[#142820]",
          compact ? "px-3 py-2" : "px-4 py-3",
        )}
        style={
          Platform.OS === "web" && !isActive
            ? ({
                backdropFilter: "blur(12px) saturate(180%)",
                WebkitBackdropFilter: "blur(12px) saturate(180%)",
              } as any)
            : {}
        }
        onPress={() => handlePress(opt.id)}
      >
        {showIcons && opt.icon && <Text className="text-base">{opt.icon}</Text>}
        <Text
          className={cn(
            "font-semibold",
            isActive ? "text-white" : "text-foreground",
            compact ? "text-xs" : "text-sm",
          )}
        >
          {opt.label}
        </Text>
      </TouchableOpacity>
    );
  });

  if (horizontal) {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className={cn("pb-1", className)}>
        <View className="flex-row gap-2">{pillContent}</View>
      </ScrollView>
    );
  }

  return (
    <View className={cn("flex-row gap-2 flex-wrap", className)}>
      {pillContent}
    </View>
  );
}

/**
 * ChipToggle — binary/dual selector (two options only)
 *
 * Two equal-width chips side by side. Active state highlighted.
 * Used for: batting style (right/left), yes/no toggles, etc.
 */
export interface ChipToggleOption<T extends string = string> {
  id: T;
  label: string;
}

export interface ChipToggleProps<T extends string = string> {
  selected: T;
  onSelect: (value: T) => void;
  options: readonly ChipToggleOption<T>[] | ChipToggleOption<T>[];
  className?: string;
}

export function ChipToggle<T extends string = string>({
  selected,
  onSelect,
  options,
  className,
}: ChipToggleProps<T>) {
  return (
    <View className={cn("flex-row gap-2", className)}>
      {options.map((opt) => {
        const isActive = selected === opt.id;
        return (
          <TouchableOpacity
            key={opt.id}
            className={cn(
              "flex-1 rounded-2xl py-3 items-center",
              isActive
                ? "bg-[#10B981]"
                : "bg-[#0B1712] border border-[#142820]",
            )}
            style={
              Platform.OS === "web" && !isActive
                ? ({
                    backdropFilter: "blur(12px) saturate(180%)",
                    WebkitBackdropFilter: "blur(12px) saturate(180%)",
                  } as any)
                : {}
            }
            onPress={async () => {
              if (Platform.OS !== "web") {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              onSelect(opt.id);
            }}
          >
            <Text
              className={cn(
                "font-semibold",
                isActive ? "text-white" : "text-foreground",
              )}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default PillSelector;
