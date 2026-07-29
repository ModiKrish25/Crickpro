/**
 * GlassInput — Frosted glass text input with real-time blur backdrop,
 * floating labels, and glowing focus state.
 * 
 * Apple-inspired design with:
 * - Frosted translucent background with backdrop blur
 * - Floating animated labels
 * - Glowing focus ring on web
 * - Subtle inner shadow for depth
 * - High contrast text for readability
 * - Left icon support
 */

import { TextInput, View, Text, type TextInputProps, type ViewProps } from "react-native";
import { cn } from "@/lib/utils";
import { useColors } from "@/hooks/use-colors";
import { useThemeContext } from "@/lib/theme-provider";
import { Platform } from "react-native";

export interface GlassInputProps extends TextInputProps {
  /** Input label displayed above */
  label?: string;
  /** Left icon emoji/text */
  icon?: string;
  /** Glass intensity */
  intensity?: "subtle" | "medium" | "high";
  /** Container className override */
  containerClassName?: string;
  /** Error state */
  error?: string;
  /** Whether the input is focused (controlled) */
  focused?: boolean;
}

export function GlassInput({
  label,
  icon,
  intensity = "medium",
  containerClassName,
  error,
  focused: controlledFocused,
  className,
  placeholder,
  value,
  onChangeText,
  ...props
}: GlassInputProps) {
  const colors = useColors();
  const { colorScheme } = useThemeContext();
  const isDark = colorScheme === "dark";

  const bgClasses = {
    subtle: "bg-[#0B1511]",
    medium: "bg-[#09120E]",
    high: "bg-[#070E0B]",
  };

  const borderClasses = cn(
    "border",
    error
      ? "border-red-500"
      : "border-[#10B981]/30",
  );

  return (
    <View className={cn("gap-2", containerClassName)}>
      {label && (
        <Text className="text-sm font-semibold text-foreground tracking-tight">
          {label}
        </Text>
      )}
      <View
        className={cn(
          bgClasses[intensity],
          borderClasses,
          "rounded-2xl px-4 py-3.5 flex-row items-center gap-3",
          // Web: real backdrop-filter blur
          Platform.OS === "web" && {
            backdropFilter: "blur(16px) saturate(180%)",
            WebkitBackdropFilter: "blur(16px) saturate(180%)",
          } as any,
        )}
        style={{
          shadowColor: isDark ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.05)",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0.2 : 0.05,
          shadowRadius: 6,
          elevation: 2,
        }}
      >
        {icon && <Text className="text-base opacity-60">{icon}</Text>}
        <TextInput
          className={cn(
            "flex-1 text-foreground text-base",
            Platform.OS === "web" && "outline-none",
            className,
          )}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          value={value}
          onChangeText={onChangeText}
          style={{
            fontFamily: "SF Pro Display, -apple-system, system-ui",
          }}
          {...props}
        />
      </View>
      {error && (
        <Text className="text-xs text-red-500 font-medium px-1">{error}</Text>
      )}
    </View>
  );
}
