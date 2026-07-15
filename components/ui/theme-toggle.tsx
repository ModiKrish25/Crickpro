/**
 * ThemeToggle - Animated dark/light mode toggle with sun/moon icons
 * 
 * Features:
 * - Spring-based toggle animation using react-native-reanimated
 * - Sun (light) and Moon (dark) icons with rotating transition
 * - Haptic feedback on toggle
 * - Cross-platform (web + native)
 * 
 * Usage:
 * <ThemeToggle
 *   isDark={colorScheme === "dark"}
 *   onToggle={() => setColorScheme(colorScheme === "dark" ? "light" : "dark")}
 * />
 */
import { TouchableOpacity, Platform, View, Text } from "react-native";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  interpolate,
  interpolateColor,
} from "react-native-reanimated";
import { useEffect } from "react";

interface ThemeToggleProps {
  /** Whether dark mode is active */
  isDark: boolean;
  /** Toggle callback */
  onToggle: () => void;
  /** Size of the toggle */
  size?: "sm" | "md" | "lg";
}

const SIZE_MAP = {
  sm: { track: 44, thumb: 20, icon: 12 },
  md: { track: 56, thumb: 26, icon: 16 },
  lg: { track: 72, thumb: 34, icon: 20 },
};

export function ThemeToggle({ isDark, onToggle, size = "md" }: ThemeToggleProps) {
  const dims = SIZE_MAP[size];

  // Animated values
  const toggleProgress = useSharedValue(isDark ? 1 : 0);
  const thumbScale = useSharedValue(1);
  const iconRotation = useSharedValue(isDark ? 1 : 0);

  // Sync with external changes
  useEffect(() => {
    toggleProgress.value = withSpring(isDark ? 1 : 0, {
      damping: 15,
      stiffness: 200,
      mass: 0.8,
    });
    iconRotation.value = withSpring(isDark ? 1 : 0, {
      damping: 12,
      stiffness: 180,
      mass: 0.6,
    });
  }, [isDark]);

  const handleToggle = async () => {
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // Press squish
    thumbScale.value = withSequence(
      withTiming(0.85, { duration: 80 }),
      withTiming(1.1, { duration: 120 }),
      withSpring(1, { damping: 10, stiffness: 150 }),
    );

    onToggle();
  };

  // Track animated style
  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      toggleProgress.value,
      [0, 1],
      ["#FDE68A", "#1e293b"],
    ),
  }));

  // Thumb position animated style
  const thumbStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          toggleProgress.value,
          [0, 1],
          [2, dims.track - dims.thumb - 2],
        ),
      },
      { scale: thumbScale.value },
    ],
  }));

  // Icon rotation
  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      {
        rotate: `${interpolate(iconRotation.value, [0, 1], [0, 360])}deg`,
      },
    ],
    opacity: interpolate(iconRotation.value, [0, 0.5, 1], [1, 0.3, 1]),
  }));

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handleToggle}
      accessibilityRole="switch"
      accessibilityState={{ checked: isDark }}
      accessibilityLabel={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      <Animated.View
        className="rounded-full justify-center overflow-hidden"
        style={[
          {
            width: dims.track,
            height: dims.thumb + 8,
            paddingHorizontal: 2,
          },
          trackStyle,
          {
            shadowColor: isDark ? "#000" : "#FDE68A",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 4,
          },
        ]}
      >
        {/* Track glow effect */}
        <Animated.View
          className="absolute inset-0 rounded-full"
          style={[
            {
              opacity: 0.15,
            },
            useAnimatedStyle(() => ({
              backgroundColor: interpolateColor(
                toggleProgress.value,
                [0, 1],
                ["#F59E0B", "#3B82F6"],
              ),
            })),
          ]}
        />

        {/* Thumb */}
        <Animated.View
          className="rounded-full items-center justify-center bg-white"
          style={[
            {
              width: dims.thumb,
              height: dims.thumb,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.2,
              shadowRadius: 2,
              elevation: 3,
            },
            thumbStyle,
          ]}
        >
          {/* Sun / Moon icon - uses spring delayed animation for smooth mid-transition swap */}
          <Animated.View style={iconStyle}>
            <Text
              style={{
                fontSize: dims.icon,
                lineHeight: dims.icon + 2,
              }}
            >
              {isDark ? "🌙" : "☀️"}
            </Text>
          </Animated.View>
        </Animated.View>

        {/* Track dots decoration */}
        {!isDark && (
          <View
            className="absolute rounded-full bg-yellow-300/40"
            style={{
              width: 3,
              height: 3,
              top: 5,
              right: 8,
            }}
          />
        )}
        {!isDark && (
          <View
            className="absolute rounded-full bg-yellow-300/30"
            style={{
              width: 2,
              height: 2,
              bottom: 6,
              right: 12,
            }}
          />
        )}
        {isDark && (
          <View
            className="absolute rounded-full bg-blue-300/30"
            style={{
              width: 2,
              height: 2,
              top: 7,
              left: 10,
            }}
          />
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}
