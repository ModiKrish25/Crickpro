/**
 * GlassSearchBar — Premium glass search bar with real-time blur.
 *
 * Apple-style search field with:
 * - Frosted glass background with backdrop blur
 * - Leading search icon
 * - Clear button on interaction
 * - Subtle focus glow
 * - Spring animations (native only — web uses plain View)
 */
import { TextInput, View, Text, TouchableOpacity, Platform } from "react-native";
import { cn } from "@/lib/utils";
import { useColors } from "@/hooks/use-colors";
import { useThemeContext } from "@/lib/theme-provider";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

export interface GlassSearchBarProps {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  onSubmit?: () => void;
  showClear?: boolean;
  className?: string;
  autoFocus?: boolean;
}

export function GlassSearchBar({
  placeholder = "Search...",
  value,
  onChangeText,
  onSubmit,
  showClear = true,
  className,
  autoFocus = false,
}: GlassSearchBarProps) {
  const colors = useColors();
  const { colorScheme } = useThemeContext();
  const isDark = colorScheme === "dark";
  const focusScale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: focusScale.value }],
    shadowOpacity: (isDark ? 0.35 : 0.1) * (focusScale.value - 0.95) * 20,
  }));

  const handleFocus = () => {
    focusScale.value = withSpring(1.02, { damping: 15, stiffness: 250, mass: 0.5 });
  };

  const handleBlur = () => {
    focusScale.value = withSpring(1, { damping: 12, stiffness: 200, mass: 0.7 });
  };

  const innerContent = (
    <View
      className={cn(
        "flex-row items-center rounded-2xl px-4 py-3 gap-3",
        "bg-[#0B1511] border border-[#10B981]/30",
      )}
      style={{
        ...(Platform.OS === "web" ? {
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
        } : {}),
      } as any}
    >
      {/* Search icon */}
      <Text className="text-base text-muted opacity-50">🔍</Text>

      {/* Input */}
      <TextInput
        className="flex-1 text-foreground text-base"
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        onFocus={handleFocus}
        onBlur={handleBlur}
        autoFocus={autoFocus}
        style={{ fontFamily: "SF Pro Display, -apple-system, system-ui" }}
        returnKeyType="search"
      />

      {/* Clear button */}
      {showClear && value.length > 0 && (
        <TouchableOpacity
          onPress={() => onChangeText("")}
          className="w-7 h-7 rounded-full items-center justify-center"
          style={{
            backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)",
          }}
        >
          <Text className="text-xs text-muted">✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // On web: plain View — Animated.View leaves component at opacity:0
  if (Platform.OS === "web") {
    return (
      <View
        className={cn("relative", className)}
        style={{
          opacity: 1,
          shadowColor: "#0066FF",
          shadowOffset: { width: 0, height: 4 },
          shadowRadius: 12,
        } as any}
      >
        {innerContent}
      </View>
    );
  }

  return (
    <Animated.View
      className={cn("relative", className)}
      style={[
        animatedStyle,
        {
          shadowColor: "#0066FF",
          shadowOffset: { width: 0, height: 4 },
          shadowRadius: 12,
        },
      ]}
    >
      {innerContent}
    </Animated.View>
  );
}
