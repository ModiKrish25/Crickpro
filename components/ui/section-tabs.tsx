/**
 * SectionTabs — Horizontal pill/glass tab bar for switching between views.
 *
 * Design: Glass pill-style tabs with animated active indicator.
 * Prevents naming collision with expo-router's Tabs navigator.
 * Supports scrollable mode for many tabs.
 */
import { useState, useRef } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { cn } from "@/lib/utils";

interface SectionTab {
  id: string;
  label: string;
  icon?: string;
  badge?: number;
}

interface SectionTabsProps {
  /** Array of tab definitions */
  tabs: SectionTab[];
  /** Currently selected tab ID */
  selected?: string;
  /** Called when a tab is selected */
  onSelect: (id: string) => void;
  /** Visual style */
  variant?: "pill" | "underline" | "glass";
  /** Enable horizontal scrolling for overflow */
  scrollable?: boolean;
  /** Additional class names */
  className?: string;
}

export function SectionTabs({
  tabs,
  selected: externalSelected,
  onSelect,
  variant = "glass",
  scrollable = false,
  className,
}: SectionTabsProps) {
  const [internalSelected, setInternalSelected] = useState(tabs[0]?.id);
  const selectedId = externalSelected ?? internalSelected;
  const scrollRef = useRef<ScrollView>(null);

  const handleSelect = (id: string) => {
    setInternalSelected(id);
    onSelect(id);
  };

  const Container = scrollable ? ScrollView : View;
  const containerProps = scrollable
    ? {
        ref: scrollRef,
        horizontal: true,
        showsHorizontalScrollIndicator: false,
        contentContainerStyle: { gap: 4 } as any,
      }
    : { className: "flex-row gap-1" };

  return (
    <View className={cn("relative", className)}>
      <Container {...(containerProps as any)}>
        {tabs.map((tab) => {
          const isSelected = tab.id === selectedId;
          return (
            <TouchableOpacity
              key={tab.id}
              className={cn(
                "flex-row items-center rounded-xl px-4 py-2.5",
                variant === "pill" && isSelected && "bg-[#0066FF]",
                variant === "pill" && !isSelected && "bg-white/50 dark:bg-white/[0.05]",
                variant === "underline" && "border-b-2 rounded-none px-3",
                variant === "underline" && isSelected && "border-[#0066FF]",
                variant === "underline" && !isSelected && "border-transparent",
                variant === "glass" && isSelected && "bg-white/60 dark:bg-white/[0.1] border border-white/50 dark:border-white/10",
                variant === "glass" && !isSelected && "bg-transparent",
              )}
              onPress={() => handleSelect(tab.id)}
            >
              {tab.icon && (
                <Text className="text-sm mr-1.5">{tab.icon}</Text>
              )}
              <Text
                className={cn(
                  "font-semibold text-sm",
                  isSelected ? "text-foreground" : "text-muted",
                )}
              >
                {tab.label}
              </Text>
              {tab.badge !== undefined && tab.badge > 0 && (
                <View className="ml-1.5 bg-[#FF3B30] rounded-full px-1.5 py-0.5 min-w-[18px] items-center">
                  <Text className="text-[10px] font-bold text-white">
                    {tab.badge > 99 ? "99+" : tab.badge}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </Container>
    </View>
  );
}

export default SectionTabs;
