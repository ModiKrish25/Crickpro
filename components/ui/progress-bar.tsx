/**
 * ProgressBar — Linear progress indicator with optional label.
 *
 * Design: Glass frosted track with animated accent fill.
 * Supports determinate (0–1) and indeterminate (animated) modes.
 */
import { View, Text } from "react-native";
import { useEffect } from "react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  interpolate,
} from "react-native-reanimated";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  /** Progress value 0–1 (e.g. 0.75 = 75%) */
  progress?: number;
  /** Show as indeterminate (animated) when true, ignores progress value */
  indeterminate?: boolean;
  /** Bar height */
  height?: number;
  /** Accent color */
  color?: string;
  /** Track color */
  trackColor?: string;
  /** Show percentage label to the right */
  showLabel?: boolean;
  /** Label text (overrides percentage) */
  label?: string;
  /** Additional class names */
  className?: string;
}

export function ProgressBar({
  progress = 0,
  indeterminate = false,
  height = 6,
  color = "#0066FF",
  trackColor,
  showLabel = false,
  label,
  className,
}: ProgressBarProps) {
  const animProgress = useSharedValue(indeterminate ? 0 : progress);
  const indeterminateOffset = useSharedValue(-1);

  useEffect(() => {
    if (indeterminate) {
      indeterminateOffset.value = withRepeat(
        withSequence(
          withTiming(2, { duration: 1200, easing: Easing.inOut(Easing.cubic) }),
          withTiming(-1, { duration: 0 }),
        ),
        -1,
        false,
      );
    } else {
      animProgress.value = withTiming(Math.max(0, Math.min(1, progress)), {
        duration: 400,
        easing: Easing.out(Easing.cubic),
      });
    }
  }, [progress, indeterminate]);

  const fillStyle = useAnimatedStyle(() => {
    if (indeterminate) {
      const translateX = interpolate(
        indeterminateOffset.value,
        [-1, 2],
        [-100, 200],
      );
      return {
        width: "40%",
        transform: [{ translateX: `${translateX}%` }],
      } as any;
    }
    return {
      width: `${Math.round(animProgress.value * 100)}%`,
    };
  });

  const pct = Math.round(progress * 100);

  return (
    <View className={cn("flex-row items-center gap-3", className)}>
      <View
        className="flex-1 rounded-full overflow-hidden"
        style={{
          height,
          backgroundColor: trackColor ?? "rgba(128,128,128,0.15)",
        }}
      >
        <Animated.View
          className="rounded-full absolute inset-0"
          style={[
            fillStyle,
            {
              height,
              backgroundColor: indeterminate ? color : color,
              borderRadius: height / 2,
            },
          ]}
        />
      </View>
      {showLabel && (
        <Text className="text-xs font-semibold text-muted w-10 text-right tabular-nums">
          {label ?? `${pct}%`}
        </Text>
      )}
    </View>
  );
}

export default ProgressBar;
